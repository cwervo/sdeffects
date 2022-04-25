import * as THREE from 'three';
import { Pane } from 'tweakpane';
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// const controls = new OrbitControls(camera, renderer.domElement);

let container;
let camera, scene, renderer;
let uniforms, material, mesh;

const PARAMS = {
  preset: '',
  quality: 0,
};
const PRESET_ARRAY = ['size', 'posOffset']
    // circle: '0.003 -0.5 -0.5 0.3 0.3',

const PRESETS = []

class Param {
  constructor(name, value = 0.0, autoSetup = false) {
    this.name = name;
    PARAMS[`${name}`] = value
    if (autoSetup) {
      this.setup({})
    }
  }
  setup(optionsMap) {
    this.input = pane.addInput(PARAMS, this.name, optionsMap)
  }
}

const pane = new Pane();
let size = new Param('size', 0.03)
size.setup({
  stop: 0.01,
  min: 0.01,
  max: 2.0,
})
let posOffset = new Param('posOffset', { x: -0.5, y: -0.5 })
posOffset.setup({
  picker: 'inline',
  expanded: true,
  x: { min: -1, max: 1, step: 0.01 },
  y: { min: -1, max: 1, step: 0.01, inverted: true},
})
let boxDimensions = new Param('boxDimensions', { x: 0.3, y: 0.3 })
boxDimensions.setup({
  picker: 'inline',
  expanded: true,
  x: { min: -1, max: 1, step: 0.001 },
  y: { min: -1, max: 1, step: 0.001, inverted: true},
})

let baseColor= new Param('baseColor', { r: 93, g: 93, b:  180 }, true)
let tile = new Param('tile', 3)
tile.setup({ 
  stop: 0.01,
  min: 0.1,
  max: 10.0,
})

let activePreset = new Param('preset', '')
activePreset.setup({
  options: {
    none: '',
    circle: '0.4 -0.5 -0.5 0 0',
    square: '0.03 -0.5 -0.5 0.3 0.3',
    squareThick: '0.16 -0.5 -0.5 0.3 0.3',
    quarterCircle: '1 0.5 0.5 0.5 0.5',
  },
});

activePreset.input.on('change', ({value}) => {
  if (value === 'none') return

  const presetNums = value.split(' ').map(n => parseFloat(n));
  PARAMS.size = presetNums[0];
  PARAMS.posOffset.x = presetNums[1]
  PARAMS.posOffset.y = presetNums[2]
  PARAMS.boxDimensions.x = presetNums[3]
  PARAMS.boxDimensions.y = presetNums[4]
  pane.refresh()
})

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
    baseColor: { type: 'v3', value: new THREE.Vector3()},
    tile: { type: 'f', value: 1.1}
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
  uniforms.tile.value = PARAMS.tile;

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
  // console.log('hello', e.pageX / window.innerWidth, uniforms.mouse.value)
  uniforms.mouse.value.x = e.pageX / window.innerWidth;
  uniforms.mouse.value.y = e.pageY / window.innerHeight;
}