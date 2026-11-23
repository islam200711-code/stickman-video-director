/**
 * Shared contract between the director (Stickman Video Director side) and the
 * renderer (Three.js rig + Remotion timeline). Everything is plain JSON so a
 * storyboard written by Claude, a script, or a human can be validated here.
 *
 * Units: time in seconds (converted to frames by the renderer), world space in
 * metres (x right, y up, z towards camera). A stickman is ~1.8 units tall.
 */
import {z} from 'zod';

export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3>;

export const ACTIONS = [
  'idle', 'walk', 'run', 'jump', 'fall', 'sit', 'stand', 'talk', 'point', 'think',
  'surprised', 'celebrate', 'argue', 'fight', 'escape', 'work', 'computer', 'hold',
  'wave', 'shrug', 'facepalm', 'thumbsup', 'lying', 'push', 'reach', 'clap', 'nod', 'headshake', 'crouch', 'laugh',
  // choreography (action director)
  'guard', 'punch', 'kick', 'block', 'dodge', 'grab', 'throw', 'pull', 'hit', 'stagger', 'knockdown', 'thrown',
  'handshake', 'highfive', 'give', 'receive', 'rescue', 'rescued', 'huddle',
] as const;
export const Action = z.enum(ACTIONS);
export type Action = z.infer<typeof Action>;

export const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking', 'worried', 'determined', 'excited', 'scared', 'confused', 'smug'] as const;
export const Expression = z.enum(EXPRESSIONS);
export type Expression = z.infer<typeof Expression>;

/** One action segment on a character's track. */
export const ActionCue = z.object({
  action: Action,
  start: z.number().min(0),            // seconds from scene start
  end: z.number().optional(),          // defaults to next cue / scene end
  speed: z.number().positive().default(1),
  intensity: z.number().min(0).max(2).default(1),
  expression: Expression.optional(),
  facing: z.number().optional(),       // yaw in degrees, 0 = towards camera, 90 = screen right
  to: Vec3.optional(),                 // locomotion target; position is eased start -> to
  target: Vec3.optional(),             // point / look target (world space)
  lookAtCharacter: z.string().optional(), // head/eyes track another character
  moveCurve: z.enum(['smooth', 'heavy', 'light']).optional(), // travel curve; match a pushed prop's weight so hands stay on it
  reach: z.object({left: Vec3.optional(), right: Vec3.optional()}).optional(), // IK hand targets (world space)
  reachRamp: z.number().optional(),    // seconds to blend IK in (default 0.35; strikes use ~0.06)
  reachAt: z.number().optional(),      // cue-local second when IK starts (default 0)
  reachUntil: z.number().optional(),   // cue-local second when IK releases
  prop: z.string().optional(),         // prop held in right hand
});
export type ActionCue = z.infer<typeof ActionCue>;

export const SceneCharacter = z.object({
  id: z.string(),                      // instance id within the scene
  profile: z.string().optional(),      // cast/library profile id (defaults to id)
  label: z.string().optional(),        // optional floating name tag
  position: Vec3.default([0, 0, 0]),
  facing: z.number().default(0),
  expression: Expression.default('neutral'),
  track: z.array(ActionCue).min(1),
});
export type SceneCharacter = z.infer<typeof SceneCharacter>;

export const CameraKey = z.object({
  t: z.number().min(0),
  position: Vec3,
  lookAt: Vec3,
  fov: z.number().default(40),
  cut: z.boolean().default(false),     // hard cut to this key (no interpolation from the previous one)
  label: z.string().optional(),        // shot name from auto-coverage, e.g. "close:sam"
});
export const Camera = z.object({
  keys: z.array(CameraKey).min(1),
  shake: z.number().min(0).default(0),
  impacts: z.array(z.object({t: z.number(), strength: z.number().default(1)})).default([]), // decaying shake bursts
  ease: z.enum(['linear', 'inOut']).default('inOut'),
});
export type Camera = z.infer<typeof Camera>;

export const Prop = z.object({
  kind: z.string(),                    // registry key in three/props.tsx
  position: Vec3,
  rotation: z.number().default(0),
  scale: z.number().default(1),
  color: z.string().optional(),
  appearAt: z.number().optional(),
  disappearAt: z.number().optional(),
  move: z.object({to: Vec3, start: z.number(), end: z.number(), roll: z.boolean().default(false), weight: z.enum(['smooth', 'heavy', 'light', 'drop']).default('smooth')}).optional(),
});
export type Prop = z.infer<typeof Prop>;

export const TextOverlay = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  style: z.enum(['title', 'caption', 'label', 'lower-third']).default('label'),
  position: z.enum(['auto', 'top', 'center', 'bottom']).default('auto'), // auto = safe-zone placement away from characters
});

export const SfxCue = z.object({file: z.string(), at: z.number(), volume: z.number().default(0.8), important: z.boolean().optional()});

export const Narration = z.object({
  text: z.string(),
  start: z.number().default(0.2),
  audio: z.string().optional(),        // filled by the audio stage (path in public/)
  duration: z.number().optional(),     // measured seconds
});

export const Transition = z.object({
  type: z.enum(['cut', 'fade', 'slide', 'wipe', 'brush', 'fire', 'blink']).default('fade'),
  duration: z.number().min(0).default(0.5),
});

