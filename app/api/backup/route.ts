import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

const MYSQLDUMP_PATH = process.env.MYSQLDUMP_PATH || "C:\\xampp\\mysql\\bin\\mysqldump.exe";

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    user: decodeURIComponent(parsed.username || "root"),
    password: decodeURIComponent(parsed.password || ""),
    host: parsed.hostname || "localhost",
    port: parsed.port || "3306",
    database: parsed.pathname.replace(/^\//, ""),
  };
}

export async function GET() {
  const { user, password, host, port, database } = parseDatabaseUrl(
    process.env.DATABASE_URL!,
  );

  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  let exitCode: number;
  let spawnError: Error | null = null;

  try {
    exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn(
        /* turbopackIgnore: true */ MYSQLDUMP_PATH,
        ["-h", host, "-P", port, "-u", user, "--single-transaction", "--routines", database],
        { env: { ...process.env, MYSQL_PWD: password } },
      );
      child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
      child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
      child.on("error", reject);
      child.on("close", (code) => resolve(code ?? 1));
    });
  } catch (error) {
    spawnError = error as Error;
    exitCode = 1;
  }

  if (spawnError) {
    return NextResponse.json(
      { error: `Tidak bisa menjalankan mysqldump: ${spawnError.message}` },
      { status: 500 },
    );
  }

  if (exitCode !== 0) {
    const message = Buffer.concat(stderrChunks).toString("utf-8").slice(0, 500);
    return NextResponse.json(
      { error: `Backup gagal: ${message || "mysqldump keluar dengan error."}` },
      { status: 500 },
    );
  }

  const sqlBuffer = Buffer.concat(stdoutChunks);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `watchyoung-backup-${timestamp}.sql`;

  return new NextResponse(new Uint8Array(sqlBuffer), {
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
