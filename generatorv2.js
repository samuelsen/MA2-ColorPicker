/*******************************************
 * Change these to match your needs
 *******************************************/

const setup =
{
    colorPresetStart: 1,
    numberOfColors: 25,
    filledImageStart: 1,
    unfilledImageStart: 26,
    appearanceStart: 101,
    colorpage: 99,
    groups: ['Spot', 'Wash', 'Beam', 'Led'],
    autoCreateColors:
    {
        enabled: true,
        AmountHue: 12,
        AmountSaturation: 2
    }
}

/*******************************************
 * Don't change anything below if you don't know what you are doing
 *******************************************/

const fs = require('fs')
const crypto = require('crypto')

function write(text)
{
    fs.writeFile('./MA3-ColorPicker-Macros.xml', text + "\n", err => {
        if (err) {
          console.error(err)
        }
      })
}

function macroLine(command, name = 'macro') {
    return '<MacroLine Guid="'+crypto.randomUUID()+'"Name="'+ name +'" Command="'+command+'"/>'
}

/*******************************************
 * Generator function
 *******************************************/
function generate()
{
    // Fetch from setup object
    let colorPresetStart = setup.colorPresetStart
    let numberOfColors = setup.numberOfColors
    let filledImageStart = setup.filledImageStart
    let unfilledImageStart = setup.unfilledImageStart
    let appearanceStart = setup.appearanceStart
    let colorpage = setup.colorpage

    // End fetch from setup object

    // setup variables
    let imagePoolRefrenceForApperanceAssignment = "13.2.3."
    let allSequenceName = 'All'
    let seqnamePostfix = "Colors"
    var xml = ''

    /*******************************************
    * Create setup macro
    *******************************************/
    xml += '<Macro name="Setup ColorPicker" Guid="'+crypto.randomUUID()+'">'
    xml += macroLine('ClearAll', 'ClearAll')

    setup.groups.map((key) => {
        xml += macroLine('Store Group \'' + key + '\' /m', 'create color group if it is missing')
    })

    /*******************************************
     * Create layout named "Colors".
     *******************************************/
    xml += macroLine('Store Layout \'Colors\'', 'Create layout for colors')

    /*******************************************
     * Create an "All" sequence with each group
     * as an invidual recipie line in each group.
     *******************************************/
    let seqName = allSequenceName + seqnamePostfix
    xml += macroLine('Store Seq \'' + seqName + '\'', 'Create Sequence for all colors')
    xml += macroLine('Set seq \''+ seqName + '\' Property \'offwhenoverridden\' false', 'Do not off sequenc when overridden')
    xml += macroLine('Store Cue 1 Thru ' + numberOfColors + ' Seq \'' + seqName + '\' /o', 'Create cue for each number of colors')

    setup.groups.map((key, index) => {
        xml += macroLine('Assign Group \'' + key + '\' at seq \'' + seqName + '\' cue 1 thru part 0.' + (index + 1 ), 'Assign each group to seperate recipie line inn \'' + allSequenceName + '\' sequence')
    })

    setup.groups.map((key) => {
        let seqName = key + seqnamePostfix
        xml += macroLine('Store Seq \'' + seqName + '\'', 'Create Sequence for group ', key)
        xml += macroLine('Set seq \''+ seqName + '\' Property \'offwhenoverridden\' false', 'Do not off sequence when overridden')
        xml += macroLine('Store Cue 1 Thru ' + numberOfColors + ' Seq \'' + seqName + '\' /o', 'Create cue for each number of colors')
        xml += macroLine('Assign Group \'' + key + '\' at seq \'' + seqName + '\' cue 1 thru part 0.1', 'Assign group at preset line 1 for each cue')
    })

    /*******************************************
     * Assign color preset to recipie line in
     * each color sequence.
     *******************************************/

    // add "all" to the list of groups
    let groups = [allSequenceName].concat(setup.groups)

    // for number of colors assign preset number to recipieline
    for (let j = 0; j < numberOfColors; j++)
    {
        xml += macroLine('SetVar A' + j + ' \'' + groups.map( function(_, index){ return ((index * numberOfColors) + appearanceStart + j) }).join(" + ") + '\'', 'Colorvariable A'+j)
    }
    xml += '</Macro>'

    /*******************************************
     * Create macros to trigger color cues
     *******************************************/

    // Macros for "All" sequence
    groups.filter((_, index) => index === 0).map((key) => {
        let seqName = key + seqnamePostfix
        for(let j = 0; j < numberOfColors; j++) {
            let macroName = key + ' ' + (j + 1)
            xml += '<Macro name="' + macroName +'">'
            let setUnfilled = ''
            for (k = 0; k < numberOfColors; k++){
                setUnfilled += 'Set Appearance $A' + k + ' Property Appearance \'' + imagePoolRefrenceForApperanceAssignment + (k + unfilledImageStart) + '\';'
            }
            xml += macroLine(setUnfilled, 'Set unfilled')
            xml += macroLine('Set Appearance $A' + j + ' Property Appearance \'' + imagePoolRefrenceForApperanceAssignment + (j + filledImageStart) + '\'', 'Set filled')
            xml += macroLine('GoTo Cue ' + (j+1) + ' Seq \'' + seqName + '\'', 'Go to cue')
            xml += '</Macro>'
        }
    })

    // Macros for each group
    groups.filter((_, index) => index > 0).map((key, index) => {
        let seqName = key + seqnamePostfix
        let appearancePoolItem = ((index+1) * numberOfColors) + appearanceStart

        for(let j = 0; j < numberOfColors; j++) {
            let macroName = key + ' ' + (j + 1)
            xml += '<Macro name="' + macroName + '" Guid="'+crypto.randomUUID()+'">'
            let setUnfilled = ''
            for (k = 0; k < numberOfColors; k++){
                // set all colors unfilled
                setUnfilled += 'Set Appearance ' + (appearanceStart + k) + ' Property Appearance \'' + imagePoolRefrenceForApperanceAssignment + (k + unfilledImageStart) + '\';'

                // set current group colors unfilled
                setUnfilled += 'Set Appearance ' + (appearancePoolItem + k) + ' Property Appearance \'' + imagePoolRefrenceForApperanceAssignment + (k + unfilledImageStart) + '\';'
            }
            xml += macroLine(setUnfilled, 'Set unfilled')
            xml += macroLine('Set Appearance ' + (appearancePoolItem + j) + ' Property Appearance \'' + imagePoolRefrenceForApperanceAssignment + (j + filledImageStart) + '\'', 'Set filled')
            xml += macroLine('GoTo Cue ' + (j+1) + ' Seq \'' + seqName + '\'', 'Go to cue')
            xml += '</Macro>'

        }
    })

    // write everything
    write('<?xml version="1.0" encoding="UTF-8"?><GMA3 DataVersion="1.9.7.0">' + xml + "</GMA3>")
}

generate()
