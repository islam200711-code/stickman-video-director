# Reference Analysis — "The Dark Age – Animator vs. Animation 14" (Alan Becker)

Purpose: technical, cinematic and pipeline study only. **Nothing in our productions may reuse its characters, names, story, dialogue, shots, backgrounds, music or assets.** In this report characters are described neutrally (for example "grey visor figure", "red figure").

## 0. Access & evidence

| Item | Status |
|---|---|
| YouTube URL | Blocked by the environment proxy (403). Not used |
| User-supplied files | All six parts **inspected** (each 640×360, 23.976 fps, AAC stereo 44.1 kHz). Durations: 198.154 / 187.703 / 187.702 / 187.702 / 198.127 / 170.052 s, **total 1129.44 s (18:49.4)** |
| Continuity | Checked the last frame of each part against the first frame of the next. Parts 1→2, 3→4, 4→5 and 5→6 continue frame to frame. **Part 2 → 3 does not:** part 2 ends on a red plain, part 3 opens on an orange sphere structure. Either the split falls on a real cut, or frames are missing at that join (not determinable from these files) |
| Narration | Per the brief, the reference has **no narration**. None was assumed, generated or added |
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

## §P3 — PART 3 (file 03; film 6:25.9–9:33.6)

95 segments, 24 of them flash elements; cut density is the highest of the film. Sequence-level table: boundaries come from detected cuts, contents from 1 fps sheets. Per-cut rows are in `shots/part03.csv`.

| Seq | Part time | On screen (observed) | Shot / camera | 2D·3D·live | Light · colour | VFX · graphics | Function |
|---|---|---|---|---|---|---|---|
| 3a | 0.00–2.63 | Orange-red sphere structure inside a fiery chasm | WS, slow move | 3D set | Orange fire | Embers | Location bridge |
| 3b | 2.63–23.23 | Red figure close to the lens (L) in a red industrial hall; WS of cables with small blue visor figures marching (12–16 s); **cyan spotlight beams** sweep the scene; red vs blue visor figure face-off in CU/MS (17–23 s) | Big fg character with deep bg; then WS; then two-shot | 2D characters over 3D hall | Red with **cyan light beams** | Light-cone beams | Two forces meet |
| 3c | 23.23–28.19 | **White frame with a black radial ink burst** (24 s); **glowing white square "eyes"** on the visor figure (25–26 s); black frame (27 s) | Impact frames, CU | 2D graphic | B/W, glow | Ink-burst impact frame, bloom-like glow | Power-up / impact punctuation |
| 3d | 28.19–45.75 | Red crowd silhouette under a glow (28–29 s); **cyan wireframe city** graphic (30–31 s, 35 s); **HUD panel**: crowd icon → globe (32 s); aerial grass plain with **cyan target boxes** on tiny figures (33–34 s); aerial road, forest with box markers (38–40 s); planet view (41–42 s); visor glow again (43–44 s) | Montage of WS, aerials and graphics | 3D sets + 2D HUD overlays | Cyan on red/green | Wireframe, target boxes, HUD | Antagonist's surveillance shows its reach (exposition without words) |
| 3e | 45.75–49.55 | Red legs (L) and a grey visor head (R) with a cyan HUD card | CU, low | 2D + HUD | Red | HUD card | Targeting |
| 3f | 49.55–71.45 | Grey ruined city (aerial, 50 s). The dark figure and the pale figure tend the injured orange figure beside the white vehicle (51–56 s). CU of an animal and figure (57–58 s); tense close shots by the vehicle (59–63 s); flash cluster at 58.64–59.43 | MS two/three-shots, CUs, OTS | 2D chars over 3D ruins | Desaturated grey | — | Care and tension in the group |
| 3g | 71.45–117.53 | Group in ruins with the vehicle. Large olive silhouette walking past in the fg (72–75 s). A distant figure watched among rubble (79–81 s); refugees gather (84–95 s). **Fish-eye circular POV** (114–117 s) | Fg wipes, WS with tiny figures, CU reactions, circular-mask POV | 2D/3D | Grey | Circle mask | Encounter with survivors |
| 3h | 117.53–152.07 | Crowd of survivors around the group; the black figure gestures to them (127 s); **dense cut cluster** 128.3–137.4 s (CU/OTS exchanges); a dark shape arrives over the group (134–135 s) | Shot/reverse, fg-cropped CUs | 2D/3D | Grey | — | Negotiation, then a new threat |
| 3i | 152.07–177.34 | A **brush-textured, painterly dark-brown creature** looms over a green-hooded figure (147–156 s); orange figure fights through brush strokes (165–173 s); **paint-splatter impacts** (172–173 s) | CU/MS, fg occlusion | **Different 2D rendering style** (rough brush texture) over 3D | Grey + brown | Paint splatter, brush-stroke smears | Antagonist with its own visual language |
| 3j | 177.34–187.70 | Ruins WS; a small figure runs across (178–180 s); a pale-green figure with a staff rises into the fg (182–184 s); **HUD panel** shows the target identified (185–187 s) | WS → fg CU → HUD | 2D/3D + HUD | Grey → red HUD | HUD | Cliffhanger: target located |

