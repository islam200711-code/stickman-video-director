/**
 * Optional audio stage. Every provider is free/offline; when a tool is missing
 * the stage degrades (no narration / skipped SFX) instead of failing the render.
 *  - Narration: espeak-ng (GPL, offline) or user-supplied files. Pluggable via TTS_PROVIDERS.
 *  - SFX / music: read-only reuse of the Skill's licensed audio library catalog
 *    (skills/directing-stickman-videos/assets/b-audio-library/catalog.json).
 * Output files are normalised to 48 kHz stereo WAV inside public/projects/<id>/audio.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {CUE_MAP} from './foley';

export const ENGINE_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const AUDIO_LIBRARY = path.resolve(ENGINE_ROOT, '../skills/directing-stickman-videos/assets/b-audio-library');

const has = (bin: string) => spawnSync('which', [bin]).status === 0;
export const probeDuration = (file: string) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

function toWav(src: string, dst: string, extra: string[] = []) {
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, ...extra, '-ar', '48000', '-ac', '2', dst]);
}

export type TtsOpts = {voice?: string; rate?: number; language: string};
export type TtsProvider = {name: string; available: () => boolean; speak: (text: string, outWav: string, o: TtsOpts) => void};

const ESPEAK_VOICE: Record<string, string> = {en: 'en-us', ar: 'ar', fr: 'fr-fr', es: 'es', de: 'de', pt: 'pt-br', tr: 'tr', id: 'id', ja: 'ja', ko: 'ko', zh: 'cmn'};
export const TTS_PROVIDERS: Record<string, TtsProvider> = {
  espeak: {
    name: 'espeak-ng',
    available: () => has('espeak-ng'),
    speak: (text, out, o) => {
      const tmp = out + '.raw.wav';
      const voice = o.voice ?? (ESPEAK_VOICE[o.language] ?? o.language) + '+m3';
      execFileSync('espeak-ng', ['-v', voice, '-s', String(o.rate ?? 155), '-p', '45', '-g', '4', '-w', tmp, text]);
      // gentle low-pass + loudness normalisation softens the robotic edge
      toWav(tmp, out, ['-af', 'highpass=f=80,lowpass=f=7000,loudnorm=I=-16:TP=-1.5:LRA=11']);
      fs.rmSync(tmp);
    },
  },
};

type CatalogAsset = {id: string; kind: string; category: string; tags: string[]; title: string; path: string; duration: number; license: {id: string; attribution: string; attribution_required: boolean; url: string}};
let catalog: CatalogAsset[] | null = null;
export function loadCatalog(): CatalogAsset[] {
  if (catalog) return catalog;
  const f = path.join(AUDIO_LIBRARY, 'catalog.json');
  catalog = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')).assets as CatalogAsset[]) : [];
  return catalog;
}

/** Deterministic search: exact id, else best tag/title/category match; CC0 preferred on ties. */
export function findAsset(query: string, kind: 'sfx' | 'music'): CatalogAsset | undefined {
  const lib = loadCatalog();
  const exact = lib.find((a) => a.id === (CUE_MAP[query] ?? query));
  if (exact) return exact;
  const words = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const pool = lib.filter((a) => (kind === 'music' ? a.kind === 'music' : a.kind !== 'music'));
  let best: CatalogAsset | undefined; let bestScore = 0;
  for (const a of pool) {
    const hay = [a.id, a.title, a.category, ...a.tags].join(' ').toLowerCase();
    let s = words.reduce((acc, w) => acc + (a.tags.includes(w) ? 3 : hay.includes(w) ? 1 : 0), 0);
    if (s === 0) continue;
    if (a.license.id === 'CC0-1.0') s += 0.5;
    if (kind === 'sfx' && a.duration > 6) s -= 1; // prefer short one-shots for cues
    if (s > bestScore) {best = a; bestScore = s;}
  }
  return best;
}

