import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";

const origin = process.env.TEST_FRONTEND_URL || "http://localhost:3001";
const api = process.env.TEST_API_URL || "http://127.0.0.1:5127";
const prefix = "as2fe" + randomUUID().replaceAll("-", "");
const password = randomBytes(24).toString("base64");
const email = prefix + "@example.test";
const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;
assert.ok(adminEmail && adminPassword && jwtSecret && process.env.DATABASE_URL, "Configure test Admin credentials, JWT_SECRET and DATABASE_URL privately.");
const db = new URL(process.env.DATABASE_URL);
const dbSslMode = process.env.TEST_DB_SSLMODE || "require";
if (dbSslMode === "disable") assert.ok(["127.0.0.1", "localhost"].includes(db.hostname), "Disable TLS only for an isolated loopback test DB.");
const pgEnv = { ...process.env, PGHOST: db.hostname, PGPORT: db.port || "5432", PGDATABASE: decodeURIComponent(db.pathname.slice(1)), PGUSER: decodeURIComponent(db.username), PGPASSWORD: decodeURIComponent(db.password), PGSSLMODE: dbSslMode, PGCONNECT_TIMEOUT: "15" };
function sql(query) {
  try {
    return execFileSync(process.env.TEST_PSQL_PATH || "psql", ["-X", "-w", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-v", "fixture_prefix=" + prefix + "%"], { input: query, env: pgEnv, encoding: "utf8", timeout: 30000 }).trim();
  } catch { throw new Error("Test database query failed; credentials and raw output withheld."); }
}
function snapshot() {
  return [ ["Department", '"DepartmentID"'], ["Project", '"ProjectID"'], ["Task", '"TaskID"'], ["Tag", '"TagID"'], ["TaskTag", '"TaskID", "TagID"'] ]
    .map(([table, order]) => sql(`SELECT md5(COALESCE(jsonb_agg(r)::text,'[]')) FROM (SELECT * FROM public."${table}" ORDER BY ${order}) r;`)).join("/");
}
const baseline = snapshot();
let count = 0;
async function request(method, path, status, body, jar = new Map(), requestOrigin = origin) {
  const headers = { Origin: requestOrigin, Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; ") };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(origin + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  assert.ok((Array.isArray(status) ? status : [status]).includes(response.status), `${method} ${path}: unexpected status ${response.status}`);
  count++;
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";"); const split = pair.indexOf("=");
    jar.set(pair.slice(0, split), pair.slice(split + 1));
  }
  const type = response.headers.get("content-type") || "";
  return { response, data: response.status === 204 ? null : type.includes("json") ? await response.json() : await response.text() };
}

async function redirect(path, destination, jar = new Map()) {
  const result = await request("GET", path, [200, 307], undefined, jar);
  if (result.response.status === 307) assert.equal(result.response.headers.get("location"), destination);
  else assert.ok(result.data.includes(`http-equiv="refresh" content="1;url=${destination}"`), "Streamed page must emit the expected redirect.");
}

try {
  const guest = new Map();
  for (const path of ["/", "/login", "/register", "/departments", "/projects", "/tags", "/search", "/departments/1", "/projects/1", "/tasks/1"])
    await request("GET", path, 200);
  for (const path of ["/admin", "/admin/departments", "/admin/projects", "/admin/tasks", "/admin/tags", "/admin/accounts", "/admin/deletions", "/profile"]) {
    await redirect(path, "/login");
  }
  await request("POST", "/api/auth/login", 403, { email: adminEmail, password: adminPassword }, guest, "https://other.example");
  await request("POST", "/api/auth/login", 401, { email: adminEmail, password: "wrong-password" });
  await request("POST", "/api/manage/tags", 401, { tagName: prefix });
  await request("POST", "/api/manage/tags", 403, { tagName: prefix }, guest, "https://other.example");
  await request("POST", "/api/manage/auth/login", 404, { });
  await request("GET", "/api/manage/deletions", 401);
  await request("POST", "/api/manage/deletions/1/restore", 403, {}, guest, "https://other.example");
  await request("POST", "/api/auth/profile", 401, { fullName: prefix });
  await request("POST", "/api/auth/password", 401, { currentPassword: password, newPassword: password + "new" });

  await request("POST", "/api/auth/register", 201, { fullName: prefix, email, password });
  await request("POST", "/api/auth/register", 409, { fullName: prefix, email, password });
  const staff = new Map();
  const login = await request("POST", "/api/auth/login", 200, { email, password }, staff);
  assert.equal(login.data.role, 0);
  assert.ok(!("accessToken" in login.data) && !("refreshToken" in login.data), "Tokens must not be returned to client JSON.");
  const cookies = login.response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.every(c => /HttpOnly/i.test(c) && /SameSite=lax/i.test(c) && /Path=\//i.test(c) && /Secure/i.test(c)), "Production cookies must be HttpOnly, Secure and SameSite=Lax.");
  const session = await request("GET", "/api/auth/session", 200, undefined, staff);
  assert.equal(session.data.fullName, prefix);
  assert.equal(session.response.headers.get("cache-control"), "no-store");
  await request("GET", "/profile", 200, undefined, staff);
  await request("POST", "/api/auth/profile", 403, { fullName: prefix }, staff, "https://other.example");
  await request("POST", "/api/auth/password", 403, { currentPassword: password, newPassword: password + "new" }, staff, "https://other.example");
  await request("POST", "/api/auth/profile", 400, { fullName: " " }, staff);
  await request("POST", "/api/auth/profile", 400, { fullName: "x".repeat(101) }, staff);
  const updatedProfile = await request("POST", "/api/auth/profile", 200, { fullName: "  " + prefix + " Profile  ", role: 1, accountId: 2147483647 }, staff);
  assert.equal(updatedProfile.data.fullName, prefix + " Profile");
  assert.equal(updatedProfile.data.role, 0);
  assert.equal(updatedProfile.data.accountId, login.data.accountId);
  await request("GET", "/admin", 200, undefined, staff);
  for (const resource of ["departments", "projects", "tasks", "tags"])
    await request("GET", "/admin/" + resource, 200, undefined, staff);
  await request("GET", "/api/manage/accounts", 403, undefined, staff);
  await redirect("/admin/accounts", "/admin", staff);

  const department = (await request("POST", "/api/manage/departments", 201, { departmentName: prefix, departmentDescription: "Frontend fixture" }, staff)).data;
  await request("PUT", "/api/manage/departments/" + department.departmentId, 204, { departmentName: prefix, departmentDescription: "Updated", isActive: true }, staff);
  const project = (await request("POST", "/api/manage/projects", 201, { projectName: prefix, startDate: "2026-10-12", status: 0, departmentId: department.departmentId }, staff)).data;
  await request("PUT", "/api/manage/projects/" + project.projectId, 204, { projectName: prefix, startDate: "2026-10-12", status: 1, departmentId: department.departmentId, isActive: true }, staff);
  const tag = (await request("POST", "/api/manage/tags", 201, { tagName: prefix, color: "#123456" }, staff)).data;
  await request("PUT", "/api/manage/tags/" + tag.tagId, 204, { tagName: prefix, color: "#abcdef" }, staff);
  const task = (await request("POST", "/api/manage/tasks", 201, { title: prefix, status: 0, priority: 0, projectId: project.projectId, tagIds: [tag.tagId] }, staff)).data;
  assert.equal(task.priority, 0);
  assert.equal(task.createdById, login.data.accountId);
  assert.equal(task.updatedById, null);
  await request("PUT", "/api/manage/tasks/" + task.taskId, 204, { title: prefix, status: 2, priority: 3, projectId: project.projectId, tagIds: [] }, staff);
  const auditedTask = await fetch(api + "/api/tasks/" + task.taskId);
  assert.equal(auditedTask.status, 200);
  assert.equal((await auditedTask.json()).updatedById, login.data.accountId);
  await request("DELETE", "/api/manage/tasks/" + task.taskId, 204, undefined, staff);
  const history = (await request("GET", "/api/manage/deletions?resource=tasks&search=" + prefix, 200, undefined, staff)).data;
  const deletedTask = history.items.find(item => item.entityId === task.taskId);
  assert.ok(deletedTask?.canRestore && !("snapshot" in deletedTask));
  await request("GET", "/api/manage/deletions?resource=accounts", 403, undefined, staff);
  await request("POST", "/api/manage/deletions/" + deletedTask.deletionId + "/restore", 403, {}, staff, "https://other.example");
  await request("POST", "/api/manage/deletions/" + deletedTask.deletionId + "/restore", 200, {}, staff);
  await request("POST", "/api/manage/deletions/" + deletedTask.deletionId + "/restore", 409, {}, staff);
  await request("DELETE", "/api/manage/tasks/" + task.taskId, 204, undefined, staff);
  await request("DELETE", "/api/manage/tags/" + tag.tagId, 204, undefined, staff);

  const admin = new Map();
  await request("POST", "/api/auth/login", 200, { email: adminEmail, password: adminPassword }, admin);
  await request("GET", "/admin/accounts", 200, undefined, admin);
  await request("GET", "/profile", 200, undefined, admin);
  const list = (await request("GET", "/api/manage/accounts", 200, undefined, admin)).data;
  assert.ok(list.some(a => a.accountId === login.data.accountId));
  assert.ok(list.every(a => !("passwordHash" in a)), "Admin response must not expose password hashes.");
  await request("PUT", "/api/manage/accounts/" + login.data.accountId, 204, { fullName: prefix + " Updated", role: 0 }, admin);
  await request("DELETE", "/api/manage/accounts/" + login.data.accountId, 409, undefined, admin);

  await request("POST", "/api/auth/password", 400, { currentPassword: "wrong-password", newPassword: password + "new" }, staff);
  await request("POST", "/api/auth/password", 400, { currentPassword: password, newPassword: "short" }, staff);
  await request("GET", "/api/auth/session", 200, undefined, staff);
  const passwordOldAccess = staff.get("tasktrack_access");
  const passwordOldRefresh = staff.get("tasktrack_refresh");
  await request("POST", "/api/auth/password", 204, { currentPassword: password, newPassword: password + "new" }, staff);
  assert.ok(!staff.get("tasktrack_access") && !staff.get("tasktrack_refresh"), "Password change must clear both cookies.");
  await request("GET", "/api/auth/session", 401, undefined, staff);
  await redirect("/profile", "/login", staff);
  await request("POST", "/api/auth/login", 401, { email, password });
  await request("POST", "/api/auth/refresh", 401, undefined, new Map([["tasktrack_refresh", passwordOldRefresh]]));
  const revokedPasswordAccess = await fetch(api + "/api/auth/me", { headers: { Authorization: "Bearer " + passwordOldAccess } });
  assert.equal(revokedPasswordAccess.status, 401);
  await request("POST", "/api/auth/login", 200, { email, password: password + "new" }, staff);
  await request("POST", "/api/auth/password", 204, { currentPassword: password + "new", newPassword: password }, staff);
  await request("POST", "/api/auth/login", 200, { email, password }, staff);

  const originalRefresh = staff.get("tasktrack_refresh");
  const parts = staff.get("tasktrack_access").split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url"));
  payload.nbf = Math.floor(Date.now() / 1000) - 120; payload.exp = Math.floor(Date.now() / 1000) - 60;
  const unsigned = parts[0] + "." + Buffer.from(JSON.stringify(payload)).toString("base64url");
  staff.set("tasktrack_access", unsigned + "." + createHmac("sha256", jwtSecret).update(unsigned).digest("base64url"));
  await request("GET", "/api/auth/session", 401, undefined, staff);
  await request("POST", "/api/auth/refresh", 403, undefined, staff, "https://other.example");
  const refresh = await request("POST", "/api/auth/refresh", 200, undefined, staff);
  assert.ok(!("accessToken" in refresh.data) && staff.get("tasktrack_refresh") !== originalRefresh);
  await request("GET", "/api/auth/session", 200, undefined, staff);
  await request("POST", "/api/auth/logout", 204, undefined, staff);
  await request("GET", "/api/auth/session", 401, undefined, staff);
  await redirect("/admin", "/login", staff);
  const stale = await fetch(api + "/api/auth/me", { headers: { Authorization: "Bearer " + refresh.response.headers.getSetCookie().find(c => c.startsWith("tasktrack_access=")).split(";")[0].split("=")[1] } });
  assert.equal(stale.status, 401, "Logout must revoke the access token at the backend.");
  assert.ok(Number.isSafeInteger(task.taskId) && task.taskId > 0 && Number.isSafeInteger(login.data.accountId) && login.data.accountId > 0);
  sql("DELETE FROM public.\"Task\" WHERE \"TaskID\"=" + task.taskId + " AND \"CreatedByID\"=" + login.data.accountId + ";");
  await request("DELETE", "/api/manage/projects/" + project.projectId, 204, undefined, admin);
  await request("DELETE", "/api/manage/departments/" + department.departmentId, 204, undefined, admin);
  await request("DELETE", "/api/manage/accounts/" + login.data.accountId, 204, undefined, admin);
  await request("POST", "/api/auth/logout", 204, undefined, admin);
} finally {
  sql(`DELETE FROM public."TaskTag" WHERE "TaskID" IN (SELECT "TaskID" FROM public."Task" WHERE "CreatedByID" IN (SELECT "AccountID" FROM public."SystemAccount" WHERE "Email" LIKE :'fixture_prefix'));
DELETE FROM public."Task" WHERE "CreatedByID" IN (SELECT "AccountID" FROM public."SystemAccount" WHERE "Email" LIKE :'fixture_prefix');
DELETE FROM public."Tag" WHERE "TagName" LIKE :'fixture_prefix';
DELETE FROM public."Project" WHERE "ProjectName" LIKE :'fixture_prefix';
DELETE FROM public."Department" WHERE "DepartmentName" LIKE :'fixture_prefix';
DELETE FROM public."SystemAccount" WHERE "Email" LIKE :'fixture_prefix';`);
  sql(`DELETE FROM public."DeletionHistory" WHERE "EntityName" ILIKE :'fixture_prefix';`);
  assert.equal(snapshot(), baseline, "Business data must be unchanged after fixture cleanup.");
}
console.log(`PASS: ${count} frontend HTTP checks; public/protected pages, cookie secrecy/flags, CSRF, Staff/Admin CRUD, profile/password changes, task audit, refresh and logout; fixtures cleaned and original data unchanged.`);
