#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

#define PI 3.141592

// we need to declare an output for the fragment shader
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
//uniform vec2 u_texUV;
uniform sampler2D u_cursed;

vec3 neighbour(vec2 offset)
{
	return texture(
		u_cursed, 
		vec2(
			(gl_FragCoord.x + 1.0*offset.x)/u_resolution.x,
			(gl_FragCoord.y + 1.0*offset.y)/u_resolution.y 
		)
	).rgb;
}
 
float activation(vec3 col)
{
	//return (col.r + col.g + col.b > 1.5 ? 1.0 : 0.0);
	return (col.r + col.g + col.b)/3.0;
}
vec3 self()
{
	return
	 1.0*(neighbour(vec2( 0.0,  0.0)));
}

vec3 kernel()
{
	return
	  0.0*(neighbour(vec2( 0.0,  0.0))) +
	  1.0*(neighbour(vec2( 1.0,  0.0))) +
	  1.0*(neighbour(vec2( 1.0,  1.0))) +
	  1.0*(neighbour(vec2( 0.0,  1.0))) +
	  1.0*(neighbour(vec2(-1.0,  1.0))) +
	  1.0*(neighbour(vec2(-1.0,  0.0))) +
	  1.0*(neighbour(vec2(-1.0, -1.0))) +
	  1.0*(neighbour(vec2( 0.0, -1.0))) +
 	  1.0*(neighbour(vec2( 1.0, -1.0)));
}

void main() {
	
	float aspect = u_resolution.x/u_resolution.y;
	vec2 uv = vec2(gl_FragCoord.x/u_resolution.x, gl_FragCoord.y/u_resolution.y);
	/*
	uv -= vec2(0.5, 0.5);
	uv.x *= aspect;
	*/
	
	vec2 mouse_uv = (vec2(u_mouse.x/u_resolution.x, 1.0-u_mouse.y/u_resolution.y));
	
	float wasAlive = float(self().r>0.5);
	
	int notOver  = int(kernel().r <= 3.5);
	int notUnder = int(kernel().r >= 1.5);
	
	float shouldSurv = float(notOver*notUnder);
	float shouldRepr = float( (kernel().r <= 3.5) && (kernel().r >= 2.5) );

	float isAlive = wasAlive*shouldSurv + (1.0-wasAlive)*(shouldRepr);
	
	vec3 col = 1.0*vec3(isAlive) + 
		1.0*vec3(1.0, 0.0, 1.0)*0.9*exp(-1000.0*((uv.x-mouse_uv.x)*(uv.x-mouse_uv.x)+(uv.y-mouse_uv.y)*(uv.y-mouse_uv.y)));
	outColor = vec4(col, 1);
}
