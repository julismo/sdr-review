import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
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
    assert.equal(
      currentUnsafe.stdout,
      'category=external_url path="README.md" line=1\n',
    );
    assert.equal(currentUnsafe.stderr, "");
    assert.equal(currentUnsafe.stdout.includes(candidate), false);
  } finally {
    await rm(repository, { recursive: true, force: true });
  }
});

test("detects supported candidates while keeping paths and values safe", async () => {
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

    const candidates = {
      openai: "s" + "k-" + "A".repeat(24),
      email: "person" + "@" + "example.invalid",
      phone: ["202", "555", "0100"].join("-"),
      url: "https" + "://example.invalid/path",
    };
    const candidateFile = "CANDIDATES.md";
    const bidiCharacter = String.fromCodePoint(0x202e);
    const bidiFile = "direction-" + bidiCharacter + "name.md";
    const escapedBidiPath = '"direction-' + "\\u202E" + 'name.md"';

    await writeFile(
      path.join(repository, candidateFile),
      Object.values(candidates).join("\n") + "\n",
    );
    await writeFile(path.join(repository, bidiFile), candidates.url + "\n");
    await writeFile(
      path.join(repository, "binary.bin"),
      Buffer.concat([Buffer.from([0]), Buffer.from(candidates.url)]),
    );
    assert.equal(run("git", ["add", "."], repository).status, 0);

    const currentUnsafe = run(process.execPath, [scannerPath], repository);
    assert.equal(currentUnsafe.status, 1);
    assert.deepEqual(
      [...currentUnsafe.stdout.matchAll(/category=([a-z_]+)/g)]
        .map((match) => match[1])
        .filter((category, index, all) => all.indexOf(category) === index)
        .sort(),
      ["email_address", "external_url", "openai_api_key", "phone_number"],
    );
    assert.equal(
      Object.values(candidates).some((candidate) =>
        currentUnsafe.stdout.includes(candidate),
      ),
      false,
      "scanner output must not contain matched values",
    );
    assert.equal(
      currentUnsafe.stdout.includes("binary.bin"),
      false,
      "binary files must be skipped",
    );
    assert.equal(
      currentUnsafe.stdout.includes(escapedBidiPath),
      true,
      "directional controls in paths must use explicit Unicode escapes",
    );
    assert.equal(
      currentUnsafe.stdout.includes(bidiCharacter),
      false,
      "scanner output must not contain a raw directional control",
    );

    assert.equal(
      run("git", ["commit", "--quiet", "-m", "test fixture"], repository)
        .status,
      0,
    );
    const revisionUnsafe = run(
      process.execPath,
      [scannerPath, "HEAD"],
      repository,
    );
    assert.equal(revisionUnsafe.status, 1);
    assert.equal(
      revisionUnsafe.stdout,
      currentUnsafe.stdout,
      "revision mode must report the same redacted findings",
    );
    assert.equal(revisionUnsafe.stderr, "");
  } finally {
    await rm(repository, { recursive: true, force: true });
  }
});

test("scans lockfiles for strict findings while exempting registry and version metadata", async () => {
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

    const candidates = {
      credential: "s" + "k-" + "L".repeat(24),
      email: ["lock-owner", "example.invalid"].join("@"),
      privateKey: ["-----BEGIN ", "PRIVATE ", "KEY-----"].join(""),
      registry: [
        "https",
        "://",
        "registry.npmjs.org",
        "/dependency/-/dependency-1.0.0.tgz",
      ].join(""),
      version: ["1234", "5678"].join("-"),
    };
    const lockfileLines = [
      "{",
      '  "name": "scanner-lockfile-fixture",',
      '  "lockfileVersion": 3,',
      '  "packages": {',
      '    "node_modules/dependency": {',
      `      "version": ${JSON.stringify(candidates.version)},`,
      `      "resolved": ${JSON.stringify(candidates.registry)},`,
      '      "integrity": "sha512-test",',
      `      "credential": ${JSON.stringify(candidates.credential)},`,
      `      "privateKey": ${JSON.stringify(candidates.privateKey)},`,
      `      "email": ${JSON.stringify(candidates.email)}`,
      "    }",
      "  }",
      "}",
    ];
    const credentialLine =
      lockfileLines.findIndex((line) => line.includes('"credential"')) + 1;
    const emailLine =
      lockfileLines.findIndex((line) => line.includes('"email"')) + 1;
    const privateKeyLine =
      lockfileLines.findIndex((line) => line.includes('"privateKey"')) + 1;

    await writeFile(
      path.join(repository, "package-lock.json"),
      lockfileLines.join("\n") + "\n",
    );
    assert.equal(run("git", ["add", "."], repository).status, 0);
    assert.equal(
      run("git", ["commit", "--quiet", "-m", "lockfile fixture"], repository)
        .status,
      0,
    );

    const expected = [
      `category=openai_api_key path="package-lock.json" line=${credentialLine}`,
      `category=private_key path="package-lock.json" line=${privateKeyLine}`,
      `category=email_address path="package-lock.json" line=${emailLine}`,
      "",
    ].join("\n");
    const currentUnsafe = run(process.execPath, [scannerPath], repository);
    const revisionUnsafe = run(
      process.execPath,
      [scannerPath, "HEAD"],
      repository,
    );

    for (const result of [currentUnsafe, revisionUnsafe]) {
      assert.equal(result.status, 1);
      assert.equal(result.stdout, expected);
      assert.equal(result.stderr, "");
      assert.equal(result.stdout.includes("external_url"), false);
      assert.equal(result.stdout.includes("phone_number"), false);
      assert.equal(
        Object.values(candidates).some((candidate) =>
          result.stdout.includes(candidate),
        ),
        false,
        "scanner output must not contain matched lockfile values",
      );
    }
  } finally {
    await rm(repository, { recursive: true, force: true });
  }
});
