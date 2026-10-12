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
