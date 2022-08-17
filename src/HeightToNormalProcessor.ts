import {
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  WebGLRenderTargetOptions,
} from 'three';
import { PlanarProcessor } from './PlanarProcessor';

const normalVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position =   projectionMatrix * 
                  modelViewMatrix * 
                  vec4(position,1.0);
}
`;

const normalFragmentShader = `
varying vec2 vUv;
uniform float distance;
uniform float strength;
uniform sampler2D inputTexture;

float getHeight(vec2 uv) {
  return texture(inputTexture, uv).r;
}

vec3 bumpFromDepth(vec2 uv, float scale) {
    
  float height = getHeight(uv);
    
  vec2 dxy = height - vec2(
      getHeight(uv + vec2(distance, 0.)), 
      getHeight(uv + vec2(0., distance))
  );

  vec3 ret = normalize(vec3(dxy * scale / distance, 1.));
  return ret;
}


void main() {
  gl_FragColor = vec4(bumpFromDepth(vUv, strength).rgb * .5 + .5, 1.);
}
`;

export class HeightToNormalProcessor extends PlanarProcessor {
  constructor(
    resolution: number,
    options?: WebGLRenderTargetOptions,
    public distance = 5.0 / resolution,
    public strength = 0.0002,
  ) {
    super(
      new ShaderMaterial({
        fragmentShader: normalFragmentShader,
        vertexShader: normalVertexShader,
      }),
      resolution,
      options,
    );
  }
  processHeightmap(renderer: WebGLRenderer, heightmap: Texture): void {
    this.setUniform('inputTexture', heightmap);
    this.setUniform('distance', this.distance);
    this.setUniform('strength', this.strength);
    super.render(renderer);
  }
}
