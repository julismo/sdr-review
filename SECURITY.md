# Security Policy

## Scope

The project is local-only and intentionally accepts no credentials or production data.

## Reporting a problem

Open a private security advisory in the repository. Do not include real personal data, secrets, access tokens, or production URLs in an issue.

## Release rule

Before publication, run the automated safety scan over tracked text in the working tree and reachable Git history. Binary assets and their metadata require an explicit manual review until the project has a binary allowlist or a fail-closed binary check.

Run `npm run scan:public-safety` for the tracked working tree or `npm run scan:public-safety -- <revision>` for one Git revision. The dependency-free text scanner reports only category, path, and line. It checks strict credential shapes, private-key headers, email addresses, phone-like values, and non-loopback URLs; ISO dates and IPv4 addresses are classified separately, and only `127.0.0.1`, `localhost`, and `::1` are accepted URL hosts. For `package-lock.json`, strict credential, private-key, and email rules still apply, while external-URL and phone-like rules are skipped because dependency registry URLs and version-like numeric metadata are expected. `npm ci` manifest/lockfile consistency and recorded lockfile integrity metadata provide a separate dependency-review boundary. These automated text and history checks support review but are not exhaustive, do not inspect binary contents, and do not comprehensively validate file metadata.
