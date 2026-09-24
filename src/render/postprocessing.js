import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { TextureBloomPass, createBloomOutput } from './bloom.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export function createPostChain(renderer, scene, camera, w, h, quality, opts = {}) {
  const pr = renderer.getPixelRatio();
  const mobile = !!opts.mobile;
  const target = new THREE.WebGLRenderTarget(Math.floor(w * pr), Math.floor(h * pr), {
    // HalfFloat bloom targets are a common iOS Safari black-screen / context-loss trigger
    type: mobile ? THREE.UnsignedByteType : THREE.HalfFloatType,
    samples: mobile ? 0 : quality.msaa,
    colorSpace: THREE.LinearSRGBColorSpace,
  });
  const composer = new EffectComposer(renderer, target);
  // A custom target has physical dimensions. Give the composer logical dimensions
  // before adding passes, otherwise addPass applies the pixel ratio a second time.
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = quality.bloom ? new TextureBloomPass(new THREE.Vector2(w, h), .2, .38, 1) : null;
  if (bloom) composer.addPass(bloom);
  composer.addPass(createBloomOutput(bloom));
  const fxaa = quality.msaa === 0 ? new ShaderPass(FXAAShader) : null;
  if (fxaa) {
    fxaa.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
    composer.addPass(fxaa);
  }
  return { composer, bloom, fxaa };
}

export function disposePostChain(composer) {
  if (!composer) return;
  // EffectComposer owns its ping-pong targets; each pass owns its own resources.
  for (const pass of composer.passes) pass.dispose?.();
  composer.dispose();
}
