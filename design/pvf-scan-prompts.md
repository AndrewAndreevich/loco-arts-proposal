# PVF Scan presentation: image prompts

Generated in Tripo Studio (Image) through the `tripo-image` skill.

## 1. Icon sheet for the tutorial (one image, cut into 15 icons)

Input image: `icons_sketch.png` (the layout sketch, 5 × 3 cells, same order).
Model: GPT Image 2, aspect 16:9.

```
Redraw this sketch as one finished icon sheet: 5 columns × 3 rows on a pure black background, 15 separate icons, each centred in its own equal cell with generous empty space around it, nothing crossing into a neighbouring cell. No text, no numbers, no labels, no grid lines, no frames around the cells.
One consistent style for all 15: clean minimal line icons with even 2-pixel rounded white strokes and a single accent colour, green #00923B, used for one detail in each icon. Flat, geometric, friendly, like the brand of a contemporary art park. No gradients, no shadows, no 3D shading, no photo realism.
Keep the order and meaning of the sketch exactly:
Row 1, scanning a flat artwork (2D): 1) a painting on an easel lit by two lamps at 45 degrees, a small colour checker card beside it; 2) a camera held parallel to a painting, the painting covered by a grid of overlapping dashed frames; 3) upload: an arrow rising from a laptop into a cloud; 4) overnight processing: a crescent moon above a progress bar; 5) a web page showing a painting with a magnifying glass zooming into the brushstrokes.
Row 2, scanning a sculpture (2D → 3D): 6) a sculpture on a turntable with soft lights around it; 7) a camera orbiting a sculpture along two dotted rings at different heights; 8) upload: an arrow rising from a laptop into a cloud; 9) a cloud of dots turning into a solid 3D sculpture; 10) a web page with a 3D sculpture and a circular 360-degree arrow around it.
Row 3, progress and storage: 11) three copies of the same painting stacked one behind another, like stages; 12) two overlapping frames aligned with crosshair registration marks; 13) a painting with a timeline slider underneath; 14) a cloud with a globe, content delivered worldwide; 15) a small house containing a computer tower and a storage box with drives.
```

## 2. Reference artwork for the "phone photo vs PVF Scan" comparison

No input image. Model: Nano Banana Pro, aspect 4:3, 4K (the loupes zoom into it).
The "phone photo" side is made from the same image on the page (angle, softness, glare).

```
A straight-on orthographic museum-grade scan of an original contemporary abstract oil painting. The canvas fills the entire image edge to edge: no frame, no wall, no shadow, no perspective, perfectly flat and square to the camera.
Bold organic shapes in ultramarine blue, vermilion, ochre yellow, deep green and warm off-white, overlapping like a lively composition. Thick impasto brushstrokes and palette-knife ridges you can almost touch, visible linen canvas weave in the thinner areas, fine craquelure in the white, a few small drips, and a small hand-written signature in the lower right corner.
Even, diffuse museum lighting: no glare, no reflections, no hot spots, true colours. Extremely sharp from corner to corner, ultra detailed, high resolution.
```

## 3. The same painting as an ordinary camera photo (left side of the comparison)

Input image: the reference artwork from prompt 2 (downscaled to 2048 px). Model: Nano Banana Pro.

```
A casual photo of this exact painting taken with an ordinary camera by a gallery assistant. The same painting, same shapes and colours, hangs on a white gallery wall in a thin light wooden frame, with some wall visible around it. The camera is handheld, a little to the left of the painting and slightly below its centre, so the painting is seen at an angle: clear perspective, the right edge looks smaller than the left, the frame is not square to the image, slight barrel lens distortion. Light from ceiling spotlights: uneven brightness, a soft glare patch on the upper right of the paint surface, one corner a bit darker. Slightly soft focus, a little camera noise, colours a bit washed out compared to the original, ordinary white balance. A realistic documentation snapshot, not a professional reproduction. No people, no text.
```

## 4. Park map from the real satellite photo (Park and halls)

Input: Esri World Imagery around 84 David Guramishvili Avenue, Tbilisi (41.7787, 44.7936; bbox 44.7895–44.7990, 41.7740–41.7815), cropped to the buildings and the green area. Model: Nano Banana Pro, 16:9.

```
Re-render this exact satellite photo as a premium 3D map visual of an art park, the kind shown in a high-end museum or architecture presentation. Keep every building, roof, path, tree, field and road exactly where it is in the photo, with the same layout and proportions; only make it more beautiful and readable. Seen from above with a gentle oblique tilt and subtle depth, like a crisp 3D scan of the place. Soft golden-hour light with long gentle shadows, clean roofs, rich green trees, tidy paths, slight tilt-shift on the far edges. Add a minimal navigation layer: small round glowing lime-green location pins above the main buildings and at a few spots in the green park, and one thin dotted lime-green walking route that follows the existing paths. The edges of the scan fade softly into a dark background. Elegant, calm, premium. No text, no labels, no logos, no people, no cars.
```

## 5. A hall from show to show (3 images, the same room)

First image from the prompt; the other two from the first image as input. Model: Nano Banana Pro, 16:9.

```
A photoreal view of a 3D scan (Gaussian Splatting) of a contemporary art exhibition hall inside a converted Soviet-era industrial building: white walls, polished concrete floor, exposed steel roof beams with track lights. Wide-angle view from the entrance, eye level, the whole room visible. The exhibition: large colourful abstract paintings in vermilion, ochre yellow and ultramarine on the walls, and one soft fabric sculpture on the floor in the middle. Very slightly soft edges like a high-quality 3D scan. No people, no text, no logos.
```

```
The same hall, exactly the same room, camera position and lens: same walls, floor, ceiling, steel beams and track lights. Only the exhibition is different: large black-and-white photographs in thin black frames along the walls, and a tall green neon light installation standing in the middle of the floor. Keep the same 3D scan look. No people, no text, no logos.
```

```
The same hall, exactly the same room, camera position and lens: same floor, ceiling, steel beams and track lights. Only the exhibition is different: the walls are painted deep night blue, living plants stand in groups on the floor, glowing white spheres hang from the beams, and a video projection of water fills the back wall. Keep the same 3D scan look. No people, no text, no logos.
```

## 6. A studio from artist to artist (3 images, the same room)

```
A photoreal view of a 3D scan (Gaussian Splatting) of an empty artist studio in a converted industrial building: whitewashed brick walls, two large steel factory windows with soft daylight, worn concrete floor, a small sink in the corner, nothing else in the room. Wide-angle view from the door, eye level, the whole room visible. Very slightly soft edges like a high-quality 3D scan. No people, no text, no logos.
```

```
The same studio, exactly the same room, camera position and lens: same brick walls, windows, floor and sink. Now a painter lives and works here: several easels with large canvases in progress, more canvases leaning against the walls, a long table covered with paint tubes and brushes, paint stains on the floor. Keep the same 3D scan look. No people, no text, no logos.
```

```
The same studio, exactly the same room, camera position and lens: same brick walls, windows, floor and sink. Now a sculptor lives and works here: wooden plinths with white plaster and grey clay sculptures, a workbench with tools, sacks of plaster, a thin layer of white dust on the floor. Keep the same 3D scan look. No people, no text, no logos.
```
