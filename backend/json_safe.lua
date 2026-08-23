-- Millennium v3.4 exposes the regular cjson-compatible module as "json".
-- Some builds do not attach the documented `.safe` table, so provide the
-- nil/error contract locally without depending on that optional field.
local cjson = require("json")

local json_safe = {}

local function call(method, value)
    local ok, result = pcall(method, value)
    if ok then return result end
    return nil, tostring(result)
end

function json_safe.encode(value)
    return call(cjson.encode, value)
end

function json_safe.decode(value)
    return call(cjson.decode, value)
end

return json_safe
