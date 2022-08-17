import {
  DepthTexture,
  NearestFilter,
  OrthographicCamera,
  RedFormat,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { PlanarProcessor } from './PlanarProcessor';

const diffVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position =   projectionMatrix * 
                  modelViewMatrix * 
                  vec4(position,1.0);
}
`;

const diffFragmentShader = `
varying vec2 vUv;
uniform sampler2D current;
uniform sampler2D previous;

void main() {
  float diff = abs(texture2D(current, vUv).r - texture2D(previous, vUv).r);
  gl_FragColor.r = diff;
}
`;

export class InteractionCapture extends OrthographicCamera {
  private previousInteraction: WebGLRenderTarget;
  private currentInteraction: WebGLRenderTarget;
  protected processor: PlanarProcessor;

  constructor(
    public worldSize: number,
    reactionDistance: number,
    reactionDepth = 0.1,
    private textureResolution = 256,
  ) {
    super(
      -worldSize / 2,
      worldSize / 2,
      -worldSize / 2,
      worldSize / 2,
      reactionDistance,
      reactionDistance + reactionDepth,
    );
    this.previousInteraction = this.makeTexture();
    this.currentInteraction = this.makeTexture();
    this.processor = new PlanarProcessor(
      new ShaderMaterial({
        fragmentShader: diffFragmentShader,
        vertexShader: diffVertexShader,
      }),
      textureResolution,
      {
        format: RedFormat,
      },
    );
  }

  protected makeTexture(): WebGLRenderTarget {
    return new WebGLRenderTarget(
      this.textureResolution,
      this.textureResolution,
      {
        depthBuffer: true,
        depthTexture: new DepthTexture(
          this.textureResolution,
          this.textureResolution,
        ),
        generateMipmaps: false,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
      },
    );
  }

  render(renderer: WebGLRenderer, scene: Scene): void {
    const tmp = this.previousInteraction;
    this.previousInteraction = this.currentInteraction;
    this.currentInteraction = tmp;
    renderer.setRenderTarget(this.currentInteraction);
    this.processor.setUniform('current', this.currentInteraction.depthTexture);
    this.processor.setUniform(
      'previous',
      this.previousInteraction.depthTexture,
    );
    renderer.render(scene, this);
    this.processor.render(renderer);
  }
}
