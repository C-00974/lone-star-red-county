import { PMREMGenerator, REVISION } from 'three';

// Sky-only fromScene adapter for pinned Three r170. Its public API has no output
// target argument. Never use this generator for other environment input types.
export class ReusableSkyPMREMGenerator extends PMREMGenerator {
  _allocateTargets() {
    // A dependency or capture-size change uses the ordinary allocation path.
    if (REVISION !== '170' || this._cubeSize !== 256) return super._allocateTargets();
    if (!this._skyOutputTarget) this._skyOutputTarget = super._allocateTargets();
    // fromScene cleanup disables scissoring; a new target starts enabled.
    this._skyOutputTarget.scissorTest = true;
    return this._skyOutputTarget;
  }
  dispose() {
    // Lighting owns and disposes the output. Three owns its internal pingpong.
    this._skyOutputTarget = null;
    super.dispose();
  }
}
