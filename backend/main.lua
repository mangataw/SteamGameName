local catalog    = require("catalog")
local logger     = require("logger")
local millennium = require("millennium")
local patches    = require("patches")

require("rpc_functions")

local function on_load()
    catalog.initialize()
    -- Do not expose the RPC surface until the bundled/cache catalog is ready.
    -- Otherwise the frontend can permanently snapshot the initial empty catalog.
    millennium.ready()
    logger:info("Loaded with Millennium " .. millennium.version())
end

local function on_unload()
    logger:info("Plugin unloaded")
end

return {
    on_load = on_load,
    on_unload = on_unload,
    patches = patches.get(),
}
