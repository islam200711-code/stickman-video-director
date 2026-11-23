# Reference Analysis — "The Dark Age – Animator vs. Animation 14" (Alan Becker)

Purpose: technical, cinematic and pipeline study only. **Nothing in our productions may reuse its characters, names, story, dialogue, shots, backgrounds, music or assets.** In this report characters are described neutrally (for example "grey visor figure", "red figure").

## 0. Access & evidence

| Item | Status |
|---|---|
| YouTube URL | Blocked by the environment proxy (403). Not used |
| User-supplied files | `THE_DARK_AGE_PART_01_OF_06.mp4` — **inspected** (198.15 s, 640×360, 23.976 fps, AAC stereo 44.1 kHz). `PART_02_OF_06.mp4` — **inspected** (187.70 s, same format); see §P2. Parts 03–06 — **not received** |
| Method | `scripts/reference-analyze.sh` and the commands in §Method. Evidence: 1 fps contact sheets (7 sheets) for the whole of part 1; 12 fps strips for action passages (29.5–32.5, 53.8–55.2, 189.5–191 s); before/after frames at all 57 detected cuts; a 0.5 s RMS loudness envelope |
| Not done | **I did not listen to the audio.** Audio statements are loudness and onset measurements only; no claims about instruments, music identity or specific sound types. Credits are not in part 1, so §F cannot name roles from evidence |

**Timestamp precision.**
- Detected cuts use `select='gt(scene,0.15)'`, accurate to ±1 frame (0.042 s).
- Some cuts inside low-contrast, single-hue passages (mainly 91.8–127.2 s) were **not detected**. Those boundaries come from the 1 fps sheets and are marked `≈`, accurate to ±1 s.
- Durations of `≈` shots are approximate.

---

## PART 1 (0:00–3:18)

### A. Shot breakdown

Legend:
- Cam: **WS** wide, **MS** medium, **CU** close-up, **ECU** extreme close-up, **EST** establishing.
- Mv: camera move.
- **T** = the transition into the next shot.
- Character positions are given in frame terms (L, C, R, fg, bg).

