// Kept separate from lib/auth.ts (no Prisma/bcrypt imports) so middleware,
// which runs on the Edge runtime, can read the cookie name without pulling
// in the Node-only Prisma/better-sqlite3 client.
export const SESSION_COOKIE_NAME = "wy_session";
