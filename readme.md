# ColorGeneratorMA3.js

The generator creates a xml containg macros to build up a colorpicker.

The generated macro will build a sequence for each color group, and create cues using recipies. The recipie lines refrences color presets, and allows for use with easy update of groups to change fixture selection for each color group.

To make the color picker in a layout view, with filled and unfilled images the macros to trigger each color sequence will refrence an apperance in the apperance pool, and each apperance refrences the filled and unfilled images importet in the image pool.

The generated macro(s) will take care of the most of the work, but you have to take some manual steps to make everything work.

## How to run it
### Step 1: Generate the color macro
First you'll need to generate the color macor xml.
Edit the `ColorGeneratorMA3V2.js` file according to your needs.

At start of the  generator you'll bee able to specify:
- the number of coloros you want to generate macros for
- the image pool number for the first filled and unfilled image.
- A javascript object with the name of each color group, and the appeareance pool number to use for each of them.

eg:

```
 let numberOfColors = 18;
 let filledImageStart = 1;
 let unfilledImageStart = 26;

 let colorGroups = {
    All : 70,
    Spot : 93,
    Wash1 : 116,
    Beam : 139,
    Wash2: 162,
    LED1: 185,
    LED2: 208
 }
```

### Step 2: Import images
Import the filled and unfilled images starting at the pool item numbers specified in step 1

### Step 3: Create color presets
For the color picker to work, you'll need to create som color presets. The setup macro uses color preset 1 to X (where x is the number of colors you specified) to create the color sequences.

### Step 4: Import the macro in the macro pool
In MA open up the macro pool, and choose an empty pool item. Then chose `edit`, and `import` in the macro editor. In the import menu locate the `ma3colormacros.xml` file, and import.

The file imoports a macro to create user variables, and a macro for each color and group you generated color macros for. The space after the empty pool item should be enough space for them to follow the initial variable macro.

### Step 5: Run the setup macro
By clicking the setup macro the following will be setup for you:
- User vaiables to refrence, and update appearances for macros.
- An apperance will be created and assigned to each color macro.
- A seqence for each color group will be created, and the color presets you created in step 3 will be assigned to the corresponding the que as a recipie line.

### Step 6: Assign groups to each sequence

