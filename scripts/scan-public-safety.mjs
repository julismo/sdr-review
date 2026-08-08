import { execFileSync } from "node:child_process";
import console from "node:console";
import { readFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";

const revision = process.argv[2];

if (process.argv.length > 3) {
  console.error("Usage: node scripts/scan-public-safety.mjs [revision]");
  process.exit(2);
}

const rules = [
  {
    category: "github_token",
    pattern:
      /(?<![A-Za-z0-9_])(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{80,255})(?![A-Za-z0-9_])/g,
  },
  {
    category: "google_api_key",
    pattern: /(?<![A-Za-z0-9_-])AIza[0-9A-Za-z_-]{35}(?![A-Za-z0-9_-])/g,
  },
  {
    category: "openai_api_key",
    pattern:
      /(?<![A-Za-z0-9_-])sk-(?:(?:proj|svcacct)-)?[A-Za-z0-9_-]{20,}(?![A-Za-z0-9_-])/g,
  },
  {
    category: "private_key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    category: "email_address",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
];

const phonePattern = /(?<![\w.])\+?\d[\d ().-]{7,}\d(?![\w.])/g;
const urlPattern = /https?:\/\/[^\s<>)"']+/gi;
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function git(args, encoding = "utf8") {
  return execFileSync("git", args, {
    encoding,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function trackedFiles() {
  const args = revision
    ? ["ls-tree", "-r", "-z", "--name-only", revision]
    : ["ls-files", "-z"];

  return git(args)
    .split("\0")
    .filter((file) => file)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function fileContents(file) {
  if (revision) {
    return git(["show", `${revision}:${file}`], null);
  }

  return readFileSync(file);
}

function isText(buffer) {
  return !buffer.includes(0);
}

function lineNumber(text, index) {
  let line = 1;
  for (let position = 0; position < index; position += 1) {
    if (text.charCodeAt(position) === 10) {
      line += 1;
    }
  }
  return line;
}

function isIsoDate(candidate) {
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate);
}

function isIpv4(candidate) {
  const parts = candidate.split(".");
  return (
    parts.length === 4 &&
    parts.every(
      (part) => /^\d{1,3}$/.test(part) && Number.parseInt(part, 10) <= 255,
    )
  );
}

function isPhoneCandidate(candidate) {
  const normalized = candidate.trim();
  if (isIsoDate(normalized) || isIpv4(normalized)) {
    return false;
  }

  const digitCount = normalized.replace(/\D/g, "").length;
  return digitCount >= 8 && digitCount <= 15;
}

function isExternalUrl(candidate) {
  try {
    const parsed = new URL(candidate);
    return !loopbackHosts.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function matches(pattern, text) {
  pattern.lastIndex = 0;
  return text.matchAll(pattern);
}

function scan(file, text) {
  const findings = [];

  for (const rule of rules) {
    for (const match of matches(rule.pattern, text)) {
      findings.push({
        category: rule.category,
        file,
        line: lineNumber(text, match.index),
      });
    }
  }

  if (file !== "package-lock.json") {
    for (const match of matches(phonePattern, text)) {
      if (isPhoneCandidate(match[0])) {
        findings.push({
          category: "phone_number",
          file,
          line: lineNumber(text, match.index),
        });
      }
    }

    for (const match of matches(urlPattern, text)) {
      if (isExternalUrl(match[0])) {
        findings.push({
          category: "external_url",
          file,
          line: lineNumber(text, match.index),
        });
      }
    }
  }

  return findings;
}

function safePath(file) {
  return JSON.stringify(file).replace(
    /[\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069]/g,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
  );
}

try {
  const findings = [];

  for (const file of trackedFiles()) {
    const contents = fileContents(file);
    if (!isText(contents)) {
      continue;
    }
    findings.push(...scan(file, contents.toString("utf8")));
  }

  const uniqueFindings = new Map();
  for (const finding of findings) {
    const key = `${finding.category}\0${finding.file}\0${finding.line}`;
    uniqueFindings.set(key, finding);
  }

  const sortedFindings = [...uniqueFindings.values()].sort(
    (left, right) =>
      left.file.localeCompare(right.file, "en") ||
      left.line - right.line ||
      left.category.localeCompare(right.category, "en"),
  );

  for (const finding of sortedFindings) {
    console.log(
      `category=${finding.category} path=${safePath(finding.file)} line=${finding.line}`,
    );
  }

  if (sortedFindings.length > 0) {
    process.exitCode = 1;
  }
} catch {
  console.error("Public safety scan could not complete.");
  process.exitCode = 2;
}
