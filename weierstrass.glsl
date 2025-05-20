#version 300 es
precision highp float;

// Uniforms provided from JavaScript
uniform vec2 u_resolution;   // Canvas resolution (width, height)
uniform float u_time;        // Shader time (if needed for animation)
uniform vec3 u_pos;          // x, y: translation; z: zoom (scale factor)
uniform vec3 u_rot;          // Rotation (using z for 2D rotation)
uniform vec2 u_ab;           // Parameters for the Weierstrass function

out vec4 fragColor;          // Output color of the fragment

// Converts HSV color to RGB color.
vec3 hsv2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0 + vec3(0.0, 4.0, 2.0),
                             6.0) - 3.0) - 1.0,
                     0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// Computes the Weierstrass function for a given x value.
// This accumulates a series defining the fractal.
float weierstrass(float x) {
    float a = u_ab.x;
    float b = u_ab.y;
    int N = 20;
    float sum = 0.0;
    for (int n = 0; n < N; n++) {
        // Each term scales down by 'a^n' and oscillates at frequency 'b^n'
        sum += pow(a, float(n)) * cos(pow(b, float(n)) * 3.14159 * x);
    }
    return sum;
}

void main() {
    // Convert pixel coordinates (gl_FragCoord) to normalized device coordinates [-1,1]
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv = uv * 2.0 - 1.0;
    
    // Correct the horizontal coordinate based on the canvas aspect ratio
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;
    
    // Rotate the coordinate space by the angle stored in u_rot.z (in radians)
    float theta = u_rot.z;
    vec2 rotatedUV;
    rotatedUV.x = uv.x * cos(theta) - uv.y * sin(theta);
    rotatedUV.y = uv.x * sin(theta) + uv.y * cos(theta);
    
    // Apply zoom and translation:
    // Scale (zoom) the coordinates by u_pos.z then translate by u_pos.xy
    rotatedUV = rotatedUV * u_pos.z + u_pos.xy;
    
    // Map the x coordinate to a scaled domain for the Weierstrass function.
    // Adjust the scaling factor (here, 4.0) to zoom into the fractal pattern.
    float x = rotatedUV.x * 4.0;
    
    // Calculate the Weierstrass function value at x.
    float yValue = weierstrass(x);
    
    // Generate a smooth line around the function value using smoothstep.
    // This creates a transition band around the function value.
    float line = smoothstep(yValue - 0.02, yValue + 0.02, rotatedUV.y);
    
    // Create a color using the hsv2rgb function.
    // The hue is modulated by the line value and u_time to animate the color.
    // Saturation is set to 1, and brightness is determined by the 'line'.
    vec3 col = hsv2rgb(vec3(0.5 * line + 0.1 * u_time, 1.0, line));
    
    // Output the final colored fragment.
    fragColor = vec4(col, 1.0);
}