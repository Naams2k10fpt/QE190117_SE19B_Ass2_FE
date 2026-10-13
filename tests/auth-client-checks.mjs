import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../.checks/auth-client.js", import.meta.url), "utf8");
function browser(state, locks = { request: (_name, callback) => callback() }) {
  const exports = {};
  vm.runInNewContext(code, {
    exports, navigator: { locks }, Response,
    window: { location: { assign: path => state.redirects.push(path) } },
    fetch: async path => {
      if (path === "/api/auth/session") return new Response(state.authenticated ? '{"accountId":1,"role":0}' : "{}", { status: state.authenticated ? 200 : 401 });
      if (path === "/api/auth/refresh") {
        state.refreshes++;
        await Promise.resolve();
        if (state.refreshStatus !== 200) return new Response("{}", { status: state.refreshStatus });
        state.authenticated = true;
        return new Response("{}");
      }
      state.writes++;
      return new Response("{}", { status: state.writeStatus || (state.authenticated ? 200 : 401) });
    },
  });
  return exports;
}
const state = () => ({ authenticated: false, refreshes: 0, writes: 0, redirects: [], refreshStatus: 200 });
{
  const s = state(); s.refreshStatus = 401;
  assert.equal(await browser(s).loadSession(), null);
  assert.equal(s.redirects.length, 0, "Guests on public pages must not be redirected.");
}
{
  const s = state(); const tab = browser(s);
  const responses = await Promise.all([tab.protectedFetch("/write"), tab.protectedFetch("/write")]);
  assert.ok(responses.every(r => r.status === 200));
  assert.equal(s.refreshes, 1, "Concurrent calls in a tab must share refresh.");
  assert.equal(s.writes, 4);
}
{
  const s = state(); let queue = Promise.resolve();
  const locks = { request: (_name, callback) => {
    const pending = queue.then(callback);
    queue = pending.then(() => undefined, () => undefined);
    return pending;
  } };
  const tabs = [browser(s, locks), browser(s, locks)];
  const responses = await Promise.all(tabs.map(tab => tab.protectedFetch("/write")));
  assert.ok(responses.every(r => r.status === 200));
  assert.equal(s.refreshes, 1, "Web Locks must prevent two tabs replaying the same refresh token.");
}
{
  const s = state(); s.authenticated = true; s.writeStatus = 403;
  assert.equal((await browser(s).protectedFetch("/write")).status, 403);
  assert.equal(s.refreshes, 0);
  assert.equal(s.redirects.length, 0, "403 must not log a user out.");
}
{
  const s = state(); s.refreshStatus = 401;
  assert.equal((await browser(s).protectedFetch("/write")).status, 401);
  assert.deepEqual(s.redirects, ["/login"]);
}
{
  const s = state(); s.writeStatus = 401;
  assert.equal((await browser(s).protectedFetch("/write")).status, 401);
  assert.equal(s.refreshes, 1);
  assert.equal(s.writes, 2, "Retry must stop after one attempt.");
  assert.deepEqual(s.redirects, ["/login"]);
}
{
  const s = state(); s.refreshStatus = 502;
  await assert.rejects(browser(s).protectedFetch("/write"), /Unable to refresh/);
  assert.equal(s.redirects.length, 0, "An API outage must not be treated as logout.");
}
console.log("PASS: guest sessions, one retry, same-tab/cross-tab coordination, 401 redirect, 403 preservation and outage handling.");
{
  const s = state();
  const tabs = [browser(s, null), browser(s, null)];
  const responses = await Promise.all(tabs.map(tab => tab.protectedFetch("/write")));
  assert.ok(responses.every(r => r.status === 401));
  assert.equal(s.refreshes, 0, "Without Web Locks, no tab may rotate the shared refresh cookie.");
  assert.deepEqual(s.redirects, ["/login", "/login"]);
  assert.equal(await tabs[0].loadSession(), null, "Guests on unsupported browsers remain guests without redirect loops.");
  s.authenticated = true;
  assert.ok(await tabs[1].loadSession(), "Valid access tokens still work without Web Locks.");
  assert.equal((await tabs[1].protectedFetch("/write")).status, 200);
}
console.log("PASS: browsers without Web Locks retain valid access and require sign-in at expiry without replaying refresh.");
