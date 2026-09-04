# next-scaffold

[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=Agustin-Perezz_next-scaffold&metric=alert_status&token=5ef88f4ca9ec87efb39e7b315d9ad4cbc4b255f6)](https://sonarcloud.io/summary/new_code?id=Agustin-Perezz_next-scaffold)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Agustin-Perezz_next-scaffold&metric=coverage&token=5ef88f4ca9ec87efb39e7b315d9ad4cbc4b255f6)](https://sonarcloud.io/summary/new_code?id=Agustin-Perezz_next-scaffold)

A production-ready [Next.js](https://nextjs.org) starter. It keeps server and client boundaries explicit. It colocates data fetching with Server Actions and pushes interactivity to the component leaves. The scaffold follows a shift-left approach. Fast feedback (lint, typecheck, unit tests + coverage) runs first. Then SonarCloud analysis imports the coverage report. Then the production build runs. The expensive E2E suite runs last. This order catches issues early and cheaply.

## Tech Stack

| Area            | Choice                                        |
| --------------- | --------------------------------------------- |
| Framework       | Next.js 16 (App Router)                        |
| UI runtime      | React 19                                       |
| Language        | TypeScript (strict)                           |
| Components      | base-ui + shadcn                               |
| Styling         | Tailwind CSS v4                                |
| Forms           | react-hook-form + zod                          |
| Lint / Format   | Biome 2                                        |
| Unit tests      | Vitest + Testing Library (jsdom)               |
| Coverage        | `@vitest/coverage-istanbul` (lcov → SonarCloud) |
| E2E             | Playwright (Chromium)                          |
| Monitoring      | Sentry (`@sentry/nextjs`)                      |
| Security scan   | Snyk (SARIF → GitHub Code Scanning)            |
| Code quality    | SonarCloud (static analysis + Quality Gate)    |
| Package manager | pnpm 9                                         |
| Git hooks       | Husky + nano-staged                            |

## Folder Structure

```
next-scaffold/
├── .github/
│   └── workflows/
│       └── ci.yml                # Shift-left chain: static → unit → sonar → build → e2e (+ snyk)
├── docs/                         # Engineering guidelines
│   ├── 01_COMPONENT-PATTERNS.md
│   ├── 02_FRONTEND-FOLDER-STRUCTURE.md
│   └── 03_TYPESCRIPT-STANDARDS.md
├── public/                       # Static assets served at root
├── src/
│   ├── app/                      # App Router routes (pages, layouts, actions)
│   ├── components/
│   │   └── ui/                   # Reusable base-ui / shadcn primitives
│   └── lib/
│       └── utils.ts              # Shared utilities (cn, helpers)
├── tests/                        # Playwright E2E specs (tests/e2e/) + Vitest unit tests (tests/unit/)
├── biome.json                    # Linter & formatter config
├── sonar-project.properties      # SonarCloud analysis config
├── next.config.ts                # Next.js configuration
├── package.json
├── playwright.config.ts
├── vitest.config.ts              # Unit test + coverage configuration
└── tsconfig.json                 # Path alias: @/* -> ./src/*
```

See [`AGENTS.md`](./AGENTS.md) for the engineering conventions for agents and contributors.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies and Playwright browsers:

   ```bash
   pnpm install
   pnpm test:install
   ```

3. Start the dev server:

   ```bash
   pnpm dev
   ```

The app runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `pnpm dev`            | Start development server                  |
| `pnpm build`          | Production build                         |
| `pnpm start`          | Start production server                  |
| `pnpm lint`           | Run Biome lint & format checks           |
| `pnpm format`         | Auto-format with Biome                   |
| `pnpm typecheck`      | Run TypeScript type checking (`tsc --noEmit`) |
| `pnpm test`           | Run unit tests (Vitest)                  |
| `pnpm test:unit`      | Run unit tests (Vitest)                  |
| `pnpm test:unit:watch`| Run unit tests in watch mode             |
| `pnpm test:coverage`  | Run unit tests with coverage (writes `coverage/lcov.info`) |
| `pnpm test:e2e`       | Run Playwright E2E tests                 |
| `pnpm test:ui`        | Run Playwright with interactive UI       |
| `pnpm test:install`   | Install Playwright Chromium browser      |

## Git Hooks

[Husky](https://typicode.github.io/husky/) manages Git hooks:

- **pre-commit**: runs `nano-staged`, which executes `biome check --staged` on staged files.
- **pre-push**: runs `pnpm typecheck && pnpm test:unit && pnpm test:e2e` (typecheck + unit tests + E2E).

The `prepare` script installs the hooks automatically when you run `pnpm install`.

## CI (GitHub Actions)

The `.github/workflows/ci.yml` workflow runs on push to `main` and on pull requests. It is a shift-left, fail-fast chain. Each stage gates the next, so a red PR never wastes SonarCloud tokens or browser minutes:

1. **static** — Biome lint + TypeScript typecheck (fast gate)
2. **unit** — Vitest unit tests with coverage. Uploads the `coverage-report` artifact (contains `lcov.info`)
3. **sonar** — SonarCloud static analysis + Quality Gate, importing the coverage report produced by `unit`
4. **build** — production build with Sentry source map upload
5. **e2e** — Playwright E2E tests (runs **last** — the most expensive stage)
6. **snyk** — scans dependencies for high-severity vulnerabilities and uploads the results as SARIF to GitHub Code Scanning. It runs in parallel off `sonar` and continues on error, so findings do not block the pipeline.

```
static ──> unit ──> sonar ──┬──> build ──> e2e
                           └──> snyk
```

Coverage feeds the SonarCloud Quality Gate: `pnpm test:coverage` writes `coverage/lcov.info`, which `sonar-project.properties` points SonarCloud at via `sonar.javascript.lcov.reportPaths`. The Quality Gate enforces **Coverage on new code ≥ 80%** (configured in the SonarCloud UI) — a delta gate that does not penalize pre-existing uncovered code.

### Coverage Scope

Coverage is deliberately scoped to **`src/app/**`** (routes, pages, Server Actions, per-feature components) and **`src/hooks/**`**. `src/components/**` (shared UI primitives, presentational wrappers) and `src/lib/**` (utilities) are excluded from the coverage gate and exercised through Playwright E2E instead.

**Rationale:** UI primitives and utilities are thin, often generic, and better validated by end-to-end user flows than by per-file unit tests. Scoping the gate lets the team write fewer unit tests. E2E covers those surfaces. Unit coverage stays on the code that branches per route (pages, actions, feature components, hooks).

**How it works (lockstep invariant):** Sonar has no coverage whitelist property. Sonar counts any source file that the LCOV report does not list as 0% covered, unless `sonar.coverage.exclusions` lists it. The two configs must therefore agree:

- `vitest.config.ts` `coverage.include` — the whitelist of files Vitest instruments (and thus appear in LCOV).
- `sonar-project.properties` `sonar.coverage.exclusions` — the complementary blacklist. Sonar requires an entry here for every file **not** in `coverage.include`, or the file tanks the gate.

**Scalability:** Vitest automatically measures new files under `src/app/**` or `src/hooks/**`. It automatically excludes new files under `src/components/**` or `src/lib/**`. Adding a new top-level `src/` directory (for example `src/services/`) requires a matching line in `sonar.coverage.exclusions`.

### Required GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret                   | Description                            |
| ------------------------ | -------------------------------------- |
| `SONAR_TOKEN`            | SonarCloud analysis token              |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (client + server)           |
| `SENTRY_AUTH_TOKEN`      | Sentry auth token for source map upload |
| `SENTRY_ORG`             | Sentry organization slug               |
| `SENTRY_PROJECT`         | Sentry project slug                    |
| `SNYK_TOKEN`             | Snyk API token for vulnerability scans |

## Documentation

- [Component Patterns](./docs/01_COMPONENT-PATTERNS.md)
- [Frontend Folder Structure](./docs/02_FRONTEND-FOLDER-STRUCTURE.md)
- [TypeScript Standards](./docs/03_TYPESCRIPT-STANDARDS.md)

