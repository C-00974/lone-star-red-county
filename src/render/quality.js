/** Soft Open quality — tiny strip can afford high shadows. */
export function qualityPreset() {
  return {
    shadow: 4096,
    shadowRadius: 48,
    msaa: 4,
    bloom: true,
    pixelRatio: 2,
  };
}
