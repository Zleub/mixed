(() => {

window['adebray'] = window['adebray'] || {}
var adebray = window['adebray']

var harmonizer = new Harmonizer()

adebray.iterates = {
	unit: ([x, y], [width, height]) => (scale) => [x, y],
	symetric : ([x, y], [width, height]) => (scale) => [
		width % 2 == 0 && x < (width / 2) ? x + 1 : x,
		height % 2 == 0 && y < (height / 2) ? y + 1 : y
	],
	circle : ([x, y], [width, height]) => (scale) => [
		Math.pow( Math.floor(width / 2 - x), 2),
		Math.pow( Math.floor(height / 2 - y), 2)
	]
	// circle : ([x, y], [width, height]) => (scale) => [
	// 	Math.pow( Math.floor( (x - width / 2) / scale), 2),
	// 	Math.pow( Math.floor( (y - height / 2) / scale), 2)
	// ]
}

adebray.filters_base = (iterArray) => (formula) => (scale) => (HTMLimage) => (x, y, r, g, b, a) => {
	iterArray.forEach( (f) => [x, y] = f([x, y], [HTMLimage.width, HTMLimage.height])(scale))

	return formula(x, y, r, g, b, a)
}

adebray.formulas_base = (formula) => (harmonie) => (x, y, r, g, b, a) => [
	onecolor(harmonie).red() * 255,
	onecolor(harmonie).green() * 255,
	onecolor(harmonie).blue() * 255,
	formula(x, y) * 255
]

adebray.formulas = {
	cos_multiply : (x, y) => Math.round( Math.cos(x * y) ),
	cos_addition : (x, y) => Math.round( Math.cos(x + y) ),
	cos_substraction : (x, y) => Math.round( Math.cos(x - y) ),
	cos_exponant : (x, y) => Math.round( Math.cos(x ^ y) ),
	cos_division : (x, y) => Math.round( Math.cos(x / y) ),
	cos_division2 : (x, y) => Math.round( Math.cos(y / x) ),
	cos_division3 : (x, y) => Math.round( Math.cos(y / x) * Math.cos(x / y) ),
	sin_exponant : (x, y) => Math.round( Math.sin(y ^ x) ),
	sin_addition : (x, y) => Math.round( Math.sin(y + x) ),
	sin_substraction : (x, y) => Math.round( Math.sin(y - x) )
}

var array = []
for (var i = 0; i < 360; i += (360 / Object.keys(adebray.formulas).length)) {
	array.push(i)	
}

var harmonie = harmonizer.harmonize([128, 21, 21,255], array)

adebray.filters = {

	generic: Object.keys(adebray.formulas).map( (k, i) => {
		return adebray.filters_base ([
			adebray.iterates.symetric,
			adebray.iterates.circle
		]) (
			adebray.formulas_base (adebray.formulas[k]) (harmonie[i])
		)
	}),

	merge: (HTMLimage, data) => (x, y, r, g, b, a) => {
		if (data[x * 4 + y * 4 * HTMLimage.width + 3] > 0) {
			r = data[x * 4 + y * 4 * HTMLimage.width]
			g = data[x * 4 + y * 4 * HTMLimage.width + 1]
			b = data[x * 4 + y * 4 * HTMLimage.width + 2]
		}
		return [r, g, b, a]
	},

	multiply: (HTMLimage, data) => (x, y, r, g, b, a) => {
		var _r = data[x * 4 + y * 4 * HTMLimage.width] / 255
		var _g = data[x * 4 + y * 4 * HTMLimage.width + 1] / 255
		var _b = data[x * 4 + y * 4 * HTMLimage.width + 2] / 255
		var _a = data[x * 4 + y * 4 * HTMLimage.width + 3] / 255

		var r = r / 255, g = g / 255, b = b / 255, a = a / 255

		return [
			r * _r * 255,
			g * _g * 255,
			b * _b * 255,
			a * _a * 255
		]
	},

	unit: (HTMLimage, data) => (x, y, r, g, b, a) => {
		return [r, g, b, a]
	}

}

adebray.compose_table = [
	{ a: String, b: String, fn: (a, b, c, callback) => {
		adebray.load(b, (HTMLimageB) => {
			adebray.load(a, (HTMLimageA) => {
				var data = adebray.iter_image_data(HTMLimageA, adebray.filters.unit(HTMLimageA))
				c(HTMLimageB, data.data)
			})
		})
	}},

	{ a: String, b: Function, fn: (a, b, c, callback) => {
		adebray.load(a, (HTMLimage) => {
			var data = adebray.iter_image_data(HTMLimage, b(HTMLimage))
			console.log(callback)
			callback( c(HTMLimage, data.data))
		})
	}},

	{ a: Array, b: String, fn: (a, b, c, callback) => {
		adebray.load(b, (HTMLimageB) => {
			adebray.compose(a, (HTMLimageA) => {
				var data = adebray.iter_image_data(HTMLimageA, adebray.filters.unit(HTMLimageA))
				callback( c(HTMLimageB, data.data) )
			})
		})
	}},
]

adebray.compose = (array, cb) => {
	var [a, b, c] = array

	console.log('----------')
	console.log(a.constructor)
	console.log(b.constructor)
	adebray.compose_table.every( (e) => {
		var {a: _a, b: _b, fn} = e

		if (a.constructor == _a && b.constructor == _b) {
			fn(a, b, c, cb)
			return false
		}
		return true
	})
}

adebray.setScale = (stage, scale) => {
	stage.scale({ x: scale, y: scale })
	stage.draw()
}

adebray.setSize = (stage, width, height) => {
	stage.setWidth(600)
	stage.setHeight(800)
}

adebray.iter_image_data = (img, f ) => {
	var canvas = document.createElement('canvas');

	canvas.width = img.width;
	canvas.height = img.height;
	var context = canvas.getContext('2d')

	context.drawImage(img, 0, 0, img.width, img.height)

	var data = context.getImageData(0, 0, img.width, img.height)

	var dt = data.data
	var x = 0, y = 0

	for(var i=0; i<dt.length; i+=4) {
		[r, g, b, a] = f(x, y, dt[i], dt[i+1], dt[i+2], dt[i+3])

		dt[i] = r,
		dt[i+1] = g,
		dt[i+2] = b,
		dt[i+3] = a

		x += 1
		if (x >= img.width) {
			x = 0
			y += 1
		}
	}

	context.putImageData(data, 0, 0);
	return [
		canvas.toDataURL(),
		canvas.getContext('2d').getImageData(0, 0, img.width, img.height)
	]
}

adebray.load = (path, f) => {
	var myImage = new Image()

	myImage.onload = () => { if (f) { f(myImage) } }
	myImage.src = path
}

adebray.init = (stage) => {
	adebray.setScale(stage, scale)
	adebray.setSize(stage, 600, 800)

	stage.content.style.border = '1px solid'
	stage.on('contentWheel', (e) => {
		scale = scale + e.evt.wheelDeltaY / 1000
		adebray.setScale(stage, scale)
		// res += e.evt.wheelDeltaY / 1000
		// if (res < 1) {
		// 	res = 1
		// }
		// console.log(res)
	})

	var layer = new Konva.Layer()
	stage.add(layer)

	layer.getContext()._context.imageSmoothingEnabled = false
	layer.getContext()._context.webkitImageSmoothingEnabled = false
	layer.getContext()._context.mozImageSmoothingEnabled = false

	adebray.add = layer.add.bind(layer)
	adebray.draw = layer.draw.bind(layer)
}

})()
