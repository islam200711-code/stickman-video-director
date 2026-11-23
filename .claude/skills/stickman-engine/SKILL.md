---
name: stickman-engine
description: Produce a finished stickman MP4 locally with the repo's engine/ (Three.js rig + Remotion). Use when the user wants an actual rendered stickman video from a topic, script or storyboard in any niche, or wants to run, extend or QC the engine. Works with directing-stickman-videos for story direction.
---

# Stickman Engine (engine/)

Roles: the **directing-stickman-videos** Skill directs (story, hook, beats, narration fit; read its `references/storyboard-template.md`). This engine renders: Three.js rig and environments, Remotion timeline/audio/encode.

1. Restore if needed: `cd engine && ./scripts/setup.sh`.
2. Confirm the brief (topic, category, duration, language, aspect, tone). Never assume a channel niche.
3. `npm run new -- <id> --topic "..." --duration N`, then write `projects/<id>/storyboard.json` per `engine/docs/STORYBOARD.md`. Show the storyboard for approval.
4. `npm run build -- <id>`. Fix every warning (narration overrun, unresolved sound).
5. Review frames before the full render: `npx tsx scripts/sve.ts still <id> <sec>`.
6. `npm run render -- <id>`, then `npm run qc -- <id>`. A video is delivered only when the MP4 exists, QC passes, and you have looked at `renders/<id>-contact.png`.
7. Deliver the MP4 with `projects/<id>/CREDITS.txt` (CC-BY music needs attribution).

Free and offline only by default (espeak-ng, licensed library). Paid TTS or video APIs need explicit user approval.
