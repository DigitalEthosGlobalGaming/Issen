import { readFileSync } from 'node:fs';
import { initLoadingProbe } from './loading-probe.mjs';
import { initTextureProbe } from './texture-probe.mjs';
import { initResourceProbe } from './resource-probe.mjs';
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
    `\nupdate: (dt,raw)=>window.__probe.run('updates',()=>{window.__profile?.beforeUpdate();update(dt,raw);}),\nrender: raw=>{window.__probe.frame();return window.__probe.run('renders',()=>{const result=render(raw);const uiReady=window.__loadingProbe.firstCompleteTitleMs!==null||(()=>{const state=uiMaterialLighting.snapshot();return state.available&&state.jobs>0&&state.rendered===state.jobs;})();window.__loadingProbe.frame(G.state,!sceneLoading,uiReady);return result;});},\n`,
  );
  replace(
    "if (G.panel === 'armory') drawPreview();",
    "if (G.panel === 'armory') window.__probe.run('previews',drawPreview);",
  );
  replace(
    "cvs.dataset.sceneState = 'loading';",
    "cvs.dataset.sceneState = 'loading';window.__loadingProbe.beginScene(demon?STAGES.length:G.stage);",
  );
  replace(
    "cvs.dataset.sceneState = 'ready';",
    "cvs.dataset.sceneState = 'ready';window.__loadingProbe.sceneReady();",
  );
  return {
    code: edited.toString(),
    map: edited.generateMap({ source: id, includeContent: true, hires: true }),
  };
}

export function instrumentPreview(source, id) {
  const anchor = 'surface?.native?.flush();';
  if (source.split(anchor).length !== 2) throw Error('Preview instrumentation anchor changed');
  const roomReady = source.includes('const roomMaterials =')
    ? "room.complete && room.naturalWidth > 0 && roomMaterials.ready('room')"
    : '!!room';
  const ready = `${roomReady} && inkCharm.snapshot().state==='ready' && inkCompanion.ready && inkEnemy.snapshot().ready && inkPlayer.snapshot().ready && inkSword.ready`;
  const edited = new MagicString(source);
  edited.appendLeft(
    source.indexOf(anchor) + anchor.length,
    `window.__loadingProbe.previewFrame(canvas.id,${ready});`,
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
      if (id.replaceAll('\\', '/').endsWith('/src/rendering/environment/compose.worker.ts'))
        return {
          code: `(${initTextureProbe.toString()})();(${initResourceProbe.toString()})();\n${source}`,
          map: null,
        };
      if (id.replaceAll('\\', '/').endsWith('/src/rendering/armory-preview.ts'))
        return instrumentPreview(source, id);
      if (id.replaceAll('\\', '/').endsWith('/src/game.ts'))
        return instrumentRuntime(source.replaceAll('\r\n', '\n'), id, buildId);
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          '<head>',
          `<head><script>(${initTextureProbe.toString()})();(${initResourceProbe.toString()})();(${initLoadingProbe.toString()})();(${initProbe.toString()})({reduced:new URLSearchParams(location.search).get('scenario')==='reduced-title',seed:Number(new URLSearchParams(location.search).get('seed')||424242)});</script>`,
        );
      },
    },
  };
}
