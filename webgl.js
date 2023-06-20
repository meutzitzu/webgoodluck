
"use strict";

function createShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}
	  
	console.log(gl.getShaderInfoLog(shader));	// eslint-disable-line
	gl.deleteShader(shader);
	return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));	// eslint-disable-line
	gl.deleteProgram(program);
	return undefined;
}

function loadTexture(gl, url) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Because images have to be downloaded over the internet
	// they might take a moment until they are ready.
	// Until then put a single pixel in the texture so we can
	// use it immediately. When the image has finished downloading
	// we'll update the texture with the contents of the image.
	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
	gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		width,
		height,
		border,
		srcFormat,
		srcType,
		pixel
	);

	const image = new Image();
	image.onload = () => {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			srcFormat,
			srcType,
			image
		);

		// WebGL1 has different requirements for power of 2 images
		// vs. non power of 2 images so check if the image is a
		// power of 2 in both dimensions.
		if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
			// Yes, it's a power of 2. Generate mips.
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			// No, it's not a power of 2. Turn off mips and set
			// wrapping to clamp to edge
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		}
	};
	image.src = url;

	return texture;
}

function isPowerOf2(value) {
	return (value & (value - 1)) === 0;
}

function main() {
// Get A WebGL context
	var canvas = document.getElementById('canvas');
	var gl = canvas.getContext('webgl2');
	if (!gl) {
		alert("Your device doesn't seem to support WebGL2. wtf are you even running this on, m8 ?");
		return;
	}
	
	let prusaTexture = loadTexture(gl, './res/tex/single.png');

// create GLSL shaders, upload the GLSL source, compile the shaders
	//	promise-land ahead
	Promise.all([
			fetch("./res/shaders/vertex.glsl"),
			fetch("./res/shaders/view.glsl"),
			fetch("./res/shaders/frag.glsl")
	]).then((values) => {
			let result = [];
			for (const i in values){
				result.push(values[i].text());
			}
			return Promise.all(result);
	})
	.then((values) => {
		//console.log(values);
		let view_program = createProgram(gl,
			createShader(gl, gl.VERTEX_SHADER, values[0]),
			createShader(gl, gl.FRAGMENT_SHADER, values[1])
		);

		let calc_program = createProgram(gl,
			createShader(gl, gl.VERTEX_SHADER, values[0]),
			createShader(gl, gl.FRAGMENT_SHADER, values[2])
		);
		
		let viewUnis = 
		{
			time : gl.getUniformLocation(view_program, "u_time"), 
			mouse : gl.getUniformLocation(view_program, "u_mouse"), 
			resolution : gl.getUniformLocation(view_program, "u_resolution"),
			position : gl.getAttribLocation(view_program, "a_position"),
			textureCursed : gl.getUniformLocation(view_program, "u_cursed"),
		};

		let calcUnis = 
		{
			time : gl.getUniformLocation(calc_program, "u_time"), 
			mouse : gl.getUniformLocation(calc_program, "u_mouse"), 
			resolution : gl.getUniformLocation(calc_program, "u_resolution"),
			position: gl.getAttribLocation(calc_program, "a_position"),
			textureCursed : gl.getUniformLocation(calc_program, "u_cursed"),
		};
		
		let positionBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		
		var positions = [
			-1.0,	-1.0,
			-1.0,	 1.0,
			 1.0,	 1.0,
			-1.0,	-1.0,
			 1.0,	-1.0,
			 1.0,	 1.0,
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

		let vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		gl.enableVertexAttribArray(viewUnis.positionAttribute);
		var size = 2;             // 2 components per iteration
		var type = gl.FLOAT;      // the data is 32bit floats
		var normalize = false;    // don't normalize the data
		var stride = 0;           // 0 = move forward size * sizeof(type) each iteration to get the next position
		var offset = 0;           // start at the beginning of the buffer
		gl.vertexAttribPointer(
			viewUnis.positionAttribute, size, type, normalize, stride, offset
		);
		
	// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		
	// Clear the canvas
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
	// Create and bind a texture.
		var texture = gl.createTexture();
		
		
		// use texture unit 0
		gl.activeTexture(gl.TEXTURE0);
		
		// set the size of all of our compute textures
		const targetTextureWidth = 117;
		const targetTextureHeight = 169;
		
		//hopefully this will un-fuck things  spoilers: it did not ! Too bad!
		gl.disable(gl.BLEND);
		
		/*   R E P R E S E N T A T I O N
		 *
		 *  edge grid:
		 *    velocity
		 *  
		 *  node grid:
		 *    obstacles
		 *    external force
		 *
		 *
		 *
		 *
		 *
		 */
				
		function make_texture(){
			const tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex); 
			// define size and format of level 0
			const level = 0;
			const internalFormat = gl.RGBA;
			const border = 0;
			const format = gl.RGBA;
			const type = gl.UNSIGNED_BYTE;
			const data = null;
			gl.texImage2D(
				gl.TEXTURE_2D, 
				level, 
				internalFormat,
				targetTextureWidth, targetTextureHeight, 
				border,
				format, 
				type, 
				data
			);
			
			// set the filtering so we don't need mips
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindTexture(gl.TEXTURE_2D, null); 
			return tex;
		}
		
		// Create the first texture to render to
		const rendTex0 = make_texture();
		const rendTex1 = make_texture();

		/* Velocity field */
		const velo1 = make_texture();
		const velo2 = make_texture();
		
		/* Force field */
		const fors1 = make_texture();
		const fors2 = make_texture();

		/* Flags - x-is obstacle? (1 - obstacle, 0 - free) */
		const flgs1 = make_texture();
		const flgs2 = make_texture();

		/* Amount of fluid - for aesthetic purposes */
		const amou1 = make_texture();
		const amou2 = make_texture();

		// Create and bind the framebuffer
		const fbuff = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbuff);
		
		// attach the texture as the first color attachment
		const attPoint = gl.COLOR_ATTACHMENT0;
		const level = 0;
		gl.framebufferTexture2D
		(
			gl.FRAMEBUFFER,
			attPoint,
			gl.TEXTURE_2D,
			rendTex0,
			level
		);
		
	// draw
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 6;
		
		var mouse_X = 0.0;
		var mouse_Y = 0.0;
		
		function render2tex(time)
		{
			gl.useProgram(calc_program);
			gl.uniform1f(calcUnis.time, time/1000.0);
			gl.uniform2f(calcUnis.resolution, targetTextureWidth, targetTextureHeight);
			gl.uniform2f(calcUnis.mouse, mouse_X*(targetTextureWidth/gl.canvas.width), mouse_Y*targetTextureHeight/gl.canvas.height);
			gl.uniform1i(calcUnis.textureCursed, 0);
			gl.drawArrays(primitiveType, offset, count);
		}
		
		function render2screen(time)
		{
			gl.useProgram(view_program);
			gl.uniform1f(viewUnis.time, time/1000.0);
			gl.uniform2f(viewUnis.resolution, gl.canvas.width, gl.canvas.height);
			gl.uniform2f(viewUnis.mouse, mouse_X, mouse_Y);
			gl.uniform1i(viewUnis.textureCursed, 0);
			gl.drawArrays(primitiveType, offset, count);
		}
		
		function swapper(a, b, parity)
		{
			return (parity ? a : b);
		}
		
		var textureSet0 =
		{
			tgol : rendTex0 
		};
		
		var textureSet1 =
		{
			tgol : rendTex1 
		};
		
		function iterate(iter, time)
		{
			let even = (iter%2===0)
			let odd  = (iter%2===1)

			let source = swapper(textureSet0, textureSet1, even);
			let target = swapper(textureSet1, textureSet0, even);
			
			gl.bindTexture(gl.TEXTURE_2D, source.tgol)
			gl.framebufferTexture2D
			(
				gl.FRAMEBUFFER,
				attPoint,
				gl.TEXTURE_2D,
				target.tgol,
				level
			);
			gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);
			// Clear the canvas
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			render2tex(time);
		}
		let frameNum = 0;
		
		gl.useProgram(view_program);
		gl.bindTexture(gl.TEXTURE_2D, prusaTexture)
		gl.framebufferTexture2D
		(
			gl.FRAMEBUFFER,
			attPoint,
			gl.TEXTURE_2D,
			rendTex1,
			level
		);
		gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);
		// Clear the canvas
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		render2tex(0.0);


		function renderLoop(timeStamp)
		{ 
			frameNum++;
		
			gl.useProgram(calc_program);
			// take turns rendering onto one texture or the other
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbuff);
			

			iterate(frameNum, timeStamp);

			
			webglUtils.resizeCanvasToDisplaySize(gl.canvas);
			// render to the screen
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			//gl.bindTexture(gl.TEXTURE_2D, rendTex0)
			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
			// Clear the canvas
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			render2screen(timeStamp);
			
			function mouseMove( event ) {
				mouse_X = event.clientX;
				mouse_Y = event.clientY;
			}
			canvas.addEventListener("mousemove", mouseMove, false);
		
		//recursive call to renderLoop
		window.requestAnimationFrame(renderLoop);
	
		}

		// begin the render loop
		window.requestAnimationFrame(renderLoop);

	})
}

main();
