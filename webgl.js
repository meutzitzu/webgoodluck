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



function main() {
// Get A WebGL context
	var canvas = document.getElementById("c");
	var gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}
	

// create GLSL shaders, upload the GLSL source, compile the shaders
	Promise.all([fetch("./vertex.glsl"), fetch("./frag.glsl")])
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
			gl.bindVertexArray(vao);
			
		// draw
			var primitiveType = gl.TRIANGLES;
			var offset = 0;
			var count = 6;

			function renderLoop(timeStamp) { 
		// set time uniform
				gl.useProgram(program);
				webglUtils.resizeCanvasToDisplaySize(gl.canvas);
				gl.uniform1f(timeUniformLocation, timeStamp/1000.0);
				gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
				gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
				
				gl.drawArrays(primitiveType, offset, count);
				
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
