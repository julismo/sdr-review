import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scannerPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "scan-public-safety.mjs",
);

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
  });
}

test("classifies known false positives and redacts a real candidate", async () => {
  const repository = await mkdtemp(path.join(os.tmpdir(), "public-safety-"));

  try {
    assert.equal(run("git", ["init", "--quiet"], repository).status, 0);
    assert.equal(
      run("git", ["config", "user.name", "Safety Scanner Test"], repository)
        .status,
      0,
    );
    assert.equal(
      run("git", ["config", "user.email", "scanner.invalid"], repository)
        .status,
      0,
    );

    await writeFile(
      path.join(repository, "README.md"),
      [
        "task-number",
        "2026-08-07",
        "127.0.0.1",
        "http" + "://localhost:4173",
        "http" + "://[::1]:4173",
      ].join("\n"),
    );
    await writeFile(
      path.join(repository, "package-lock.json"),
      "https" + "://example.invalid\n",
    );
    assert.equal(run("git", ["add", "."], repository).status, 0);
    assert.equal(
      run("git", ["commit", "--quiet", "-m", "test fixture"], repository)
        .status,
      0,
    );

    const currentSafe = run(process.execPath, [scannerPath], repository);
    assert.equal(currentSafe.status, 0, currentSafe.stderr);
    assert.equal(currentSafe.stdout, "");

    const revisionSafe = run(process.execPath, [scannerPath, "HEAD"], repository);
    assert.equal(revisionSafe.status, 0, revisionSafe.stderr);
    assert.equal(revisionSafe.stdout, "");

    const candidate = "https" + "://example.invalid/path";
    await writeFile(path.join(repository, "README.md"), candidate + "\n");

    const currentUnsafe = run(process.execPath, [scannerPath], repository);
    assert.equal(currentUnsafe.status, 1);
    assert.equal(currentUnsafe.stdout, "category=external_url path=README.md line=1\n");
    assert.equal(currentUnsafe.stderr, "");
    assert.equal(currentUnsafe.stdout.includes(candidate), false);
  } finally {
    await rm(repository, { recursive: true, force: true });
  }
});