| # | Start | End | Dur | What is on screen (characters · positions · actions · expressions) | Cam / angle / move | Environment · lighting | VFX | T → next | Purpose |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.00 | 6.95 | 6.95 | No characters. A large shadow crosses the tree canopy at ≈4–6 s | EST, high aerial, steady **forward fly-over** | Painted-look 3D canopy (fg→bg) to a city skyline; bright day | Moving cast shadow (off-screen flyer) | Cut | World establishment; the shadow foreshadows a threat |
| 2 | 6.95 | 12.45 | 5.50 | 2 figures: yellow (R, standing, cooking with a pan, serving), purple (L, seated at a table). Purple reacts with raised arms at 9 s and hands on head at 11 s | MS/WS, eye level, static | Detailed kitchen interior; window with skyline; soft daylight, warm wall lamp | — | Cut | Ordinary-world routine before the disruption |
| 3 | 12.45 | 15.20 | 2.75 | Exterior of the same apartment window. At 14 s the yellow face presses to the glass, purple behind | MS frontal, static, flat facade | Pale facade panels | — | Cut | Bridge inside→outside; characters look out (motivates the next shot) |
| 4 | 15.20 | 18.12 | 2.92 | No characters. A skyscraper tilts and falls (≈16–17 s) | WS, slightly low, static | Painted 3D city, blue sky, clouds | Falling building | Cut | Scale of the threat (the point-of-view payoff of 3) |
| 5 | 18.12 | 24.80 | 6.68 | Street crowd of many coloured figures crossing; one falls (19 s). A dust cloud then fills the frame (20–22 s); camera **tilts up** out of the smoke to a tiny figure high between towers (23–24 s) | WS street level → **tilt-up / crane** | City street, lamps, cars; day | Large stylised smoke wall used as an in-camera wipe | Cut (24.80, with 1-frame flickers 24.84/24.88) | Panic → reveal of the hero high above |
| 6 | 24.80 | ≈26.5 | ≈1.7 | Grey figure with a cyan visor, frontal, arms out; cyan lines radiate behind | MS/CU **low angle**, static | Plain sky | Cyan line burst (HUD-like) | ≈Cut (undetected, 1 fps evidence 26→27 s) | Hero framing (power pose, low angle) |
| 7 | ≈26.5 | 30.18 | ≈3.7 | ECU red sphere with a spider-like emblem; a small white figure appears inside | ECU, slow push / static | Dark vignette | Radial blur rings (30.08–30.17) | **Zoom/radial-blur match transition** (30.18–30.22) | Antagonist motif and threat identity |
| 8 | 30.22 | 33.89 | 3.67 | Grey visor figure: camera pulls back from an **ECU on the visor (30.25) to MS (30.75)**. A red figure smears in from the top right (31.33–31.58) and lands beside him (31.67), crouched and hooked against him | Low angle, **fast pull-out** then static | Sky with cyan line rays | **Smear frames** on the red figure's entrance; HUD reticle on the visor | Cut | Confrontation set-up; speed shown with smear |
| 9 | 33.89 | 34.68 | 0.79 | Grey figure walking forward between towers (bottom of frame) | Low-angle WS street canyon | Damaged street, blue tones | — | Cut | Geography / approach |
| 10 | 34.68 | 36.31 | 1.63 | Red figure in a contorted action pose between towers; impact or debris below | WS low | Same street | Debris / dust | Smear wipe | Action beat |
| — | 36.31 | 36.60 | 0.29 | **Transition element:** black-and-red brush smears sweep the frame over 7 frames, revealing the next shot | — | — | Hand-drawn smear wipe | — | Energy transition |
| 11 | 36.60 | 40.56 | 3.96 | A giant dark winged construct with a red ring and eye looms to the R of a skyscraper | WS **very low angle**, slow drift | Pink and red sky | Glowing red accents | Cut | Antagonist scale reveal |
| 12 | 40.56 | 50.66 | 10.10 | TV news graphic ("breaking news" lower third) over city destruction. A presenter figure (purple, L) is inset with picture-in-picture footage. Pull-back reveals the TV inside a room with silhouetted viewers (47 s). A test card appears (49 s), and a grey figure is seen on the screen | **Screen-within-screen**, then **pull-out** to the room | Broadcast graphics, then a dim room lit by the TV | Lower-third graphics, colour-bar test card | Cut | Exposition device; shows scale via "media" |
| 13 | 50.66 | 54.33 | 3.67 | Chaotic battle: fire, flipped car, dark foreground silhouettes, red figures attacking | WS, dynamic | Burning street | Fire, debris; **cyan flash frame at 50.66–50.70** | Impact star | Escalation |
| — | 54.33 | 54.83 | 0.50 | **Transition element:** 1-frame **radial white impact star on black** (54.37), then **hand-painted fire/explosion wipe** (yellow/orange/white shapes, 54.38–54.72) dissolving into the next shot | — | — | Impact flash + painted explosion wipe | — | Impact punctuation, used as a cut |
| 14 | 54.83 | 58.29 | 3.46 | Group of distinct townsfolk figures (hats, a flower) in the fg facing the camera, frightened. A red figure is in the bg with the giant construct behind | MS group, eye level, static | Burning town street | Fire | Impact star (58.37) + fire wipe (58.41–58.96) | Ordinary people under threat |
| 15 | 58.96 | 65.51 | 6.55 | Burning landscape at night; the construct floats far away (top L). A windmill silhouette appears at R (63 s) | EST/WS, slow **pan right** | Night, fire glow, embers | Fire, embers, smoke | **1-frame full green flash** (65.51) | Scale of devastation |
| 16 | ≈65.6 | 68.17 | ≈2.6 | A small yellow figure trapped in a green-lit glass capsule on a machine; a blue figure stands beside it | MS, low, static | Dark red machine interior; green key light from the capsule | Green glow | Cut | Captive or stakes reveal |
| 17 | 68.17 | 75.01 | 6.84 | Exterior of the construct against a starry sky, with a green core glowing; at 71 s a tumbling fragment | WS, slow move | Night sky | Green glow | Cut | Antagonist machine geography |
| 18 | 75.01 | 83.69 | 8.68 | A dense crowd of many hundreds of figures; a heap of fallen figures (75 s). The camera **pushes in or travels** across the crowd (76–83 s) | WS → MS, **slow lateral/forward move** | Dusk, desaturated | Crowd duplication | Cut | Scale of the oppressed population |
| 19 | 83.69 | 87.40 | 3.71 | Construct silhouette against a red sky over a city skyline | WS, static | Red monochrome | — | Cut | Mood shift to red "dark age" palette |
| 20 | 87.40 | 90.07 | 2.67 | Mechanical red ring or lens with an orb at its centre | CU frontal, static | Red | Glow | Cut | Machine eye motif |
| 21 | 90.07 | 91.82 | 1.75 | Chain shackles and red spheres | CU, static | Red | — | Cut | Captivity motif |
| 22 | 91.82 | ≈95.5 | ≈3.7 | Two figures very close to the lens: a pale-faced dark figure (L, with goggles) and the grey visor figure (R) in profile | **Extreme foreground CU two-shot** | Red | — | ≈Cut | Intimate confrontation |
| 23 | ≈95.5 | ≈101.5 | ≈6 | Distant WS: figures far away on a red plain; one approaches the other | WS, static | Red plain, horizon band | — | ≈Cut | Distance / isolation |
| 24 | ≈101.5 | ≈107 | ≈5.5 | City skyline silhouette; a red figure rises into frame (102–106 s) and faces the camera | MS, **figure entering the frame** | Red | — | ≈Cut | Antagonist presence |
| 25 | ≈107 | ≈110.5 | ≈3.5 | Red legs on a ledge (top) and a dark figure's arm reaching (the ledge is in perspective) | CU low, static | Red | — | ≈Cut | Physical interaction detail |
| 26 | ≈110.5 | ≈114.5 | ≈4 | Repeat of the distant WS (as in 23) | WS | Red | — | ≈Cut | Callback to the geography |
| 27 | ≈114.5 | 127.23 | ≈12.7 | Huge mechanical tower or construct; slow travel past its surface | WS, **slow tracking past a large structure** | Red haze | Atmospheric haze | Cut | Scale and oppression |
| 28 | 127.23 | 130.15 | 2.92 | A white device or vehicle (dome with cyan lights) driven by a figure, with a giant dark structure behind | MS, slightly low, static | Saturated red sky | — | Cut (fast zoom) | Introduces the vehicle |
| 29 | 130.15 | 134.28 | 4.13 | Interior/close view of the device: control panel; a card with picture icons appears (131.5 s) | CU/insert, **cut-in** | White device, soft light | — | Cut | Information insert (shows a plan visually) |
| 30 | 134.28 | 136.99 | 2.71 | Mechanical red ring/orb (as in 20) | CU | Red | — | Cut | Re-establishes the machine eye |
| 31 | 136.99 | 140.87 | 3.88 | Device travelling on a red plain (L) toward a small object (R) | WS profile, static | Red horizon bands | — | Cut | Travel / geography |
| 32 | 140.87 | 153.63 | 12.76 | A pale long-haired figure (L) walks to a slumped dark figure (R, on the ground, next to a ball-and-chain). She kneels and touches him (145–147 s), stands, gestures and walks around (148–152 s) | WS **profile staging**, static, long take | Red plain; flat graphic bands | — | Cut | **Emotional scene**: first gentle interaction, in a long held wide |
| 33 | 153.63 | 157.43 | 3.80 | The dark figure's head and shoulders, still | CU, static | Red | — | Cut | Reaction / interiority |
| 34 | 157.43 | ≈161.1 | ≈3.7 | Large CU of the pale figure, 3/4 back view, looking toward the vehicle | **OTS-like CU** | Red; city in bg | — | Rapid cuts 161.14–161.81 | Point of view |
| 35 | 161.14 | 167.02 | 5.88 | Alternating **foreground pale figure / dark figure** framings (4 quick cuts at 161.14, 161.23, 161.31, 161.73, 161.81) then a held framing of the dark figure | CU/OTS shot-reverse-shot | Red | — | Cut | Shot/reverse-shot dialogue without words |
| 36 | 167.02 | 170.07 | 3.05 | Machine-heavy interior: thick ribbed cables, mechanisms, red spider-like insignia | WS, slight drift | Red industrial interior | — | Cut | Moves to the enemy facility |
| 37 | 170.07 | 178.33 | 8.26 | A dark figure and a pale figure crouch behind a large grey metal block (cover); the pale figure peeks and gestures | MS, slightly high, static | Industrial interior: cables, red light | — | Cut | Stealth / planning |
| 38 | 178.33 | ≈184 | ≈5.7 | The dark figure climbs onto or over machinery with a white weapon; he aims (180–183 s) | MS, **low / tilted** angle | Industrial, red | — | ≈Cut | Action set-up |
| 39 | ≈184 | ≈188 | ≈4 | Swarm of red outlined spider-like creatures on the machinery; white star glints | WS, dynamic | Industrial, red | Glints | ≈Cut | Threat swarm |
| 40 | ≈188 | ≈190.2 | ≈2.2 | Dark figure from behind/below, aiming. **Muzzle flash and yellow beam** (189.67 s) | Low angle, static | Red machinery | Beam, muzzle flash | Cut | Action |
| 41 | ≈190.2 | ≈191 | ≈0.8 | A red creature is hit: hit flash and ring (190.58–190.92) | WS | Industrial | **Hit flash + burst** | Cut | Cause→effect readability |
| 42 | ≈191 | 198.15 | ≈7 | Shooting continues; swarm close-up (195 s); the figure moves along a cable (196–197 s) | Mixed MS/WS | Industrial | Beams | End of file | Action continues into part 2 |

