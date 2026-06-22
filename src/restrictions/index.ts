import { apiRestrictions } from "./apis.js";
import { navigationRestrictions } from "./navigation.js";
import { paymentRestrictions } from "./payments.js";
import type { Restriction } from "./schema.js";
import { storageRestrictions } from "./storage.js";

export { apiRestrictions } from "./apis.js";
export { navigationRestrictions } from "./navigation.js";
export { paymentRestrictions } from "./payments.js";
export type {
  AppId,
  AppScope,
  Platform,
  Restriction,
  RestrictionCategory,
} from "./schema.js";
export { storageRestrictions } from "./storage.js";

/** Every restriction in the manifest, across all categories. */
export const allRestrictions: Restriction[] = [
  ...navigationRestrictions,
  ...paymentRestrictions,
  ...storageRestrictions,
  ...apiRestrictions,
];

/** Look a restriction up by its stable `id`. */
export function getRestriction(id: string): Restriction | undefined {
  return allRestrictions.find((r) => r.id === id);
}
