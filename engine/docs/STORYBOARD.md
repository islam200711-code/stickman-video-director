# Storyboard format (director → engine)

A storyboard is `projects/<id>/storyboard.json`, validated by `director/storyboard.ts`. It is written in film language; the adapter converts it into renderer scene data (`schema/scene.ts`). The complete working example is `projects/ordinary-challenge/storyboard.json`.

## Top level

| Field | Meaning |
|---|---|
| `id` | kebab-case project id |
| `title` | Video title |
| `brief.category` | Free text such as "education", "comedy" or "unspecified". It is recorded but never changes engine behaviour |
| `brief.topic`, `language`, `tone` | Per-video choices. `language` selects the TTS voice |
| `brief.targetDuration` | Seconds. All shots, beats, text and SFX are scaled proportionally so the video is exactly this many frames |
| `brief.aspect` / `quality` / `fps` | `16:9`/`9:16`, `720p`/`1080p`, default 24 |
| `cast` | Library ids (`"sam"`) or full profiles `{id,name,color,headColor,accent,accessory,build,scale}` |
| `voice` | `{provider: "espeak" \| "files" \| "none", voice?, rate?, files?: {shotId: path}}` |
| `music` | `{query: "upbeat friendly", volume}` searches the licensed library, or `{file}` |
| `captions` | Narration subtitles on or off |

## Shot

| Field | Meaning |
|---|---|
| `environment`, `timeOfDay`, `palette` | Preset: `studio street park office room cliff forest`; `day`/`dusk`/`night`; colour overrides |
| `narration` | Spoken line. Its measured TTS length sets the default shot length |
| `duration` | Optional fixed length before retiming |
| `camera.shot` | `establishing wide two-shot medium close low high` |
| `camera.move` | `static push-in pull-out pan-left pan-right track orbit crane-up` |
| `camera.focus` | Character id, list of ids, or `[x,y,z]`. `track` follows the focus as it moves |
| `camera.angle` / `shake` | Yaw around the focus in degrees (0 = front); shake amount |
| `blocking` | `{charId: {at:[x,0,z], facing, expression, label?}}`. Facing is in degrees: 0 = camera, 90 = screen right |
| `beats` | `{who, do: <action>, at, until?, to?, facing?, expression?, speed?, intensity?, prop?}` |
| `props` | `{kind, at, scale?, rotation?, color?, appearAt?, move?: {to, start, end, roll}}` |
| `text` | `{text, at, until?, style: title\|label\|caption\|lower-third, position: top\|center\|bottom}` |
| `sfx` | `{sound: "<library id or search words or local path>", at, volume}` |
| `transition` | Transition into this shot: `cut fade slide wipe`, plus `transitionDuration` |

**Actions:** idle walk run jump fall sit stand talk point think surprised celebrate argue fight escape work computer hold wave shrug facepalm thumbsup lying push.

**Expressions:** neutral happy sad angry surprised thinking worried determined.

**World units:** metres. A stickman is about 1.9 units tall. x is screen-right, z is toward the camera, y is up.

## Authoring with Claude and the existing Skill

Use the `directing-stickman-videos` Skill's story guidance (`references/storyboard-template.md`: hook, beats, narration fit of about 2.5 words per second, reaction pauses) to write the shots. Then run `npm run build`: it prints every narration overrun and retiming warning before any rendering happens.
