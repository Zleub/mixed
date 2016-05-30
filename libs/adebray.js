(() => {

window['adebray'] = window['adebray'] || {}
var adebray = window['adebray']

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
	return canvas.toDataURL()
}

adebray.load = (path, f) => {
	var myImage = new Image()

	var img = new Konva.Image({
		x: 0,
		y: 0,
		image: myImage
	})

	myImage.onload = () => { if (f) { f(img, myImage) } }
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
