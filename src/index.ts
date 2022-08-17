import { GUI } from 'dat.gui';
import {
  AmbientLight,
  BoxGeometry,
  CubeTextureLoader,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { degToRad } from 'three/src/math/MathUtils';
import { WaterInteractor } from './WaterInteractor';

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

// scene.add(new GridHelper());

// interactor
const interactor = new WaterInteractor(5, 0.5, 0.1, 2048);
interactor.position.y = -0.55;
interactor.lookAt(0, 1, 0);

// cube
const cube = new Mesh(
  new BoxGeometry(0.3, 0.3, 0.3),
  new MeshPhongMaterial({
    side: DoubleSide, // important for interaction capture
  }),
);
scene.add(cube);

// cubemap for preview plane
const path = 'https://threejs.org/examples/textures/cube/Park2/';
const format = '.jpg';
const urls = [
  path + 'posx' + format,
  path + 'negx' + format,
  path + 'posy' + format,
  path + 'negy' + format,
  path + 'posz' + format,
  path + 'negz' + format,
];
const reflectionCube = new CubeTextureLoader().load(urls);
scene.background = reflectionCube;
// preview plane
const previewPlane = new Mesh(
  new PlaneGeometry(interactor.worldSize, interactor.worldSize),
  new MeshPhongMaterial({
    envMap: reflectionCube,
    reflectivity: 0.8,
    normalMap: interactor.texture,
    color: 0x789abc,
  }),
  // new MeshBasicMaterial({
  //   map: interactor.normalTexture,
  // }),
);
previewPlane.rotateX(-degToRad(90));
scene.add(previewPlane);

// ball with manual control
const sphere = new Mesh(
  new SphereGeometry(0.2),
  new MeshPhongMaterial({ side: DoubleSide }),
);
sphere.position.y = 0.15;
scene.add(sphere);

// debug
const gui = new GUI();
const waterFolder = gui.addFolder('Water controls');
waterFolder.add(interactor, 'damping', 0.8, 1.0, 0.01);
waterFolder.add(interactor, 'neighborsStrength', 0.8, 2.0, 0.1);
waterFolder.add(interactor, 'stopThreshold', 0, 0.03, 0.001);

function updateMouse2dPos(event: MouseEvent): void {
  const vec = new Vector3(); // create once and reuse
  const pos = new Vector3(); // create once and reuse
  vec.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5,
  );
  vec.unproject(camera);
  vec.sub(camera.position).normalize();
  const distance = -camera.position.y / vec.y;
  pos.copy(camera.position).add(vec.multiplyScalar(distance));
  sphere.position.x = pos.x;
  sphere.position.z = pos.z;
}
canvas.addEventListener('mousemove', updateMouse2dPos);

// loops updates
function loop() {
  controls.update();
  if (resizeRendererToDisplaySize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  const t = new Date().getTime() * 0.002;
  cube.position.set(Math.sin(t), 0.15, Math.cos(t));
  localStorage.setItem(
    'cameraPosition',
    JSON.stringify(camera.position.toArray()),
  );
  previewPlane.visible = false;
  interactor.render(renderer, scene);
  previewPlane.visible = true;
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
// runs a continuous loop
loop();
