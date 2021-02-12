// adapted from https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_hemisphere.html
varying vec3 vWorldPosition;

void main() {
    float h = normalize( vWorldPosition + vec3(0.0, 400, 0.0) ).y;
    gl_FragColor = vec4( mix( vec3(0.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), max( pow( max( h , 0.0), 0.2 ), 0.0 ) ), 1.0 );
}