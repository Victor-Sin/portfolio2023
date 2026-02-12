/**
 * Polyfill pour GPUShaderStage sur les navigateurs sans WebGPU.
 *
 * Three.js (WebGPUConstants.js) fait :
 *   export const GPUShaderStage = (typeof self !== 'undefined') ? self.GPUShaderStage : { … };
 *
 * Sur mobile, `self` existe mais `self.GPUShaderStage` est undefined → crash.
 * Ce module doit être importé AVANT tout import de "three/webgpu" ou "three/tsl".
 */
if (typeof self !== "undefined" && !self.GPUShaderStage) {
  self.GPUShaderStage = { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };
}
