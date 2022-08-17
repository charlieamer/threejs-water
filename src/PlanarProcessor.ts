import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget,
  WebGLRenderTargetOptions,
} from 'three';

export class PlanarProcessor {
  private camera: OrthographicCamera;
  private scene: Scene;
  protected result: WebGLRenderTarget;
  constructor(
    private material: ShaderMaterial,
    resolution: number,
    options?: WebGLRenderTargetOptions,
  ) {
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postPlane = new PlaneGeometry(2, 2);
    const postQuad = new Mesh(postPlane, material);
    this.scene = new Scene();
    this.scene.add(postQuad);
    this.result = new WebGLRenderTarget(resolution, resolution, options);
  }
  render(renderer: WebGLRenderer): void {
    renderer.setRenderTarget(this.result);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(null);
  }
  setUniforms(uniforms: ShaderMaterial['uniforms']): void {
    this.material.uniforms = uniforms;
  }
  setUniform(name: string, value: unknown): void {
    if (!this.material.uniforms[name]) {
      this.material.uniforms[name] = {
        value,
      };
    } else {
      this.material.uniforms[name].value = value;
    }
  }

  get texture(): Texture {
    return this.result.texture;
  }
}
