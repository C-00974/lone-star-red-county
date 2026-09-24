import { Vector2 } from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Keep Three r170's extraction, Gaussian pyramid and tinting. Composite the
// resulting texture in OutputPass, before tone mapping, instead of writing it
// back into the multisampled scene target and resolving that target a second time.
export class TextureBloomPass extends UnrealBloomPass {
  dispose() { this.materialHighPassFilter.dispose(); super.dispose(); }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    if (maskActive) throw new Error('TextureBloomPass does not support stencil masks');
    renderer.getClearColor(this._oldClearColor);
    const alpha = renderer.getClearAlpha(), autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(this.clearColor, 0);
    const draw = (material, target) => {
      this.fsQuad.material = material;
      renderer.setRenderTarget(target); renderer.clear(); this.fsQuad.render(renderer);
    };
    try {
      this.highPassUniforms.tDiffuse.value = readBuffer.texture;
      this.highPassUniforms.luminosityThreshold.value = this.threshold;
      draw(this.materialHighPassFilter, this.renderTargetBright);
      let input = this.renderTargetBright;
      for (let i = 0; i < this.nMips; i++) {
        const material = this.separableBlurMaterials[i];
        material.uniforms.colorTexture.value = input.texture;
        material.uniforms.direction.value = HORIZONTAL;
        draw(material, this.renderTargetsHorizontal[i]);
        material.uniforms.colorTexture.value = this.renderTargetsHorizontal[i].texture;
        material.uniforms.direction.value = VERTICAL;
        draw(material, this.renderTargetsVertical[i]);
        input = this.renderTargetsVertical[i];
      }
      this.compositeMaterial.uniforms.bloomStrength.value = this.strength;
      this.compositeMaterial.uniforms.bloomRadius.value = this.radius;
      this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors;
      draw(this.compositeMaterial, this.renderTargetsHorizontal[0]);
    } finally {
      renderer.setClearColor(this._oldClearColor, alpha);
      renderer.autoClear = autoClear;
    }
  }
}
const HORIZONTAL = new Vector2(1, 0), VERTICAL = new Vector2(0, 1);

export function createBloomOutput(bloom) {
  const output = new OutputPass();
  if (!bloom) return output;
  output.uniforms.tBloom = { value: bloom.renderTargetsHorizontal[0].texture };
  output.uniforms.bloomMix = { value: 1 };
  const source = output.material.fragmentShader;
  const sample = 'gl_FragColor = texture2D( tDiffuse, vUv );';
  if (!source.includes(sample)) throw new Error('Three OutputPass shader changed: review bloom integration');
  output.material.fragmentShader = source
    .replace('uniform sampler2D tDiffuse;', 'uniform sampler2D tDiffuse;\n uniform sampler2D tBloom;\n uniform float bloomMix;')
    .replace(sample, sample + '\n vec4 bloomSample = texture2D(tBloom, vUv);\n gl_FragColor += bloomSample * bloomSample.a * bloomMix;');
  const render = output.render.bind(output);
  output.render = (...args) => { output.uniforms.bloomMix.value = bloom.enabled ? 1 : 0; render(...args); };
  return output;
}