### B. Animation (part 1)

**Observed** (with evidence):
- **Smear frames for fast entrances:** the red figure's body stretches into whip-like strokes for 3–4 frames before resolving (31.33–31.67 s, 12 fps strip).
- **Pose-to-pose with strong holds:** after landing, the red figure holds a crouched pose for many frames (31.75–32.42 s).
- **Graphic silhouettes:** characters are flat, single-colour stickmen with thick, constant line weight and circular heads. They read clearly against every background because of strong hue/value contrast (yellow/purple against blue interiors; black/white against red).
- **Gentle emotional acting via staging rather than faces:** the kneel-and-touch beat in shot 32 is played in a held wide profile, with slow timing.
- **Crowd scale via many simple figures** (shot 18).
- Not determinable from 1–12 fps evidence: squash/stretch on impacts, foot contact accuracy, specific in-betweening. A per-frame (24 fps) pass on chosen moments is needed and is planned for part 2's fight sections.

**Recommendations for our engine** (not observations): add smear and stretch frames for fast moves, hold frames after landings, impact punctuation frames, and flat-colour 2D characters with constant line weight for the hybrid mode.

### C. Camera & cinematography (part 1)

**Observed:**
- **Establishing** aerial fly-over (1) and night landscape pan (15).
- **Low-angle hero framing** (6, 8, 11).
- **Fast pull-out** from an ECU (8).
- **Tilt-up through smoke** as a reveal (5).
- **Screen-within-screen** exposition with a pull-out (12).
- **Long-held wide profile staging** for emotional scenes (32), contrasting with rapid **shot/reverse-shot** cutting (35).
- **Cut-in inserts** for information (29).
- **Extreme-foreground CU two-shots** (22).
- Shot lengths range from 0.8 s (action) to 12–13 s (emotional and scale takes). 42 shots in 198 s gives a mean of about 4.7 s.

