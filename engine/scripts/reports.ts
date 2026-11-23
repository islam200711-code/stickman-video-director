/**
 * Post-render reports for a project: audio sync report + render performance report.
 * usage: tsx scripts/reports.ts <project-id> [render-seconds]
 * Measures the actual rendered MP4 (not the plan): for every scheduled SFX cue it finds the
 * nearest audio onset; for every important impact it measures the music dip before the hit.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {VideoSpec, resolution, totalFrames} from '../schema/scene';
import {ENGINE_ROOT} from '../audio';

const id = process.argv[2]; const renderS = Number(process.argv[3] ?? NaN);
const spec = VideoSpec.parse(JSON.parse(fs.readFileSync(path.join(ENGINE_ROOT, 'public/projects', id, 'spec.json'), 'utf8')));
const mp4 = path.join(ENGINE_ROOT, 'renders', `${id}-${spec.format.aspect.replace(':', 'x')}-${spec.format.quality}.mp4`);
const fps = spec.format.fps;

// PCM -> 10 ms RMS envelope (dB)
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', mp4, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], {maxBuffer: 1 << 28});
const pcm = new Int16Array(raw.buffer, raw.byteOffset, raw.length / 2);
const W = 80; const env: number[] = [];
for (let i = 0; i + W <= pcm.length; i += W) {let s = 0; for (let k = 0; k < W; k++) {const v = pcm[i + k] / 32768; s += v * v;} env.push(10 * Math.log10(s / W + 1e-12));}
const at = (t: number) => env[Math.max(0, Math.min(env.length - 1, Math.round(t * 100)))];
const onsetNear = (t: number, win = 0.1) => {let best = -1, bt = t; for (let x = t - win; x <= t + win; x += 0.01) {const d = at(x) - at(x - 0.03); if (d > best) {best = d; bt = x;}} return {t: bt, rise: best};};
const mean = (a: number, b: number) => {let s = 0, n = 0; for (let x = a; x < b; x += 0.01) {s += at(x); n++;} return s / Math.max(1, n);};

// global scene offsets
const starts: number[] = []; let acc = 0;
spec.scenes.forEach((sc, i) => {starts.push(acc / fps); const n = Math.round(sc.duration * fps); const nx = spec.scenes[i + 1]; acc += n - (nx && nx.transitionIn.type !== 'cut' ? Math.round(nx.transitionIn.duration * fps) : 0);});

const rows: string[] = []; const errs: number[] = []; const imp: string[] = [];
spec.scenes.forEach((sc, i) => {
  for (const s of sc.sfx) {
    const T = starts[i] + s.at; if (s.volume < 0.6) continue; // check prominent cues (quiet footsteps/ticks are masked by design)
    const o = onsetNear(T); const err = (o.t - T) * 1000; if (o.rise > 3) errs.push(Math.abs(err));
    rows.push(`| ${sc.id} | ${path.basename(s.file).replace('.wav', '').slice(0, 42)} | ${T.toFixed(3)} | ${o.t.toFixed(2)} | ${err.toFixed(0)} | ${o.rise.toFixed(1)} |`);
    if (s.important) imp.push(`| ${sc.id} | ${T.toFixed(2)} | ${mean(T - 1.4, T - 0.6).toFixed(1)} | ${mean(T - 0.4, T - 0.05).toFixed(1)} | ${(mean(T - 0.4, T - 0.05) - mean(T - 1.4, T - 0.6)).toFixed(1)} |`);
  }
});
errs.sort((a, b) => a - b);
const p50 = errs[Math.floor(errs.length * 0.5)] ?? NaN, p95 = errs[Math.floor(errs.length * 0.95)] ?? NaN;
const credits = fs.existsSync(path.join(ENGINE_ROOT, 'projects', id, 'CREDITS.txt')) ? fs.readFileSync(path.join(ENGINE_ROOT, 'projects', id, 'CREDITS.txt'), 'utf8') : '(none)';
const {width, height} = resolution(spec.format);
const out = `# ${spec.title} — audio & performance report

Generated from the rendered file \`${path.relative(ENGINE_ROOT, mp4)}\` (measured, not planned).

## Audio
- Narration: **none** (voice provider: none). Music bed + event-driven SFX + ambience only.
- Prominent SFX cues checked: ${rows.length}. Onset error vs scheduled time (cues with a clear onset): **median ${p50?.toFixed(0)} ms, p95 ${p95?.toFixed(0)} ms** (1 frame = ${(1000 / fps).toFixed(1)} ms).

| scene | cue | scheduled (s) | detected onset (s) | error (ms) | rise (dB) |
|---|---|---|---|---|---|
${rows.join('\n')}

### Pre-hit silence / ducking (important impacts)
| scene | hit (s) | mix level −1.4…−0.6 s (dB) | mix level −0.4…−0.05 s (dB) | change (dB) |
|---|---|---|---|---|
${imp.join('\n') || '| – | – | – | – | – |'}

### Licences / attribution
\`\`\`
${credits.trim()}
\`\`\`

## Render performance
- Output: ${width}×${height} @ ${fps} fps, ${totalFrames(spec)} frames (${(totalFrames(spec) / fps).toFixed(2)} s).
- Wall time: ${isNaN(renderS) ? 'n/a' : `${renderS} s → **${(renderS / totalFrames(spec)).toFixed(2)} s/frame**, ${(renderS / (totalFrames(spec) / fps)).toFixed(1)}× realtime`} (4-core cloud container, software WebGL/SwiftShader, MSAA on, shadow map ${spec.format.render.shadowMap}, concurrency ${process.env.REMOTION_CONCURRENCY ?? 3}).
`;
const dst = path.join(ENGINE_ROOT, 'docs/hybrid', `${id}-report.md`);
fs.mkdirSync(path.dirname(dst), {recursive: true}); fs.writeFileSync(dst, out);
console.log(out.split('\n').slice(0, 8).join('\n')); console.log(`→ ${dst}`);
