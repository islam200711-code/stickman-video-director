import {Config} from '@remotion/cli/config';
// Cloud-safe defaults: reuse the pre-installed Chromium and software WebGL.
Config.setBrowserExecutable(process.env.REMOTION_CHROME ?? '/opt/pw-browsers/chromium');
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY ?? 2));
Config.setVideoImageFormat('jpeg');