## §P4 — PART 4 (file 04; film 9:33.6–12:41.3)

47 segments, 4 of them flash elements. Mostly longer takes.

| Seq | Part time | On screen (observed) | Shot / camera | 2D·3D·live | Light · colour | VFX · graphics | Function |
|---|---|---|---|---|---|---|---|
| 4a | 0–10.59 | Red figure grabs or grapples the visor figure (0–3 s); giant red construct over a burning city (4–10 s) | CU → WS, low angle | 2D over 3D | Red / fire | Fire field | Antagonist dominance |
| 4b | 10.59–39.58 | Burning ruined skyline with a giant dark spike; silhouettes of a long column of creature riders cross L→R (11–19 s). Night: a group rides a large creature across a valley (20–26 s), through a forest (27–29 s), and away (30–34 s) | WS **lateral tracking**, silhouettes | 2D figures over 3D | Fire orange → **night blue** | Fire glow | Journey; palette resets to night |
| 4c | 39.58–49.26 | **Binocular POV** (octagonal mask) on a distant light (40–42 s); a water tower with graffiti; a small white figure peeks, then a red figure's legs fill the frame (47 s) | POV mask; static WS with **frame-filling fg entrance** | 2D/3D | Night blue + warm tower light | Mask | Arrival at a hideout; comic entrance |
| 4d | 49.26–61.90 | Bunker interior / door (49–52 s); exterior of a lit cabin-like tower with a telescope (53–56 s); dark device with a **green laser scan** (57–58 s); **green terminal UI**: character tiles, then "SAFE" stamp (59–61 s) | WS ext → insert → full-screen UI | 3D + 2D UI | Night, green | Laser, UI | Security check told through UI |
| 4e | 61.90–103.85 | **Detailed 3D living room**, high angle: the group arrives; reunion (hugs, group embrace 71–72 s); characters on the sofa; **eyelid-blink transition** (black frame with an almond-shaped opening, 88–91 s); playful pile-up on the sofa (92–99 s) | High-angle WS, MS group, big fg CUs; blink-mask transition | 2D characters over a richly lit 3D interior | Warm interior | Blink wipe | Rest, warmth, found family |
| 4f | 103.85–124.46 | Kitchen and bunk area; a **pixel-art (8-bit) character** stands beside vector characters and a grey mannequin-like figure | MS static | **Mixed character art styles** in one frame | Warm | — | Comic contrast between styles |
| 4g | 124.46–167.46 | Lab: computers, whiteboard full of sketches (pointer, wifi, devices); the yellow figure takes coffee (mugs insert 164 s), sits at a keyboard; ECU keyboard insert (170 s); green terminal UI (171 s) | MS, inserts, ECU | 3D lab + 2D chars + UI | Teal/green monitors | UI windows | Planning / hacking (the plan shown, not told) |
| 4h | 167.46–187.70 | Satellite dish under night clouds (174–175 s); dark object on blue (176–178 s); **network graph** of glowing nodes and cubes (179–183 s); dark room with a monitor (184–186 s); high-angle living room (187 s) | WS, abstract visualisation | 3D + motion graphics | Blue, cyan glow | Node graph | The signal travels outward (montage) |

## §P5 — PART 5 (file 05; film 12:41.3–15:59.4)

71 segments, 11 of them flash elements. **Contains live action.**

