# Shape Detector

> Shape/gesture/stroke detection/recognition algorithm based on the $1 (dollar) Recognizer

Shape Detector is a refactored version of the [$1 (dollar) Recognizer](http://depts.washington.edu/aimgroup/proj/dollar) without the protractor and with a few other tweaks. It's available as a module which can be used client side and with Node.js. 

## Usage

Install using bower: `bower install shape-detector`  
Or using npm: `npm install shape-detector`  
Or just by downloading the [tarball](https://github.com/MathieuLoutre/shape-detector/archive/master.zip)

```js

	var detector = new ShapeDetector(ShapeDetector.defaultShapes)
	var stroke = [{ x: 127, y: 141 }, { x: 124, y: 140 }, { x: 120, y: 139 }, { x: 118, y: 139 }, { x: 116, y: 139 }, { x: 111, y: 140 }, { x: 109, y: 141 }, { x: 104, y: 144 }, { x: 100, y: 147 }, { x: 96, y: 152 }, { x: 93, y: 157 }, { x: 90, y: 163 }, { x: 87, y: 169 }, { x: 85, y: 175 }, { x: 83, y: 181 }, { x: 82, y: 190 }, { x: 82, y: 195 }, { x: 83, y: 200 }, { x: 84, y: 205 }, { x: 88, y: 213 }, { x: 91, y: 216 }, { x: 96, y: 219 }, { x: 103, y: 222 }, { x: 108, y: 224 }, { x: 111, y: 224 }, { x: 120, y: 224 }, { x: 133, y: 223 }, { x: 142, y: 222 }, { x: 152, y: 218 }, { x: 160, y: 214 }, { x: 167, y: 210 }, { x: 173, y: 204 }, { x: 178, y: 198 }, { x: 179, y: 196 }, { x: 182, y: 188 }, { x: 182, y: 177 }, { x: 178, y: 167 }, { x: 170, y: 150 }, { x: 163, y: 138 }, { x: 152, y: 130 }, { x: 143, y: 129 }, { x: 140, y: 131 }, { x: 129, y: 136 }, { x: 126, y: 139 }]
	detector.spot(stroke) // returns circle

	// You can also specify what you're looking for
	detector.spot(stroke, 'triangle') // returns null as the circle doesn't match the triangle

	// The detector can also learn new shapes
	stroke = [{ x: 307, y: 216 }, { x: 333, y: 186 }, { x: 356, y: 215 }, { x: 375, y: 186 }, { x: 399, y: 216 }, { x: 418, y: 186 }]
	detector.learn('zig-zag', stroke)

	// Name lookup is done with indexOf so you can make "groups" of shapes
	detector.lean('zig-zag 2', stroke)

	detector.spot(stroke, 'zig-zag') // will look for both circle and circle 2 and return the closest

	// ShapeDetector can also take options
	// nbSamplePoints is 64 by default and potentially improves accuracy
	// threshold by default is 0, a higher number will be less forgiving of wonky shapes
	detector = ShapeDetector(ShapeDetector.defaultShapes, { nbSamplePoints: 128, threshold: 0.8 })

```

## TODO

- Testing
- Integrate $P

## Changelog

- 0.2.0 - First release