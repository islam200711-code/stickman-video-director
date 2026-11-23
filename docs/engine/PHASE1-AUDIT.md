# Phase 1 Audit: Stickman Video Director + Remotion

Date: 2026-11-22. Read-only audit. No repository files were changed.

## 1. What exists

| Area | Finding |
|---|---|
| Repo shape | One Claude/Codex **Skill** package: `skills/directing-stickman-videos/` (SKILL.md, about 80 reference docs, scripts, tests, assets). The root holds READMEs in 9 languages, a CHANGELOG, `tests/` (Python/shell doc verifiers) and `docs/`. |
| How Claude Code uses it | Through `SKILL.md` (the skill `directing-stickman-videos`). It is a prompt-driven director: Claude reads the references and runs the scripts. There is no server or API. `agents/openai.yaml` is the Codex manifest. |
| Mode A · Model Engine (A1–A8) | Storyboards and prompts for **external AI video generators** (Google Flow, Gemini and others). It does not render locally. |
| Mode B · Code Engine (B1–B7) | Local renderer. `scripts/autopilot.mjs` is the CLI (init/validate/render/doctor). `autopilot-render.mjs` draws frames with `@napi-rs/canvas` and encodes them with **ffmpeg**. B6 has a Python puppet rig (`b6_puppet.py`: Pillow, NumPy, OpenCV; FK and 2-bone IK arms; **static legs only, "does not claim to solve gait"**) and a 3D camera/projection helper (`b6_space.py`). B7 draws pixel art. |
| Audio | `assets/b-audio-library/` (CC0/credited SFX: Kenney, RubberDuck), `audio-library.mjs`, and caption alignment in `align_captions.py`. Narration depends on external TTS providers such as Gemini (`gemini-media.mjs`, which needs an API key). |
| QA | Extensive style-specific gates: `b*-review`, `*-quality`, and `node --test tests/*.test.mjs`. |
| Dependencies | `@napi-rs/canvas`, `sharp`. **`node_modules` is not installed** in this container. In Python, NumPy and Pillow are present but **OpenCV is missing**, so B6 cannot run. ffmpeg/ffprobe 6.x and Node 22 are present. |

## 2. What is missing

- **Remotion: not present anywhere.** There is no Remotion package, composition, `remotion.config`, or any mention in the repo or in the global npm packages. Only the Remotion *documentation skills* plugin is loaded in Claude Code. The brief's statement that "Remotion is already present/installed" does not hold for this repository or container.
- **Three.js, React Three Fiber, @remotion/three:** none present.
- No niche-neutral, machine-readable scene format shared between a director and a renderer. Each B style has its own manifest dialect.
- No walking, running or jumping gait in any rig. The action library is limited to arm actions (rest, reach, offer, receive, retract) and style-specific motion.
- No free offline TTS installed: no espeak, piper or festival.

## 3. Compatibility issues and risks

1. Existing B-mode scenes are tightly coupled to per-style acceptance gates and painted assets. Feeding them into Remotion directly would bypass those gates. The new engine should be **additive** (a new path, for example "B8 / Engine"), not a rewrite of B1–B7.
2. The B6 puppet is Python and raster-based. Remotion renders React in Chromium, so the B6 rig cannot be reused inside Remotion. A new procedural vector/Three.js stickman rig is required, and it would not duplicate anything existing.
3. Remotion's licence is free for individuals and small companies (up to 3 employees). Larger companies need a paid company licence. This needs flagging before commercial use.
4. Remotion has to download a headless Chrome. The pre-installed Chromium at `/opt/pw-browsers/chromium` can be supplied as `browserExecutable` instead.
5. Three.js inside Remotion needs WebGL in headless Chromium (`--gl=angle`/swangle). It works, but it is slower than 2D SVG.

## 4. Recommended architecture

```
skills/directing-stickman-videos/      (existing Skill, untouched except one SKILL.md pointer)
engine/                                 NEW sibling package (single Remotion project)
  director/      concept -> script -> storyboard -> scene JSON (rule-based, LLM-optional)
  schema/        scene.schema (TypeScript + zod) = shared contract
  adapters/      storyboard -> scene JSON; scene JSON -> Remotion props
  characters/    profiles + library (proportions locked, palette configurable)
  animations/    deterministic pose functions f(frame) -> joint angles
  three/         optional R3F/@remotion/three renderer of the same rig
  remotion/      Root.tsx, Video composition, Scene, transitions, captions
  audio/         optional TTS/SFX/music interfaces (no paid services)
  scripts/       CLI: new / storyboard / render / qc
  renders/       (gitignored) MP4 output
docs/engine/     integration docs
```

The 2D SVG rig is the default renderer because it is fast, crisp and deterministic. Three.js is an optional renderer for 3D shots over the same skeleton data.

## 5. Files to modify / create

- Modify: `SKILL.md` (add a short "Engine" route pointer), `.gitignore` (`engine/renders`, `engine/node_modules`).
- New: everything under `engine/` and `docs/engine/`.
