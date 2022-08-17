import { RGFormat, Scene, ShaderMaterial, Texture, WebGLRenderer } from 'three';
import { DoubleBufferPlanarProcessor } from './DoubleBufferPlanarProcess';
import { HeightToNormalProcessor } from './HeightToNormalProcessor';
import { InteractionCapture } from './InteractionCapture';

const waterVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position =   projectionMatrix * 
                  modelViewMatrix * 
                  vec4(position,1.0);
}
`;

const waterFragmentShader = `
varying vec2 vUv;
uniform sampler2D previous;
uniform sampler2D difference;

uniform float damping;
uniform float neighborsStrength;
uniform float stopThreshold;

// value of 127 means flat
#define DATA_MIDPOINT (1.0 / 255.0 * 127.0)
// #define DATA_MIDPOINT 0.0
#define SAMPLING_DISTANCE (1.0 / 512.0)

vec2 offsets[5] = vec2[](
  vec2(0.0, 0.0),
  vec2(SAMPLING_DISTANCE, 0.0),
  vec2(-SAMPLING_DISTANCE, 0.0),
  vec2(0.0, SAMPLING_DISTANCE),
  vec2(0.0, -SAMPLING_DISTANCE)
);

void main() {
  float diff = texture2D(difference, vUv).r;
  vec2 pixels[5];
#pragma unroll_loop_start
  for (int i=0; i<5; i++) {
    pixels[i] = texture2D(previous, vUv + offsets[i]).rg;
  }
#pragma unroll_loop_end
  float neighborsZ = (pixels[1].r + pixels[2].r + pixels[3].r + pixels[4].r) / 4.0f - DATA_MIDPOINT;
  float neighborsV = (pixels[1].g + pixels[2].g + pixels[3].g + pixels[4].g) / 4.0f - DATA_MIDPOINT;
  float height = max(pixels[0].r, diff * 5.0) - DATA_MIDPOINT;
  float speed = pixels[0].g - DATA_MIDPOINT;

  float neighborsForce = (neighborsZ - height) * neighborsStrength;
  float finalZ = speed + height + neighborsForce;
  finalZ *= damping;
  // finalZ = (abs(finalZ) < 0.01) ? 0.0 : finalZ;

  float finalV = finalZ - height;
  finalV *= 1.02;
  // finalV *= damping;
  // finalV = (abs(finalV) < 0.01) ? 0.0 : finalV;

  if (abs(finalZ) < stopThreshold && abs(finalV) < stopThreshold) {
    finalZ = 0.0;
    finalV = 0.0;
  }

  gl_FragColor.rg = vec2(finalZ + DATA_MIDPOINT, finalV + DATA_MIDPOINT);
}
`;

export class WaterInteractor extends InteractionCapture {
  private waterProcessor: DoubleBufferPlanarProcessor;
  private heightToNormalProcessor: HeightToNormalProcessor;
  public damping = 0.97;
  public neighborsStrength = 1.5;
  public stopThreshold = 0.007;
  constructor(
    worldSize: number,
    reactionDistance: number,
    reactionDepth = 0.1,
    textureResolution = 256,
  ) {
    super(worldSize, reactionDistance, reactionDepth, textureResolution);
    this.waterProcessor = new DoubleBufferPlanarProcessor(
      new ShaderMaterial({
        fragmentShader: waterFragmentShader,
        vertexShader: waterVertexShader,
      }),
      textureResolution,
      {
        format: RGFormat,
      },
    );
    this.heightToNormalProcessor = new HeightToNormalProcessor(
      textureResolution,
    );
  }
  get texture(): Texture {
    return this.heightToNormalProcessor.texture;
  }
  get normalTexture(): Texture {
    return this.waterProcessor.texture;
  }
  render(renderer: WebGLRenderer, scene: Scene): void {
    super.render(renderer, scene);
    this.waterProcessor.setUniform('previous', this.waterProcessor.oldTexture);
    this.waterProcessor.setUniform('difference', this.processor.texture);
    this.waterProcessor.setUniform('damping', this.damping);
    this.waterProcessor.setUniform('neighborsStrength', this.neighborsStrength);
    this.waterProcessor.setUniform('stopThreshold', this.stopThreshold);
    this.waterProcessor.render(renderer);
    this.heightToNormalProcessor.processHeightmap(
      renderer,
      this.waterProcessor.texture,
    );
  }
}
