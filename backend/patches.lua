-- Targets the current stable Steam library sidebar name renderer. The find segment
-- includes all display-name fields to avoid matching details, downloads or search UI.
local patches = {}

function patches.get()
    return {
        {
            file = [[chunk~[0-9a-f]+\.js]],
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
                    replace = [[\1\3=\4;\3=\6.active_beta?\3+" ["+\6.active_beta+"]":\3;\3=#{{self}}?.gameNames?.render(\2.item.appid,\4,\6.active_beta)??((e=>e?e+" | "+\3:\3)({"10":"\u53cd\u6050\u7cbe\u82f1","220":"\u534a\u8870\u671f 2","400":"\u4f20\u9001\u95e8","570":"\u5200\u5854 2","620":"\u4f20\u9001\u95e8 2","730":"\u53cd\u6050\u7cbe\u82f1 2","271590":"\u4fa0\u76d7\u730e\u8f66\u624b V"}[String(\2.item.appid)]));]],
                },
            },
        },
    }
end

return patches
