local cache      = require("cache")
local datetime   = require("datetime")
local http       = require("http")
local json       = require("json").safe
local logger     = require("logger")
local millennium = require("millennium")
local source     = require("source_config")
local validation = require("validation")

local catalog = {}
local MAX_BYTES = 5 * 1024 * 1024
local current = { schemaVersion = 1, games = {} }
local status = {
    source = "bundled", state = "内置", entryCount = 0, etag = nil, lastModified = nil,
    lastCheckedAt = nil, lastSuccessfulUpdateAt = nil, error = nil, patchCompatible = true,
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
        update_status("bundled", "错误", 0, "内置词库无效")
        return
    end
    current = bundled
    update_status("bundled", "内置", bundled_count, nil)

    local stored_metadata = cache.read_json(cache.metadata_path, 64 * 1024)
    metadata = validation.validate_metadata(stored_metadata)
    local cached = cache.read_json(cache.catalog_path, MAX_BYTES)
    if cached then
        local cached_count = validation.validate_catalog(cached)
        if cached_count then
            current = cached
            update_status("cache", "缓存", cached_count, nil)
        else logger:warn("Ignoring invalid cached catalog") end
    end
    logger:info(string.format("Loaded %d translations from %s", status.entryCount, status.source))
end

function catalog.get() return current end
function catalog.get_status() return status end
function catalog.set_patch_compatible(value) status.patchCompatible = value == true end

function catalog.refresh(force)
    if refreshing then return nil, "refresh_in_progress" end
    if not force and automatically_checked then return status end
    if not source.remote_url then
        status.error = "本地构建未配置远程词库地址"
        return status
    end
    refreshing = true
    if not force then automatically_checked = true end
    local checked_at = iso_now()
    local headers = { ["Accept"] = "application/json" }
    if metadata.etag then headers["If-None-Match"] = metadata.etag end
    local response, request_error = http.get(source.remote_url, {
        headers = headers, timeout = 8, follow_redirects = false, verify_ssl = true,
        user_agent = "steam-game-name-zh/" .. source.version,
    })
    metadata.lastCheckedAt = checked_at
    if not response then
        refreshing = false
        status.lastCheckedAt = checked_at
        status.state = current == nil and "错误" or "离线"
        status.error = "词库请求失败: " .. tostring(request_error)
        cache.atomic_write_json(cache.metadata_path, metadata)
        return status
    end
    if response.status == 304 then
        refreshing = false
        status.state = "最新"
        status.lastCheckedAt = checked_at
        status.error = nil
        cache.atomic_write_json(cache.metadata_path, metadata)
        return status
    end
    if response.status ~= 200 then
        refreshing = false
        status.lastCheckedAt = checked_at
        status.state = "离线"
        status.error = "远程服务器返回 HTTP " .. tostring(response.status)
        cache.atomic_write_json(cache.metadata_path, metadata)
        return status
    end
    local decoded, count_or_error = decode_and_validate(response.body)
    if not decoded then
        refreshing = false
        status.lastCheckedAt = checked_at
        status.state = "错误"
        status.error = "远程词库校验失败: " .. tostring(count_or_error)
        cache.atomic_write_json(cache.metadata_path, metadata)
        return status
    end
    local wrote, write_error = cache.atomic_write_json(cache.catalog_path, decoded, validation.validate_catalog)
    if not wrote then
        refreshing = false
        status.state = "错误"
        status.error = "缓存写入失败: " .. tostring(write_error)
        return status
    end
    metadata.etag = response.headers and (response.headers.etag or response.headers.ETag) or nil
    metadata.lastModified = response.headers and (response.headers["last-modified"] or response.headers["Last-Modified"]) or nil
    metadata.lastSuccessfulUpdateAt = checked_at
    metadata.remoteUrl = source.remote_url
    cache.atomic_write_json(cache.metadata_path, metadata)
    current = decoded
    update_status("remote", "最新", count_or_error, nil)
    refreshing = false
    logger:info(string.format("Catalog updated: %d entries", count_or_error))
    notify_frontend()
    return status
end

return catalog

