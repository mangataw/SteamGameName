local fs         = require("fs")
local json       = require("json_safe")
local millennium = require("millennium")

local cache = {}
local root = fs.join(millennium.steam_path(), "ext", "data", "cache", "steam-game-name-zh")

cache.catalog_path = fs.join(root, "catalog.json")
cache.metadata_path = fs.join(root, "metadata.json")

local function read_text(path, max_size)
    if not fs.is_file(path) then return nil, "not_found" end
    local size, size_error = fs.file_size(path)
    if not size then return nil, size_error end
    if size > max_size then return nil, "file_too_large" end
    local handle, open_error = io.open(path, "rb")
    if not handle then return nil, open_error end
    local content = handle:read("*a")
    handle:close()
    return content
end

function cache.read_json(path, max_size)
    local content, read_error = read_text(path, max_size)
    if not content then return nil, read_error end
    if content:sub(1, 3) == "\239\187\191" then return nil, "utf8_bom_forbidden" end
    return json.decode(content)
end

function cache.atomic_write_json(path, value, verifier)
    local ok, directory_error = fs.create_directories(root)
    if not ok and not fs.is_directory(root) then return nil, directory_error end
    local encoded, encode_error = json.encode(value)
    if not encoded then return nil, encode_error end
    local temporary = path .. ".tmp"
    local handle, open_error = io.open(temporary, "wb")
    if not handle then return nil, open_error end
    local wrote, write_error = handle:write(encoded)
    if wrote then handle:flush() end
    handle:close()
    if not wrote then fs.remove(temporary); return nil, write_error end
    local decoded, decode_error = cache.read_json(temporary, 5 * 1024 * 1024)
    if not decoded then fs.remove(temporary); return nil, decode_error end
    if verifier then
        local verified, verify_error = verifier(decoded)
        if not verified then fs.remove(temporary); return nil, verify_error end
    end
    local backup = path .. ".bak"
    if fs.is_file(backup) then fs.remove(backup) end
    if fs.is_file(path) then
        local moved, move_error = fs.rename(path, backup, false)
        if not moved then fs.remove(temporary); return nil, move_error end
    end
    local replaced, replace_error = fs.rename(temporary, path, false)
    if not replaced then
        if fs.is_file(backup) then fs.rename(backup, path, false) end
        fs.remove(temporary)
        return nil, replace_error
    end
    if fs.is_file(backup) then fs.remove(backup) end
    return true
end

return cache