| Seq | Part time | On screen (observed) | Shot / camera | 2D·3D·live | Light · colour | VFX · graphics | Function |
|---|---|---|---|---|---|---|---|
| 5a | 0–6.30 | Living room top view; night exterior of the tower (2–5 s); **green terminal UI** with a red alert box (6–7 s) | WS, UI | 3D + UI | Night | UI | Something has gone wrong |
| 5b | 6.30–42.92 | Lab: pale and yellow figures at the computer, black figure watching; insert of a **child-like drawing** (hearts, arrow figure) on paper (13–14 s); a group hug at the console (18–23 s); balcony at night with a red light far away (24–26 s); a **magnifier HUD** and **scope reticle** over a red-tinted landscape locates the red construct (30–37 s) | Fg-heavy MS, inserts, POV scope | 3D + 2D + HUD | Teal → **red scope tint** | Reticle, magnifier | Emotion beat, then threat located through a POV device |
| 5c | 42.92–68.28 | Kitchen: yellow figure poses, the black figure falls flat (46–47 s); the pale figure stands over the fallen one; group fight-play in the living room (52–53 s); a **pixel-art figure** among vector figures (55 s); **live-action-looking fist** (photo-real skin texture) intrudes from the lower left over the cartoon scene (56–58 s, 1:20–1:24) | MS, big fg intrusions | 2D + 3D + **photographic element** | Warm | — | Physical comedy with mixed media |
| 5d | 68.28–114.91 | Pale figure **throws the grey figure** over her shoulder (1:04–1:05) — clear throw silhouette; reaction lineup; group bunched in big fg CUs (85–89 s); black figure alone; spiky hair reveal (1:41 s); group in the living room (1:46–1:48); exterior at night (1:55–1:58); rooftop group under a red sky glow (1:59–2:02); group CU at the lab screen (2:03–2:07) | Varied; strong silhouettes for the throw | 2D/3D | Warm → night | — | Training/comedy, then resolve |
| 5e | 114.91–159.12 | Orange figure with a pencil tool **draws on the whiteboard** (2:08–2:21); the group watches; a white table with a **drawn telephone** materialises (2:24–2:28); the orange figure dials (2:29–2:38) | MS/CU, inserts | 2D drawing created on screen over the 3D lab | Blue lab | Drawing-on appearance | Characters create objects (in-world creation tool) |
| 5f | 159.12–184.68 | **LIVE ACTION:** a real smartphone ringing on a wooden desk (2:39–2:42); a person at a laptop answers (2:43–2:48); intercut with the animated group on the drawn phone (2:49–2:55); live-action hand and phone, ECU of the person's glasses (2:56–3:04). **Near-silent windows 176–183 s** | Live-action WS/MS/CU/ECU ↔ animated MS (cross-cutting) | **Live action intercut with animation** | Natural daylight vs blue lab | — | The animated world reaches the real world (fourth-wall phone call) |
| 5g | 184.68–198.13 | Animated: drawn phone and a **drawn computer monitor** on the table; the monitor shows a video-call image (3:14–3:17) | MS | 2D drawn props in a 3D set | Blue | Screen-in-screen | Bridge to the video call |

## §P6 — PART 6 (file 06; film 15:59.4–18:49.4)

65 segments, 21 of them flash elements.

