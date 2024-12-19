const fs = require("fs");

/*******************************************
 * Change these to match your needs
 *******************************************/

const setup = {
  groups: ["All", "Spot", "Wash", "Shapes", "LED", "Spot2", "Wash2"],
  numberOfColors: 25,
  filledImageStart: 30,
  colorPage: 99,
  macroStart: 100,
};

/*******************************************
 * Generator function
 *******************************************/

function generate() {
  let colorGroups = setup.groups;
  let numberOfColors = setup.numberOfColors;
  let filledStart = setup.filledImageStart;
  let colorPage = setup.colorPage;
  let macroStart = setup.macroStart;

  let startx = 75;
  let starty = -5;
  let filledEnd = filledStart + numberOfColors - 1;
  let unfilledStart = filledEnd + 1;
  let unfilledEnd = unfilledStart + numberOfColors - 1;

  let macros = [];
  let macrolines = [];
  var layoutxml = [];

  //baseImageColorVariables
  macrolines.push(`SetVar FILLEDIMAGES="${filledStart} thru ${filledEnd}"`);
  macrolines.push(
    `SetVar UNFILLEDIMAGES="${unfilledStart} thru ${unfilledEnd}"`
  );

  //color image variables per group
  colorGroups.map(function (groupName, index) {
    macrolines.push(
      `SetVar ${groupName.toUpperCase()}COLORIMAGESTART = ${
        unfilledEnd + 1 + numberOfColors * index
      }`
    );
  });

  //color image variables per color
  let colorStart = unfilledEnd + 1;
  for (let j = 1; j <= numberOfColors; j++) {
    macrolines.push(
      `SetVar C${j} = "${colorGroups
        .map(function (_, index) {
          return unfilledEnd + j + index * numberOfColors;
        })
        .join(" + ")}"`
    );
  }

  macrolines.push(
    `Copy Image $UNFILLEDIMAGES at ${colorGroups
      .map(function (value) {
        return `$${value.toUpperCase()}COLORIMAGESTART /o`;
      })
      .join("; COPY IMAGE $UNFILLEDIMAGES at ")}`
  );

  macros.push(
    `<Macro name="colormacroCreator">${macrolinesAsXML(macrolines)}</Macro>`
  );

  //macro for "all" colors
  for (let j = 1; j <= numberOfColors; j++) {
    macrolines = [];
    index = j - 1;

    macrolines.push(
      `COPY IMAGE $UNFILLEDIMAGES at ${colorGroups
        .map(function (value) {
          return `$${value.toUpperCase()}COLORIMAGESTART /o`;
        })
        .join("; COPY IMAGE $UNFILLEDIMAGES at ")}`
    );

    macrolines.push(`COPY IMAGE ${filledStart + index} AT $C${j} /o`);
    macrolines.push(
      `Goto Cue ${j} exec ${colorPage}.1 thru ${colorPage}.${colorGroups.length}`
    );

    macros.push(
      `<Macro name="ALLC${j}">${macrolinesAsXML(macrolines)}</Macro>`
    );

    layoutxml.push(
      `<LayoutCObject font_size="Small" center_x="${
        startx + index
      }" center_y="${starty}" size_h="1" size_w="1" background_color="3c3c3c" border_color="5a5a5a" icon="None" show_id="1" show_name="1" show_type="1" function_type="Simple" select_group="1" image_size="Fit"><image name=""><No>8</No><No>${
        unfilledEnd + j
      }</No></image><CObject name="ALLC${j}"><No>13</No><No>1</No><No>${++macroStart}</No></CObject></LayoutCObject>`
    );
  }

  //macros for each color per group
  colorGroups
    .filter((_, index) => index > 0)
    .map((key, ind) => {
      for (let j = 1; j <= numberOfColors; j++) {
        macrolines = [];
        index = j - 1;

        macrolines.push(
          `COPY IMAGE $UNFILLEDIMAGES at $${key.toUpperCase()}COLORIMAGESTART /o; COPY IMAGE $UNFILLEDIMAGES at $${colorGroups[0].toUpperCase()}COLORIMAGESTART /o`
        );

        macrolines.push(
          `COPY IMAGE ${filledStart + index} at ${
            colorStart + index + (ind + 1) * numberOfColors
          } /o`
        );

        macrolines.push(`GoTo Cue ${j} exec ${colorPage}.${ind + 1}`);
        macros.push(
          `<Macro name="${key.toUpperCase()}${j}">${macrolinesAsXML(
            macrolines
          )}</Macro>`
        );

        layoutxml.push(
          `<LayoutCObject font_size="Small" center_x="${
            startx + index
          }" center_y="${
            starty + ind + 1
          }" size_h="1" size_w="1" background_color="3c3c3c" border_color="5a5a5a" icon="None" show_id="1" show_name="1" show_type="1" function_type="Simple" select_group="1" image_size="Fit"><image name=""><No>8</No><No>${
            colorStart + index + (ind + 1) * numberOfColors
          }</No></image><CObject name="${key.toUpperCase()}${j}"><No>13</No><No>1</No><No>${++macroStart}</No></CObject></LayoutCObject>`
        );
      }
    });

  write(
    "./colormacros.xml",
    xmlHeader +
      macros
        .map(function (val) {
          return val;
        })
        .join("") +
      xmlEnd
  );

  write(
    "./colorlayout.xml",
    layoutXmlHeader +
      layoutxml
        .map(function (val) {
          return val;
        })
        .join("") +
      layoutXmlEnd
  );
}

/*******************************************
 * Don't change anything below if you don't know what you are doing
 *******************************************/

const xmlHeader =
  '<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.9.60/MA.xsd" major_vers="3" minor_vers="9" stream_vers="60"><Info datetime="2022-09-11T07:52:31" showfile="" />';
const xmlEnd = "</MA>";

const layoutXmlHeader =
  '<?xml version="1.0" encoding="utf-8"?><MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.9.60/MA.xsd" major_vers="3" minor_vers="9" stream_vers="60"><Info datetime="2024-09-03T16:15:49" showfile="simen v24" /><Group index="0" name="colors"><LayoutData index="0" marker_visible="true" background_color="000000" visible_grid_h="0" visible_grid_w="0" snap_grid_h="0.5" snap_grid_w="0.5" default_gauge="Filled &amp; Symbol"subfixture_view_mode="DMX Layer"><CObjects>';
const layoutXmlEnd = "</CObjects></LayoutData></Group></MA>";

function macrolinesAsXML(macrolines) {
  return macrolines
    .map(function (command, index) {
      return `<Macroline index="${index}"><text>${command}</text></Macroline>`;
    })
    .join("");
}

function write(filename, text) {
  fs.writeFile(filename, text + "\n", (err) => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
}

generate();
