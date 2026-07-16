/**
 * Debug-only helpers for local development / quickstart.
 * Do not use secretKey-based UserSig generation in production clients.
 */
export { genTestUserSig } from './genTestUserSig';
export type { GenTestUserSigParams, GenTestUserSigResult } from './genTestUserSig';
