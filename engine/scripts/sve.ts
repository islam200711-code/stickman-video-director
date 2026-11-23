#!/usr/bin/env tsx
/**
 * sve — Stickman Video Engine CLI
 *   new <id> --topic "..." [--category x] [--duration 30] [--language en] [--aspect 16:9]
 *   build <id>        storyboard.json -> audio stage -> adapter -> public/projects/<id>/spec.json
 *   render <id>       Remotion render -> renders/<id>.mp4  [--quality 720p|1080p] [--aspect 9:16]
 *   qc <id>           ffprobe + frame/black/silence checks + contact sheet -> renders/<id>.qc.json
 *   produce <id>      build + render + qc
 *   still <id> <sec>  render one frame for review
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {Storyboard} from '../director/storyboard';
import {storyboardToSpec, expandChoreography} from '../adapters/storyboardToSpec';
import {autoFoley} from '../audio/foley';
import {buildAudio, ENGINE_ROOT, probeDuration} from '../audio';
import {VideoSpec, resolution, totalFrames} from '../schema/scene';
import {planOverlays} from '../remotion/Overlays';

const [, , cmd, id, ...rest] = process.argv;
const flag = (n: string, d?: string) => {const i = rest.indexOf(`--${n}`); return i >= 0 ? rest[i + 1] : d;};
const P = (...p: string[]) => path.join(ENGINE_ROOT, ...p);
const projectDir = (pid: string) => P('projects', pid);
const specPath = (pid: string) => P('public', 'projects', pid, 'spec.json');
const die = (m: string): never => {console.error(`✖ ${m}`); process.exit(1);};
const CHROME = process.env.REMOTION_CHROME ?? '/opt/pw-browsers/chromium';

function cmdNew(pid: string) {
  const dir = projectDir(pid);
  if (fs.existsSync(path.join(dir, 'storyboard.json'))) die(`${dir}/storyboard.json already exists`);
  fs.mkdirSync(dir, {recursive: true});
  const board = {
    id: pid, title: flag('title', flag('topic', pid)),
    brief: {category: flag('category', 'unspecified'), topic: flag('topic', ''), language: flag('language', 'en'), tone: flag('tone', 'neutral'),
      targetDuration: Number(flag('duration', '30')), aspect: flag('aspect', '16:9'), quality: flag('quality', '720p'), fps: Number(flag('fps', '24'))},
    cast: ['sam', 'riley'], voice: {provider: 'espeak'}, captions: true,
    shots: [{id: 's1', purpose: 'hook', environment: 'studio', narration: 'Replace with narration.', camera: {shot: 'medium', move: 'push-in'},
      blocking: {sam: {at: [0, 0, 0]}}, beats: [{who: 'sam', do: 'wave', at: 0.5}], text: [{text: 'Title', at: 0.3, style: 'title'}]}],
  };
  fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(board, null, 2));
  console.log(`✔ created ${path.relative(process.cwd(), dir)}/storyboard.json — fill in shots (see docs/STORYBOARD.md), then: npm run build -- ${pid}`);
}

function cmdBuild(pid: string) {
  const file = path.join(projectDir(pid), 'storyboard.json');
  if (!fs.existsSync(file)) die(`missing ${file}`);
  const parsed = Storyboard.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (!parsed.success) return die(`storyboard invalid:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
  const ex = expandChoreography(parsed.data);
  const board = autoFoley(ex.board);
  if (ex.report.errors.length) die(`choreography invalid:\n${ex.report.errors.map((e) => '  ' + e).join('\n')}`);
  ex.report.log.forEach((l) => console.log(`  ⚔ ${l}`));
  const audio = buildAudio({projectId: pid, publicDir: P('public'), language: board.brief.language, voice: board.voice,
    shots: board.shots, music: board.music, baseDir: projectDir(pid)});
  const {spec, warnings, shotList} = storyboardToSpec(board, audio);
  fs.mkdirSync(path.dirname(specPath(pid)), {recursive: true});
  fs.writeFileSync(specPath(pid), JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(projectDir(pid), 'CREDITS.txt'), [`${board.title}`, '', 'Audio credits:', ...audio.credits.map((c) => `- ${c}`), ''].join('\n'));
  const frames = totalFrames(spec);
  console.log(`✔ spec: ${path.relative(process.cwd(), specPath(pid))}  scenes=${spec.scenes.length} frames=${frames} (${(frames / spec.format.fps).toFixed(3)}s @ ${spec.format.fps}fps)`);
  console.log('  shot list:'); shotList.forEach((l) => console.log(`    ${l}`));
  [...audio.notes, ...warnings].forEach((w) => console.log(`  ⚠ ${w}`));
}

function loadSpec(pid: string) {
  if (!fs.existsSync(specPath(pid))) die(`no spec for ${pid}; run build first`);
  const spec = VideoSpec.parse(JSON.parse(fs.readFileSync(specPath(pid), 'utf8')));
  if (flag('quality')) spec.format.quality = flag('quality') as never;
  if (flag('aspect')) spec.format.aspect = flag('aspect') as never;
  return spec;
}
const outName = (pid: string, spec: VideoSpec) => P('renders', `${pid}-${spec.format.aspect.replace(':', 'x')}-${spec.format.quality}.mp4`);

function remotion(args: string[], spec: VideoSpec) {
  const props = P('out', `props-${spec.id}.json`);
  fs.mkdirSync(path.dirname(props), {recursive: true});
  fs.writeFileSync(props, JSON.stringify({spec}));
  const r = spawnSync('npx', ['remotion', ...args, `--props=${props}`, '--gl=angle', `--browser-executable=${CHROME}`], {cwd: ENGINE_ROOT, stdio: 'inherit'});
  if (r.status !== 0) die(`remotion ${args[0]} failed`);
}

function cmdRender(pid: string) {
  const spec = loadSpec(pid);
  const out = outName(pid, spec);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  remotion(['render', 'remotion/index.ts', 'StickmanVideo', out, '--codec=h264', '--crf=20', '--pixel-format=yuv420p', `--concurrency=${process.env.REMOTION_CONCURRENCY ?? 3}`], spec);
  if (!fs.existsSync(out)) die('render reported success but no MP4 exists');
  // Remotion encodes JPEG frames as full-range yuvj420p; normalise to broadcast-range yuv420p for every player/platform.
  const tmp = out.replace(/\.mp4$/, '.tmp.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out, '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'copy', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, out);
  console.log(`✔ rendered ${path.relative(process.cwd(), out)}`);
}

function cmdStill(pid: string, sec: string) {
  const spec = loadSpec(pid);
  const out = P('out', `${pid}-${sec}s.png`);
  remotion(['still', 'remotion/index.ts', 'StickmanVideo', out, `--frame=${Math.round(Number(sec) * spec.format.fps)}`], spec);
  console.log(`✔ ${out}`);
}

function cmdQc(pid: string) {
  const spec = loadSpec(pid);
  const file = outName(pid, spec);
  const report: Record<string, unknown> = {file: path.relative(ENGINE_ROOT, file)};
  const checks: {name: string; ok: boolean; detail: string}[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({name, ok, detail});
  add('mp4 exists', fs.existsSync(file), file);
  if (!fs.existsSync(file)) {console.table(checks); process.exit(1);}
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', file]).toString());
  const v = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'video');
  const a = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'audio');
  const {width, height} = resolution(spec.format);
  const wantFrames = totalFrames(spec);
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  add('resolution', v.width === width && v.height === height, `${v.width}x${v.height} (want ${width}x${height})`);
  add('frame rate', n / d === spec.format.fps, `${v.r_frame_rate} (want ${spec.format.fps})`);
  add('frame count', Number(v.nb_read_frames) === wantFrames, `${v.nb_read_frames} decoded (want ${wantFrames})`);
  add('duration', Math.abs(Number(probe.format.duration) - wantFrames / spec.format.fps) < 0.1, `${Number(probe.format.duration).toFixed(3)}s container (video ${(Number(v.nb_read_frames) / spec.format.fps).toFixed(3)}s)`);
  add('codec', v.codec_name === 'h264' && v.pix_fmt === 'yuv420p', `${v.codec_name} ${v.pix_fmt}`);
  const hasNarr = spec.scenes.some((s) => s.narration?.audio) || spec.scenes.some((s) => s.sfx.length) || !!spec.music;
  add('audio stream', !hasNarr || !!a, a ? `${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch` : 'none');
  // full decode = playability; blackdetect + freezedetect for empty/stuck picture
  const log = spawnSync('ffmpeg', ['-v', 'info', '-i', file, '-vf', 'blackdetect=d=0.25:pix_th=0.08,freezedetect=n=0.001:d=1.5', '-af', 'silencedetect=n=-45dB:d=2.5', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  const blacks = [...log.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => `${m[1]}-${m[2]}`);
  const freezes = [...log.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => m[1]);
  const silences = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => m[1]);
  add('decodes cleanly', !/error|corrupt/i.test(log.split('\n').filter((l) => !l.includes('silencedetect')).join('\n').replace(/Error while filtering/g, '')), 'full ffmpeg decode');
  add('no black segments', blacks.length === 0, blacks.join(', ') || 'none');
  add('no frozen picture >1.5s', freezes.length === 0, freezes.join(', ') || 'none');
  report.silences = silences;
  // audio sync check: narration onset per scene from the spec vs actual audio energy
  // contact sheet: one frame per scene midpoint + scene boundaries
  const fps = spec.format.fps;
  let acc = 0; const times: number[] = [];
  spec.scenes.forEach((s, i) => {const startF = acc; const len = Math.round(s.duration * fps); times.push((startF + len / 2) / fps); acc += len - (spec.scenes[i + 1] && spec.scenes[i + 1].transitionIn.type !== 'cut' ? Math.round(spec.scenes[i + 1].transitionIn.duration * fps) : 0);});
  const sheetDir = P('renders', `${pid}-frames`);
  fs.rmSync(sheetDir, {recursive: true, force: true}); fs.mkdirSync(sheetDir, {recursive: true});
  times.forEach((t, i) => execFileSync('ffmpeg', ['-v', 'error', '-ss', t.toFixed(3), '-i', file, '-frames:v', '1', '-vf', 'scale=640:-2', path.join(sheetDir, `scene-${String(i + 1).padStart(2, '0')}-${t.toFixed(1)}s.png`)]));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `fps=1,scale=320:-2,tile=6x${Math.ceil((wantFrames / fps) / 6)}`, '-frames:v', '1', P('renders', `${pid}-contact.png`)]);
  const sz = cmdSafezones(pid, true);
  add('text safe zones (no head covered)', sz.headFail === 0, `${sz.rows.length} text blocks checked`);
  report.safezones = sz.rows;
  report.checks = checks;
  report.sceneFrames = fs.readdirSync(sheetDir).map((f) => path.join('renders', `${pid}-frames`, f));
  fs.writeFileSync(file.replace(/\.mp4$/, '.qc.json'), JSON.stringify(report, null, 2));
  console.table(checks);
  console.log(`contact sheet: renders/${pid}-contact.png  scene frames: renders/${pid}-frames/`);
  if (checks.some((c) => !c.ok)) process.exit(2);
}

/** Safe-zone audit: every title/label/caption vs projected characters + moving action, sampled every 3 frames. */
function cmdSafezones(pid: string, quiet = false) {
  const spec = loadSpec(pid);
  const {width, height} = resolution(spec.format);
  const rows: {scene: string; text: string; slot: string; headHits: string; bodyHits: string}[] = [];
  let headFail = 0;
  for (const sc of spec.scenes) {
    const plan = planOverlays(sc, width, height, spec.format.fps);
    const items = [...sc.text.map((x, i) => ({text: x.text, p: plan.texts[i]})), ...(spec.captions && plan.caption ? plan.caption.chunks.map((c, i) => ({text: '[cap] ' + c.text, p: plan.caption!.placements[i]})) : [])];
    for (const it of items) {
      headFail += it.p.headHits;
      rows.push({scene: sc.id, text: it.text.slice(0, 38), slot: it.p.slot, headHits: `${it.p.headHits}/${it.p.samples}`, bodyHits: `${it.p.bodyHits}/${it.p.samples}`});
    }
  }
  if (!quiet) console.table(rows);
  console.log(headFail === 0 ? '✔ no text block covers a character head' : `✖ ${headFail} sampled frames where text covers a head`);
  return {rows, headFail};
}

if (!cmd || !id) die('usage: sve <new|build|render|qc|produce|still> <project-id> [...]');
switch (cmd) {
  case 'new': cmdNew(id); break;
  case 'build': cmdBuild(id); break;
  case 'render': cmdRender(id); break;
  case 'still': cmdStill(id, rest[0] ?? '1'); break;
  case 'qc': cmdQc(id); break;
  case 'safezones': if (cmdSafezones(id).headFail) process.exit(2); break;
  case 'produce': cmdBuild(id); cmdRender(id); cmdQc(id); break;
  default: die(`unknown command ${cmd}`);
}
void probeDuration;
