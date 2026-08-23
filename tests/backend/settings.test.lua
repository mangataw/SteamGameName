local values = {}
package.loaded.millennium = nil
package.preload.millennium = function()
    return {
        config = {
            get = function(key) return values[key] end,
            set = function(key, value) values[key] = value end,
        },
    }
end

package.loaded.settings = nil
local settings = require("settings")
local defaults = settings.get()
assert(defaults.displayMode == "bilingual", "invalid stored setting must fall back")
assert(values.displayMode == "bilingual", "fallback must be persisted")

local updated = settings.set_mode("chinese")
assert(updated.displayMode == "chinese", "valid setting must be applied")

for _, invalid in ipairs({ "", "unknown", 1, false }) do
    local result, err = settings.set_mode(invalid)
    assert(result == nil and err == "display_mode_invalid", "illegal setting must be rejected")
    assert(values.displayMode == "chinese", "illegal setting must not mutate configuration")
end

print("settings backend cases passed")