### D. Environment & art direction (part 1)

**Observed:**
- **Painted-look 3D environments** (city, kitchen, industrial) with flat 2D characters composited on top. This is the clearest evidence for the 2D-character / 3D-environment hybrid approach.
- Detailed interiors (kitchen, TV room); large-scale exteriors with fg/mg/bg depth (city canyons, crowd, landscape).
- **Strong palette blocking by act:** bright blue/green day (0–60 s) → fire orange (50–66 s) → **near-monochrome red** (84–198 s), where characters read as black or white silhouettes.
- Effects: fire, smoke walls, embers, glow (green capsule, red machine).

### E. Audio (part 1) — measured, not listened

- 0.5 s RMS envelope: quiet opening (−36 dBFS at 0 s) rising to −14 dBFS by 2.5 s. A loud section from 10–15 s peaks at −5 dBFS; this is the **loudest part of part 1** and sits inside shot 2.
- **Sharp onsets** (> 8 dB jump in 0.5 s): 2.0, **10.0 (+16 dB)**, 26.5, 90.0, 107.5, 110.5, 113.0, 154.0, 161.5, 189.5 s.
  - 189.5 s coincides with the observed muzzle flash (189.67 s).
  - 161.5 s coincides with the rapid cut cluster (161.14–161.81 s).
