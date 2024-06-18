import * as THREE from 'three';
import { Pane } from 'tweakpane';
import matterVertexShader from './shader/matter.frag'
import matterFragmentShader from './shader/matter.vert'

let camera, scene, renderer;
let uniforms, material, mesh;

const PARAMS = {
  preset: '',
  quality: 0,
};

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

new Param('baseColor', { r: 93, g: 93, b:  180 }, true)

let tile = new Param('tile', 3)
tile.setup({ 
  stop: 0.01,
  step: 0.01,
  min: 0.1,
  max: 10.0,
})

let activePreset = new Param('preset', '')
activePreset.setup({
  options: {
    none: '',
    //             thicc | X  |  Y  | W | H | tile
    circle:        '0.50 -0.5 -0.50  0.0 0.0 1.0',
    square:        '0.03 -0.5 -0.50  0.3 0.3 _',
    squareThick:   '0.16 -0.5 -0.50  0.3 0.3 _',
    quarterCircle: '0.75  0.5  0.50  0.5 0.5 6',
    singleCircle:  '0.05 -0.95 -0.05 0.0 0.0 0.25'
  },
});


function assignIFF(variable, IFFvariable) {
  if (isNaN(IFFvariable)) return
   const LEFT =`PARAMS.${variable}`
   const VALUE = eval(LEFT)
   eval(`${LEFT} = (IFFvariable != undefined) ? IFFvariable : ${eval(LEFT)}`)
  console.log(`${variable} attempting to be set to: ${VALUE} |  ${IFFvariable}`)
  console.log(`set ${variable} to ${VALUE}`)
}

function assignIFF_cgpt(variable, IFFvariable) {
  if (isNaN(IFFvariable)) return;

  const PARAMS = { [variable]: undefined }; // Assuming PARAMS is an object that you have

  const currentValue = Reflect.get(PARAMS, variable);

  const newValue = (IFFvariable !== undefined) ? IFFvariable : currentValue;

  Reflect.set(PARAMS, variable, newValue);

  console.log(`${variable} attempting to be set to: ${currentValue} | ${IFFvariable}`);
  console.log(`set ${variable} to ${newValue}`);
}


activePreset.input.on('change', ({value}) => {
  if (value === 'none') return
  const presetNums = value.split(' ').map(n => parseFloat(n)).filter(n => n != undefined && !isNaN(n));
  console.log(presetNums)
  assignIFF('lineThickness', presetNums[0])
  assignIFF('posOffset.x', presetNums[1])
  assignIFF('posOffset.y', presetNums[2])
  assignIFF('boxDimensions.x', presetNums[3])
  assignIFF('boxDimensions.y', presetNums[4])
  assignIFF('tile', presetNums[5])
  pane.refresh()
  console.log('----- FINISH LOADING PRESET -----')
})

init();
const startTime = Date.now();
animate();

function init() {
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
}

document.onmousemove = function(e) {
  uniforms.mouse.value.x = e.pageX / window.innerWidth;
  uniforms.mouse.value.y = e.pageY / window.innerHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  })
});