/** One linear-space light lookup and display response for all scene colour geometry. */
export const lightingCompositeFunctions = `
uniform sampler2D uLightDiffuse;
uniform sampler2D uLightSpecular;
uniform vec2 uLightSize;
vec3 toLinear(vec3 colour) {
  return mix(colour / 12.92, pow((colour + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), colour));
}
vec3 toDisplay(vec3 colour) {
  return mix(colour * 12.92, 1.055 * pow(colour, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), colour));
}
vec3 highlightRolloff(vec3 colour) {
  colour = max(colour, vec3(0.0));
  float peak = max(colour.r, max(colour.g, colour.b));
  if (peak <= 0.8) return colour;
  float mapped = 0.8 + 0.2 * (1.0 - exp(-(peak - 0.8) / 0.2));
  return colour * (mapped / peak);
}
vec3 sceneLightColour(vec3 original, vec2 position, vec3 emission) {
  vec2 uv = position / uLightSize;
  vec3 result = toLinear(original) * texture(uLightDiffuse, uv).rgb
    + texture(uLightSpecular, uv).rgb + emission;
  return toDisplay(highlightRolloff(result));
}
`;
