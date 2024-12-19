local function Exec(t)
    if (type(t) ~= 'table') then t = {t} end
    for _, c in ipairs(t) do gma.cmd(c) end
end

function AddGroups(a, index)
    local g = gma.textinput('Input group number (leave blank to end)', '')
    if g == '' then
        return a
    else
        a[index] = g
        return AddGroups(a, index + 1)
    end
end

function GetGroupName(groupNumber)
    local handle = gma.show.getobj.handle('group ' .. groupNumber)
    return gma.show.getobj.label(handle)
end

function LayoutPoolItemString(x, y, imageNumber, macronumber)

    gma.echo('x:' .. x)
    gma.echo('y:' .. y)
    gma.echo('imageNumber:' .. imageNumber)
    gma.echo('macronumber:' .. macronumber)

    return string.format(
        '<LayoutCObject font_size="Small" center_x="%d" center_y="%d" size_h="1" size_w="1" background_color="3c3c3c" border_color="5a5a5a" icon="None" show_id="1" show_name="1" show_type="1" function_type="Simple" select_group="1" image_size="Fit"><image name=""><No>8</No><No>%d</No></image><CObject><No>13</No><No>1</No><No>%d</No></CObject></LayoutCObject>',
      x,
      y,
      imageNumber,
      macronumber
    )
end