- Quieter sustained passages: 100–107 s and 138–153 s (about −21 to −27 dBFS). These overlap the long emotional take (shot 32), which suggests the mix steps down for tender scenes.
- **No near-silent windows** (< −40 dBFS) after the first second: the soundtrack is continuous.

### F. Production roles

Credits are not present in part 1, so no role list from evidence. Pipeline mapping: see "Proposed architecture" below.

---

## §P2 — PART 2 (0:00–3:07.7 of file 02)

File: 187.70 s, 640×360, 23.976 fps. Evidence: 1 fps sheets (7), 12 fps strips (20.5–23.5 s close fight, 150–153 s crash), 44 detected changes at threshold 0.15, a 0.5 s RMS envelope. `≈` marks a ±1 s boundary taken from the 1 fps sheets.

### A. Shot breakdown

| # | Start | End | Dur | On screen | Cam / move | Environment · light | VFX | T → | Purpose |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.00 | 12.01 | 12.0 | Dark figure with a white weapon on giant ribbed cables. Fires a **yellow beam** (1 s, 8 s) at red outlined creatures. Climbs, jumps between machine parts; tiny in frame by 9–11 s | **Dynamic, tilted angles**; camera follows the climb, ends very wide | Red industrial core interior, cables receding in depth | Beams, muzzle flashes | Cut | Action chase through a vertical space |
| 2 | 12.01 | 18.73 | 6.7 | High-angle view of a central machine with a green capsule (yellow figure inside). A pale figure and a small white animal sneak in from the left (14–18 s) | WS **high angle**, slight drift | Red sets; **green key light** from the capsule | Green glow | Cut | Parallel action (the rescue thread) |
| 3 | 18.73 | ≈24 | ≈5.3 | Close fight: an outlined red creature lunges (20.6–21.1 s); the dark figure blocks with the weapon vertical (21.7–22.4 s), then shoves or strikes (22.5–23.4 s). Figures are cropped by the frame | CU, **foreground-cropped framing**, static | Cables bg | — | ≈Cut | Physical struggle, close and tight |
| 4 | ≈24 | 36.45 | ≈12.4 | Dark figure in profile on a ribbed walkway; a creature charges and he dodges or blocks (26–29 s). CU of the figure turning (31–32 s), back to profile (33–34 s); he leaves frame (35 s) | WS **profile staging** ↔ CU, static | Red walkway band, flat background | — | Cut | Readable left-right action in profile |
| 5 | 36.45 | 38.71 | 2.3 | Pale figure and animal at the capsule; she reaches toward it | MS, static | Green capsule light | — | Cut | Rescue progress |
| 6 | 38.71 | 42.25 | 3.5 | A large pencil-like tool and pale arms (insert), with the animal's silhouette in the fg | **Insert CU** | Grey/white | — | Cut | Shows the tool (visual storytelling) |
| 7 | 42.25 | 51.93 | 9.7 | Inside the capsule: an orange limb with a green band; the pencil tool approaches and **draws or erases** at the band (44–51 s) | **ECU insert** | Saturated green | — | Cut | Key action shown in close detail |
| 8 | 51.93 | 59 | ≈7 | Orange figure freed, standing with the pale figure and the animal (52–58 s). Pull-out to WS (59 s) | MS → **pull-out** | Green beam, red room | — | Cut | Payoff of the rescue |
| 9 | ≈59 | 64.56 | ≈5.6 | WS: pale figure and animal on a platform; a small orange figure tumbles away (60–64 s) | WS high angle | Red machine room, stairs | — | Cut | Geography / consequence |
| 10 | 64.56 | 66.27 | 1.7 | Animal shown big in the fg, an orange smear-figure dashes past, the pale figure behind | CU fg, smear | Red | **Speed smear** on orange | Cut | Comic speed beat |
| 11 | 66.27 | 71.03 | 4.8 | A red creature grabs the dark figure (66–67 s). Then the pale figure's shoulder in the fg looks down a corridor to a round door (68–70 s) | MS / **OTS** | Industrial corridor | — | Cuts (67.65) | Threat + POV |
| 12 | 71.03 | 84.75 | 13.7 | Extreme-close struggle: the red outlined creature fills the frame over the dark figure (71–76 s). Insert of a glowing card or shard with a symbol (77–78 s). The pale figure intervenes, reaches and pulls (79–84 s) | ECU / CU, multiple cut-ins (72.82, 76.74, 78.62) | Red | Glow on shard | Cuts | Climactic struggle; interaction between three parties |
| 13 | 84.75 | 93.55 | 8.8 | The pale figure holds the glowing shard (85–87 s). A creature over the dark figure on the ground; a shard is placed or dropped (88–93 s) | CU / MS | Red | — | Cuts (86.67, 87.67) | Turning point |
| 14 | 93.55 | 97.89 | 4.3 | The group (pale, orange, dark figures, animal) boards the white vehicle | MS, static | Red machine room | — | Cut | Regroup |
| 15 | 97.89 | 100.35 | 2.5 | The vehicle flies into a red square tunnel or shaft | WS, **one-point perspective** | Red tunnel | — | Cut | Escape begins |
| 16 | 100.35 | 108.07 | 7.7 | **Fish-eye circular vignette** (security-camera or porthole look): dark interior; the vehicle crosses the frame (105–107 s) | Circular-masked **POV** | Dark | Lens vignette | Cut | Change of perspective |
| 17 | 108.07 | ≈114.5 | ≈6.4 | Overcast green plain; a red-grey smoke column at L; the vehicle approaches the camera and passes (110–112 s); camera **tilts up into the sky** (113–114 s) | WS → **tilt-up** | First **natural daylight**, grey sky | Smoke column | ≈Dissolve | Breakout into the outside world (palette shift) |
| 18 | ≈114.5 | 136.89 | ≈22 | Orbital view of the planet; a green light spot over the land (pull-back 114–120 s), then a descending aerial over a coastline; the vehicle trails a wake (121–124 s) | **Space EST → aerial descent** | Night/day planet, satellite look | Atmosphere glow | Cut | Scale shift, "where are we" |
| 19 | 136.89 | 141.39 | 4.5 | Hills with a wind turbine; the tiny vehicle travels L→R | WS, static | Overcast countryside | — | Cut | Journey geography |
| 20 | 141.39 | 150.23 | 8.8 | The vehicle flies into a **ruined city**; camera tracks past rubble with a dark fg silhouette (143–147 s), then a down-the-street WS (147–150 s) | **Tracking**, fg wipe | Grey ruined city, overcast | Dust | Cuts (143.69, 148.11) | New location: devastation |
| 21 | 150.23 | 152.86 | 2.6 | The vehicle crashes: it digs in and grinds; **posterized smoke billows** (150.25–152.75 s), debris and sparks | CU low, **camera close to impact** | Ruined street | **Flat-tone smoke, debris, sparks** | Cut | Crash impact |
| 22 | 152.86 | 158.53 | 5.7 | Wreck in a crater; passengers sit up (154–158 s). **Near-silence at 157.0–157.5 s**, then a +17 dB onset at 158.0 s | WS, static | Grey | — | Cut cluster | Aftermath, then a jolt |
| 23 | 158.53 | 163.41 | 4.9 | **Rapid cut cluster** (12 changes in 4.9 s): a glowing-eyed figure with glasses (159 s); battle chaos with a crowd and fire (160–163 s) | Mixed CUs, dynamic | Fire orange / red | Fire | Cuts | Shock flash-cuts |
| 24 | 163.41 | 167.04 | 3.6 | Giant red ring-construct (L); two small figures far away (R) | WS, slow push | Red/orange haze | — | Cut | Re-establish the threat |
| 25 | 167.04 | 174.59 | 7.6 | The red figure (L) and the grey visor figure (R) stand in front of the construct; the red figure gestures (animated arm), the grey stands still | MS two-shot, **symmetrical**, static | Orange haze, fire | Fire | Cut | Confrontation stand-off |
| 26 | 174.59 | 178.59 | 4.0 | Burning landscape WS with two small figures | WS, slow move | Fire, haze | Fire | Cut | Geography |
| 27 | 178.59 | 182.93 | 4.3 | Black iron ball with chain in the fg L; a small red figure in the bg walks toward the camera (181–182 s) | **Deep fg/bg staging** | Red plain | — | Cut | Visual callback to the chain motif |
| 28 | 182.93 | 187.70 | 4.8 | The red figure walks in from the distance (184 s) to a big CU (185–186 s), then exits the frame | **Walk-to-camera**, static | Red plain | — | End | Character approach to the lens |

