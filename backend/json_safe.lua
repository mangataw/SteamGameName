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

local function ascii_json(encoded)
    local output, i = {}, 1
    while i <= #encoded do
        local first = encoded:byte(i)
        if first < 0x80 then
            output[#output + 1] = string.char(first)
            i = i + 1
        else
            local codepoint, width
            if first >= 0xC2 and first <= 0xDF then
                local second = encoded:byte(i + 1)
                if second and second >= 0x80 and second <= 0xBF then
                    codepoint, width = (first - 0xC0) * 0x40 + second - 0x80, 2
                end
            elseif first >= 0xE0 and first <= 0xEF then
                local second, third = encoded:byte(i + 1), encoded:byte(i + 2)
                if second and third and second >= 0x80 and second <= 0xBF and third >= 0x80 and third <= 0xBF then
                    codepoint, width = (first - 0xE0) * 0x1000 + (second - 0x80) * 0x40 + third - 0x80, 3
                end
            elseif first >= 0xF0 and first <= 0xF4 then
                local second, third, fourth = encoded:byte(i + 1), encoded:byte(i + 2), encoded:byte(i + 3)
                if second and third and fourth and second >= 0x80 and second <= 0xBF
                    and third >= 0x80 and third <= 0xBF and fourth >= 0x80 and fourth <= 0xBF then
                    codepoint = (first - 0xF0) * 0x40000 + (second - 0x80) * 0x1000
                        + (third - 0x80) * 0x40 + fourth - 0x80
                    width = 4
                end
            end
            if not codepoint then
                output[#output + 1] = "\\ufffd"
                i = i + 1
            elseif codepoint <= 0xFFFF then
                output[#output + 1] = string.format("\\u%04x", codepoint)
                i = i + width
            else
                local value = codepoint - 0x10000
                local high = 0xD800 + math.floor(value / 0x400)
                local low = 0xDC00 + value % 0x400
                output[#output + 1] = string.format("\\u%04x\\u%04x", high, low)
                i = i + width
            end
        end
    end
    return table.concat(output)
end

function json_safe.encode_ascii(value)
    local encoded, encode_error = json_safe.encode(value)
    if not encoded then return nil, encode_error end
    return ascii_json(encoded)
end

function json_safe.decode(value)
    return call(cjson.decode, value)
end

return json_safe
