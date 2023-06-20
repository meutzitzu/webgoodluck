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
	return (col.r + col.g + col.b > 1.5 ? 1.0 : 0.0);
	//return (col.r + col.g + col.b)/3.0;
}

float enviornment()
{
	return 
	activation(neighbour(vec2( 1.0,  0.0))) +
	activation(neighbour(vec2( 1.0,  1.0))) +
	activation(neighbour(vec2( 0.0,  1.0))) +
	activation(neighbour(vec2(-1.0,  1.0))) +
	activation(neighbour(vec2(-1.0,  0.0))) +
	activation(neighbour(vec2(-1.0, -1.0))) +
	activation(neighbour(vec2( 0.0, -1.0))) +
	activation(neighbour(vec2( 1.0, -1.0)));
}

vec3 alive(float env)
{
	if (activation(neighbour(vec2(0.0, 0.0)))<=0.1)
	{
		if (env>=3.0 && env<=3.0)
		{
     		return vec3(0.5, 1.0, 0.5);
		}
	}
	else if (env>=2.0 && env<=3.0)
	{
     	return vec3(0.0, 1.0, 1.0);
	}
	else return vec3(0.8, 0.0, 0.0);
}

vec3 BoxColor = vec3(1.0, 0.0, 0.0);
vec3 SphereColor = vec3(0.0, 0.0, 1.0);

void main() {

	float aspect = u_resolution.x/u_resolution.y;
	vec2 uv = vec2(gl_FragCoord.x/u_resolution.x, gl_FragCoord.y/u_resolution.y);
	/*
	uv -= vec2(0.5, 0.5);
	uv.x *= aspect;
	*/

	vec2 mouse_uv = (vec2(u_mouse.x/u_resolution.x, 1.0-u_mouse.y/u_resolution.y));

	vec3 col = 1.0*vec3(alive(enviornment())) + 
		vec3(1.0, 0.0, 1.0)*0.9*exp(-1000.0*((uv.x-mouse_uv.x)*(uv.x-mouse_uv.x)+(uv.y-mouse_uv.y)*(uv.y-mouse_uv.y)));
	outColor = vec4(col, 1);
}
