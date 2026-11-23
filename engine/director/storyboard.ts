/**
 * Storyboard = the director-facing format. This is what Claude (using the
 * directing-stickman-videos Skill's narrative/storyboard guidance) or a human
 * writes. It speaks in film language (shot type, camera move, beats) rather than
 * renderer details. adapters/storyboardToSpec.ts turns it into a VideoSpec.
 */
import {z} from 'zod';
import {Action, CharacterProfile, Expression, Vec3} from '../schema/scene';

export const Brief = z.object({
  category: z.string().default('unspecified'),   // free text; NOT an engine switch
  topic: z.string(),
  language: z.string().default('en'),
  tone: z.string().default('neutral'),
  targetDuration: z.number().positive().optional(), // seconds; if set, shots are retimed to hit it
  aspect: z.enum(['16:9', '9:16']).default('16:9'),
  quality: z.enum(['720p', '1080p']).default('720p'),
  fps: z.number().int().default(24),
});

export const Beat = z.object({
  who: z.string(),
  do: Action,
  at: z.number().min(0),
  until: z.number().optional(),
  to: Vec3.optional(),
  facing: z.number().optional(),
  expression: Expression.optional(),
  speed: z.number().positive().optional(),
  intensity: z.number().optional(),
  prop: z.string().optional(),
  reach: z.object({left: Vec3.optional(), right: Vec3.optional()}).optional(), // IK hand targets, world space
  lookAt: Vec3.optional(),
  lookAtCharacter: z.string().optional(),
  moveCurve: z.enum(['smooth', 'heavy', 'light']).optional(),
  reachRamp: z.number().optional(), reachAt: z.number().optional(), reachUntil: z.number().optional(),
  /** storyboard event that drives auto camera coverage (implicit events are also detected) */
  event: z.enum(['dialogue', 'reaction', 'emphasis', 'impact', 'reveal', 'enter', 'action']).optional(),
  with: z.string().optional(),            // the other character in an 'action' event (for profile staging)
});

export const ActionEvent = z.object({
  type: z.enum(['punch', 'kick', 'block', 'dodge', 'grab', 'throw', 'push', 'pull', 'rescue', 'handshake', 'highfive', 'transfer', 'huddle']),
  at: z.number().min(0),                // start of anticipation
  actor: z.string(),                    // who initiates
  target: z.string().optional(),        // who reacts / partner
  group: z.array(z.string()).optional(),// huddle members
  outcome: z.enum(['hit', 'blocked', 'dodged']).default('hit'),
  force: z.number().min(0.2).max(2).default(1),
  aim: z.enum(['head', 'body']).default('head'),
  object: z.string().optional(),        // transfer: prop kind handed over
  autoApproach: z.boolean().default(true), // insert a walk so the distance is valid
});
export type ActionEvent = z.infer<typeof ActionEvent>;

export const ShotCamera = z.object({
  shot: z.enum(['establishing', 'wide', 'medium', 'close', 'extreme-close', 'low', 'high', 'two-shot', 'over-shoulder']).default('medium'),
  move: z.enum(['static', 'push-in', 'pull-out', 'pan-left', 'pan-right', 'track', 'orbit', 'crane-up']).default('static'),
  focus: z.union([z.string(), Vec3, z.array(z.string())]).optional(), // character id(s) or a point
  angle: z.number().default(0),          // yaw around focus in degrees (0 = from front)
  from: z.string().optional(),          // over-shoulder: whose shoulder (focus = who we look at)
  fov: z.number().optional(),           // override the lens
  shake: z.number().default(0),
  /** single = one framed shot (shot/move above); auto = director cuts wide/medium/close/ECU/OTS from beat events */
  coverage: z.enum(['single', 'auto']).default('single'),
});

export const Shot = z.object({
  id: z.string(),
  purpose: z.string().optional(),       // storyboard note: hook / setup / turn / payoff...
  environment: z.string(),
  timeOfDay: z.enum(['day', 'dusk', 'night']).default('day'),
  palette: z.record(z.string()).optional(),
  look: z.string().default('natural'),    // lighting/depth/grade preset, see three/looks.ts
  characterMode: z.enum(['stylized_3d', 'flat_2d', 'hybrid_2_5d']).optional(),
  ambient: z.enum(['auto', 'none', 'leaves', 'dust', 'fireflies', 'petals']).default('auto'),
  narration: z.string().optional(),
  duration: z.number().positive().optional(),
  camera: ShotCamera.default({}),
  blocking: z.record(z.object({at: Vec3, facing: z.number().default(0), expression: Expression.default('neutral'), label: z.string().optional()})).default({}),
  beats: z.array(Beat).default([]),
  props: z.array(z.object({kind: z.string(), at: Vec3, rotation: z.number().default(0), scale: z.number().default(1), color: z.string().optional(), appearAt: z.number().optional(), disappearAt: z.number().optional(), move: z.object({to: Vec3, start: z.number(), end: z.number(), roll: z.boolean().default(false), weight: z.enum(['smooth', 'heavy', 'light', 'drop']).default('smooth')}).optional()})).default([]),
  text: z.array(z.object({text: z.string(), at: z.number(), until: z.number().optional(), style: z.enum(['title', 'caption', 'label', 'lower-third']).default('label'), position: z.enum(['auto', 'top', 'center', 'bottom']).default('auto')})).default([]),
  sfx: z.array(z.object({sound: z.string(), at: z.number(), volume: z.number().default(0.8)})).default([]),
  /** choreographed interactions — expanded by choreography/director.ts into beats, VFX, SFX and camera impacts */
  actions: z.array(ActionEvent).default([]),
  vfx: z.array(z.object({type: z.string(), at: z.number(), position: Vec3.optional(), dir: Vec3.optional(), scale: z.number().default(1), color: z.string().optional(), duration: z.number().optional(), actor: z.string().optional()})).default([]),
  cameraImpacts: z.array(z.object({at: z.number(), strength: z.number().default(1)})).default([]),
  transition: z.enum(['cut', 'fade', 'slide', 'wipe']).default('cut'),
  transitionDuration: z.number().default(0.5),
});
export type Shot = z.infer<typeof Shot>;

export const Storyboard = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  brief: Brief,
  cast: z.array(z.union([z.string(), CharacterProfile])).default([]),
  voice: z.object({provider: z.enum(['espeak', 'none', 'files']).default('espeak'), voice: z.string().optional(), rate: z.number().default(155), files: z.record(z.string()).optional()}).default({}),
  music: z.object({query: z.string().optional(), file: z.string().optional(), volume: z.number().default(0.12)}).optional(),
  captions: z.boolean().default(true),
  style: z.object({lineWidth: z.number().default(1), font: z.string().optional(), characterMode: z.enum(['stylized_3d', 'flat_2d', 'hybrid_2_5d']).default('stylized_3d')}).default({}),
  shots: z.array(Shot).min(1),
});
export type Storyboard = z.infer<typeof Storyboard>;
export type StoryboardInput = z.input<typeof Storyboard>;