export type AudioResult = {
  narration: Record<string, {audio?: string; duration: number}>;
  sfx: Record<string, string>;
  music?: string;
  credits: string[];
  notes: string[];
};

export function buildAudio(opts: {
  projectId: string; publicDir: string; language: string;
  voice: {provider: string; voice?: string; rate?: number; files?: Record<string, string>};
  shots: {id: string; narration?: string; sfx: {sound: string}[]; ambience?: string}[];
  music?: {query?: string; file?: string};
  baseDir: string;
}): AudioResult {
  const rel = (p: string) => path.relative(opts.publicDir, p).split(path.sep).join('/');
  const outDir = path.join(opts.publicDir, 'projects', opts.projectId, 'audio');
  fs.rmSync(outDir, {recursive: true, force: true});
  fs.mkdirSync(outDir, {recursive: true});
  const res: AudioResult = {narration: {}, sfx: {}, credits: [], notes: []};
  const credit = (a: CatalogAsset) => {
    const line = `${a.title} (${a.id}) — ${a.license.attribution} — ${a.license.id} ${a.license.url}. Changes: converted to WAV, timed to picture${a.kind === 'music' ? ', volume reduced, trimmed/faded to video length' : ''}.`;
    if (!res.credits.includes(line)) res.credits.push(line);
  };

  // narration
  const provider = TTS_PROVIDERS[opts.voice.provider];
  for (const s of opts.shots) {
    if (!s.narration) continue;
    const out = path.join(outDir, `vo-${s.id}.wav`);
    try {
      if (opts.voice.provider === 'files') {
        const src = opts.voice.files?.[s.id];
        if (!src) throw new Error('no file given');
        toWav(path.resolve(opts.baseDir, src), out);
      } else if (provider?.available()) {
        provider.speak(s.narration, out, {voice: opts.voice.voice, rate: opts.voice.rate, language: opts.language});
      } else {
        throw new Error(`provider "${opts.voice.provider}" unavailable`);
      }
      res.narration[s.id] = {audio: rel(out), duration: probeDuration(out)};
    } catch (e) {
      // captions still work: estimate reading time
      res.narration[s.id] = {duration: s.narration.split(/\s+/).length / 2.6};
      res.notes.push(`narration for ${s.id} skipped (${(e as Error).message}); captions use estimated timing`);
    }
  }
  if (opts.voice.provider === 'espeak' && provider?.available()) res.credits.push('Narration: synthesized with eSpeak NG (GPL-3.0 software; generated audio is not encumbered).');

  // sfx
  const queries = [...new Set([...opts.shots.flatMap((s) => s.sfx.map((x) => x.sound)), ...opts.shots.map((s) => s.ambience).filter((a): a is string => !!a && a !== 'none' && a !== 'auto')])];
  for (const q of queries) {
    const local = path.resolve(opts.baseDir, q);
    const asset = fs.existsSync(local) ? undefined : findAsset(q, 'sfx');
    const src = asset ? path.join(AUDIO_LIBRARY, asset.path) : fs.existsSync(local) ? local : undefined;
    if (!src) {res.notes.push(`sfx "${q}" not found in library`); continue;}
    const out = path.join(outDir, `sfx-${(asset?.id ?? path.basename(q)).replace(/[^a-z0-9-]/gi, '_')}.wav`);
    toWav(src, out);
    res.sfx[q] = rel(out);
    if (asset) credit(asset);
  }

  // music
  if (opts.music?.query || opts.music?.file) {
    const asset = opts.music.file ? undefined : findAsset(opts.music.query!, 'music');
    const src = asset ? path.join(AUDIO_LIBRARY, asset.path) : opts.music.file ? path.resolve(opts.baseDir, opts.music.file) : undefined;
    if (src && fs.existsSync(src)) {
      const out = path.join(outDir, 'music.wav');
      toWav(src, out);
      res.music = rel(out);
      if (asset) credit(asset);
    } else res.notes.push(`music "${opts.music.query ?? opts.music.file}" not found`);
  }
  return res;
}
