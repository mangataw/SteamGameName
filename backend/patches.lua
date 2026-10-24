-- Targets the current stable Steam library sidebar. Display-name rendering and
-- text filtering are deliberately separate patches so either feature can fail
-- closed without changing the other one.
local patches = {}

function patches.get()
    return {
        {
            -- Steam Stable historically emitted the library code in a hashed
            -- chunk, while the October 2026 client consolidated it into sp.js.
            -- Keep both layouts so the same package remains usable across the
            -- Stable/Beta rollout boundary; the structural find below still
            -- ensures that unrelated files are never transformed.
            file = [[(?:chunk~[0-9a-f]+|sp)\.js]],
            find = [[function \w+\(\w+\)\{let \w+=\(0,\w+\.\w+\)\(\(\)=>\{let\{item:\w+\}=\w+;return\{display_name:\w+\.display_name,display_name_elanguage:\w+\.display_name_elanguage,display_status:\w+\.display_status,active_beta:\w+\.active_beta,status_percentage:\w+\.status_percentage,remote_item:[^,}]+,update_available_but_disabled_by_app:[^}]+\}\}\),\w+=\w+\.display_name;\w+\.active_beta&&\(\w+=\w+\+" \["\+\w+\.active_beta\+"\]"\);]],
            transforms = {
                {
                    -- Hook patterns use RE2, which does not support backreferences
                    -- inside the match expression. Capture the argument and target
                    -- independently, then use them only in the replacement.
                    match = [[(function \w+\((\w+)\)\{let \w+=\(0,\w+\.\w+\)\(\(\)=>\{let\{item:\w+\}=\w+;return\{display_name:\w+\.display_name,display_name_elanguage:\w+\.display_name_elanguage,display_status:\w+\.display_status,active_beta:\w+\.active_beta,status_percentage:\w+\.status_percentage,remote_item:[^,}]+,update_available_but_disabled_by_app:[^}]+\}\}\),)(\w+)=(\w+\.display_name);((\w+)\.active_beta&&\(\w+=\w+\+" \["\+\w+\.active_beta\+"\]"\);)]],
                    -- Preserve Steam's beta suffix outside the translated base name,
                    -- then replace the final string with the reactive component.
                    -- Steam can render the sidebar before the plugin frontend has
                    -- finished loading. Keep this bootstrap map intentionally small
                    -- and fixed: the complete bundled catalog lives in the frontend
                    -- snapshot and backend asset, so catalog growth never inflates
                    -- the Hooking API replacement string again.
                    replace = [[\1\3=\4;\3=\6.active_beta?\3+" ["+\6.active_beta+"]":\3;\3=#{{self}}?.gameNames?.render(\2.item.appid,\4,\6.active_beta)??((e=>e?e+" | "+\3:\3)({"10":"\u53cd\u6050\u7cbe\u82f1","220":"\u534a\u8870\u671f 2","400":"\u4f20\u9001\u95e8","570":"\u5200\u5854 2","620":"\u4f20\u9001\u95e8 2","730":"\u53cd\u6050\u7cbe\u82f1 2"}[String(\2.item.appid)]));]],
                },
            },
        },
        {
            file = [[(?:chunk~[0-9a-f]+|sp)\.js]],
            -- Match the library AppFilter text-search tail. The AppID and all
            -- original Steam name/sort-name/fuzzy checks are structural signals
            -- that keep this away from store, friends and global search code.
            find = [[String\(\w+\.appid\)==this\.m_filterSpec\.strSearchText\)return!0;let \w+=this\.m_filterSpec\.strSearchText\.toLowerCase\(\),\w+=\w+\.display_name\.toLowerCase\(\);return(?:!\(!\w+\.includes\(\w+\)&&!\w+\.sort_as\.includes\(\w+\)\)\|\|-1!==\w+\(\w+,\w+\)|!!\(\w+\.includes\(\w+\)\|\|\w+\.sort_as\.includes\(\w+\)\|\|\w+\(\w+,\w+\)!==-1\))]],
            transforms = {
                {
                    -- RE2 cannot use backreferences in the match expression, so
                    -- capture the app, query and original result independently.
                    match = [[(String\((\w+)\.appid\)==this\.m_filterSpec\.strSearchText\)return!0;let (\w+)=this\.m_filterSpec\.strSearchText\.toLowerCase\(\),(\w+)=\w+\.display_name\.toLowerCase\(\);return)(!\(!\w+\.includes\(\w+\)&&!\w+\.sort_as\.includes\(\w+\)\)\|\|-1!==\w+\(\w+,\w+\)|!!\(\w+\.includes\(\w+\)\|\|\w+\.sort_as\.includes\(\w+\)\|\|\w+\(\w+,\w+\)!==-1\))]],
                    -- Keep Steam's built-in result authoritative and add only a
                    -- synchronous in-memory Chinese-name match. Missing frontend
                    -- exports evaluate false, which is the safe English-only path.
                    replace = [[\1(\5)||(#{{self}}?.gameSearch?.matches(\2.appid,\3)??!1)]],
                },
            },
        },
    }
end

return patches
