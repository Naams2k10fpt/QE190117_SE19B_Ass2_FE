# TaskTrack frontend · PRN232 Assignment 2

Next.js 15 App Router frontend with TypeScript and Tailwind CSS, connected to the [Assignment 2 API](https://github.com/Naams2k10fpt/QE190117_SE19B_Ass2_BE).

## Features

Public home, departments, details and task search retain the Assignment 1 behavior. Register creates Staff accounts; login opens `/admin`, with four counts from the active business lists. Staff and Admin manage departments, projects, tasks and tags through the existing modal forms, confirmation dialogs, filters and pagination. Task forms support multiple tags. Only Admin can open `/admin/accounts` and edit names/roles or delete eligible accounts. The old management URLs redirect to the protected pages.

Access and refresh tokens stay in HttpOnly, Secure production cookies with SameSite=Lax. Browser JSON contains account details only. Server route handlers forward authenticated writes, enforce same-origin requests and limit destination paths; the API independently enforces roles. Logout revokes the backend session and clears both cookies. Expired access tokens refresh once before retry; Web Locks coordinate refresh between tabs. Without Web Locks, coordination is limited to one tab. A backend outage reports an error without discarding the session.

## Database ERD

![TaskTrack PostgreSQL entity relationship diagram](docs/erd.svg)

## Run locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`. Set `API_URL` and `NEXT_PUBLIC_API_URL` to the API origin without `/api`.
3. Start the Assignment 2 API at `http://localhost:5117`, then run `npm run dev` and open `http://localhost:3000`.

Run `npm test`, `npm run lint` and `npm run build` before pushing. CI runs these checks. See [tests/README.md](tests/README.md) for the separate HTTP/database regression suite.

## Deployment

The [live frontend](https://qe190117-se19b-ass2-fe.vercel.app) runs in the separate Vercel project `qe190117-se19b-ass2-fe`, with functions in Singapore. GitHub `main` is connected for automatic deployment. Both API origins point to `https://qe190117-se19b-ass2-be.onrender.com`, and Render's `FRONTEND_URL` matches this production origin. Grading credentials are provided in the submission document, never in Git.

On 12 October 2026, the live deployment passed 58 frontend HTTP checks and 180 backend assertions. Browser checks verified live Staff registration, login/logout, Admin accounts, keyboard focus in modals and protected redirects. Test fixtures were removed and the original business data matched its pre-test snapshot. Both repositories' CI checks passed.

The free Render backend can take time to wake after inactivity. The reused PostgreSQL instance currently expires on 26 October 2026; maintain availability before grading after that date.

## Dependency checks

Next.js and its ESLint configuration are pinned to 15.5.27. The production dependency audit reports zero vulnerabilities. The full audit retains nine development/build dependency advisories; forcing npm's suggested Tailwind major migration is outside this assignment's scope.
