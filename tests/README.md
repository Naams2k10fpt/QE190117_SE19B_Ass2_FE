# Frontend regression checks

`npm test` compiles and exercises the real authentication client with Node's standard library. It checks guest sessions, one refresh/retry, same-tab and cross-tab coordination, 403 handling, expired-session redirects and backend outages.

`npm run test:http` exercises a running production frontend, API and database. Configure these privately in the process environment:

- `TEST_FRONTEND_URL` (defaults to `http://localhost:3001`)
- `TEST_API_URL` (defaults to `http://127.0.0.1:5127`)
- `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD`
- `JWT_SECRET` matching the API and `DATABASE_URL`
- `TEST_PSQL_PATH` if `psql` is not on PATH

Build with the correct API origins, start with `npm run start -- --port 3001`, then run the HTTP checks. They cover public pages, protected redirects, registration, role restrictions, same-origin validation, cookie flags, token confidentiality, all business CRUD, Admin account management, refresh and logout.

Fixtures have a unique prefix. Cleanup removes only those fixtures, including their temporary soft-deleted tasks, then verifies that every business table matches its initial snapshot. Run while nobody else is editing the database; concurrent edits intentionally fail this check. Never commit credentials or test tokens.

The HTTP suite also covers profile redirects/validation, rejected account/role spoofing, task audit fields, password validation, revoked access/refresh tokens and cleared cookies after password changes. It changes only its disposable Staff fixture's password; grading credentials stay unchanged.

`npm run test:cold-start` runs the real server authentication helper against a local server that responds after 32 seconds. It confirms startup delay survives the former 30-second timeout, without credentials or production requests. Page guards may use either HTTP redirects or Next.js streaming redirects; the HTTP suite verifies the expected destination in both cases.
