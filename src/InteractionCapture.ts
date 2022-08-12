import {
  DepthTexture,
  NearestFilter,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';

export class InteractionCapture extends OrthographicCamera {
  private previousInteraction: WebGLRenderTarget;
  private currentInteraction: WebGLRenderTarget;
  private interactionDiff: WebGLRenderTarget;

  constructor(
    worldSize: number,
    reactionDistance: number,
    public reactionDepth = 0.1,
    private textureResolution = 256,
  ) {
    super(
      -worldSize / 2,
      worldSize / 2,
      -worldSize / 2,
      worldSize / 2,
      0.1,
      10,
      // reactionDistance,
      // reactionDistance + reactionDepth,
    );
    this.previousInteraction = this.makeTexture();
    this.currentInteraction = this.makeTexture();
    this.interactionDiff = this.makeTexture();
  }

  private makeTexture() {
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
        format: RGBAFormat,
      },
    );
  }

  render(renderer: WebGLRenderer, scene: Scene): void {
    renderer.setRenderTarget(this.currentInteraction);
    renderer.render(scene, this);
    renderer.setRenderTarget(null);
  }

  get texture(): Texture {
    return this.currentInteraction.texture;
  }
}
