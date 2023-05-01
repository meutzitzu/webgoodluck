"use strict";

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
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

  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
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
	var canvas = document.getElementById('c');
	var gl = canvas.getContext('webgl2');
	if (!gl) {
		alert("Your device doesn't seem to support WebGL2. wtf are you even running this on, m8 ?");
		return;
	}
	
	let prusaTexture = loadTexture(gl, './res/tex/prusa.jpg');
	let spaceTexture = loadTexture(gl, './res/tex/spaceEngineers.jpg');

// create GLSL shaders, upload the GLSL source, compile the shaders
	//  promise-land ahead
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
		//	console.log(values);
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
			  -1.0, -1.0,
			  -1.0,  1.0,
			   1.0,  1.0,
			  -1.0, -1.0,
			   1.0, -1.0,
			   1.0,  1.0,
			];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

			let vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			gl.enableVertexAttribArray(positionAttributeLocation);
			var size = 2;          // 2 components per iteration
			var type = gl.FLOAT;   // the data is 32bit floats
			var normalize = false; // don't normalize the data
			var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
			var offset = 0;        // start at the beginning of the buffer
			gl.vertexAttribPointer(
			    positionAttributeLocation, size, type, normalize, stride, offset);
			
			webglUtils.resizeCanvasToDisplaySize(gl.canvas);
			
		// Tell WebGL how to convert from clip space to pixels
			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
			
		// Clear the canvas
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			
		// Tell it to use our program (pair of shaders)
			gl.useProgram(program);

			
			
		// Bind the attribute/buffer set we want.

			let rendTex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, rendTex);
			{
				let stupizenie = new Uint8Array([255, 0, 0, 255])
				gl.texImage2D
				(
					gl.TEXTURE_2D,
					0,
					gl.RGBA,
					1080,1080,
					0,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					stupizenie
				)
			}

			let fbuff = gl.createFramebuffer();
			
		// draw
			var primitiveType = gl.TRIANGLES;
			var offset = 0;
			var count = 6;

			let attPoint = gl.COLOR_ATTACHMENT0;
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				attPoint,
				gl.TEXTURE_2D,
				rendTex,
				0
			)
			

			function draw(time)
			{
				gl.useProgram(program);
				gl.bindVertexArray(vao);
				gl.uniform1f(timeUniformLocation, time/1000.0);
				gl.uniform2f(resolutionUniformLocation, 1080, 1080);
				gl.uniform1i(textureCursedLocation, 0);
				gl.drawArrays(primitiveType, offset, count);
			}

			function renderLoop(timeStamp) { 
		// set time uniform

				webglUtils.resizeCanvasToDisplaySize(gl.canvas);

				{
					gl.bindFramebuffer(gl.FRAMEBUFFER, fbuff);
					gl.bindTexture(gl.TEXTURE_2D, prusaTexture);
					gl.viewport(0, 0, 1080, 1080);
					// Clear the canvas
					gl.clearColor(0, 1, 0, 1);
					gl.clear(gl.COLOR_BUFFER_BIT);
					draw(timeStamp);
				}
				
				{
					gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					gl.bindTexture(gl.TEXTURE_2D, rendTex)
					gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
					// Clear the canvas
					gl.clearColor(0, 0, 0, 1);
					gl.clear(gl.COLOR_BUFFER_BIT);
					draw(timeStamp);
				}

				
		// recursive invocation
			
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
