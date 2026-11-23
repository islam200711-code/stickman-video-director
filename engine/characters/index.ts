import lib from './library.json';
import {CharacterProfile, type CharacterProfile as Profile} from '../schema/scene';

export const LIBRARY: Profile[] = lib.characters.map((c) => CharacterProfile.parse(c));
/** Resolve a cast: per-video profiles override library entries with the same id. */
export function resolveCast(cast: Profile[]): Record<string, Profile> {
  const out: Record<string, Profile> = {};
  for (const c of LIBRARY) out[c.id] = c;
  for (const c of cast) out[c.id] = {...(out[c.id] ?? {}), ...c};
  return out;
}
export const BUILD_THICKNESS = {slim: 0.8, standard: 1, sturdy: 1.3} as const;
