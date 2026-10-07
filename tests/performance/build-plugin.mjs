import { readFileSync } from 'node:fs';
import { initProbe } from './probe.mjs';
import MagicString from 'magic-string';

export function instrumentRuntime(source, id = 'src/game.ts', buildId = 'test') {
  const edited = new MagicString(source);
  const replace = (pattern, value) => {
    const count =
      typeof pattern === 'string'
        ? source.split(pattern).length - 1
        : [...source.matchAll(new RegExp(pattern.source, 'g'))].length;
    if (count !== 1)
      throw new Error(`Performance instrumentation anchor changed: ${pattern} (${count} matches)`);
    const match =
      typeof pattern === 'string'
        ? { index: source.indexOf(pattern), 0: pattern }
        : source.match(pattern);
    edited.overwrite(match.index, match.index + match[0].length, value);
  };
  const hook = readFileSync(new URL('./runtime-hook.txt', import.meta.url), 'utf8');
  replace(
    'if (pageActive()) frameLoop.start();',
    `${hook}\nwindow.__profile.schemaVersion = 1; window.__profile.buildId = ${JSON.stringify(buildId)}; window.__profile.readyMs = performance.now(); if (pageActive()) frameLoop.start();`,
  );
  replace(
    /\n\s*update,\n\s*render,\n/,
    `\nupdate: (dt,raw)=>window.__probe.run('updates',()=>{window.__profile?.beforeUpdate();update(dt,raw);}),\nrender: raw=>{window.__probe.frame();return window.__probe.run('renders',()=>render(raw));},\n`,
  );
  replace(
    "if (G.panel === 'armory') drawPreview();",
    "if (G.panel === 'armory') window.__probe.run('previews',drawPreview);",
  );
  return {
    code: edited.toString(),
    map: edited.generateMap({ source: id, includeContent: true, hires: true }),
  };
}

// This plugin is loaded ONLY by the performance runner's programmatic build.
export function performancePlugin(buildId) {
  return {
    name: 'issen-performance-fixture',
    enforce: 'pre',
    transform(source, id) {
      if (id.replaceAll('\\', '/').endsWith('/src/game.ts'))
        return instrumentRuntime(source.replaceAll('\r\n', '\n'), id, buildId);
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          '<head>',
          `<head><script>(${initProbe.toString()})({reduced:new URLSearchParams(location.search).get('scenario')==='reduced-title',seed:Number(new URLSearchParams(location.search).get('seed')||424242)});</script>`,
        );
      },
    },
  };
}
