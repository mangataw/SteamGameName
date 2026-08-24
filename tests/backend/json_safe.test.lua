package.loaded.json = nil
package.preload.json = function()
    return {
        encode = function() return '{"name":"传送门 2","emoji":"🎮"}' end,
        decode = function(value) return value end,
    }
end

package.loaded.json_safe = nil
local json = require("json_safe")
local encoded = json.encode_ascii({})

assert(encoded == '{"name":"\\u4f20\\u9001\\u95e8 2","emoji":"\\ud83c\\udfae"}', "RPC JSON must be ASCII-only")
assert(not encoded:find("[^\0-\127]"), "RPC JSON must not contain non-ASCII bytes")

print("ASCII JSON transport cases passed")
