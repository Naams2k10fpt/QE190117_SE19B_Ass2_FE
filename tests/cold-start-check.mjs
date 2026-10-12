import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import vm from "node:vm";
import ts from "typescript";

const server = createServer((_request, response) => {
  setTimeout(() => { response.writeHead(401); response.end(); }, 32000);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const compiled = ts.transpileModule(readFileSync("lib/server-auth.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, {
  exports, fetch, AbortSignal, URL,
  process: { env: { API_URL: `http://127.0.0.1:${server.address().port}` } },
  require: name => { assert.equal(name, "next/headers"); return {}; },
});
try {
  const started = Date.now();
  const response = await exports.backendFetch("/api/auth/me");
  assert.equal(response.status, 401);
  assert.ok(Date.now() - started >= 31000, "Startup response must survive the former 30-second timeout.");
  console.log("PASS: the real backend helper accepts a response after 32 seconds.");
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
