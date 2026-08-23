local catalog    = require("catalog")
local logger     = require("logger")
local millennium = require("millennium")
local patches    = require("patches")

require("rpc_functions")

local function on_load()
    millennium.ready()
    catalog.initialize()
    logger:info("Loaded with Millennium " .. millennium.version())
end

local function on_frontend_loaded()
    local ok, err = pcall(function() catalog.refresh(false) end)
    if not ok then logger:warn("Automatic catalog refresh failed: " .. tostring(err)) end
end

local function on_unload()
    logger:info("Plugin unloaded")
end

return {
    on_load = on_load,
    on_frontend_loaded = on_frontend_loaded,
    on_unload = on_unload,
    patches = patches.get(),
}
