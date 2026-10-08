/** One linear-space light lookup and display response for all scene colour geometry. */
export const lightingCompositeFunctions = `
precision highp float;
uniform sampler2D uLightDiffuse;
uniform sampler2D uLightSpecular;
uniform vec2 uLightSize;
uniform vec2 uLightResolution;
uniform sampler2D uLightGuide;
vec3 lookupNormal(vec2 encoded) {
  vec2 xy = encoded * 2.0 - 1.0;
  vec3 n = vec3(xy, 1.0 - abs(xy.x) - abs(xy.y));
  if (n.z < 0.0) n.xy = (1.0 - abs(n.yx)) * mix(vec2(-1.0), vec2(1.0), step(vec2(0.0), n.xy));
  return n * inversesqrt(max(dot(n,n), 0.000001));
}
void sceneLightLookup(vec2 uv, out vec3 diffuse, out vec3 specular) {
  if (all(equal(uLightResolution, uLightSize))) {
    diffuse = texture(uLightDiffuse, uv).rgb;
    specular = texture(uLightSpecular, uv).rgb;
    return;
  }
  vec4 centre = texture(uLightGuide, uv);
  vec3 normal = lookupNormal(centre.xy);
  vec2 grid = uv * uLightResolution - 0.5;
  vec2 origin = floor(grid), fraction = fract(grid);
  diffuse = vec3(0.0); specular = vec3(0.0);
  float total = 0.0, bestMetric = 10000.0;
  vec3 nearestDiffuse = vec3(0.0), nearestSpecular = vec3(0.0);
  for (int i = 0; i < 4; ++i) {
    vec2 offset = vec2(mod(float(i), 2.0), floor(float(i) * 0.5));
    vec2 pixel = clamp(origin + offset, vec2(0.0), uLightResolution - 1.0);
    vec2 sampleUv = (pixel + 0.5) / uLightResolution;
    vec4 guide = texture(uLightGuide, sampleUv);
    float depthError = abs(guide.z - centre.z) * 255.0;
    float normalError = max(0.0, 1.0 - dot(normal, lookupNormal(guide.xy)));
    float coverageError = abs(step(0.001, guide.a) - step(0.001, centre.a));
    float metric = depthError * 8.0 + normalError * 64.0 + coverageError * 1000.0;
    vec2 spatial = mix(1.0 - fraction, fraction, offset);
    float weight = spatial.x * spatial.y * exp2(-metric);
    vec3 d = texture(uLightDiffuse, sampleUv).rgb;
    vec3 s = texture(uLightSpecular, sampleUv).rgb;
    diffuse += d * weight; specular += s * weight; total += weight;
    if (metric < bestMetric) { bestMetric = metric; nearestDiffuse = d; nearestSpecular = s; }
  }
  // A feature missing every coarse sample uses the most compatible neighbour.
  // This remains the same accumulated-light lookup, never a second BRDF pass.
  if (total > 0.00001) { diffuse /= total; specular /= total; }
  else { diffuse = nearestDiffuse; specular = nearestSpecular; }
}
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
  vec3 diffuse, specular;
  sceneLightLookup(uv, diffuse, specular);
  vec3 result = toLinear(original) * diffuse + specular + emission;
  return toDisplay(highlightRolloff(result));
}
`;