### B. Animation (part 2) — observed

- **Block / strike readability:** in the 12 fps strip (20.5–23.4 s) each key pose is held 4–8 frames: lunge, contact block, push.
- **Frame-filling crops:** the dark figure's head and body run off the frame edges, which conveys proximity.
- **Speed smear** on a dashing figure (64.56–66.27 s).
- **Tool interaction shown in inserts** (pencil drawing or erasing on a limb band, 42–51 s): action told through CU detail rather than wide motion.
- **Profile staging for fights** (shot 4) keeps screen direction clear: the attacker comes from the left, the defender is on the right.
- **Gentle acting** (the rescue): slow reach, hand-on-object, holds.

### C. Camera (part 2) — observed

- Tilted dynamic angles in vertical action spaces.
- High-angle WS for sneaking.
- OTS / foreground-shoulder framings.
- One-point-perspective tunnel.
- Circular fish-eye POV.
- Tilt-up exits.
- Orbital EST into an aerial descent.
- Tracking past fg silhouettes (parallax).
- Camera placed at ground level for the crash.
- Walk-to-camera.
- A **rapid flash-cut montage** (12 cuts in 4.9 s) contrasting with 12–22 s holds.

### D. Environment (part 2) — observed

The palette shifts by location:
- red industrial (0–100 s);
- the first natural grey-green daylight outside (108–150 s);
- desaturated grey ruins (141–158 s);
- back to fire orange and red (158–187 s).

