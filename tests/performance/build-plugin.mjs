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
      throw new Error(
        'Performance instrumentation anchor changed: ' + pattern + ' (' + count + ' matches)',
      );
    const match =
      typeof pattern === 'string'
        ? { index: source.indexOf(pattern), 0: pattern }
        : source.match(pattern);
    edited.overwrite(match.index, match.index + match[0].length, value);
  };
  if (id.endsWith('frame-bindings.ts')) {
    replace(
      /\n\s*update,\n\s*render,\n\s*afterRender: /,
      "\nupdate: (dt,raw)=>window.__probe.run('updates',()=>{window.__profile?.beforeUpdate();update(dt,raw);}),\nrender: raw=>{window.__probe.frame();return window.__probe.run('renders',()=>render(raw));},\nafterRender: ",
    );
    replace(
      "if (G.panel === 'armory') drawPreview();",
      "if (G.panel === 'armory') window.__probe.run('previews',drawPreview);",
    );
  } else {
    edited.prepend(
      "import { STAGES } from './game/content/stages.ts';\nimport { OPP } from './shared/directions.ts';\n",
    );
    let hook = readFileSync(new URL('./runtime-hook.txt', import.meta.url), 'utf8');
    for (const [name, expression] of Object.entries({
      time: 'foundation.view.presentationState.time',
      W: 'foundation.view.geometry.W',
      H: 'foundation.view.geometry.H',
      activeTrial: 'foundation.run.activity.activeTrial',
      EQ: 'foundation.profile.profileEquipment.EQ',
    }))
      hook = hook.replace(new RegExp('\\b' + name + '\\b', 'g'), expression);
    hook = hook.replace(
      'kills:G.kills,foundation.view.presentationState.time,',
      'kills:G.kills,time:foundation.view.presentationState.time,',
    );
    const aliases =
      'const { G } = foundation.run; const { fx } = foundation.view.presentationState; const { frameLoop } = frames; const { startRun,spawnEnemy,enemyPos,killEnemy,startTrial,pause,onSwipe } = game; const { openPanel,closePanel,cinematic,previewStage } = controls; const { cvs,environmentRenderer } = foundation.browser;';
    replace(
      'if (pageActive()) frames.frameLoop.start();',
      aliases +
        '\n' +
        hook +
        '\nwindow.__profile.schemaVersion = 1; window.__profile.buildId = ' +
        JSON.stringify(buildId) +
        '; window.__profile.readyMs = performance.now(); if (pageActive()) frames.frameLoop.start();',
    );
  }
  return {
    code: edited.toString(),
    map: edited.generateMap({ source: id, includeContent: true, hires: true }),
  };
}

// Loaded only by the opt-in performance runner.
export function performancePlugin(buildId) {
  return {
    name: 'issen-performance-fixture',
    enforce: 'pre',
    transform(source, id) {
      if (id.replaceAll('\\', '/').match(/\/src\/(game\.ts|runtime\/frame-bindings\.ts)$/))
        return instrumentRuntime(source.replaceAll('\r\n', '\n'), id, buildId);
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          '<head>',
          '<head><script>(' +
            initProbe.toString() +
            ')({reduced:new URLSearchParams(location.search).get("scenario")==="reduced-title",seed:Number(new URLSearchParams(location.search).get("seed")||424242)});</script>',
        );
      },
    },
  };
}
