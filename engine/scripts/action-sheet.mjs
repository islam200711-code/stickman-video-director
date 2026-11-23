// QA tool: renders every action in the library into a labelled contact sheet (out/action-sheet.png).
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const t = Number(process.argv[2] ?? 0.6);
const acts = ['idle','walk','run','jump','fall','sit','stand','talk','point','think','surprised','celebrate','argue','fight','escape','work','computer','hold','wave','shrug','facepalm','thumbsup','lying','push','reach','clap','nod','headshake','crouch','laugh'];
const ids = ['sam','riley','max','jo','dev'];
fs.mkdirSync('out', {recursive: true});
const rows = [];
for (let r = 0; r * 6 < acts.length; r++) {
  const chunk = acts.slice(r * 6, r * 6 + 6);
  const characters = chunk.map((a, i) => ({id: 'c' + i, profile: ids[(r * 6 + i) % 5], label: a, position: [(i - 2.5) * 1.75, 0, 0], facing: a === 'walk' || a === 'run' || a === 'escape' ? 60 : 20, expression: ['happy','excited','surprised','thinking','determined','smug'][i],
    track: [{action: a, start: 0, prop: a === 'hold' ? 'coffee' : undefined}]}));
  const spec = {id: 'sheet', title: 'sheet', cast: [], captions: false, scenes: [{id: 'row', duration: 3, environment: {preset: 'studio'}, characters,
    camera: {keys: [{t: 0, position: [0, 1.6, 9.5], lookAt: [0, 1.0, 0], fov: 40}]}}]};
  fs.writeFileSync(`out/sheet-${r}.json`, JSON.stringify({spec}));
  execFileSync('npx', ['remotion', 'still', 'remotion/index.ts', 'StickmanVideo', `out/sheet-${r}.png`, `--frame=${Math.round(t * 24)}`, `--props=out/sheet-${r}.json`, '--gl=angle', '--log=error'], {stdio: 'inherit'});
  rows.push(`out/sheet-${r}.png`);
}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...rows.flatMap((p) => ['-i', p]), '-filter_complex', `${rows.map((_, i) => `[${i}:v]crop=1280:420:0:150[r${i}]`).join(';')};${rows.map((_, i) => `[r${i}]`).join('')}vstack=inputs=${rows.length}`, 'out/action-sheet.png']);
console.log('wrote out/action-sheet.png');