The 3D sets are detailed: the cable forest, a central machine, a tunnel, a planet, a coastline, turbines, a ruined city, craters. **Flat 2D characters are composited over 3D** throughout. Smoke is **posterized** (flat tones) to match the 2D characters rather than being volumetric.

### E. Audio (part 2) — measured, not listened

10 s block means range from −14 dBFS (0–10 s and 20–30 s, the action) down to −27 dBFS (120–130 s, the orbital and aerial travel). Quieter levels sit under travel and emotional passages, louder under action.

Sharp onsets: 66.0, 111.0 (+13), **137.0 (+17)**, **158.0 (+17)** and 158.5 (+11), 181.5 s.
- The **only near-silent windows (157.0–157.5 s)** come immediately before the 158.0 s onset. Measured as a silence-then-hit pattern, it coincides with the start of the flash-cut montage (158.53 s).
- 137.0 s coincides with the cut at 136.89 s (end of the aerial).

### F. Roles

No credits in parts 1–2, so nothing to cite.

---

## Cross-part findings to carry into our engine

These are technique-level, original implementations only.

1. **2D flat stickmen composited over 3D sets** (both parts). This drives the `HYBRID_STICKMAN_CINEMATIC` design.
2. **Graphic transitions:** brush-smear wipes, a 1-frame radial impact star, painted fire wipes, a 1-frame colour flash, smoke-wall wipes, zoom/radial-blur match cuts.
3. **Effect style:** posterized flat-tone smoke and fire, glow on key props, beams with muzzle flashes, hit flashes, smear frames.
4. **Palette blocking per act or location.** Characters stay readable as black/white or saturated shapes against monochrome sets.
5. **Editing rhythm:** long holds (8–22 s) for travel and emotion, against flash-cut clusters (5–12 cuts in under 5 s) for shock.
6. **Audio dynamics** (measured): mix steps down under travel and emotion, is louder under action, with brief near-silence before a big onset.
7. **Fight readability:** profile staging, consistent screen direction, held key poses, CU crops for contact.

