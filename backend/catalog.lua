local cache      = require("cache")
local datetime   = require("datetime")
local http       = require("http")
local json       = require("json_safe")
local logger     = require("logger")
local millennium = require("millennium")
local source     = require("source_config")
local validation = require("validation")

local catalog = {}
local MAX_BYTES = 5 * 1024 * 1024
local current = { schemaVersion = 1, games = {} }
local status = {
    source = "bundled", state = "bundled", entryCount = 0, etag = nil, lastModified = nil,
    lastCheckedAt = nil, lastSuccessfulUpdateAt = nil, error = nil, patchCompatible = false,
}
local metadata = {}
local refreshing = false
local automatically_checked = false

local function iso_now()
    return datetime.format(datetime.now(), "%Y-%m-%dT%H:%M:%SZ", true)
end

local function decode_and_validate(content)
    if type(content) ~= "string" or #content > MAX_BYTES then return nil, "catalog_too_large" end
    if content:sub(1, 3) == "\239\187\191" then return nil, "catalog_bom_forbidden" end
    local decoded, decode_error = json.decode(content)
    if not decoded then return nil, "catalog_json_invalid: " .. tostring(decode_error) end
    local count, validation_error = validation.validate_catalog(decoded)
    if not count then return nil, validation_error end
    return decoded, count
end

local function update_status(source_name, state_name, count, error_message)
    status.source = source_name
    status.state = state_name
    status.entryCount = count
    status.etag = metadata.etag
    status.lastModified = metadata.lastModified
    status.lastCheckedAt = metadata.lastCheckedAt
    status.lastSuccessfulUpdateAt = metadata.lastSuccessfulUpdateAt
    status.error = error_message
end

local function notify_frontend()
    pcall(function() millennium.call_frontend_method("catalogUpdated", {}) end)
end

function catalog.initialize()
    local bundled_content = millennium.assets.read("data/translations.zh-CN.json")
    local bundled, bundled_count = decode_and_validate(bundled_content)
    if not bundled then
        logger:error("Bundled catalog is invalid")
        update_status("bundled", "error", 0, "bundled_catalog_invalid")
        return
    end
    current = bundled
    update_status("bundled", "bundled", bundled_count, nil)

    local stored_metadata = cache.read_json(cache.metadata_path, 64 * 1024)
    metadata = validation.validate_metadata(stored_metadata)
    local cached = cache.read_json(cache.catalog_path, MAX_BYTES)
    if cached then
        local cached_count = validation.validate_catalog(cached)
        if cached_count then
            current = cached
            update_status("cache", "cached", cached_count, nil)
        else logger:warn("Ignoring invalid cached catalog") end
    end
    logger:info(string.format("Loaded %d translations from %s", status.entryCount, status.source))
end

function catalog.get() return current end
function catalog.get_status() return status end
function catalog.mark_patch_compatible()
    status.patchCompatible = true
    return status
end

function catalog.refresh(force)
    if refreshing then return nil, "refresh_in_progress" end
    if not force and automatically_checked then return status end
    if not source.remote_url then
        status.error = "remote_catalog_unconfigured"
        return status
    end
    refreshing = true
    if not force then automatically_checked = true end
    local checked_at = iso_now()
    local headers = { ["Accept"] = "application/json" }
    if metadata.etag then headers["If-None-Match"] = metadata.etag end
    if metadata.lastModified then headers["If-Modified-Since"] = metadata.lastModified end
    local response, request_error = http.get(source.remote_url, {
        headers = headers, timeout = 8, follow_redirects = false, verify_ssl = true,
        user_agent = "steam-game-name-zh/" .. source.version,
    })
    metadata.lastCheckedAt = checked_at
    if not response then
        refreshing = false
        status.lastCheckedAt = checked_at
        status.state = current == nil and "error" or "offline"
        status.error = "catalog_request_failed: " .. tostring(request_error)
        cache.atomic_write_json(cache.metadata_path, metadata)
        return status
    end
    if response.status == 304 then
        refreshing = false
        status.state = "latest"
        status.lastCheckedAt = checked_at
        status.error = nil
        cache.atomic_write_json(cache.metadata_path, metadata)
        return status
    end
    if response.status ~= 200 then
        refreshing = false
        status.lastCheckedAt = checked_at
        status.state = "offline"
        status.error = "remote_http_error: " .. tostring(response.status)
        cache.atomic_write_json(cache.metadata_path, metadata)
        return status
    end
    local decoded, count_or_error = decode_and_validate(response.body)
    if not decoded then
        refreshing = false
        status.lastCheckedAt = checked_at
        status.state = "error"
        status.error = "remote_catalog_invalid: " .. tostring(count_or_error)
        cache.atomic_write_json(cache.metadata_path, metadata)
        return status
    end
    local wrote, write_error = cache.atomic_write_json(cache.catalog_path, decoded, validation.validate_catalog)
    if not wrote then
        refreshing = false
        status.state = "error"
        status.error = "cache_write_failed: " .. tostring(write_error)
        return status
    end
    metadata.etag = response.headers and (response.headers.etag or response.headers.ETag) or nil
    metadata.lastModified = response.headers and (response.headers["last-modified"] or response.headers["Last-Modified"]) or nil
    metadata.lastSuccessfulUpdateAt = checked_at
    metadata.remoteUrl = source.remote_url
    cache.atomic_write_json(cache.metadata_path, metadata)
    current = decoded
    update_status("remote", "latest", count_or_error, nil)
    refreshing = false
    logger:info(string.format("Catalog updated: %d entries", count_or_error))
    notify_frontend()
    return status
end

return catalog
