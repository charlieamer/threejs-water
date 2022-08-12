import {
  AmbientLight,
  BoxGeometry,
  CameraHelper,
  DirectionalLight,
  GridHelper,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { InteractionCapture } from './InteractionCapture';

function resizeRendererToDisplaySize(renderer: WebGLRenderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

const canvas = document.getElementById('app') as HTMLCanvasElement;
const renderer = new WebGLRenderer({
  canvas,
});

// camera
const camera = new PerspectiveCamera(
  30,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  100,
);
const cameraPositionLS = localStorage.getItem('cameraPosition');
if (cameraPositionLS) {
  camera.position.fromArray(JSON.parse(cameraPositionLS));
} else {
  camera.position.set(10, 5, 8);
}
camera.lookAt(0, 0, 0);

// camera control
const controls = new OrbitControls(camera, canvas);

const scene = new Scene();

// light
{
  const color = 0xffffff;
  const intensity = 1;
  const light = new DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
}

// ambient light
scene.add(new AmbientLight(0x333333));

scene.add(new GridHelper());

// interactor
const interactor = new InteractionCapture(5, 0.5, 0.1);
interactor.position.y = -0.55;
interactor.lookAt(0, 1, 0);
scene.add(new CameraHelper(interactor));

// cube
// for (let i = 0; i < 100; i++) {
const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshPhongMaterial({
  // map: interactor.texture,
});
const cube = new Mesh(geometry, material);
// cube.position.fromArray([0, 0, 0].map(() => (Math.random() - 0.5) * 10));
cube.position.y = 0.5;
cube.frustumCulled = false;
scene.add(cube);
// }

// loops updates
function loop() {
  controls.update();
  if (resizeRendererToDisplaySize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  localStorage.setItem(
    'cameraPosition',
    JSON.stringify(camera.position.toArray()),
  );
  interactor.render(renderer, scene);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
// runs a continuous loop
loop();

setTimeout(() => {
  material.map = interactor.texture;
  material.needsUpdate = true;
}, 1000);
