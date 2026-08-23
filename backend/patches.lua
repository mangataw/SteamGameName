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
                    match = [[(function \w+\((\w+)\)\{let (\w+)=\(0,\w+\.\w+\)\(\(\)=>\{let\{item:\w+\}=\2;return\{display_name:\w+\.display_name,display_name_elanguage:\w+\.display_name_elanguage,display_status:\w+\.display_status,active_beta:\w+\.active_beta,status_percentage:\w+\.status_percentage,remote_item:[^,}]+,update_available_but_disabled_by_app:[^}]+\}\}\),(\w+)=\3\.display_name;\3\.active_beta&&\(\4=\4\+" \["\+\3\.active_beta\+"\]"\);)]],
                    replace = [[\1\4=#{{self}}?.gameNames?.render(\2.item.appid,\4)??\4;]],
                },
            },
        },
    }
end

return patches