| Seq | Part time | On screen (observed) | Shot / camera | 2D·3D·live | Light · colour | VFX · graphics | Function |
|---|---|---|---|---|---|---|---|
| 6a | 0–4.67 | Drawn monitor shows a video-call UI ("Calling…") | MS | 2D | Blue | Call UI | Call connecting |
| 6b | 4.67–20.65 | **Live action:** a hand holds a smartphone over a desk; the screen shows the video call with the **animated characters composited onto the phone display** (5–17 s); a system permission dialog appears on the phone (17–20 s) | Live-action MS/CU, handheld | **Animation composited into a live-action screen** | Natural | Phone UI | Animation inside reality |
| 6c | 20.65–33.28 | **Live action:** laptop desktop; an install/permission dialog for a program; the cursor clicks "Yes" (28–29 s); ECU of the person's glasses and eyes (30–32 s) | Live-action inserts, ECU | Live | Natural | Real OS UI (filmed) | Consent moment |
| 6d | 33.28–55.26 | Animated: yellow figure at a laptop in the lab (33–37 s); group CU (38–40 s); machines power up (41–47 s); **green terminal UI** to a reticle, "Initiating Avatar" (48–51 s); night exterior; a **searchlight beam** sweeps from the tower (55–56 s) | MS, UI full-screen, WS | 3D + 2D + UI | Teal, green, night | Searchlight cone | The system activates |
| 6e | 55.26–66.86 | **Live action:** person's face lit by a screen (57–59 s); a laptop screen shows the **3D lab scene** (1:00–1:03); live-action mouse hand (1:06) | Live CU/insert | Live action showing the 3D world on screen | Dim | — | The real user enters the world |
| 6f | 66.86–124.92 | **First-person POV inside the 3D lab with a cartoon 3D arm and hand** in the fg (1:04–2:04): looks around; the group gathers; a crosshair dot; **pop-up UI windows** appear over characters (1:26–1:27, 1:36–1:37, 1:41, 1:50–1:57, 2:01–2:04); characters react with sparkle or glitter effects (1:30–1:48); purple aura (1:30–1:34) | **FPS camera** | 3D POV + 2D characters + UI | Teal lab | Sparkles, aura, UI pop-ups | Interacting with the characters through an interface |
| 6g | 124.92–138.64 | Full-screen green UI: a text field being **typed letter by letter** (2:05–2:09); then a dense flash cluster (129.55–137.05): a black figure is engulfed in **stylised fire or energy**; a silhouette with **flame wings** (2:15–2:18) | UI ECU → impact montage | UI + 2D VFX | Green → fire orange/white | Typing animation, flame/energy bursts | Transformation climax |
| 6h | 138.64–166.29 | Monitor alerts (2:19–2:20); the group lines up and reacts (2:21–2:25); the pale figure in big CU (2:26–2:29); night forest **tracking/rising** past dark trees to the tower (2:30–2:39); rooftop group WS (2:40–2:41); characters with sparkles and aura (2:42–2:45) | Reaction lineup, big CU, crane/track, WS | 3D + 2D | Night blue | Sparkles, aura | Resolution and group image |
| 6i | 166.29–170.05 | **"to be continued" on black** (2:46–2:50); last window **near-silent (169.5 s)** | Title card | 2D text | Black | — | Serial hook |

---

## Production techniques (whole film)

Each item cites example evidence by part and time. Items are **observations** unless labelled *Inference*.

1. **2D stickmen over 3D environments.**
   - Characters are flat vector shapes with a constant stroke and circular heads, composited over 3D sets with real perspective, lighting and depth of field (P1 kitchen; P2 cable forest; P4 living room; P6 lab).
   - Shadows under 2D characters are rare or absent in the sampled frames.
   - Characters are **never shaded by the 3D lights**; scale cues come from placement and occlusion.
   - *Inference:* this is how the film keeps the stickman identity crisp while sets carry richness.
2. **Live action integrated with animation.**
   - Cross-cutting between a live-action desk scene and animated characters (P5 2:39–3:04).
   - Animation composited onto a real phone screen (P6 0:05–0:17).
   - Real OS dialogs filmed on screen (P6 0:18–0:29).
   - A live-action laptop showing the 3D world, leading into a first-person POV with a cartoon arm (P6 1:00–2:04).
   - A photographic fist intruding into an animated frame (P5 0:56–1:24).
3. **Outlines and silhouettes.**
   - Characters read as solid colour against monochrome sets: black/white on red (P1–P3), saturated colours on grey ruins (P3) and on warm interiors (P4).
   - The antagonist uses outline-only red figures (P1–P2).
   - A painterly brush-textured creature (P3) and a pixel-art figure (P4–P5) are deliberate **style contrasts** within one film.
4. **Depth and parallax.**
   - Large fg elements pass the lens: silhouettes, characters crossing at frame edges (P2 2:23–2:27, P3 1:12–1:15).
   - Deep fg/bg staging (P2 2:58–3:02 ball-and-chain in the fg, figure in the bg).
   - Tracking past structures (P1 1:55–2:05; P4 0:20–0:34 night ride).
5. **Camera perspective.**
   - Low-angle hero framings; high angles for sneaking.
   - One-point tunnels; POV masks (fish-eye circle, binocular octagon, scope reticle).
   - First-person POV with a body part in the fg (P6).
   - Aerial and orbital establishing shots (P2, P3).
6. **Environmental lighting.**
   - Location palettes: red machine world; grey ruins; night blue and warm interiors; teal labs.
   - Motivated light sources: a green capsule, cyan beams, a searchlight, monitor glow, fire.
