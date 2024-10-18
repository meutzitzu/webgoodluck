#version 300 es

precision highp float;
out vec4 FragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_CZ;
//[x, rz], [y, ry], [z, rz]
uniform vec2 u_x;
uniform vec2 u_y;
uniform vec2 u_z;

//uniform vec4 u_view;
uniform float u_MSAA;
uniform float u_maxiters;
#define pi radians(180)

vec3 hsv2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// multiplication of complex numbers
vec2 cm(vec2 num1, vec2 num2)
{
	vec2 rez;
	rez.x=num1.x*num2.x-num1.y*num2.y;
	rez.y=num1.x*num2.y+num1.y*num2.x;
	return rez;
}
void main()
{
	vec2 uv = vec2(gl_FragCoord.x/ u_resolution.x, gl_FragCoord.y/ u_resolution.y)*2.0 + vec2(-1.0);
	float aspect_ratio = float(u_resolution.x)/u_resolution.y;

	// formula so it works
	uv.x *= aspect_ratio;
	vec2 aux1=uv;
	// rotation
	uv.x=aux1.x*cos(u_z.y)-aux1.y*sin(u_z.y);
	uv.y=aux1.x*sin(u_z.y)+aux1.y*cos(u_z.y);
	uv *= u_z.x;
//	uv*=1.0;
	uv += vec2(u_x.x, u_y.x);
	int l = 0;
//	int maxiters = int(floor(min(10.0*u_time, 512)));
	//int maxiters =  int(min(12.0*u_time , 192));
	float h = 0.0;
	for(int s=0; s<int(u_MSAA); ++s)
	{	
		vec2 aux = uv + vec2(random(vec2((s+1))))/u_resolution*1.0*u_z.x;
		vec2 z = aux + u_CZ.zw;
//		vec2 c = u_time*0.05*vec2(cos(u_time), sin(u_time));
//		vec2 c = aux + u_CZ.xy;
		vec2 c = vec2(u_x.x, u_y.x);
		for( int i=1; i<int (u_maxiters); ++i)
		{
			z=cm(z, z);
			z += c;
			l = (length(z) > 4.0 ? i: l);
		}
		h += (float(l)/u_maxiters)/u_MSAA;
	}

    vec3 col = hsv2rgb(vec3(3.0*h, sqrt(h), sqrt(h)));
//	vec3 col = vec3((h));

	FragColor = vec4(col, 1.0);

}