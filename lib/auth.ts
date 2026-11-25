import "server-only";

import { cache } from "react";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isMaster } from "@/lib/roles";
import { SESSION_COOKIE_NAME } from "@/lib/auth-edge";

export { SESSION_COOKIE_NAME };
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// cache(): layout dan halaman dalam satu render cukup satu query user.
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    if (!userId) return null;

    // Role dibaca dari database di setiap request (bukan disimpan di token),
    // jadi perubahan role atau penghapusan akun langsung berlaku tanpa
    // menunggu sesi lama kedaluwarsa.
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, branchId: true },
    });
  } catch {
    return null;
  }
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Untuk API route khusus master. Mengembalikan response error (401/403)
 * kalau akses ditolak, atau null kalau boleh lanjut:
 *
 *   const denied = await denyUnlessMaster();
 *   if (denied) return denied;
 */
export async function denyUnlessMaster() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sesi habis, silakan login lagi." }, { status: 401 });
  }
  if (!isMaster(user)) {
    return NextResponse.json(
      { error: "Fitur ini hanya untuk akun master." },
      { status: 403 },
    );
  }
  return null;
}

/** Untuk halaman khusus master: staff diarahkan kembali ke dashboard. */
export async function requireMasterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isMaster(user)) redirect("/");
  return user;
}
