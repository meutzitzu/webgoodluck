"use strict";
let x=0.0, y=0.0, z=1.0, r=0.0, speed=0.03, min_speed=0.03;

var pressedKeys = {};
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }

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
			
			let viewUniformLocation = gl.getUniformLocation(program, "u_view"); 

			let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

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
				gl.uniform4f(viewUniformLocation, x, y, z, r);
				gl.drawArrays(primitiveType, offset, count);
				
		// recursive invocation
			
      //recursive call to renderLoop
			window.requestAnimationFrame(renderLoop);
				z*=(pressedKeys[32] ? 1/(1.0+speed) : 1.0);
				z*=(pressedKeys[16] ? 1.0+speed : 1.0);
				y+=z*(pressedKeys[87] ? speed : 0.0);
				y+=z*(pressedKeys[83] ? -speed : 0.0);
				x+=z*(pressedKeys[65] ? -speed : 0.0);
				x+=z*(pressedKeys[68] ? speed : 0.0);
				r+=z*(pressedKeys[37] ? -speed : 0.0);
				r+=z*(pressedKeys[39] ? speed : 0.0);
				speed+=(pressedKeys[38] ? 0.01 : 0.0);
				speed+=(pressedKeys[40] ? -0.01 : 0.0);
				if (speed<min_speed)speed=min_speed;
				console.log(speed);
			}

			// begin the render loop
			window.requestAnimationFrame(renderLoop);
		})
}

main();
