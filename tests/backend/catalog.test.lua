local passed = 0

local function equal(actual, expected, message)
    if actual ~= expected then
        error((message or "values differ") .. ": expected " .. tostring(expected) .. ", got " .. tostring(actual), 2)
    end
end

local function truthy(value, message)
    if not value then error(message or "expected truthy value", 2) end
end

local function test(name, body)
    local ok, failure = pcall(body)
    if not ok then error(name .. ": " .. tostring(failure), 0) end
    passed = passed + 1
end

local bundled = { schemaVersion = 1, games = { ["10"] = "反恐精英" } }
local remote = { schemaVersion = 1, games = { ["20"] = "团队要塞" } }
local invalid = { schemaVersion = 1, games = { bad = "无效" } }

local function install(name, value)
    package.loaded[name] = nil
    package.preload[name] = function() return value end
end

local function load_catalog(options)
    options = options or {}
    local writes, requests, notifications = {}, {}, 0
    local metadata = options.metadata
    local cached = options.cached
    local cache = {
        catalog_path = "catalog.json",
        metadata_path = "metadata.json",
        read_json = function(path)
            if path == "metadata.json" then return metadata end
            return cached
        end,
        atomic_write_json = function(path, value)
            writes[#writes + 1] = { path = path, value = value }
            if path == "catalog.json" and options.write_error then return nil, options.write_error end
            return true
        end,
    }
    local response = options.response
    local request_error = options.request_error
    local http = {
        get = function(url, request_options)
            requests[#requests + 1] = { url = url, options = request_options }
            if options.during_request then options.during_request() end
            return response, request_error
        end,
    }
    install("cache", cache)
    install("datetime", { now = function() return 0 end, format = function() return "2026-08-24T00:00:00Z" end })
    install("http", http)
    install("json_safe", {
        decode = function(content)
            if content == "bundled" then return bundled end
            if content == "remote" then return remote end
            if content == "invalid" then return invalid end
            return nil, "invalid_json"
        end,
    })
    install("logger", { info = function() end, warn = function() end, error = function() end })
    install("millennium", {
        assets = { read = function() return "bundled" end },
        call_frontend_method = function(name)
            equal(name, "catalogUpdated")
            notifications = notifications + 1
        end,
    })
    install("source_config", { remote_url = "https://example.invalid/catalog.json", version = "test" })
    package.loaded.validation = nil
    package.loaded.catalog = nil
    local catalog = require("catalog")
    return catalog, writes, requests, function() return notifications end
end

test("no cache uses bundled catalog", function()
    local catalog = load_catalog()
    catalog.initialize()
    equal(catalog.get_status().source, "bundled")
    equal(catalog.get_status().entryCount, 1)
end)

test("damaged cache is ignored", function()
    local catalog = load_catalog({ cached = { schemaVersion = 1, games = { bad = "无效" } } })
    catalog.initialize()
    equal(catalog.get_status().source, "bundled")
end)

test("remote 200 validates, persists, swaps, and notifies", function()
    local catalog, writes, requests, notification_count = load_catalog({
        metadata = { etag = "old", lastModified = "yesterday" },
        response = { status = 200, body = "remote", headers = { ETag = "new", ["Last-Modified"] = "today" } },
    })
    catalog.initialize()
    local status = catalog.refresh(true)
    equal(status.source, "remote")
    equal(status.entryCount, 1)
    equal(status.etag, "new")
    equal(requests[1].options.headers["If-None-Match"], "old")
    equal(requests[1].options.timeout, 8)
    equal(requests[1].options.verify_ssl, true)
    equal(writes[1].path, "catalog.json")
    equal(notification_count(), 1)
end)

test("remote 304 keeps current catalog", function()
    local catalog = load_catalog({ response = { status = 304, headers = {} } })
    catalog.initialize()
    local before = catalog.get()
    local status = catalog.refresh(true)
    equal(catalog.get(), before)
    equal(status.state, "latest")
    equal(status.error, nil)
end)

for _, failure in ipairs({ "dns_failure", "tls_failure", "timeout" }) do
    test(failure .. " falls back without replacing catalog", function()
        local catalog = load_catalog({ request_error = failure })
        catalog.initialize()
        local before = catalog.get()
        local status = catalog.refresh(true)
        equal(catalog.get(), before)
        equal(status.state, "offline")
        truthy(status.error:find(failure, 1, true))
    end)
end

test("invalid remote data is rejected", function()
    local catalog = load_catalog({ response = { status = 200, body = "invalid", headers = {} } })
    catalog.initialize()
    local before = catalog.get()
    local status = catalog.refresh(true)
    equal(catalog.get(), before)
    equal(status.state, "error")
    truthy(status.error:find("catalog_appid_invalid", 1, true))
end)

test("atomic catalog write failure keeps current catalog", function()
    local catalog = load_catalog({
        response = { status = 200, body = "remote", headers = {} },
        write_error = "disk_full",
    })
    catalog.initialize()
    local before = catalog.get()
    local status = catalog.refresh(true)
    equal(catalog.get(), before)
    equal(status.state, "error")
    truthy(status.error:find("disk_full", 1, true))
end)

test("concurrent refresh is rejected", function()
    local catalog
    local nested_status, nested_error
    catalog = load_catalog({
        response = { status = 304, headers = {} },
        during_request = function() nested_status, nested_error = catalog.refresh(true) end,
    })
    catalog.initialize()
    catalog.refresh(true)
    equal(nested_status, nil)
    equal(nested_error, "refresh_in_progress")
end)

print("catalog backend cases passed: " .. tostring(passed))
