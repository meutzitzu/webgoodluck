#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// we need to declare an output for the fragment shader
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;

void main() {

	float aspect = u_resolution.x/u_resolution.y;
	vec2 uv = vec2(gl_FragCoord.x/u_resolution.x, gl_FragCoord.y/u_resolution.y);
	uv -= vec2(0.5, 0.5);
	uv.x *= aspect;

	outColor = vec4(mod(u_time + 10.0*length(uv), 0.8), mod(8.0*length(uv)-0.5*u_time, 0.9), 0.0, 1);
}

