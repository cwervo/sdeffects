import * as THREE from 'three';
import { Pane } from 'tweakpane';

const PARAMS = {
  size: 0.5,
  posOffset: { x: 0, y: 0 },
  boxDimensions: { x: 0, y: 0 },
  baseColor: { r: 255, g: 0, b: 0 }
};

const pane = new Pane();
pane.addInput(PARAMS, 'size', {
  stop: 0.01,
  min: 0.01,
  max: 0.99,
});
pane.addInput(PARAMS, 'posOffset', {
  picker: 'inline',
  expanded: true,
  x: { min: -1, max: 1, step: 0.01 },
  y: { min: -1, max: 1, step: 0.01, inverted: true},
});
pane.addInput(PARAMS, 'boxDimensions', {
  picker: 'inline',
  expanded: true,
  x: { min: -1, max: 1, step: 0.01 },
  y: { min: -1, max: 1, step: 0.01, inverted: true},
});
pane.addInput(PARAMS, 'baseColor');

// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// const controls = new OrbitControls(camera, renderer.domElement);
var container;
var camera, scene, renderer;
var uniforms, material, mesh;
// var mouseX = 0,
//   mouseY = 0,
//   lat = 0,
//   lon = 0,
//   phy = 0,
//   theta = 0;

// var windowHalfX = window.innerWidth / 2;
// var windowHalfY = window.innerHeight / 2;

init();
const startTime = Date.now();
animate();

function init() {
  // const scene = new THREE.Scene();
  // renderer.setSize(window.innerWidth, window.innerHeight);

  // camera = new THREE.Camera();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,

    0.1,
    1000
  );
  camera.position.z = 1;
  scene = new THREE.Scene();

  uniforms = {
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
    mouse: { type: "v2", value: new THREE.Vector2() },
    size : { type: "f", value: 0.1 },
    posOffset: { type: "v2", value: new THREE.Vector2() },
    boxDimensions: { type: "v2", value: new THREE.Vector2() },
    baseColor: { type: 'v3', value: new THREE.Vector3()}
  };

  material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `uniform float time;
                uniform vec2 resolution;
                void main()	{
                    gl_Position = vec4( position, 1.0 );
                }`,
    fragmentShader: `#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform float size;
uniform vec2 posOffset;
uniform vec2 boxDimensions;
uniform vec3 baseColor;

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
	vec2 st = gl_FragCoord.xy/resolution;
    float pct = 0.0;
    
    // a. The DISTANCE from the pixel to the center
    pct = distance(st,vec2(0.5));

    // b. The LENGTH of the vector
    //    from the pixel to the center
    vec2 toCenter = vec2(sin(time * 0.1))-st;
    pct = length(toCenter);

    // start at bottom left, move to center
    vec2 pos = st - vec2(1.0, 1.0) - posOffset;
    // pct = sdBox((pos), boxDimensions);
    pct = step(sdBox(pos, boxDimensions), 1.0 - size);
    // pct = circle(pos, size) * vec3(0.5, 0.0, 0.0);

    // c. The SQUARE ROOT of the vector
    //    from the pixel to the center
    // vec2 tC = vec2(0.5)-st;
    // pct = sqrt(tC.x*tC.x+tC.y*tC.y);
    // vec3 color = pct * vec3(0.5, 0.5, 0.9); 
    vec3 color = pct * (baseColor / 255.0);

	gl_FragColor = vec4( color, 1.0);
	// gl_FragColor = vec4(vec3(0.,0.,1.0), 0.5 );
}
                `,
  });

  mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  camera.aspect = renderer.clientWidth / renderer.clientHeight;
  document.body.appendChild(renderer.domElement);

  uniforms.resolution.value.x = window.innerWidth;
  uniforms.resolution.value.y = window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  var elapsedMilliseconds = Date.now() - startTime;
  var elapsedSeconds = elapsedMilliseconds / 1000;
  uniforms.time.value = 60 * elapsedSeconds;
  uniforms.size.value = PARAMS.size;
  uniforms.posOffset.value = PARAMS.posOffset;
  uniforms.boxDimensions.value = PARAMS.boxDimensions;
  uniforms.baseColor.value = PARAMS.baseColor;
  console.log(uniforms.size.value)
  renderer.render(scene, camera);

  // if (resizeRendererToDisplaySize(renderer)) {
  //   const canvas = renderer.domElement;
  //   camera.aspect = canvas.clientWidth / canvas.clientHeight;
  //   camera.updateProjectionMatrix();
  // }
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// ----- MODERN
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(
//   75,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   1000
// );

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// camera.position.z = 5;

// function animate() {
//   requestAnimationFrame(animate);

//   cube.rotation.x += 0.01;
//   cube.rotation.y += 0.01;

//   renderer.render(scene, camera);
// }

// animate();

// // // Option 2: Import just the parts you need.
// // import { Scene } from 'three';

// // const scene = new Scene();

document.onmousemove = function(e) {
  console.log('hello', e.pageX / window.innerWidth, uniforms.mouse.value)
  uniforms.mouse.value.x = e.pageX / window.innerWidth;
  uniforms.mouse.value.y = e.pageY / window.innerHeight;
}