7. **Character-object interaction.**
   - A drawing/erasing pencil tool used on characters and objects (P2 0:39–0:51; P5 2:08–2:28); objects drawn into existence (table, phone, monitor).
   - Weapons and beams; vehicles boarded, driven and crashed; mugs and keyboards in inserts.
8. **UI and screen storytelling.**
   - A news broadcast with lower thirds (P1).
   - HUD target panels (P3, P4); green terminal UIs with status stamps ("SAFE"), alerts and typing (P4–P6).
   - A video-call UI (P5–P6); pop-up windows over characters (P6).
   - The plot advances **through interfaces instead of dialogue**.
9. **Dynamic group scenes.**
   - Crowds of hundreds of simple figures (P1 1:15–1:23).
   - Refugee gatherings (P3).
   - Group hugs and pile-ups with overlapping bodies (P4 1:10–1:35); reaction lineups (P5, P6).
10. **Action choreography.**
    - Profile staging and consistent screen direction (P2 0:24–0:36).
    - Held key poses at 12 fps (P2 0:20.5–0:23.4).
    - A readable throw silhouette (P5 1:04–1:05).
    - Smear entrances (P1, P2); impact frames (ink burst, radial star), then painted fire wipes (P1, P3).
11. **Wordless storytelling.**
    - Narration: none. Story is carried by staging, reaction close-ups, inserts (the drawing, the plan, the keyboard), UI states and palette shifts.
    - On-screen text appears only as in-world UI or graphics: news ticker, HUD labels, typed text, "to be continued".
12. **Editing rhythm.**
    - Flash clusters: P3 58.6–59.4 s (7 elements); P6 133.4–137.1 s (about 20 elements).
    - Long holds: 12–35 s takes in P1–P2 and P4.
    - 381 segments over 1129 s gives a mean of about 3.0 s; excluding flash elements, about 3.9 s per shot.

## Sound design (whole film) — measured, not listened

| Part | Mean level | p10 / p90 | Near-silent windows (< −40 dBFS) | Character (measured) |
|---|---|---|---|---|
| 1 | −18.1 dBFS | −24 / −12 | none | Continuous, loudest; 10 sharp onsets |
| 2 | −21.6 | −29 / −14 | 157.0–157.5 (before the +17 dB hit at 158.0) | Continuous; louder under action, quieter under travel |
| 3 | −22.0 | −30 / −15 | 49.5–50.0 | Continuous; 11 onsets |
| 4 | **−28.6** | −40 / −16 | **35 windows** (85–143 s in the hideout) | Sparse, with many pauses |
| 5 | **−27.9** | −43 / −16 | **68 windows**, including 176–183 s during the live-action call | Sparsest; silence used for comedy and realism |
| 6 | −22.7 | −29 / −16 | 1.0–1.5, 5.0, **169.5** (end card) | Builds to the climax; silence on the end card |

- **Spectral flatness** (0 = tonal, 1 = noise): medians 0.25–0.31. "Noisy and loud" windows (flatness > 0.25 and level > −20 dBFS), consistent with effects-dominated moments, cluster in the action passages: P1 31–50 s, P2 0–20 s, P3 23–37 s, P5 45–64 s, P6 89–102 s.
- **Measured patterns:**
  - action is continuously loud;
  - domestic and live-action sequences drop 6–10 dB, with frequent near-silence;
  - a brief silence sits right before major hits (P2 157→158 s);
  - the film ends on silence over the end card.
- **Not claimed:** instrument identification, music cue identities, specific SFX types or dialogue content.

## Production roles

No credits sequence was found in the supplied parts. The film ends on "to be continued", so no roles are named. Generic pipeline mapping: see the table in §F of part 1.

---

## Architecture recommendation (no changes made — awaiting approval)

**Keep Style C exactly as is** (the default). Add an optional `mode: "hybrid"` per video, reusing the existing storyboard, adapter, coverage director, looks, safe zones, audio library and QC.

