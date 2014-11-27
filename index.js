(function (root, factory) {
	
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} 
	else if (typeof module !== "undefined" && module.exports) {
		module.exports = factory();
	} 
	else {
		root.ShapeDetector = factory();
	}
}(this, function () {

	var _nbSamplePoints;
	var _squareSize = 250;
	var _phi = 0.5 * (-1.0 + Math.sqrt(5.0));
	var _angleRange = deg2Rad(45.0);
	var _anglePrecision = deg2Rad(2.0);
	var _halfDiagonal = Math.sqrt(_squareSize * _squareSize + _squareSize * _squareSize) * 0.5;
	var _origin = { x: 0, y: 0 };

	function deg2Rad (d) {

		return d * Math.PI / 180.0;
	};

	function distance (a, b) {

		var dx = b.x - a.x;
		var dy = b.y - a.y;

		return Math.sqrt(dx * dx + dy * dy);
	};

	function Stroke (points, name) {

		this.points = points;
		this.name = name;
		this.processStroke();
	}

	Stroke.prototype.processStroke = function () {

		this.points = this.resample();
		this.setCentroid();
		this.points = this.rotateBy(-this.indicativeAngle());
		this.points = this.scaleToSquare();
		this.setCentroid();
		this.points = this.translateToOrigin();
		
		return this;
	};

	Stroke.prototype.resample = function () {

		var localDistance, q;
		var interval = this.strokeLength() / (_nbSamplePoints - 1);
		var distance = 0.0;
		var newPoints = [this.points[0]];

		for (var i = 1; i < this.points.length; i++) {
			localDistance = this.distance(i);

			if (distance + localDistance >= interval) {
				q = {
					x: this.points[i - 1].x + ((interval - distance) / localDistance) * (this.points[i].x - this.points[i - 1].x),
					y: this.points[i - 1].y + ((interval - distance) / localDistance) * (this.points[i].y - this.points[i - 1].y)
				};

				newPoints.push(q);
				this.points.splice(i, 0, q);
				distance = 0.0;
			} 
			else {
				distance += localDistance;
			}
		}
		
		if (newPoints.length === _nbSamplePoints - 1) {
			newPoints.push(this.points[this.points.length - 1]);
		}
		
		return newPoints;
	};

	Stroke.prototype.rotateBy = function (angle) {

		var point;
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		var newPoints = [];
		
		for (var i = 0; i < this.points.length; i++) {
			point = this.points[i];

			newPoints.push({
				x: (point.x - this.c.x) * cos - (point.y - this.c.y) * sin + this.c.x,
				y: (point.x - this.c.x) * sin + (point.y - this.c.y) * cos + this.c.y
			});
		}

		return newPoints;
	};

	Stroke.prototype.scaleToSquare = function () {

		var point;
		var newPoints = []
		var box = {
			minX: +Infinity,
			maxX: -Infinity,
			minY: +Infinity,
			maxY: -Infinity
		};

		for (var i = 0; i < this.points.length; i++) {
			point = this.points[i];
			
			box.minX = Math.min(box.minX, point.x);
			box.minY = Math.min(box.minY, point.y);
			box.maxX = Math.max(box.minX, point.x);
			box.maxY = Math.max(box.minY, point.y);
		}

		box.width = box.maxX - box.minX;
		box.height = box.maxY - box.minY;

		for (i = 0; i < this.points.length; i++) {
			point = this.points[i];

			newPoints.push({
				x: point.x * (_squareSize / box.width),
				y: point.y * (_squareSize / box.height)
			});
		}

		return newPoints;
	};

	Stroke.prototype.translateToOrigin = function (points) {

		var point;
		var newPoints = [];
		
		for (var i = 0; i < this.points.length; i++) {
			point = this.points[i];
		
			newPoints.push({
				x: point.x + _origin.x - this.c.x,
				y: point.y + _origin.y - this.c.y
			});
		}

		return newPoints;
	};

	Stroke.prototype.setCentroid = function () {
		
		var point;
		this.c = {
			x: 0.0,
			y: 0.0
		};

		for (var i = 0; i < this.points.length; i++) {
			point = this.points[i];

			this.c.x += point.x;
			this.c.y += point.y;
		}

		this.c.x /= this.points.length;
		this.c.y /= this.points.length;
		
		return this;
	};

	Stroke.prototype.indicativeAngle = function () {

		return Math.atan2(this.c.y - this.points[0].y, this.c.y - this.points[0].y);
	};

	Stroke.prototype.strokeLength = function () {
		
		var d = 0.0;

		for (var i = 1; i < this.points.length; i++) {
			d += this.distance(i);
		}

		return d;
	};

	Stroke.prototype.distance = function (i) {

		return distance(this.points[i], this.points[i - 1]);
	};

	Stroke.prototype.distanceAtBestAngle = function (pattern) {
		
		var a = -_angleRange;
		var b = _angleRange;
		var x1 = _phi * a + (1.0 - _phi) * b;
		var f1 = this.distanceAtAngle(pattern, x1);
		var x2 = (1.0 - _phi) * a + _phi * b;
		var f2 = this.distanceAtAngle(pattern, x2);

		while (Math.abs(b - a) > _anglePrecision) {
			
			if (f1 < f2) {
				b = x2;
				x2 = x1;
				f2 = f1;
				x1 = _phi * a + (1.0 - _phi) * b;
				f1 = this.distanceAtAngle(pattern, x1);
			} 
			else {
				a = x1;
				x1 = x2;
				f1 = f2;
				x2 = (1.0 - _phi) * a + _phi * b;
				f2 = this.distanceAtAngle(pattern, x2);
			}
		}

		return Math.min(f1, f2);
	};

	Stroke.prototype.distanceAtAngle = function (pattern, angle) {

		var strokePoints = this.rotateBy(angle);
		var patternPoints = pattern.points;
		var d = 0.0;

		for (var i = 0; i < strokePoints.length; i++) {
			point = strokePoints[i];

			d += distance(point, patternPoints[i]);
		}

		return d / strokePoints.length;
	};

	function ShapeDetector (patterns, options) {

		options = options || {};
		this.threshold = options.threshold || 0;
		_nbSamplePoints = options.nbSamplePoints || 64;

		this.patterns = [];

		for (var i = 0; i < patterns.length; i++) {
			this.learn(patterns[i].name, patterns[i].points);
		}
	}

	ShapeDetector.defaultShapes = [
		{
			points: [{ x: 137, y: 139 }, { x: 135, y: 141 }, { x: 133, y: 144 }, { x: 132, y: 146 }, { x: 130, y: 149 }, { x: 128, y: 151 }, { x: 126, y: 155 }, { x: 123, y: 160 }, { x: 120, y: 166 }, { x: 116, y: 171 }, { x: 112, y: 177 }, { x: 107, y: 183 }, { x: 102, y: 188 }, { x: 100, y: 191 }, { x: 95, y: 195 }, { x: 90, y: 199 }, { x: 86, y: 203 }, { x: 82, y: 206 }, { x: 80, y: 209 }, { x: 75, y: 213 }, { x: 73, y: 213 }, { x: 70, y: 216 }, { x: 67, y: 219 }, { x: 64, y: 221 }, { x: 61, y: 223 }, { x: 60, y: 225 }, { x: 62, y: 226 }, { x: 65, y: 225 }, { x: 67, y: 226 }, { x: 74, y: 226 }, { x: 77, y: 227 }, { x: 85, y: 229 }, { x: 91, y: 230 }, { x: 99, y: 231 }, { x: 108, y: 232 }, { x: 116, y: 233 }, { x: 125, y: 233 }, { x: 134, y: 234 }, { x: 145, y: 233 }, { x: 153, y: 232 }, { x: 160, y: 233 }, { x: 170, y: 234 }, { x: 177, y: 235 }, { x: 179, y: 236 }, { x: 186, y: 237 }, { x: 193, y: 238 }, { x: 198, y: 239 }, { x: 200, y: 237 }, { x: 202, y: 239 }, { x: 204, y: 238 }, { x: 206, y: 234 }, { x: 205, y: 230 }, { x: 202, y: 222 }, { x: 197, y: 216 }, { x: 192, y: 207 }, { x: 186, y: 198 }, { x: 179, y: 189 }, { x: 174, y: 183 }, { x: 170, y: 178 }, { x: 164, y: 171 }, { x: 161, y: 168 }, { x: 154, y: 160 }, { x: 148, y: 155 }, { x: 143, y: 150 }, { x: 138, y: 148 }, { x: 136, y: 148 }],
			name: "triangle"
		},
		{
			points: [{ x: 78, y: 149 }, { x: 78, y: 153 }, { x: 78, y: 157 }, { x: 78, y: 160 }, { x: 79, y: 162 }, { x: 79, y: 164 }, { x: 79, y: 167 }, { x: 79, y: 169 }, { x: 79, y: 173 }, { x: 79, y: 178 }, { x: 79, y: 183 }, { x: 80, y: 189 }, { x: 80, y: 193 }, { x: 80, y: 198 }, { x: 80, y: 202 }, { x: 81, y: 208 }, { x: 81, y: 210 }, { x: 81, y: 216 }, { x: 82, y: 222 }, { x: 82, y: 224 }, { x: 82, y: 227 }, { x: 83, y: 229 }, { x: 83, y: 231 }, { x: 85, y: 230 }, { x: 88, y: 232 }, { x: 90, y: 233 }, { x: 92, y: 232 }, { x: 94, y: 233 }, { x: 99, y: 232 }, { x: 102, y: 233 }, { x: 106, y: 233 }, { x: 109, y: 234 }, { x: 117, y: 235 }, { x: 123, y: 236 }, { x: 126, y: 236 }, { x: 135, y: 237 }, { x: 142, y: 238 }, { x: 145, y: 238 }, { x: 152, y: 238 }, { x: 154, y: 239 }, { x: 165, y: 238 }, { x: 174, y: 237 }, { x: 179, y: 236 }, { x: 186, y: 235 }, { x: 191, y: 235 }, { x: 195, y: 233 }, { x: 197, y: 233 }, { x: 200, y: 233 }, { x: 201, y: 235 }, { x: 201, y: 233 }, { x: 199, y: 231 }, { x: 198, y: 226 }, { x: 198, y: 220 }, { x: 196, y: 207 }, { x: 195, y: 195 }, { x: 195, y: 181 }, { x: 195, y: 173 }, { x: 195, y: 163 }, { x: 194, y: 155 }, { x: 192, y: 145 }, { x: 192, y: 143 }, { x: 192, y: 138 }, { x: 191, y: 135 }, { x: 191, y: 133 }, { x: 191, y: 130 }, { x: 190, y: 128 }, { x: 188, y: 129 }, { x: 186, y: 129 }, { x: 181, y: 132 }, { x: 173, y: 131 }, { x: 162, y: 131 }, { x: 151, y: 132 }, { x: 149, y: 132 }, { x: 138, y: 132 }, { x: 136, y: 132 }, { x: 122, y: 131 }, { x: 120, y: 131 }, { x: 109, y: 130 }, { x: 107, y: 130 }, { x: 90, y: 132 }, { x: 81, y: 133 }, { x: 76, y: 133 }],
			name: "rectangle"
		},
		{
			points: [{ x: 127, y: 141 }, { x: 124, y: 140 }, { x: 120, y: 139 }, { x: 118, y: 139 }, { x: 116, y: 139 }, { x: 111, y: 140 }, { x: 109, y: 141 }, { x: 104, y: 144 }, { x: 100, y: 147 }, { x: 96, y: 152 }, { x: 93, y: 157 }, { x: 90, y: 163 }, { x: 87, y: 169 }, { x: 85, y: 175 }, { x: 83, y: 181 }, { x: 82, y: 190 }, { x: 82, y: 195 }, { x: 83, y: 200 }, { x: 84, y: 205 }, { x: 88, y: 213 }, { x: 91, y: 216 }, { x: 96, y: 219 }, { x: 103, y: 222 }, { x: 108, y: 224 }, { x: 111, y: 224 }, { x: 120, y: 224 }, { x: 133, y: 223 }, { x: 142, y: 222 }, { x: 152, y: 218 }, { x: 160, y: 214 }, { x: 167, y: 210 }, { x: 173, y: 204 }, { x: 178, y: 198 }, { x: 179, y: 196 }, { x: 182, y: 188 }, { x: 182, y: 177 }, { x: 178, y: 167 }, { x: 170, y: 150 }, { x: 163, y: 138 }, { x: 152, y: 130 }, { x: 143, y: 129 }, { x: 140, y: 131 }, { x: 129, y: 136 }, { x: 126, y: 139 }],
			name: "circle"
		}
	];

	ShapeDetector.prototype.spot = function (points, patternName) {

		if (patternName == null) {
			patternName = '';
		}

		var distance, pattern, score;
		var stroke = new Stroke(points);
		var bestDistance = +Infinity;
		var bestPattern = null;
		var bestScore = 0;

		for (var i = 0; i < this.patterns.length; i++) {
			pattern = this.patterns[i];

			if (pattern.name.indexOf(patternName) > -1) {
				distance = stroke.distanceAtBestAngle(pattern);
				score = 1.0 - distance / _halfDiagonal;

				if (distance < bestDistance && score > this.threshold) {
					bestDistance = distance;
					bestPattern = pattern.name;
					bestScore = score;
				}
			}
		}

		return { pattern: bestPattern, score: bestScore };
	};

	ShapeDetector.prototype.learn = function (name, points) {

		return this.patterns.push(new Stroke(points, name));
	};

	return ShapeDetector;
}));