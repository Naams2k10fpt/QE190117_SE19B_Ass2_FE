# TaskTrack frontend · PRN232 Assignment 2

Next.js 15 app for browsing and managing departments, projects, tasks, and tags. It uses the App Router, TypeScript, Tailwind CSS, and the [Assignment 2 TaskTrack API](https://github.com/Naams2k10fpt/QE190117_SE19B_Ass2_BE).

## Database ERD

![TaskTrack PostgreSQL entity relationship diagram](docs/erd.svg)

## Run locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the API origin, without a trailing `/api` path.
3. Start the Assignment 2 API at `http://localhost:5117`, then run `npm run dev` and open `http://localhost:3000`.

Run `npm run lint` and `npm run build` before pushing. GitHub Actions runs these checks on every push using the local API origin as a build placeholder.

The existing management pages currently provide public create, edit, delete, filtering, and 10-row pagination. Task deletion is a soft delete in the API. Login, registration, and protected `/admin` pages are not implemented yet.

## Deployment

The Vercel frontend and Render backend URLs are pending. Set `NEXT_PUBLIC_API_URL` to the deployed Assignment 2 API origin when deployment is configured. Update the CI build origin if needed at that time.
