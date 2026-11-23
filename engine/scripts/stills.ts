/**
 * Render many review stills from one bundle (much faster than repeated `remotion still`).
 * usage: tsx scripts/stills.ts <project-id> <sec> [sec...] [--out dir] [--scale 1]
 */
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {ENGINE_ROOT} from '../audio';

const args = process.argv.slice(2);
const id = args[0];
const oi = args.indexOf('--out');
const out = oi >= 0 ? args[oi + 1] : path.join(ENGINE_ROOT, 'out', id);
const times = args.slice(1).filter((a, i, arr) => !a.startsWith('--') && arr[i - 1] !== '--out').map(Number);
const spec = JSON.parse(fs.readFileSync(path.join(ENGINE_ROOT, 'public', 'projects', id, 'spec.json'), 'utf8'));
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(ENGINE_ROOT, 'remotion/index.ts'), publicDir: path.join(ENGINE_ROOT, 'public')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_CHROME ?? '/opt/pw-browsers/chromium', chromiumOptions: {gl: 'angle'}});
const inputProps = {spec};
const composition = await selectComposition({serveUrl, id: 'StickmanVideo', inputProps, puppeteerInstance: browser});
for (const t of times) {
  const file = path.join(out, `${t.toFixed(2)}s.png`);
  await renderStill({composition, serveUrl, inputProps, frame: Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps)), output: file, puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}});
  console.log(file);
}
await browser.close({silent: true});