Parts 03–06: not received; not analysed.

---

## Method (reproducible)

```bash
bash scripts/reference-analyze.sh reference/part01.mp4            # cuts (0.3), per-shot sheets, ebur128
ffmpeg -i reference/part01.mp4 -vf "select='gt(scene,0.15)',showinfo" -an -f null -   # sensitive cuts
# 1 fps timestamped sheets, 12 fps action strips, before/after frames at each cut, 0.5 s RMS envelope (python/numpy)
```

---

## Proposed architecture: `HYBRID_STICKMAN_CINEMATIC` (Style C untouched)

Evidence from part 1 (2D flat characters over 3D painted-look sets, smear entrances, painted impact and fire wipes, act-based palette blocking) supports this design:

```
storyboard.json (mode: "hybrid")
  → director/storyboard.ts (+ mode, actionEvents[], vfx[])
  → adapters/storyboardToSpec.ts (existing; passes hybrid fields)
  → choreography/ action director: validates initiator/target/distance/contact,
       emits pose tracks, impact times (hit-stop), VFX + SFX cues, camera events
  → Remotion SceneComp → mode switch
       style-c → three/StageCanvas (unchanged)
       hybrid  → hybrid/HybridStage
           • Three.js environment + camera (reuses environments, looks, camera)
           • 2D characters: SVG strokes from the SAME skeleton solver, projected through the
             3D camera (correct placement, scale, parallax, depth order); constant line weight,
             flat colour; smear frames from joint velocity
           • 2D VFX layer (impact stars, painted fire wipes, speed lines) + 3D particles
           • transitions: smear wipe, impact-flash cut, fire wipe, colour-flash cut
```

- No new runtime libraries.
- Declined for lack of need: a physics engine (hits are choreographed), postprocessing bloom (too costly in software WebGL; additive sprites instead) and Lottie (the rig is procedural).

**Safe-to-add matrix.** Everything is additive: new actions in `ACTION_FNS`, a new `choreography/`, a new `vfx/`, new environment presets, a new `hybrid/` renderer selected per video. `style-c` remains the default, and all existing tests must keep passing.