| Capability | Proposed component | Reuses | Evidence motivating it |
|---|---|---|---|
| 1. 2D stickman characters | `hybrid/Stickman2D.tsx`: SVG strokes (constant width, flat fill, round head, optional outline-only and pixel variants) drawn from the **existing skeleton solver**, projected through the 3D camera for placement, scale and depth order. 2D-specific smear frames from joint velocity | `animations/library.ts`, `three/skeleton.ts`, `director/coverage.ts` | Techniques 1, 3 and 10 |
| 2. Three.js environments | Existing `three/environments.tsx` plus new modular kits (industrial hall, lab, ruins, bunker or hideout interior, night exterior) | `three/assets.tsx`, `looks.ts` | Technique 6 |
| 3. Remotion compositing | `hybrid/HybridStage.tsx`: z-ordered layers (3D set → fg occluders → 2D characters → 2D VFX → UI), with per-layer grade | `SceneComp`, `Grade` | Techniques 1 and 4 |
| 4. Live-action layers | `layers/VideoLayer` using Remotion `<OffthreadVideo>`: full-frame cutaways, **screen inserts** (animation mapped into a device-screen quad in footage via 4-corner pin), and fg intrusions. **Only user-supplied or licensed footage** | Remotion | Technique 2 |
| 5. UI and screen overlays | `ui/` kit of original components: terminal window, HUD target panel, alert and status stamps, call screen, typing field, pop-ups, reticle and POV masks (circle, binocular, scope), all driven by timeline events | Safe-zone system for text | Techniques 5 and 8 |
| 6. Event-driven VFX | `vfx/`: impact frame (radial star / ink burst, 1–2 frames), painted fire wipe, smear wipe, colour-flash cut, blink-eyelid wipe, posterized smoke, sparks, beams, glow, sparkle/aura, light cones; all keyed to action events | `animations/weight.ts`, camera impacts | Techniques 10 and 12 |
| 7. Music and SFX, no narration | Default `voice.provider: "none"` for hybrid. An event→SFX cue map (impact, whoosh, footstep, UI blip, alarm); music bed with **ducking** and **pre-hit silence**; level targets per sequence type (action continuous, quiet scenes sparse) | `audio/` licensed catalog and CREDITS | Sound section |

**Not needed:** a physics engine, post-process bloom (glow is faked with additive sprites), Lottie, or a second render framework.

## Prioritised implementation plan (for approval)

| # | Item | Why first | Effort | Risk to Style C |
|---|---|---|---|---|
| P1 | `mode` switch plus **Stickman2D** renderer over existing Three.js sets, with a test render | Core identity of the hybrid mode; everything else layers on it | M | None (opt-in) |
| P2 | **Action-event schema plus action director** (initiator, target, contact point, force, reaction, hit-stop), with new actions (punch, kick, dodge, block, grab, throw, pull, roll, land, climb, slide, run-stop, handshake, high-five, rescue, carry) and character-to-character IK | Choreography readability is the main lesson of the reference | L | None: actions are additive and tests guard them |
| P3 | **Event-driven VFX and transitions** (impact frame, smear/fire/blink wipes, colour flash, posterized smoke, beams, sparkles) | High visual payoff, cheap to render | M | None |
| P4 | **UI/HUD kit and POV masks** | Wordless storytelling device | M | None |
| P5 | **Sound: event cue map, ducking, pre-hit silence, no narration by default** | Rhythm and readability | S–M | None |
| P6 | **New environment kits** (industrial, lab, ruins, hideout, night exteriors) | Needed for THE LAST SIGNAL | M | None |
| P7 | **Live-action layer** (cutaway, screen-insert corner-pin, fg intrusion) | Optional; needs user-supplied footage | M | None |
| P8 | **THE LAST SIGNAL** (60 s original hybrid test): render, contact sheets, animation benchmark, audio report, performance report | Proof | M | None |

Every step ends with an actual render and frame inspection. Style C's existing tests and benchmark must keep passing.

**Originality:** the hybrid mode will use **our own** character designs (Style C cast colours and proportions translated to 2D), our own UI language, and original environments, story and sound choices. None of the reference's characters, designs, story beats, UI text, logos or audio is reproduced.

---

## Method (reproducible)

```bash
for p in 1 2 3 4 5 6; do
  ffmpeg -i reference/part0$p.mp4 -vf "select='gt(scene,0.15)',showinfo" -an -f null - 2>&1 | grep -o 'pts_time:[0-9.]*'   # cuts
  # 1 fps timestamped contact sheets (30 s or 64 s per sheet), 12 fps strips for action passages,
  # before/after frames at every cut (parts 1-2), last/first frames at each join
done
# audio: mono 16 kHz PCM -> 0.5 s windows -> RMS dBFS, >8 dB onsets, <-40 dBFS near-silence,
#        spectral flatness and centroid (numpy). Measurements only; no listening claims.
```
