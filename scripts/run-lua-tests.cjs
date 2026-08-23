const { readFileSync, readdirSync } = require("node:fs");
const { basename, join } = require("node:path");
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = require("fengari");

const backendFiles = readdirSync("backend").filter((name) => name.endsWith(".lua"));
const testFiles = readdirSync("tests/backend").filter((name) => name.endsWith(".test.lua"));
let failures = 0;

for (const testFile of testFiles) {
  const state = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(state);
  lua.lua_getglobal(state, to_luastring("package"));
  lua.lua_getfield(state, -1, to_luastring("preload"));
  for (const file of backendFiles) {
    const source = readFileSync(join("backend", file), "utf8");
    const status = lauxlib.luaL_loadbuffer(state, to_luastring(source), null, to_luastring(`@backend/${file}`));
    if (status !== lua.LUA_OK) throw new Error(to_jsstring(lua.lua_tostring(state, -1)));
    lua.lua_setfield(state, -2, to_luastring(basename(file, ".lua")));
  }
  lua.lua_pop(state, 2);

  const source = readFileSync(join("tests/backend", testFile), "utf8");
  let status = lauxlib.luaL_loadbuffer(state, to_luastring(source), null, to_luastring(`@tests/backend/${testFile}`));
  if (status === lua.LUA_OK) status = lua.lua_pcall(state, 0, 0, 0);
  if (status === lua.LUA_OK) console.log(`PASS ${testFile}`);
  else {
    failures += 1;
    console.error(`FAIL ${testFile}: ${to_jsstring(lua.lua_tostring(state, -1))}`);
  }
  lua.lua_close(state);
}
if (failures) process.exitCode = 1;
else console.log(`Lua backend tests passed (${testFiles.length} files)`);
