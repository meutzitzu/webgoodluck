#version 300 es

precision highp float;
out vec4 FragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_CZ;
uniform vec4 u_view;
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

void main()
{
	vec2 uv = vec2(gl_FragCoord.x/ u_resolution.x, gl_FragCoord.y/ u_resolution.y)*2.0 + vec2(-1.0);
	float aspect_ratio = float(u_resolution.x)/u_resolution.y;
	
//	uv.x-=0.25;
	uv.x *= aspect_ratio;
	vec2 aux1=uv;
	uv.x=aux1.x*cos(u_view.w)-aux1.y*sin(u_view.w);
	uv.y=aux1.x*sin(u_view.w)+aux1.y*cos(u_view.w);
	uv *= u_view.z;
//	uv*=1.0;
	uv += u_view.xy;
	int MSAA = 4;
	int l = 0;
//	int maxiters = int(floor(min(10.0*u_time, 512)));
//	int maxiters =  int(min(12.0*u_time , 256));
	int maxiters = 256;
	float h = 0.0;
	for(int s=0; s<MSAA; ++s)
	{	
		vec2 aux = uv + vec2(random(vec2((float(s)+1.0))))/u_resolution*1.0*u_view.z;
		vec2 z = aux + u_CZ.zw;
//		vec2 c = u_time*0.05*vec2(cos(u_time), sin(u_time));
		vec2 c = aux;
		for( int i=0; i<maxiters; ++i)
		{
			aux = z;
			z.x = (z.x*z.x -z.y*z.y);
			z.y = (2.0*aux.x*aux.y);
			z += c;
			l = (length(z) > 4.0 ? i: l);
		}
		h += (float(l)/float(maxiters))/float(MSAA);
	}

	vec3 col = hsv2rgb(vec3(1.0*h+0.1*u_time, 1.0, sqrt(h)));

//	vec3 col = vec3((h));

	FragColor = vec4(col, 1.0);

}

