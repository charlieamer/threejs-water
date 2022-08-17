import {
  WebGLRenderTarget,
  ShaderMaterial,
  WebGLRenderTargetOptions,
  WebGLRenderer,
  Texture,
} from 'three';
import { PlanarProcessor } from './PlanarProcessor';

export class DoubleBufferPlanarProcessor extends PlanarProcessor {
  private oldResult: WebGLRenderTarget;
  constructor(
    material: ShaderMaterial,
    resolution: number,
    options?: WebGLRenderTargetOptions,
  ) {
    super(material, resolution, options);
    this.oldResult = new WebGLRenderTarget(resolution, resolution, options);
  }
  render(renderer: WebGLRenderer, swapBuffers = true): void {
    super.render(renderer);
    if (swapBuffers) {
      this.swap();
    }
  }
  swap(): void {
    const tmp = this.result;
    this.result = this.oldResult;
    this.oldResult = tmp;
  }

  get oldTexture(): Texture {
    return this.oldResult.texture;
  }
}
