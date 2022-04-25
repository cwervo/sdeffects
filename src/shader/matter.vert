#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform float size;
uniform vec2 posOffset;
uniform vec2 boxDimensions;
uniform vec3 baseColor;
uniform float tile;
// TODO: make this a string insertion to add Param uniform!!!

float sdCircle( vec2 p, float r ) {
    return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
	vec2 d = abs(p) - b;
  // Invert ...
  // return 1. - length(max(d, vec2(0))) + min(max(d.x, d.y), 0.0);
  return 1. - length(max(d, vec2(0))) + min(max(d.x, d.y), 0.0);
}

float circle(vec2 _st, float _radius){
    vec2 dist = _st-vec2(0.5);
	return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(dist,dist)*4.0);
}

void main(){
  // size = 0.3, posOffset = -.5, boxDim = 0.0 => gird of circles!

	vec2 st = gl_FragCoord.xy/resolution;
  float pct = 0.0;
  vec2 pos = st - posOffset - vec2(3. * (size + boxDimensions.x + boxDimensions.y));

  // 0 - 0.99 => make 4, with different thicknesses b/c of overlap, 0.1 most thick, 0.99 least thick
  // 0.5 => make 4
  // 1.1 = make 4 with a bit of an inset
  pos *= tile; // Scale up the space by 3
  pos = fract(pos); // Wrap around 1.0

  pos += posOffset;

  /*
  step(
  maxTheBox,
  determin its thickness
  )
  */
  pct = step(sdBox(pos, boxDimensions), 1.0 - size);
  vec3 color = pct * (baseColor / 255.0) * 1.2;

	gl_FragColor = vec4( color, 1.0);
}