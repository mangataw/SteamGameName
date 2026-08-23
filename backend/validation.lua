local validation = {}

local MAX_APP_ID = 4294967295

local function utf8_codepoints(value)
    local points = {}
    local i = 1
    while i <= #value do
        local b1 = value:byte(i)
        local cp, width
        if b1 < 0x80 then cp, width = b1, 1
        elseif b1 >= 0xC2 and b1 <= 0xDF then
            local b2 = value:byte(i + 1)
            if not b2 or b2 < 0x80 or b2 > 0xBF then return nil end
            cp, width = (b1 - 0xC0) * 0x40 + (b2 - 0x80), 2
        elseif b1 >= 0xE0 and b1 <= 0xEF then
            local b2, b3 = value:byte(i + 1), value:byte(i + 2)
            if not b2 or not b3 or b2 < 0x80 or b2 > 0xBF or b3 < 0x80 or b3 > 0xBF then return nil end
            cp, width = (b1 - 0xE0) * 0x1000 + (b2 - 0x80) * 0x40 + (b3 - 0x80), 3
            if cp < 0x800 or (cp >= 0xD800 and cp <= 0xDFFF) then return nil end
        elseif b1 >= 0xF0 and b1 <= 0xF4 then
            local b2, b3, b4 = value:byte(i + 1), value:byte(i + 2), value:byte(i + 3)
            if not b2 or not b3 or not b4 or b2 < 0x80 or b2 > 0xBF or b3 < 0x80 or b3 > 0xBF or b4 < 0x80 or b4 > 0xBF then return nil end
            cp, width = (b1 - 0xF0) * 0x40000 + (b2 - 0x80) * 0x1000 + (b3 - 0x80) * 0x40 + (b4 - 0x80), 4
            if cp < 0x10000 or cp > 0x10FFFF then return nil end
        else return nil end
        points[#points + 1] = cp
        i = i + width
    end
    return points
end

local function is_han(cp)
    return (cp >= 0x3400 and cp <= 0x4DBF)
        or (cp >= 0x4E00 and cp <= 0x9FFF)
        or (cp >= 0xF900 and cp <= 0xFAFF)
        or (cp >= 0x20000 and cp <= 0x2EE5F)
        or (cp >= 0x30000 and cp <= 0x323AF)
end

function validation.valid_translation(value)
    if type(value) ~= "string" or value:match("^%s*$") or value:match("[%z\1-\31\127]") then return false end
    local lower = value:lower()
    if lower:find("<", 1, true) or lower:find(">", 1, true) then return false end
    local points = utf8_codepoints(value)
    if not points then return false end
    for _, cp in ipairs(points) do if is_han(cp) then return true end end
    return false
end

function validation.validate_catalog(catalog)
    if type(catalog) ~= "table" or catalog.schemaVersion ~= 1 or type(catalog.games) ~= "table" then
        return nil, "catalog_schema_invalid"
    end
    local count = 0
    for app_id, name in pairs(catalog.games) do
        if type(app_id) ~= "string" or not app_id:match("^[1-9][0-9]*$") then return nil, "catalog_appid_invalid" end
        local numeric = tonumber(app_id)
        if not numeric or numeric > MAX_APP_ID or math.floor(numeric) ~= numeric then return nil, "catalog_appid_invalid" end
        if not validation.valid_translation(name) then return nil, "catalog_name_invalid" end
        count = count + 1
    end
    return count
end

function validation.validate_metadata(metadata)
    if type(metadata) ~= "table" then return {} end
    local result = {}
    for _, key in ipairs({ "etag", "lastModified", "lastCheckedAt", "lastSuccessfulUpdateAt", "remoteUrl" }) do
        local value = metadata[key]
        if type(value) == "string" and #value <= 2048 and not value:match("[%z\1-\31\127]") then result[key] = value end
    end
    return result
end

return validation