function CreateColorMacrosAndSequences()

    local generate = gma.gui.confirm("Colorgrid generator",
                                     "This plugin will generate what you need to make a colorgrid selector for ma2. \n It will prompt you to input at what colorpreset pool item to start from, \n the number of colors, what executorpage that should be used for sequences, \n what macro to start storing at and where the images starts from. \n\n Before running this plugin you should first create a set of filled and unfilled images. \n Import them at starting from the location you input into the plugin. \n\n Do you want to continue?")

    if not generate then return end

    -- inputs from user
    local numberOfColors = math.floor(gma.textinput('input number of colors', '25'))
    local colorpresetStart = math.floor(gma.textinput('Input poolnumber for first color preset', 1))
    local filledImageStart = math.floor(gma.textinput('image start position', 32))
    local colorPage = math.floor(gma.textinput('pagenumber for color executors', 99))
    local macroStartPosition = math.floor(gma.textinput('macro start', '500'))
    local colorViewName = gma.textinput('Color view name', 'Colors')

    -- calculated variables
    local startx = 0;
    local starty = 0;
    local clayoutxml = ''
    local filledEnd = filledImageStart + numberOfColors - 1
    local unfilledStart = filledEnd + 1
    local unfilledEnd = unfilledStart + numberOfColors - 1

    local groups = {}
    AddGroups(groups, 1)

    if #groups == 0 then
        gma.gui.msgbox("No groups",
                       "You need to input at least one group for this plugin to work")
        return
    end

    -- Set vars
    gma.show.setvar("FILLEDIMAGES", filledImageStart .. ' thru ' .. filledEnd)
    gma.show.setvar("UNFILLEDIMAGES", unfilledStart .. ' thru ' .. unfilledEnd)

    -- Create group image start variables
    gma.show.setvar("G0IMAGESTART", unfilledEnd + 1)

    for i = 1, #groups do
        gma.show.setvar("G" .. i .. "IMAGESTART",
                        unfilledEnd + 1 + numberOfColors * i)
        gma.cmd("Copy Image $UNFILLEDIMAGES at $G" .. i .. "IMAGESTART /o")
    end

    -- For all colors and for each group
    for i = 1, numberOfColors do
        local groupStart = unfilledEnd + i
        for j = 1, #groups do
            groupStart = groupStart .. ' + ' .. unfilledEnd + i + j *
                             numberOfColors
        end
        gma.show.setvar("CO" .. i, groupStart)
    end

    Exec({
        "Delete page " .. colorPage,
        "Store page " .. colorPage .. " Colors",
        "Delete layout " .. colorViewName,
        "Store layout " .. colorViewName
    })

    -- Create colormacros, colorsequences
    for i = 1, numberOfColors do
        local macroLocation = macroStartPosition - 1 + i
        local macroExists = gma.show.getobj.handle('Macro ' .. macroLocation)
        if (macroExists) then gma.cmd("Delete macro 1." .. macroLocation) end

        Exec({
            "Store macro " .. macroLocation .. "AllC" .. i .. " /o",
            "Store macro 1." .. macroLocation .. ".1 \"GoTo Cue " .. i .. " exec " .. colorPage .. ".1 thru " .. colorPage .. "." .. #groups .. " /o\"",
            "Store macro 1." .. macroLocation .. ".2 \"Copy Image $UNFILLEDIMAGES at $G0IMAGESTART /o\""
        })

        clayoutxml = clayoutxml .. LayoutPoolItemString((startx + i), starty, (unfilledEnd + i), macroLocation)

        for group = 1, #groups do
            local groupname = GetGroupName(groups[group])
            Exec("Store macro 1." .. macroLocation .. "." .. group + 2 .. " \"Copy Image $UNFILLEDIMAGES at $G" .. group .. "IMAGESTART /o\"")

            -- Create sequence for group
            if i == 1 then
                Exec("Store exec " .. colorPage .. "." .. group .. "\"" .. groupname .. " C" .. i .. "\" /o")
            end

            Exec({
                "Group " .. groups[group] .. " At Preset 4." .. colorpresetStart - 1 + i,
                "Store cue " .. i .. " exec " .. colorPage .. "." .. group .. "\"" .. groupname .. " C" .. i .. "\"  /o",
                "ClearAll"
            })

            -- Create color macro for group
            local groupMacroLocation = macroLocation + numberOfColors * group
            local macroExists = gma.show.getobj.handle('Macro ' .. groupMacroLocation)
            if (macroExists) then
                Exec("Delete macro 1." .. groupMacroLocation)
            end

            Exec({
                "Store macro " .. groupMacroLocation .. " \"" .. groupname .. " C" .. i .. "\" /o",
                "Store macro 1." .. groupMacroLocation .. ".1 \"GoTo Cue " .. i .. " exec " .. colorPage .. "." .. group .. " /o\"",
                "Store macro 1." .. groupMacroLocation .. ".2 \"Copy Image $UNFILLEDIMAGES at $G0IMAGESTART /o; Copy Image $UNFILLEDIMAGES at $G" .. group .. "IMAGESTART /o\"",
                "Store macro 1." .. groupMacroLocation .. ".3 \"Copy Image " .. filledImageStart - 1 + i .. " at " .. unfilledEnd + i + numberOfColors * group .. " /o\""
            })
            clayoutxml = clayoutxml .. LayoutPoolItemString((startx + i), (starty + group), (unfilledEnd + i + numberOfColors * group), groupMacroLocation)
        end

        Exec("Store macro 1." .. macroLocation .. "." .. #groups + 3 .. " \"Copy Image " .. filledImageStart - 1 + i .. " at $CO" .. i .. " /o\"")
    end

    Exec({
        'Store Layout ' .. colorViewName .. ' /nc',
        'Export Layout ' .. colorViewName .. ' "_color_layout_temp.xml" /nc'
    })

    local fh = io.open('importexport/_color_layout_temp.xml');
    local xml = fh:read('*all'); fh:close();
    xml = xml:gsub('<LayoutData([^\n]+) />', '<LayoutData%1>\n\t</LayoutData>');

    xml = xml:gsub('</LayoutData>', '<CObjects>' .. clayoutxml .. '\n\t</CObjects></LayoutData>')
    local fh = io.open('importexport/_color_layout_temp.xml', 'w');
    fh:write(xml);
    fh:close();

    Exec({
        'Import "_color_layout_temp.xml" At Layout ' .. colorViewName .. ' /nc',
        'Layout ' .. colorViewName
    });

    gma.gui.msgbox('Completed', 'Colorselector generated for ' .. #groups .. ' groups')

end

return CreateColorMacrosAndSequences