export const Environment = z.object({
  preset: z.string(),                  // registry key in three/environments.tsx
  palette: z.record(z.string()).optional(),
  timeOfDay: z.enum(['day', 'dusk', 'night']).default('day'),
  ambient: z.enum(['auto', 'none', 'leaves', 'dust', 'fireflies', 'petals']).default('auto'),
});

export const Scene = z.object({
  id: z.string(),
  duration: z.number().positive(),
  environment: Environment,
  characters: z.array(SceneCharacter).default([]),
  props: z.array(Prop).default([]),
  camera: Camera,
  text: z.array(TextOverlay).default([]),
  narration: Narration.optional(),
  sfx: z.array(SfxCue).default([]),
  ambience: z.object({file: z.string(), volume: z.number().default(0.22)}).optional(),
  transitionIn: Transition.default({type: 'cut', duration: 0}),
  /** screen graphics / HUD events (rendered by ui/Hud.tsx), times in scene seconds */
  ui: z.array(z.object({
    type: z.enum(['news', 'terminal', 'alert', 'target', 'videocall', 'map', 'scope', 'binocular', 'fisheye', 'glitch', 'scanwipe', 'status']),
    at: z.number(), until: z.number().optional(),
    title: z.string().optional(), text: z.string().optional(), lines: z.array(z.string()).optional(),
    stamp: z.string().optional(),            // terminal: status stamp after typing (e.g. "SIGNAL FOUND")
    color: z.string().optional(),
    target: z.string().optional(),            // character id to track (target display)
    position: Vec3.optional(),                // world point to track (target display)
    route: z.array(z.tuple([z.number(), z.number()])).optional(), // map: normalised 0..1 points
    anchor: z.enum(['full', 'left', 'right', 'center', 'corner']).default('center'),
  })).default([]),
  /** event-driven visual effects (rendered by vfx/), times in scene seconds */
  vfx: z.array(z.object({type: z.string(), at: z.number(), position: Vec3.optional(), dir: Vec3.optional(), scale: z.number().default(1), color: z.string().optional(), duration: z.number().optional(), actor: z.string().optional()})).default([]),
  look: z.string().default('natural'),  // lighting + depth + grade preset (three/looks.ts)
  characterMode: z.enum(['stylized_3d', 'flat_2d', 'hybrid_2_5d']).optional(), // per-scene override of style.characterMode
});
export type Scene = z.infer<typeof Scene>;

export const CharacterProfile = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),                   // limb / body ink
  headColor: z.string().optional(),
  accent: z.string().optional(),       // scarf / tie / cap colour
  accessory: z.enum(['none', 'cap', 'tie', 'scarf', 'glasses', 'bow']).default('none'),
  scale: z.number().min(0.6).max(1.4).default(1),
  build: z.enum(['standard', 'slim', 'sturdy']).default('standard'),
});
export type CharacterProfile = z.infer<typeof CharacterProfile>;

export const Format = z.object({
  aspect: z.enum(['16:9', '9:16']).default('16:9'),
  quality: z.enum(['720p', '1080p']).default('720p'),
  fps: z.number().int().default(24),
  render: z.object({shadowMap: z.number().int().default(1024), msaa: z.boolean().default(true), softShadows: z.boolean().default(true)}).default({}),
});

export const Style = z.object({
  lineWidth: z.number().default(1),     // limb thickness multiplier
  characterMode: z.enum(['stylized_3d', 'flat_2d', 'hybrid_2_5d']).default('stylized_3d'), // stylized_3d = Style C (default)
  outline: z.boolean().default(true),
  font: z.string().default('Inter, Helvetica, Arial, sans-serif'),
  captionColor: z.string().default('#ffffff'),
  captionBg: z.string().default('rgba(0,0,0,0.55)'),
});

export const VideoSpec = z.object({
  id: z.string(),
  title: z.string(),
  meta: z.object({
    category: z.string().default('unspecified'),   // niche is per-video data, never engine logic
    language: z.string().default('en'),
    tone: z.string().default('neutral'),
  }).default({}),
  format: Format.default({}),
  style: Style.default({}),
  cast: z.array(CharacterProfile).min(0),
  music: z.object({file: z.string(), volume: z.number().default(0.15)}).optional(),
  captions: z.boolean().default(true),
  scenes: z.array(Scene).min(1),
});
export type VideoSpec = z.infer<typeof VideoSpec>;
export type VideoSpecInput = z.input<typeof VideoSpec>;

export const resolution = (f: z.infer<typeof Format>) => {
  const long = f.quality === '1080p' ? 1920 : 1280;
  const short = f.quality === '1080p' ? 1080 : 720;
  return f.aspect === '16:9' ? {width: long, height: short} : {width: short, height: long};
};

/** Total runtime in frames, accounting for transition overlaps. */
export const totalFrames = (v: VideoSpec) => {
  const fps = v.format.fps;
  let f = 0;
  v.scenes.forEach((s, i) => {
    f += Math.round(s.duration * fps);
    if (i > 0 && s.transitionIn.type !== 'cut') f -= Math.round(s.transitionIn.duration * fps);
  });
  return f;
};
