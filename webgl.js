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
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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
	
	let prusaTexture = loadTexture(gl, './res/tex/prusa.jpg');
	let spaceTexture = loadTexture(gl, './res/tex/spaceEngineers.jpg');

// create GLSL shaders, upload the GLSL source, compile the shaders
	//	promise-land ahead
	Promise.all([fetch("./res/shaders/vertex.glsl"), fetch("./res/shaders/frag.glsl")])
		.then((values) => {
			let result = [];
			for (const i in values){
				result.push(values[i].text());
			}
			return Promise.all(result);
		})
		.then((values) => 
		{
			//console.log(values);
			let program = createProgram(gl,
				createShader(gl, gl.VERTEX_SHADER, values[0]),
				createShader(gl, gl.FRAGMENT_SHADER, values[1])
			);

			let timeUniformLocation = gl.getUniformLocation(program, "u_time"); 
			let mouseUniformLocation = gl.getUniformLocation(program, "u_mouse"); 
			let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution")
			let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
			let texturePrusaLocation = gl.getUniformLocation(program, "u_prusa");
			let textureSpaceLocation = gl.getUniformLocation(program, "u_space");
			let textureCursedLocation = gl.getUniformLocation(program, "u_cursed");
			
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
			gl.enableVertexAttribArray(positionAttributeLocation);
			var size = 2;					// 2 components per iteration
			var type = gl.FLOAT;	 // the data is 32bit floats
			var normalize = false; // don't normalize the data
			var stride = 0;				// 0 = move forward size * sizeof(type) each iteration to get the next position
			var offset = 0;				// start at the beginning of the buffer
			gl.vertexAttribPointer(
				positionAttributeLocation, size, type, normalize, stride, offset
			);
			
		// Tell WebGL how to convert from clip space to pixels
			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
			
		// Clear the canvas
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			
		// Create and bind a texture.
			var texture = gl.createTexture();
			
			/*
			// use texture unit 0
			gl.activeTexture(gl.TEXTURE0 + 0);

			// bind to the TEXTURE_2D bind point of texture unit 0
			gl.bindTexture(gl.TEXTURE_2D, texture);

				 // fill texture with 3x2 pixels
				{
					 const level = 0;
					 const internalFormat = gl.R8;
					 const width = 3;
					 const height = 2;
					 const border = 0;
					 const format = gl.RED;
					 const type = gl.UNSIGNED_BYTE;
					 const data = new Uint8Array([
						 128,  64, 128,
						   0, 192,   0,
					 ]);
					 gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
					 gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
												 format, type, data);
				}

				 // set the filtering so we don't get a black fucking screen with no errors or other signs we did anything wrong. (Too bad)
				 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			*/
			
			// use texture unit 0
			gl.activeTexture(gl.TEXTURE0);
			
			// set the size of all of our compute textures
			const targetTextureWidth = 1080;
			const targetTextureHeight = 1080;

			// Create the first texture to render to
			const rendTex0 = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, rendTex0);	 
			{
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
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			}
			
			const rendTex1 = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, rendTex1);	 
			{
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
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			}

			//unbind textures
			gl.bindTexture(gl.TEXTURE_2D, null);	 
			
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

			function render2tex(time)
			{
				gl.useProgram(program);
				gl.bindVertexArray(vao);
				gl.uniform1f(timeUniformLocation, time/1000.0);
				gl.uniform2f(resolutionUniformLocation, 1080, 1080);
				gl.uniform1i(textureCursedLocation, 0);
				gl.drawArrays(primitiveType, offset, count);
			}
			
			function render2screen(time)
			{
				gl.useProgram(program);
				gl.bindVertexArray(vao);
				gl.uniform1f(timeUniformLocation, time/1000.0);
				gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
				gl.uniform1i(textureCursedLocation, 0);
				gl.drawArrays(primitiveType, offset, count);
			}
			let frameNum = 0;
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbuff);
			gl.bindTexture(gl.TEXTURE_2D, prusaTexture)
			gl.viewport(0, 0, 1080, 1080);
			// Clear the canvas
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			render2screen(0.0);
			
			function renderLoop(timeStamp)
			{ 
				frameNum++;
				webglUtils.resizeCanvasToDisplaySize(gl.canvas);
			
				// take turns rendering onto one texture or the other
				gl.bindFramebuffer(gl.FRAMEBUFFER, fbuff);
				switch(frameNum%2)
				{
				case 0: //even frame
					gl.bindTexture(gl.TEXTURE_2D, rendTex0)
					gl.framebufferTexture2D
					(
						gl.FRAMEBUFFER,
						attPoint,
						gl.TEXTURE_2D,
						rendTex1,
						level
					);
					gl.viewport(0, 0, 1080, 1080);
					// Clear the canvas
					gl.clearColor(0, 0, 0, 1);
					gl.clear(gl.COLOR_BUFFER_BIT);
					render2screen(timeStamp);
				break;
				
				case 1: //odd frame
					gl.bindTexture(gl.TEXTURE_2D, rendTex1)
					gl.framebufferTexture2D
					(
						gl.FRAMEBUFFER,
						attPoint,
						gl.TEXTURE_2D,
						rendTex0,
						level
					);
					gl.viewport(0, 0, 1080, 1080);
					// Clear the canvas
					gl.clearColor(0, 0, 0, 1);
					gl.clear(gl.COLOR_BUFFER_BIT);
					render2screen(timeStamp);
				break;
				}
				
				// render to the screen
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.bindTexture(gl.TEXTURE_2D, rendTex0)
				gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
				// Clear the canvas
				gl.clearColor(0, 0, 0, 1);
				gl.clear(gl.COLOR_BUFFER_BIT);
				render2screen(timeStamp);
				
				function mouseMove( event )
				{
					gl.uniform2f(mouseUniformLocation, event.clientX, event.clientY);
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
