local catalog  = require("catalog")
local json     = require("json_safe")
local settings = require("settings")

local function result(data, err)
    local payload = { ok = err == nil, data = data, error = err }
    return json.encode_ascii(payload) or '{"ok":false,"data":null,"error":"json_encode_failed"}'
end

---@ffi
---@return string
function get_catalog() return result(catalog.get()) end

---@ffi
---@return string
function get_catalog_status() return result(catalog.get_status()) end

---@ffi
---@param force boolean
---@return string
function refresh_catalog(force)
    if type(force) ~= "boolean" then return result(nil, "force_must_be_boolean") end
    local data, err = catalog.refresh(force)
    return result(data, err)
end

---@ffi
---@return string
function get_settings() return result(settings.get()) end

---@ffi
---@param mode string
---@return string
function set_display_mode(mode)
    local data, err = settings.set_mode(mode)
    return result(data, err)
end
