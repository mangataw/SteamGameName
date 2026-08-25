local ready_count, initialize_count, log_count = 0, 0, 0
local load_order = {}

local function install(name, value)
    package.loaded[name] = nil
    package.preload[name] = function() return value end
end

install("catalog", {
    initialize = function()
        initialize_count = initialize_count + 1
        load_order[#load_order + 1] = "catalog"
    end,
})
install("logger", {
    info = function() log_count = log_count + 1 end,
    warn = function() error("unexpected warning") end,
})
install("millennium", {
    ready = function()
        ready_count = ready_count + 1
        load_order[#load_order + 1] = "ready"
    end,
    version = function() return "test" end,
})
install("rpc_functions", true)
package.loaded.patches = nil
package.loaded.main = nil

local first = require("main")
assert(type(first.patches) == "table" and #first.patches == 2, "main must expose display and search patches")
first.on_load()
first.on_unload()
assert(ready_count == 1 and initialize_count == 1, "lifecycle callbacks must run once")
assert(load_order[1] == "catalog" and load_order[2] == "ready", "catalog must initialize before frontend RPC is marked ready")
assert(log_count == 2, "load and unload must both be logged")

package.loaded.main = nil
local second = require("main")
assert(second.patches ~= first.patches, "reloading must return a fresh patch list")
assert(#second.patches == 2 and #first.patches == 2, "unload/reload must not accumulate patches")
second.on_unload()
assert(log_count == 3, "reloaded plugin must unload cleanly")

print("lifecycle reload/unload cases passed")
