import * as THREE from 'three';
import { Pane } from 'tweakpane';
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// const controls = new OrbitControls(camera, renderer.domElement);
import matterVertexShader from './shader/matter.frag'
import matterFragmentShader from './shader/matter.vert'

let container;
let camera, scene, renderer;
let uniforms, material, mesh;

const PARAMS = {
  preset: '',
  quality: 0,
};
const PRESET_ARRAY = ['lineThickness', 'posOffset']
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
let lineThickness = new Param('lineThickness', 0.03)
lineThickness.setup({
  step: 0.001,
  min: 0.01,
  max: 2.0,
  /*
    TODO: associate `area` of box (boxDimensions.x * boxDimensions.y) w/ the thickness of the lines somehow?
      probably not a param, it's most useful as an implicit relationship between the `lineThickness` & the `area`.
  */
  // max: 0.2
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
  PARAMS.lineThickness = presetNums[0];
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
    lineThickness: { type: "f", value: 0.1 },
    posOffset: { type: "v2", value: new THREE.Vector2() },
    boxDimensions: { type: "v2", value: new THREE.Vector2() },
    baseColor: { type: 'v3', value: new THREE.Vector3()},
    tile: { type: 'f', value: 1.1}
  };

  material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: matterVertexShader,
    fragmentShader: matterFragmentShader
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
  uniforms.lineThickness.value = PARAMS.lineThickness;
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