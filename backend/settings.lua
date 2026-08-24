local millennium = require("millennium")

local settings = {}
local allowed = { bilingual = true, chinese = true }

function settings.get()
    local mode = millennium.config.get("displayMode")
    -- v0.1.6 exposed an "original" mode that is no longer part of the core
    -- feature. Treat it like any invalid legacy value and persist the default.
    if not allowed[mode] then
        mode = "bilingual"
        millennium.config.set("displayMode", mode)
    end
    return { schemaVersion = 1, displayMode = mode }
end

function settings.set_mode(mode)
    if type(mode) ~= "string" or not allowed[mode] then return nil, "display_mode_invalid" end
    millennium.config.set("displayMode", mode)
    return settings.get()
end

return settings
