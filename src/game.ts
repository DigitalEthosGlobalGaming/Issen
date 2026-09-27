import type { Item, ItemCategory } from './game/content/items.ts';
import type { Enemy } from './game/combat/enemy.ts';
import type { Boss } from './game/encounters/boss.ts';
import type { Screen } from './game/run-state.ts';
import type { Direction } from './shared/directions.ts';
import type { Figure } from './rendering/figures/types.ts';
import type { GrassBlade, Leaf } from './rendering/scene/ambient.ts';
import type { WeatherParticle, Bamboo } from './rendering/scene/weather-state.ts';
import { createLifecycle } from './platform/lifecycle.ts';
import { createFrameLoop } from './platform/frame-loop.ts';
import { createHud } from './ui/hud.ts';
import { createRunState, resetRun } from './game/run-state.ts';
import { createArmoryPreview } from './rendering/armory-preview.ts';
import { createArmoryScreen } from './ui/screens/armory.ts';
import { createShareCard } from './ui/share-card.ts';
import { renderGameOver, ITEM_TYPE_LABEL as TYPE_WORD } from './ui/screens/game-over.ts';
import { recordRun } from './game/progression/run-records.ts';
import { resolveDamage } from './game/combat/damage.ts';
import {
  createStandoff,
  updateStandoff as simulateStandoff,
  resolveStandoffSwipe,
} from './game/encounters/standoff.ts';
import { targetSwipe } from './game/combat/targeting.ts';
import { setMirror, parryOpening } from './game/encounters/boss-openings.ts';
import { createBoss } from './game/encounters/boss-create.ts';
import { bossPosition } from './rendering/figures/boss-position.ts';
import { bossToIdle, updateBoss as simulateBoss } from './game/encounters/boss-update.ts';
import { initialSpawns, updateWave as simulateWave } from './game/encounters/waves.ts';
import {
  pickEnemyLook,
  spawnEnemy as createEnemy,
  orderedEnemies,
  selectAttacker,
} from './game/combat/enemy-spawn.ts';
import { enemyPosition } from './rendering/figures/enemy-position.ts';
import { updateEnemies as simulateEnemies } from './game/combat/enemy-update.ts';
import { createAmbient } from './rendering/scene/ambient.ts';
import { createWeatherRenderer } from './rendering/scene/weather-draw.ts';
import { createWeatherParticles } from './rendering/scene/weather-particles.ts';
import { createWeatherState } from './rendering/scene/weather-state.ts';
import { updateWeather as simulateWeather } from './rendering/scene/weather-update.ts';
import {
  REST_POSE as PREST,
  createPlayerAnimation,
  startSwing,
  updatePlayerAnimation,
} from './rendering/figures/player.ts';
import { comboMultiplier, scoreGain } from './game/progression/scoring.ts';
import { createEffectSpawner } from './rendering/effects/spawn.ts';
import { createEffectRenderer } from './rendering/effects/draw.ts';
import { createEffects } from './rendering/effects/state.ts';
import { updateEffects } from './rendering/effects/update.ts';
import { shrineOffers, applyBlessing } from './game/shrine/blessings.ts';
import { renderShrine } from './ui/screens/shrine.ts';
import { createNotifications } from './ui/notifications.ts';
import { modeKey as getModeKey } from './game/progression/modes.ts';
import { renderStatistics } from './ui/screens/stats.ts';
import { createFigureRenderer } from './rendering/figures/figure.ts';
import { unlockEligibleItems } from './game/progression/unlocks.ts';
import { makeFig, EPOSE, mixPose, approachPose } from './rendering/figures/model.ts';
import { applyFilm } from './rendering/effects/film.ts';
import { blob, createBackground } from './rendering/scene/background.ts';
import { BASE, createPalette } from './rendering/palette.ts';
import { drawEnso as renderEnso } from './rendering/glyphs.ts';
import { waveConfig, bossParameters } from './game/encounters/configuration.ts';
import { bindPointer } from './input/pointer.ts';
import { bindKeyboard } from './input/keyboard.ts';
import { createSetupScreen } from './ui/screens/setup.ts';
import { createSharing } from './platform/sharing.ts';
import { createLayout } from './rendering/layout.ts';
import { BLADES, ROBES } from './game/content/cosmetics.ts';
import { SPECIAL } from './game/content/awakenings.ts';
import { FORTUNES } from './game/content/fortunes.ts';
import { BLESS, TIER, TIERNAME, BLESS_BY } from './game/content/blessings.ts';
import { loadStatistics, loadSetup, loadUnlocks, loadEquipment } from './platform/saves.ts';
import { createItems } from './game/content/items.ts';
import { deathsTotal } from './game/progression/statistics.ts';
import { createAudio } from './audio/audio.ts';
import { computeModifiers } from './game/equipment/modifiers.ts';
import { store } from './platform/storage.ts';
import { STAGES } from './game/content/stages.ts';
import { TAU, clamp, lerp, easeOut, easeInOut, angDiff } from './shared/math.ts';
import { rng, shuffle } from './shared/random.ts';
import { DIRS, OPP, DANG } from './shared/directions.ts';
import { kanji, roman } from './shared/format.ts';
import { buzz } from './platform/haptics.ts';
export function startGame(): () => void {
  const lifecycle = createLifecycle();
  ('use strict');
  function $(id: 'c' | 'prevC'): HTMLCanvasElement;
  function $(id: 'shareImg'): HTMLImageElement;
  function $(id: 'bAgain'): HTMLButtonElement;
  function $(id: string): HTMLElement;
  function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error('Missing game element ' + id);
    return el;
  }
  function context2d(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D unavailable');
    return context;
  }
  const cvs = $('c'),
    mainG = context2d(cvs);
  const g = mainG;
  const R = Math.random;
  const FONT = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';

  const PZ = 0.78; // perfect-cut zone starts at this fraction of the attack ring

  /* ---------------- stages ---------------- */
  /* ---------------- layout ---------------- */
  let W = 1,
    H = 1,
    DPR = 1,
    S = 1,
    portrait = true;
  let L: ReturnType<typeof createLayout> & {
    glows?: ReturnType<typeof createBackground>['glows'];
  } = createLayout(1, 1);
  function layout() {
    portrait = H >= W * 0.9;
    S = Math.max(W, H) / 900;
    L = createLayout(W, H);
  }

  /* ---------------- colours ---------------- */
  let MIST: number[] = [146, 141, 132];
  const palette = createPalette();
  const cols = (fog: number) => palette.fog(fog, MIST);
  /* ---------------- armory data ---------------- */
  const ITEMS = createItems(() => UNL);
  const BASEBLADE = {
    len: 0.52,
    d: '#5c5a56',
    m: '#a8a59f',
    l: '#f6f3ec',
    edge: 'rgba(255,253,246,.9)',
  };
  const CHARMCOL: Record<string, string> = {
    suzu: '#b8923a',
    maneki: '#b0322a',
    daruma: '#8c1f14',
    kitsunebi: '#2f5c8a',
    furin: '#3f7a8c',
    ofuda: '#7a6a4a',
    kinun: '#a67c22',
    kachi: '#1f4a2a',
    shingan: '#5a2a6a',
    ryoen: '#a8456a',
    kagami: '#5f6b75',
    omikuji: '#6b5a3a',
    hisshou: '#a3271d',
    kaiun: '#b8923a',
    yakuyoke: '#2d3e72',
    enmei: '#2f6f55',
    shobai: '#9c7a1f',
    kotsu: '#7a7466',
    gakugyo: '#6b3f7a',
  };
  const ITEM_BY: Record<string, Item> = {};
  for (const it of ITEMS) ITEM_BY[it.id] = it;
  const robePal = palette.robe;

  /* ---------------- persistent stats & unlocks ---------------- */

  const ST = loadStatistics();
  const SETUP = loadSetup();
  const saveStats = () => store.set('issen.stats', ST);
  const UNL = loadUnlocks();
  const EQ = loadEquipment(UNL, ITEMS);
  const SEALS: Record<string, string> = {
    verm: '#a3271d',
    gold: '#a67c22',
    indigo: '#2d3e72',
    jade: '#2f6f55',
    sumiseal: '#1b1a18',
  };
  let SEAL = '#a3271d',
    SEALARC = '#a3271d';
  function applySeal() {
    SEAL = SEALS[EQ.seal] || '#a3271d';
    SEALARC = EQ.seal === 'sumiseal' ? '#e9e3d6' : SEAL;
    document.documentElement.style.setProperty('--seal', SEAL);
  }

  /* ---------------- background ---------------- */
  let bg: HTMLCanvasElement | null = null,
    prevBg: HTMLCanvasElement | null = null,
    stageFade = 0;
  function buildBG() {
    const result = createBackground(W, H, DPR, G.stage);
    bg = result.canvas;
    L.glows = result.glows;
  }

  /* ---------------- ambient ---------------- */
  let mistSprite: HTMLCanvasElement | null = null,
    vig: HTMLCanvasElement | null = null;
  let mists: { x: number; y: number; w: number; h: number; a: number; v: number }[] = [],
    fg: GrassBlade[] = [],
    mid: GrassBlade[] = [],
    leaves: Leaf[] = [],
    wx: WeatherParticle[] = [];
  const grainCanv: HTMLCanvasElement[] = [],
    grainPats: (CanvasPattern | null)[] = [];
  const WX = createWeatherState(() => 0.5);
  function buildMist() {
    const st = STAGES[G.stage]!;
    mistSprite = document.createElement('canvas');
    mistSprite.width = mistSprite.height = 128;
    const m = context2d(mistSprite);
    const gr = m.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${st.mist},1)`);
    gr.addColorStop(0.5, `rgba(${st.mist},.45)`);
    gr.addColorStop(1, `rgba(${st.mist},0)`);
    m.fillStyle = gr;
    m.fillRect(0, 0, 128, 128);
    mists = [];
    for (let i = 0; i < 10; i++)
      mists.push({
        x: R() * W,
        y: L.horizonY + R() * (L.groundY - L.horizonY + H * 0.06),
        w: W * (0.45 + R() * 0.7),
        h: H * (0.05 + R() * 0.07),
        a: 0.08 + R() * 0.13,
        v: (5 + R() * 12) * S,
      });
  }
  function ambient() {
    return createAmbient({ width: W, height: H, scale: S, layout: L, random: R });
  }
  function buildGrass() {
    const built = ambient().buildGrass(STAGES[G.stage]!.gl);
    fg = built.fg;
    mid = built.mid;
  }
  function newLeaf(anywhere: boolean) {
    return ambient().newLeaf(anywhere);
  }
  function buildLeaves() {
    leaves = ambient().buildLeaves();
  }
  function gustLeaves(n: number) {
    ambient().gustLeaves(leaves, n);
  }
  let bamboo: Bamboo[] = [],
    smokeSprite: HTMLCanvasElement | null = null;
  function buildWeather() {
    const w = STAGES[G.stage]!.weather;
    const built = createWeatherParticles(w, W, H, S, R);
    wx = built.particles;
    bamboo = built.bamboo;
    if (w === 'smoke') {
      if (!smokeSprite) {
        smokeSprite = document.createElement('canvas');
        smokeSprite.width = smokeSprite.height = 128;
        const m = context2d(smokeSprite);
        const gr = m.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, 'rgba(14,12,11,1)');
        gr.addColorStop(0.55, 'rgba(14,12,11,.6)');
        gr.addColorStop(1, 'rgba(14,12,11,0)');
        m.fillStyle = gr;
        m.fillRect(0, 0, 128, 128);
      }
    }
    Object.assign(WX, createWeatherState(R));
  }
  function buildPost() {
    if (!grainCanv.length) {
      for (let k = 0; k < 3; k++) {
        const c = document.createElement('canvas');
        c.width = c.height = 180;
        const x = context2d(c);
        const id = x.createImageData(180, 180);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = R() < 0.5 ? 0 : 255;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = R() * 36;
        }
        x.putImageData(id, 0, 0);
        grainCanv.push(c);
        grainPats.push(mainG.createPattern(c, 'repeat'));
      }
    }
    vig = document.createElement('canvas');
    vig.width = Math.max(1, Math.round(W));
    vig.height = Math.max(1, Math.round(H));
    const v = context2d(vig);
    const gr = v.createRadialGradient(
      W / 2,
      H * 0.46,
      Math.min(W, H) * 0.25,
      W / 2,
      H * 0.46,
      Math.max(W, H) * 0.78,
    );
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.55, 'rgba(0,0,0,.16)');
    gr.addColorStop(1, 'rgba(0,0,0,.72)');
    v.fillStyle = gr;
    v.fillRect(0, 0, W, H);
    inkEdge = document.createElement('canvas');
    inkEdge.width = vig.width;
    inkEdge.height = vig.height;
    const k = context2d(inkEdge),
      m = Math.min(W, H),
      r2 = rng(99);
    const fr = k.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.32,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.72,
    );
    fr.addColorStop(0, 'rgba(14,5,4,0)');
    fr.addColorStop(1, 'rgba(14,5,4,.85)');
    k.fillStyle = fr;
    k.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const sd = (r2() * 4) | 0,
        t = r2(),
        rad = m * (0.05 + r2() * 0.14);
      const x = sd === 0 ? t * W : sd === 1 ? W + rad * 0.3 : sd === 2 ? t * W : -rad * 0.3,
        y = sd === 0 ? -rad * 0.3 : sd === 1 ? t * H : sd === 2 ? H + rad * 0.3 : t * H;
      const rg = k.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, 'rgba(12,4,3,.95)');
      rg.addColorStop(0.6, 'rgba(12,4,3,.6)');
      rg.addColorStop(1, 'rgba(12,4,3,0)');
      k.fillStyle = rg;
      k.beginPath();
      k.arc(x, y, rad, 0, TAU);
      k.fill();
    }
  }
  let inkEdge: HTMLCanvasElement | null = null,
    inkA = 0,
    inkPulse = 0,
    hbT = 0,
    hbP = 0;
  function setStage(si: number, anim: boolean) {
    if (anim && bg) {
      prevBg = bg;
      stageFade = 1;
    }
    G.stage = si;
    MIST = STAGES[si]!.fog;
    palette.clearFog();
    buildBG();
    buildMist();
    buildGrass();
    buildWeather();
  }
  function blades(list: GrassBlade[], t: number) {
    ambient().blades(g, list, t, wind);
  }
  function drawLeaves(front: boolean) {
    ambient().drawLeaves(g, leaves, front);
  }
  function weatherRenderer() {
    return createWeatherRenderer(g, {
      weather: STAGES[G.stage]!.weather,
      width: W,
      height: H,
      scale: S,
      time,
      wind,
      hazard: G.m.hazard,
      particles: wx,
      bamboo,
      state: WX,
      smokeSprite,
    });
  }
  function drawWeather() {
    weatherRenderer().drawWeather();
  }
  function drawSmoke() {
    weatherRenderer().drawSmoke();
  }
  function drawBamboo() {
    weatherRenderer().drawBamboo();
  }
  /* ---------------- figures ---------------- */
  function figureRenderer() {
    return createFigureRenderer(g, {
      time,
      wind,
      petActive: G.petT > 0,
      width: W,
      height: H,
      palette: cols,
      random: R,
    });
  }
  function drawFigure(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawFigure']>) {
    return figureRenderer().drawFigure(...args);
  }
  function drawSplit(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawSplit']>) {
    return figureRenderer().drawSplit(...args);
  }
  function drawPetAt(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawPetAt']>) {
    return figureRenderer().drawPetAt(...args);
  }
  function drawSword(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawSword']>) {
    return figureRenderer().drawSword(...args);
  }
  function drawGlint(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawGlint']>) {
    return figureRenderer().drawGlint(...args);
  }
  function tipOf(...args: Parameters<ReturnType<typeof createFigureRenderer>['tipOf']>) {
    return figureRenderer().tipOf(...args);
  }
  function petOf() {
    return EQ.pet === 'nopet' && EQ.robe === 'scarecrow' ? 'crow' : EQ.pet;
  }
  function drawFoxfire() {
    if (!G.m || !G.m.foxfire) return;
    const p = L.player,
      x = p.x + p.h * 0.34 + Math.cos(time * 1.4) * p.h * 0.05,
      y = p.y - p.h * 1.02 + Math.sin(time * 2.8) * p.h * 0.025,
      r = Math.max(6, p.h * 0.035),
      a = G.foxUsed && G.state !== 'title' ? 0.22 : 0.9;
    g.save();
    g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(x, y, 0, x, y, r * 2.4);
    rg.addColorStop(0, `rgba(170,215,255,${a})`);
    rg.addColorStop(0.4, `rgba(90,150,255,${a * 0.5})`);
    rg.addColorStop(1, 'rgba(90,150,255,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, r * 2.4, 0, TAU);
    g.fill();
    const tip = y - r * 1.6 - Math.sin(time * 9) * r * 0.3;
    g.fillStyle = `rgba(230,245,255,${a})`;
    g.beginPath();
    g.moveTo(x, tip);
    g.quadraticCurveTo(x + r, y, x, y + r * 0.7);
    g.quadraticCurveTo(x - r, y, x, tip);
    g.fill();
    g.restore();
  }
  function foxSave(e: Enemy) {
    e.p = 0.5;
    killEnemy(e, e.dir, true);
    pop(0, 0, '狐火');
    flash(0.25, '150,200,255');
    sfx.glint();
  }
  function reviveDaruma(ph = false) {
    if (ph) G.phoenixUsed = true;
    else G.darumaUsed = true;
    timeScale = 1;
    lbT = 0;
    P.fall = 0;
    P.pose = { ...PREST };
    breakCombo();
    G.pStreak = 0;
    if (!G.zen && !G.hard) G.lives = ph ? G.maxLives : 1;
    renderLives();
    setScore();
    hud(true);
    inkPulse = 0;
    const inBoss = G.diedInBoss;
    G.enemies = [];
    G.attacker = null;
    G.pendingSpawns = [];
    G.so = null;
    if (inBoss) {
      G.boss = null;
      G.bossCount--;
      startBoss();
    } else startWave(G.wave, true);
    if (ph) banner('鳳凰', 'Rise from the ashes');
    else banner('達磨', 'Seven times down, eight times up');
    stamp(ph ? '鳳' : '起', 0, 0, Math.max(60, 86 * S), true, 1.6);
    flash(0.5, '255,240,220');
  }
  function drawPet() {
    const pt = EQ.pet,
      p = L.player;
    if (pt === 'shiba') drawPetAt('shiba', p.x + p.h * 0.47, H - 2, p.h * 0.14);
    else if (pt === 'cat') drawPetAt('cat', W * 0.85, H * 0.93 - W * 0.045, Math.max(W, H) * 0.045);
  }
  /* ---------------- ensō glyph ---------------- */
  function drawEnso(
    x: number,
    y: number,
    r: number,
    dir: Direction,
    o: Parameters<typeof renderEnso>[6],
  ) {
    renderEnso(
      g,
      { time, seal: SEAL, sealArc: SEALARC, font: FONT, perfectZone: pz(), noArc: !!G.m.noArc },
      x,
      y,
      r,
      dir,
      o,
    );
  }

  /* ---------------- audio ---------------- */
  const audio = createAudio(store.get('issen.muted', false) === true);
  const audioInit = audio.init,
    tn = audio.tone,
    sfx = audio.cues;
  const ICON_ON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const ICON_OFF =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function setMuteIcon() {
    $('mute').innerHTML = audio.muted ? ICON_OFF : ICON_ON;
    $('mute').setAttribute('aria-pressed', String(audio.muted));
  }
  lifecycle.listen($('mute'), 'pointerup', (e) => {
    e.stopPropagation();
    audioInit();
    audio.setMuted(!audio.muted);
    store.set('issen.muted', audio.muted);
    setMuteIcon();
  });
  lifecycle.listen($('mute'), 'pointerdown', (e) => e.stopPropagation());

  /* ---------------- game state ---------------- */
  let time = 0,
    wind = 1,
    shake = 0,
    hitStop = 0,
    timeScale = 1,
    flashA = 0,
    flashCol = '255,255,255',
    frameN = 0,
    lb = 0,
    lbT = 0,
    zoom = 1,
    zoomX = 0,
    zoomY = 0;
  const G = createRunState(store.get('issen.hints', {}));
  const P = createPlayerAnimation();
  let fx = createEffects();
  function isSp() {
    return !!(EQ.bladeSp && SPECIAL[EQ.blade] && UNL.has(EQ.blade + '+'));
  }
  function bladeMods() {
    return isSp() ? SPECIAL[EQ.blade]!.m : (ITEM_BY[EQ.blade] || {}).m;
  }
  function bladeStyle() {
    const b = BLADES[EQ.blade];
    return isSp()
      ? Object.assign(
          {},
          b || BASEBLADE,
          { aura: SPECIAL[EQ.blade]!.aura },
          SPECIAL[EQ.blade]!.st || {},
        )
      : b;
  }
  function bst() {
    const id = G.runBlade;
    if (!id) return null;
    return ST.bl[id] || (ST.bl[id] = { k: 0, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 });
  }
  function computeMods() {
    G.m = computeModifiers(
      [bladeMods(), (ITEM_BY[EQ.robe] || {}).m, (ITEM_BY[EQ.charm] || {}).m, G.fortune?.m],
      G.bless,
    );
  }
  const pz = () => clamp(PZ + (G.m ? G.m.pz : 0), 0.55, 0.92);
  function pickLook(n: number) {
    return pickEnemyLook(n, R);
  }
  function waveConfiguration() {
    if (!G.cfg) throw new Error('Encounter requires a wave configuration');
    return G.cfg;
  }
  const waveCfg = (w: number) => waveConfig(w, G.mode, G.m);
  const bossParams = (n: number) => bossParameters(n, G.mode, G.m);
  const comboMult = () => comboMultiplier(G.combo, G.m);
  const gain = (p: number) => scoreGain(p, G);
  const modeKey = () => getModeKey(G);
  function bumpCombo() {
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    if (G.zen) ST.bestZen = Math.max(ST.bestZen, G.combo);
    else {
      ST.bestCombo = Math.max(ST.bestCombo, G.combo);
      const q = bst();
      if (q) q.c = Math.max(q.c, G.combo);
    }
  }

  const hudView = createHud($('app'));
  const showScreen = hudView.showScreen;
  function renderLives() {
    hudView.renderLives(G);
  }
  function hud(on: boolean) {
    hudView.render(G, on);
  }
  function setScore() {
    hudView.renderScore(G);
  }
  const banner = hudView.showBanner;
  const notifications = createNotifications($('hint'), $('toast'), () => sfx.unlock());
  function hint(key: string, text: string, dur = 3500) {
    if (G.hints[key]) return;
    G.hints[key] = 1;
    store.set('issen.hints', G.hints);
    notifications.hint(key, text, dur || 3500);
  }
  const hideHint = notifications.hideHint,
    clearHints = notifications.clearHints;
  function toast(it: { k: string; msg?: string; n?: string; type?: ItemCategory }) {
    notifications.toast({
      k: it.k,
      msg: it.msg || 'Unlocked: ' + it.n + ' ' + (it.type ? TYPE_WORD[it.type] : ''),
    });
  }
  function checkUnlocks(silent = false) {
    unlockEligibleItems(ST, UNL, ITEMS, (_id, it) => {
      store.set('issen.unlocks', [...UNL]);
      if (!silent) {
        G.newUnlocks.push(it);
        toast(it);
      }
    });
  }
  function pop(x: number, y: number, text: string, size?: number) {
    const ax = portrait ? W * 0.25 : W * 0.18,
      ay = portrait ? H * 0.8 : H * 0.7,
      lh = Math.max(22, 26 * S);
    while (fx.pops.length >= 4) fx.pops.shift();
    const n = fx.pops.filter((q) => q.t < q.life * 0.7).length;
    fx.pops.push({
      x: ax,
      y: ay - n * lh,
      text,
      t: 0,
      life: 0.8,
      size: Math.min(size || Math.max(16, 19 * S), Math.max(18, 23 * S)),
    });
  }
  function addScore(pts: number, x: number, y: number, label?: string, size?: number) {
    pts = gain(pts);
    G.score += pts;
    setScore();
    if (G.zen) {
      if (label) pop(x, y, label, size);
    } else pop(x, y, (label ? label + ' ' : '') + '+' + pts, size);
    return pts;
  }
  function flash(a: number, col?: string) {
    flashA = Math.max(flashA, a);
    flashCol = col || '255,255,255';
  }
  function stamp(text: string, x: number, y: number, size: number, seal: boolean, life?: number) {
    fx.stamps.push({
      text,
      x: portrait ? W * 0.27 : W * 0.18,
      y: portrait ? H * 0.62 : H * 0.36,
      size: size * 0.8,
      seal: !!seal,
      t: 0,
      life: (life || 1.1) * 0.75,
    });
  }
  function effectSpawner(state = fx, scale = S, preview = false) {
    return createEffectSpawner(state, {
      scale,
      random: R,
      flash: preview ? () => {} : flash,
      sounds: sfx,
    });
  }
  function addSlash(...args: Parameters<ReturnType<typeof createEffectSpawner>['addSlash']>) {
    effectSpawner().addSlash(...args);
  }
  function inkBurst(...args: Parameters<ReturnType<typeof createEffectSpawner>['inkBurst']>) {
    effectSpawner().inkBurst(...args);
  }
  function scraps(...args: Parameters<ReturnType<typeof createEffectSpawner>['scraps']>) {
    effectSpawner().scraps(...args);
  }
  function ring(...args: Parameters<ReturnType<typeof createEffectSpawner>['ring']>) {
    effectSpawner().ring(...args);
  }
  function sparks(...args: Parameters<ReturnType<typeof createEffectSpawner>['sparks']>) {
    effectSpawner().sparks(...args);
  }
  function dust(...args: Parameters<ReturnType<typeof createEffectSpawner>['dust']>) {
    effectSpawner().dust(...args);
  }
  function letterbox(d: number) {
    lbT = Math.max(lbT, d);
  }
  function punch(z: number, x: number, y: number) {
    zoom = Math.max(zoom, z);
    zoomX = x;
    zoomY = y;
  }

  /* ---------------- enemies ---------------- */
  function enemyPos(e: Enemy) {
    return enemyPosition(e, L, W, H);
  }
  function spawnEnemy(slot: number, attract = false) {
    return createEnemy(G, slot, attract, enemyPos, R);
  }
  function setupAttract() {
    G.enemies = [];
    G.cfg = null;
    G.boss = null;
    G.attacker = null;
    for (let i = 0; i < 5; i++) spawnEnemy(i, true);
  }
  function liveOrdered() {
    return orderedEnemies(G.enemies);
  }
  function pickAttacker() {
    return selectAttacker(G.enemies, waveConfiguration().ordered, R);
  }
  function updateEnemies(dt: number) {
    simulateEnemies(G, dt, {
      surge: WX.surge,
      time,
      perfectZone: pz,
      sounds: sfx,
      pet: EQ.pet,
      foxSave,
      playerDie,
      position: enemyPos,
    });
  }
  function startRun() {
    resetRun(G, SETUP, EQ, R);
    computeMods();
    G.runWards = G.m.runWard;
    G.maxLives = Math.max(1, 3 + G.m.lives);
    if (!G.zen && !G.hard) G.lives = G.maxLives;
    G.freezeT = 0;
    G.wardUsed = false;
    P.fall = 0;
    P.swingT = 9;
    P.pose = { ...PREST };
    timeScale = 1;
    hitStop = 0;
    lbT = 0;
    for (const [key, particles] of Object.entries(fx))
      if (key !== 'scratches') particles.length = 0;
    ST.runs++;
    saveStats();
    clearHints();
    if (G.stage !== 0) setStage(0, true);
    showScreen(null);
    hud(true);
    $('bossbar').classList.remove('on');
    G.pauseN = 0;
    {
      const hr = new Date().getHours();
      if ((hr === 23 || hr === 0) && !ST.midnight) {
        ST.midnight = 1;
        saveStats();
        checkUnlocks();
      }
    }
    setScore();
    if (G.rush) {
      ST.rushRuns = (ST.rushRuns || 0) + 1;
      startRushDuel();
      hint(
        'rush',
        'Boss rush. Only duels, one after another, with a shrine after every victory.',
        5500,
      );
    } else startWave(1);
    if (G.fortune) toast({ k: G.fortune.k, msg: `Omikuji: ${G.fortune.n}. ${G.fortune.d}` });
    if (G.blade)
      hint(
        'blade',
        'No arrows. Raised high is up, held low is down, held out to a side is that side.',
        6500,
      );
    if (G.zen)
      hint(
        'zen',
        'Endless combo. You cannot die, but every mistake breaks your chain. End the run from pause.',
        6500,
      );
  }
  function nextStep() {
    if (G.rush) startRushDuel();
    else startWave(G.wave + 1);
  }
  function startRushDuel() {
    const n = G.bossCount + 1;
    G.wave = n;
    G.event = null;
    G.wardUsed = false;
    G.kikuUsed = 0;
    G.foxUsed = false;
    G.kagamiUsed = false;
    G.so = null;
    const si = (n - 1) % STAGES.length;
    G.lap = Math.floor((n - 1) / STAGES.length);
    if (si !== G.stage) setStage(si, true);
    G.cfg = waveCfg(Math.min(30, n * 3));
    G.enemies = G.enemies.filter((e) => e.state === 'dying');
    G.pendingSpawns = [];
    G.toSpawn = 0;
    G.attacker = null;
    startBoss();
    $('waveLbl').textContent = `決闘 ${kanji(n)}`;
  }
  function startWave(n: number, skipEvent = false) {
    G.wave = n;
    G.event = null;
    G.wardUsed = false;
    G.kikuUsed = 0;
    G.foxUsed = false;
    G.kagamiUsed = false;
    G.so = null;
    if (
      G.m.regen &&
      n > 1 &&
      (n - 1) % G.m.regen === 0 &&
      !G.zen &&
      !G.hard &&
      G.lives < G.maxLives
    ) {
      G.lives++;
      renderLives();
      pop(W / 2, H * 0.5, '延命 +1 life', Math.max(20, 24 * S));
    }
    if (n >= 9 && !G.zen && !G.lostLife && !ST.flawless) ST.flawless = 1;
    const si = Math.floor((n - 1) / 3) % STAGES.length,
      lap = Math.floor((n - 1) / (3 * STAGES.length)),
      changed = si !== G.stage || lap !== G.lap;
    G.lap = lap;
    if (si !== G.stage) setStage(si, true);
    const st = STAGES[si]!;
    if (!G.zen) {
      if (G.blade) ST.bladeWave = Math.max(ST.bladeWave || 0, n);
      if (!G.lostLife) ST.flawlessWave = Math.max(ST.flawlessWave || 0, n);
      {
        const q = bst();
        if (q) {
          q.w = Math.max(q.w, n);
          if (G.mode === 'ronin') q.rw = Math.max(q.rw, n);
        }
      }
      ST.bestWave = Math.max(ST.bestWave, n);
      if (G.mode === 'ronin') ST.roninWave = Math.max(ST.roninWave, n);
      ST.furthestStage = Math.max(ST.furthestStage, Math.floor((n - 1) / 3));
    }
    saveStats();
    checkUnlocks();
    let ev: 'standoff' | 'blood' | 'fog' | null = null;
    if (!skipEvent && n >= 4 && n - G.lastEv >= 2 && R() < 0.3 * (G.m.standoff > 1 ? 1.4 : 1)) {
      const q = R();
      ev = q < (G.m.standoff > 1 ? 0.7 : 0.4) ? 'standoff' : q < 0.7 ? 'blood' : 'fog';
      G.lastEv = n;
    }
    if (ev === 'standoff') {
      if (st.hint) hint('stage' + si, st.hint, 5000);
      startStandoff(n, changed);
      return;
    }
    G.event = ev;
    G.cfg = waveCfg(n);
    if (ev === 'blood') waveConfiguration().atk *= 0.82;
    G.state = 'playing';
    G.enemies = G.enemies.filter((e) => e.state === 'dying');
    G.attacker = null;
    G.toSpawn = waveConfiguration().total;
    G.gapT = 1.2;
    G.pendingSpawns = [];
    G.pendingSpawns = initialSpawns(waveConfiguration().pack, !!((changed && n > 1) || ev), R);
    if (changed && n > 1) {
      banner(st.k, `${st.n}${lap ? ' ' + roman(lap + 1) : ''}, wave ${n}`);
      G.gapT = 1.9;
    } else if (ev === 'blood') {
      banner('赤月', 'Blood moon. Faster blades, double score.');
      G.gapT = 1.9;
    } else if (ev === 'fog') {
      banner('霧', 'Fog. Only the attacker shows himself.');
      G.gapT = 1.9;
    } else banner(`第${kanji(n)}陣`, `Wave ${n}`);
    $('waveLbl').textContent = ev === 'blood' ? '赤月' : ev === 'fog' ? '霧' : `第${kanji(n)}陣`;
    sfx.drum();
    if (n === 1) hint('swipe', 'Swipe the way his blade points.', 7000);
    if (n === 2 || G.mode === 'ronin')
      hint(
        'perfect',
        'Wait until his ring reaches the red arc, then cut, for a perfect cut.',
        5000,
      );
    if (waveConfiguration().ordered)
      hint('order', 'They strike in order now. Cut the red 一 first.', 5000);
    if (waveConfiguration().refill) hint('refill', 'The pack no longer thins. Keep cutting.', 4000);
    if (waveConfiguration().feint)
      hint('feint', 'A trembling seal may feint. Watch the blade turn.', 5000);
    if (st.hint) hint('stage' + si, st.hint, 5000);
    if (ev === 'blood')
      hint('blood', 'Blood moon. They strike faster, but every cut scores double.', 4500);
    if (ev === 'fog')
      hint('fog', 'Fog. The rest of the pack is hidden. Cut whoever steps out.', 4500);
  }
  function updateWave(dt: number) {
    simulateWave(
      G,
      dt,
      {
        spawn: (slot) => spawnEnemy(slot),
        attack: (c) => {
          sfx.step();
          dust(c.pos.x, c.pos.y, c.pos.h * 0.4);
        },
        cleared: (bonus) => addScore(bonus, W / 2, H * 0.42, '陣破', Math.max(20, 26 * S)),
      },
      R,
    );
  }
  function killEnemy(e: Enemy, dir: Direction, chained = false) {
    const wasAtk = e === G.attacker,
      p = e.state === 'attack' ? clamp(e.p) : 0,
      perfect =
        !G.m.noPerfect &&
        ((wasAtk && p >= pz()) || (!chained && G.bless.has('flurry') && (G.combo + 1) % 10 === 0));
    e.k = e.state === 'attack' ? Math.pow(p, 1.6) : 0;
    e.state = 'dying';
    e.t = 0;
    e.cutAng = DANG[dir];
    e.pos = enemyPos(e);
    e.deathType = G.m.bonk
      ? R() < 0.5
        ? 'kneel'
        : 'stagger'
      : perfect
        ? 'split'
        : ['split', 'kneel', 'stagger', 'disarm'][Math.min(3, (R() * 4) | 0)];
    e.fallDir = R() < 0.5 ? -1 : 1;
    if (e.deathType === 'disarm') {
      const q = e.pos,
        s2 = q.h / 160;
      fx.swords.push({
        x: q.x + q.h * 0.1,
        y: q.y - q.h * 0.6,
        vx: (R() - 0.5) * 260 * s2,
        vy: -(380 + R() * 200) * s2,
        ang: R() * TAU,
        vr: (R() < 0.5 ? -1 : 1) * (10 + R() * 6),
        len: q.h * 0.5,
        ground: q.y + q.h * 0.01,
        t: 0,
        stuck: false,
        life: 2.4,
      });
    }
    for (const o of G.enemies)
      if (o !== e && (o.state === 'idle' || o.state === 'attack')) o.flinch = 0.6 + 0.4 * R();
    if (wasAtk) {
      G.attacker = null;
      G.gapT = waveConfiguration().gap;
    }
    G.combo++;
    G.kills++;
    ST.kills++;
    if (e.fake) ST.feintKills = (ST.feintKills || 0) + 1;
    if (G.m.maneki) {
      G.manekiN = (G.manekiN || 0) + 1;
      if (G.manekiN % 7 === 0) {
        fx.coins.push({ x0: e.pos.x, y0: e.pos.y - e.pos.h * 0.6, t: 0, life: 0.8 });
        sfx.coin();
        addScore(Math.round(500 * comboMult()), 0, 0, '招き猫');
      }
    }
    {
      const q = bst();
      if (q) q.k++;
    }
    bumpCombo();
    const P0 = e.pos,
      cx = P0.x,
      cy = P0.y - P0.h * 0.55,
      v: [number, number] = [Math.cos(e.cutAng), Math.sin(e.cutAng)],
      len = P0.h * 0.95,
      sc = P0.h / 160;
    addSlash(
      cx - (v[0] * len) / 2,
      cy - (v[1] * len) / 2,
      cx + (v[0] * len) / 2,
      cy + (v[1] * len) / 2,
      Math.max(3, P0.h * 0.03),
      0.3,
    );
    killFx(cx, cy, e.cutAng + Math.PI / 2, sc);
    scraps(cx, cy, 6, sc);
    ring(cx, cy, P0.h * 0.08, P0.h * 0.55, 0.32, Math.max(1.5, 2 * S));
    fx.stains.push({
      x: P0.x + (R() - 0.5) * P0.h * 0.2,
      y: P0.y + P0.h * 0.01,
      rx: P0.h * (0.12 + R() * 0.1),
      t: 0,
      life: 6,
    });
    swingPlayer(dir);
    if (G.m.bonk) sfx.bonk();
    else sfx.slice();
    buzz(14);
    if (G.m.restore && !G.zen && !G.hard) {
      G.clean = (G.clean || 0) + 1;
      if (G.clean >= G.m.restore) {
        G.clean = 0;
        if (G.lives < G.maxLives) {
          G.lives++;
          renderLives();
          pop(0, 0, '正宗 +1 life');
        }
      }
    }
    if (perfect) {
      G.perfects++;
      ST.perfects++;
      if (G.bless.has('echo')) {
        G.combo += 2;
        bumpCombo();
      }
      {
        const q = bst();
        if (q) q.p++;
      }
      G.pStreak++;
      ST.bestPStreak = Math.max(ST.bestPStreak, G.pStreak);
      G.petT = 0.7;
      if (G.m.freeze) {
        G.freezeT = 0.8 * G.m.freeze;
        pop(W / 2, H * 0.4, '凍', Math.max(22, 28 * S));
      }
      const pts = addScore(
        Math.round((400 + Math.min(500, (G.pStreak - 1) * 100)) * comboMult() * G.m.perfect),
        P0.x,
        P0.y - P0.h * 1.05,
      );
      stamp('一閃', W / 2, H * 0.3, Math.max(52, 74 * S), true, 1.1);
      addSlash(
        cx - v[0] * Math.max(W, H) * 1.3,
        cy - v[1] * Math.max(W, H) * 1.3,
        cx + v[0] * Math.max(W, H) * 1.3,
        cy + v[1] * Math.max(W, H) * 1.3,
        Math.max(2, 2.5 * S),
        0.5,
      );
      ring(cx, cy, P0.h * 0.1, P0.h * 1.3, 0.5, Math.max(2, 3 * S));
      letterbox(0.5);
      punch(1.07, cx, cy);
      shake = Math.max(shake, 10 * S);
      hitStop = 0.15;
      flash(0.32);
      sfx.perfect();
      buzz([10, 30, 30]);
      if (pts) void 0;
    } else {
      if (wasAtk) G.pStreak = 0;
      addScore(
        Math.round((100 + (wasAtk ? 40 : 20)) * comboMult() * G.m.normal),
        P0.x,
        P0.y - P0.h * 1.05,
      );
      shake = Math.max(shake, 7 * S);
      hitStop = 0.055;
      flash(0.08);
    }
    if (G.combo % 10 === 0 && G.m.comboBonus)
      addScore((G.m.comboBonus * G.combo) / 10, 0, 0, '歌舞伎');
    if (G.combo % 10 === 0 && G.m.furin) {
      G.slowT = Math.max(G.slowT, 2);
      pop(0, 0, '風鈴');
      sfx.chime();
    }
    if (G.combo % 10 === 0) {
      stamp(kanji(G.combo) + '連', W / 2, H * 0.2, Math.max(40, 54 * S), false, 1.2);
      gustLeaves(26);
      sfx.drum();
    }
    if (notifications.activeHint === 'swipe') hideHint();
    if (waveConfiguration().refill && G.toSpawn > 0)
      G.pendingSpawns.push({ slot: e.slot, t: 0.45 });
    if (!chained && G.m.serpent && R() < G.m.serpent) {
      const nx = waveConfiguration().ordered
        ? liveOrdered()[0]
        : G.enemies.find((q) => (q.state === 'idle' || q.state === 'attack') && q.dir === dir);
      if (nx && (nx.state === 'idle' || nx.state === 'attack') && nx.dir === dir) {
        killEnemy(nx, dir, true);
        pop(0, 0, '大蛇', Math.max(20, 26 * S));
        return;
      }
    }
    if (!chained && G.bless.has('tempest')) {
      G.tempN = (G.tempN || 0) + 1;
      if (G.tempN % 5 === 0) {
        const c = G.enemies.filter((q) => q.state === 'idle' || q.state === 'attack');
        const nx = waveConfiguration().ordered ? liveOrdered()[0] : c[(R() * c.length) | 0];
        if (nx && (nx.state === 'idle' || nx.state === 'attack')) {
          killEnemy(nx, nx.dir, true);
          pop(0, 0, '颯');
        }
      }
    }
    if (perfect && !chained && G.bless.has('swallow')) {
      const nx = waveConfiguration().ordered
        ? liveOrdered()[0]
        : G.enemies.find((q) => (q.state === 'idle' || q.state === 'attack') && q.dir === dir);
      if (nx && (nx.state === 'idle' || nx.state === 'attack') && nx.dir === dir) {
        killEnemy(nx, dir, true);
        pop(nx.pos.x, nx.pos.y - nx.pos.h * 1.3, '燕', Math.max(20, 26 * S));
      }
    }
    checkUnlocks();
  }
  function weatherBurst(cx: number, cy: number, sc: number) {
    const w = STAGES[G.stage]!.weather;
    if (w === 'rain' || w === 'storm') {
      for (let i = 0; i < 16; i++) {
        const a = R() * TAU,
          sp = (120 + R() * 260) * sc;
        fx.splash.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 80 * sc,
          t: 0,
          life: 0.4 + R() * 0.3,
          c: '215,220,225',
        });
      }
    } else if (w === 'snow') {
      for (let i = 0; i < 22; i++) {
        const a = R() * TAU,
          sp = (60 + R() * 200) * sc;
        fx.splash.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 60 * sc,
          t: 0,
          life: 0.8 + R() * 0.6,
          c: '246,244,238',
          drift: 1,
        });
      }
      dust(cx, cy + 30 * sc, 60 * sc);
    } else if (w === 'sakura') {
      for (let i = 0; i < 14; i++) {
        const a = R() * TAU,
          sp = (60 + R() * 240) * sc;
        fx.petals.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 100 * sc,
          rot: R() * TAU,
          vr: (R() - 0.5) * 10,
          s: (2 + R() * 2.5) * sc,
          t: 0,
          life: 1.4 + R() * 0.8,
        });
      }
    } else if (w === 'smoke') {
      for (let i = 0; i < 14; i++)
        fx.embers.push({
          x: cx + (R() - 0.5) * 30 * sc,
          y: cy,
          vx: (R() - 0.5) * 140 * sc,
          vy: -(80 + R() * 200) * sc,
          t: 0,
          life: 0.7 + R() * 0.8,
          ph: R() * TAU,
        });
    } else if (w !== 'night') {
      for (let i = 0; i < 8; i++) {
        const l = newLeaf(false);
        l.x = cx + (R() - 0.5) * 40 * sc;
        l.y = cy + (R() - 0.5) * 40 * sc;
        l.z = 1.3 + R() * 0.6;
        l.s = (3 + R() * 4) * l.z * S;
        l.gust = 1;
        l.col = 'rgba(24,23,21,.85)';
        leaves.push(l);
      }
    }
  }
  function killFx(cx: number, cy: number, ang: number, sc: number) {
    weatherBurst(cx, cy, sc);
    effectSpawner().killFx(EQ.fx, cx, cy, ang, sc);
  }
  function swingPlayer(dir: Direction | 'block') {
    if (EQ.blade === 'koken' && G.state !== 'title') sfx.hum();
    startSwing(P, dir);
  }
  function onSwipe(dir: Direction) {
    if (G.state === 'standoff') {
      standoffSwipe(dir);
      return;
    }
    if (G.state === 'playing') {
      const outcome = targetSwipe(G.enemies, G.attacker, dir, {
        ordered: waveConfiguration().ordered,
        centerX: W / 2,
        mirrorAvailable: !!(G.m.kagami && !G.kagamiUsed),
      });
      if (outcome.kind === 'cut') {
        if (outcome.mirror) G.kagamiUsed = true;
        killEnemy(outcome.target, dir, outcome.mirror);
        if (outcome.mirror) {
          pop(0, 0, '鏡');
          sfx.glint();
        }
      } else if (outcome.kind === 'miss') {
        swingPlayer(dir);
        sfx.whoosh();
        playerDie(outcome.killer, outcome.reason);
      }
    } else if (G.state === 'boss') bossSwipe(dir);
  }

  /* ---------------- boss ---------------- */
  function startBoss() {
    G.bossCount++;
    const b = createBoss(G.bossCount, G.mode, G.m, bossPos),
      { def, lap } = b;
    G.boss = b;
    G.state = 'boss';
    G.attacker = null;
    G.event = null;
    const nm = def.n + (lap ? ' ' + roman(lap + 1) : '');
    banner(def.k, nm);
    $('waveLbl').textContent = '決闘';
    $('bossK').textContent = def.k;
    $('bossN').textContent = nm;
    renderHp();
    $('bossbar').classList.add('on');
    sfx.drum();
    hint('boss', 'A duel. Wait for the glint, then tap to parry. Tapping early is death.', 6000);
    if (def.twin) hint('twin', 'The Twin Fang strikes twice. Parry both glints.', 4500);
    if (def.spear) hint('spear', 'The spear gives less warning. Watch the tip.', 4500);
    if (def.mirror)
      hint('mirror', "The Mirror's blade flips before it settles. Wait for it, then cut.", 5000);
  }
  function renderHp() {
    hudView.renderBossHealth(G.boss);
  }
  function bossPos(b: Boss) {
    return bossPosition(b, L);
  }
  function toIdle(b: Boss, base: number) {
    bossToIdle(b, base, R);
  }
  function updateBoss(dt: number) {
    simulateBoss(G, dt, {
      random: R,
      sounds: sfx,
      flash,
      playerDie,
      position: bossPos,
      recovered: (b) => {
        breakCombo();
        setScore();
        pop(b.pos.x, b.pos.y - b.pos.h * 1.05, 'Recovered');
      },
    });
  }
  function bossTipWorld(b: Boss): [number, number] {
    const tp = tipOf(b.pose, b.lean, b.def.spear ? 0.98 : 0.52);
    return [b.pos.x + tp[0] * b.pos.h, b.pos.y + tp[1] * b.pos.h];
  }
  function parry() {
    const b = G.boss;
    if (!b) return;
    const tw = bossTipWorld(b);
    const { second, counterDamage } = parryOpening(
      b,
      {
        count: G.bossCount,
        mode: G.mode,
        chainModifier: G.m.chain,
        counter: G.bless.has('counter'),
      },
      R,
    );
    if (!second && G.bless.has('timestop')) G.slowT = Math.max(G.slowT, 1.4);
    if (counterDamage) {
      renderHp();
      pop(b.pos.x, b.pos.y - b.pos.h * 1.25, '返し', Math.max(20, 26 * S));
    }
    swingPlayer('block');
    sparks(tw[0], tw[1], 24);
    ring(tw[0], tw[1], 4 * S, 90 * S, 0.35, Math.max(2, 2.5 * S));
    shake = Math.max(shake, 11 * S);
    hitStop = 0.09;
    flash(0.3);
    sfx.clang();
    buzz(30);
    letterbox(0.3);
    G.combo++;
    G.parries++;
    ST.parries++;
    bumpCombo();
    addScore(Math.round(60 * comboMult()), b.pos.x, b.pos.y - b.pos.h * 1.05);
    if (!second) hint('parry', 'An opening. Swipe the way his blade points.', 3000);
  }
  function onTapDown() {
    if (G.state === 'boss' && G.boss && G.boss.state === 'flash') {
      parry();
      return true;
    }
    return false;
  }
  function onTap() {
    if (G.state === 'standoff') {
      const so = G.so;
      if (so && !so.done && !so.fired) {
        so.done = true;
        swingPlayer('block');
        playerDie(so.e, 'early');
      }
      return;
    }
    if (G.state !== 'boss' || !G.boss) return;
    const s = G.boss.state;
    if (s === 'flash') {
      parry();
      return;
    }
    if (s === 'idle' || s === 'windup' || s === 'feint') {
      swingPlayer('block');
      playerDie(G.boss, 'early');
    }
  }
  function blockHit(dir: Direction) {
    const b = G.boss;
    if (!b) return;
    const tw = bossTipWorld(b);
    b.chainLeft--;
    let nd;
    do {
      nd = DIRS[(R() * 4) | 0]!;
    } while (nd === b.sdir);
    b.sdir = nd;
    b.t = 0;
    b.window = Math.max(0.5, b.bp.stag * 0.72);
    b.blockT = 0.12;
    setMirror(b);
    swingPlayer(dir);
    sparks(tw[0], tw[1], 16);
    ring(tw[0], tw[1], 3 * S, 70 * S, 0.28, Math.max(1.5, 2 * S));
    shake = Math.max(shake, 7 * S);
    hitStop = 0.05;
    flash(0.12);
    sfx.block();
    buzz(12);
    G.combo++;
    bumpCombo();
    addScore(Math.round(40 * comboMult()), b.pos.x, b.pos.y - b.pos.h * 1.05, 'Blocked');
    if (notifications.activeHint === 'parry') hideHint();
    hint('chain', 'He blocked. Keep swiping the way his blade points.', 3500);
  }
  function bossSwipe(dir: Direction) {
    const b = G.boss;
    if (!b || b.state !== 'stagger') return;
    const p = b.pos,
      cx = p.x,
      cy = p.y - p.h * 0.55;
    if (dir === b.sdir && b.chainLeft > 1) {
      blockHit(dir);
      return;
    }
    if (dir === b.sdir) {
      b.hp = Math.max(0, b.hp - G.m.bossDmg);
      renderHp();
      swingPlayer(dir);
      const a = DANG[dir],
        v: [number, number] = [Math.cos(a), Math.sin(a)],
        len = p.h * 0.9,
        sc = p.h / 170;
      addSlash(
        cx - (v[0] * len) / 2,
        cy - (v[1] * len) / 2,
        cx + (v[0] * len) / 2,
        cy + (v[1] * len) / 2,
        Math.max(4, p.h * 0.03),
        0.35,
      );
      killFx(cx, cy, a + Math.PI / 2, sc);
      scraps(cx, cy, 8, sc);
      ring(cx, cy, p.h * 0.1, p.h * 0.7, 0.35, Math.max(2, 2.5 * S));
      shake = Math.max(shake, 12 * S);
      hitStop = 0.08;
      flash(0.15);
      sfx.slice();
      buzz(20);
      G.combo++;
      bumpCombo();
      if (notifications.activeHint === 'parry') hideHint();
      if (b.hp <= 0) {
        b.state = 'dying';
        b.t = 0;
        b.cutAng = a;
        addScore(
          Math.round(1500 * G.bossCount * G.m.bossScore),
          cx,
          p.y - p.h * 1.1,
          '討取',
          Math.max(22, 28 * S),
        );
        stamp('討取', W / 2, H * 0.3, Math.max(56, 80 * S), true, 1.6);
        letterbox(1.3);
        punch(1.08, cx, cy);
        hitStop = 0.25;
        flash(0.45);
        addSlash(
          cx - v[0] * Math.max(W, H) * 1.3,
          cy - v[1] * Math.max(W, H) * 1.3,
          cx + v[0] * Math.max(W, H) * 1.3,
          cy + v[1] * Math.max(W, H) * 1.3,
          Math.max(3, 3 * S),
          0.7,
        );
        sfx.bossDie();
        G.petT = 1;
        if (EQ.pet === 'crow') sfx.caw();
        G.bossesSlain++;
        ST.duels++;
        if (G.rush) {
          ST.rushBest = Math.max(ST.rushBest || 0, G.bossesSlain);
          if (G.blade) ST.rushBlade = (ST.rushBlade || 0) + 1;
        }
        {
          const q = bst();
          if (q) q.d++;
        }
        if (G.mode === 'ronin') ST.roninDuels++;
        if (b.def.mirror) ST.mirrorWins++;
        if (b.def.mirror && !b.failed) ST.mirrorClean = 1;
        if (G.bless.has('breath') && !G.zen && !G.hard && G.lives < G.maxLives) {
          G.lives++;
          renderLives();
          pop(W / 2, H * 0.5, '息 +1 life', Math.max(20, 24 * S));
        }
        if (!b.failed) ST.cleanDuels++;
        if (G.blade) ST.bladeDuels++;
        G.state = 'between';
        G.afterBoss = true;
        G.nextT = 2.2;
        $('bossbar').classList.remove('on');
        inkBurst(cx, cy, a + Math.PI / 2, 30, p.h / 150);
        fx.stains.push({ x: p.x, y: p.y + p.h * 0.01, rx: p.h * 0.3, t: 0, life: 8 });
        saveStats();
        checkUnlocks();
      } else {
        b.state = 'hurt';
        b.t = 0;
        addScore(Math.round(300 * comboMult() * G.m.bossScore), cx, p.y - p.h * 1.05);
      }
    } else {
      if (G.m.kage && (b.kageUsed || 0) < G.m.kage) {
        b.kageUsed = (b.kageUsed || 0) + 1;
        swingPlayer(dir);
        sfx.deflect();
        pop(cx, p.y - p.h * 1.05, 'Afterimage');
        return;
      }
      swingPlayer(dir);
      b.state = 'recover';
      b.t = 0;
      b.failed = true;
      breakCombo();
      setScore();
      sfx.deflect();
      pop(cx, p.y - p.h * 1.05, 'Deflected');
    }
  }

  /* ---------------- standoff & shrine ---------------- */
  function startStandoff(n: number, changed: boolean) {
    const st = STAGES[G.stage]!;
    G.state = 'standoff';
    G.cfg = waveCfg(n);
    G.enemies = G.enemies.filter((e) => e.state === 'dying');
    G.attacker = null;
    G.pendingSpawns = [];
    G.toSpawn = 0;
    const B = L.boss;
    const e: Enemy = {
      feintAt: 0,
      pos: { x: 0, y: 0, h: 0, fog: 0, alpha: 1 },
      slot: 2,
      fixed: { x: B.x, y: B.y, h: B.h * 0.82, fog: 0.05 },
      dir: DIRS[(R() * 4) | 0]!,
      fake: null,
      switched: false,
      order: 0,
      state: 'idle',
      t: 0,
      life: 0,
      p: 0,
      T: 1,
      k: 0,
      d: makeFig((R() * 1e9) | 0),
      pose: { ...EPOSE.guard },
      snap: 0,
      lean: 0,
      look: pickLook(9),
      glint: 0,
      challenger: true,
    };
    e.pos = enemyPos(e);
    G.enemies.push(e);
    G.so = createStandoff(e, n, G.mode, G.m.parry, G.m.soWin, R);
    banner(
      '挑',
      changed ? `A challenger in the ${st.n.toLowerCase()}` : 'A challenger blocks the road',
    );
    $('waveLbl').textContent = '挑';
    letterbox(99);
    sfx.drum();
    hint(
      'standoff',
      'A standoff. Stay still. The instant he draws, cut the way his blade points. Moving early is death.',
      6500,
    );
  }
  function updateStandoff(dt: number) {
    simulateStandoff(
      G,
      dt,
      {
        nextWave: (n) => {
          lbT = 0;
          startWave(n, true);
        },
        step: () => sfx.step(),
        draw: () => {
          sfx.glint();
          flash(0.2);
        },
        late: (e) => playerDie(e, 'late'),
      },
      R,
    );
  }
  function standoffSwipe(dir: Direction) {
    const so = G.so,
      outcome = resolveStandoffSwipe(so, dir);
    if (outcome === 'ignore' || !so) return;
    const e = so.e;
    if (outcome === 'cut') {
      const p = e.pos,
        cx = p.x,
        cy = p.y - p.h * 0.55,
        a = DANG[dir],
        v: [number, number] = [Math.cos(a), Math.sin(a)],
        M = Math.max(W, H) * 1.3,
        sc = p.h / 160;
      e.state = 'dying';
      e.t = 0;
      e.cutAng = a;
      e.k = 0;
      swingPlayer(dir);
      addSlash(cx - v[0] * M, cy - v[1] * M, cx + v[0] * M, cy + v[1] * M, Math.max(3, 3 * S), 0.6);
      killFx(cx, cy, a + Math.PI / 2, sc);
      scraps(cx, cy, 10, sc);
      ring(cx, cy, p.h * 0.1, p.h * 1.3, 0.5, Math.max(2, 3 * S));
      stamp('一閃', W / 2, H * 0.3, Math.max(56, 80 * S), true, 1.4);
      punch(1.08, cx, cy);
      hitStop = 0.22;
      flash(0.4);
      sfx.perfect();
      buzz([10, 30, 40]);
      G.combo++;
      bumpCombo();
      G.kills++;
      ST.kills++;
      ST.standoffs++;
      addScore(
        Math.round(1000 * comboMult() * G.m.standoff),
        cx,
        p.y - p.h * 1.1,
        '挑',
        Math.max(22, 28 * S),
      );
      saveStats();
      checkUnlocks();
    } else {
      swingPlayer(dir);
      sfx.whoosh();
      playerDie(e, outcome);
    }
  }
  let knocks = 0;
  lifecycle.listen($('shrineK'), 'click', () => {
    audioInit();
    sfx.knock();
    knocks++;
    if (knocks >= 3 && !ST.omikuji) {
      ST.omikuji = 1;
      saveStats();
      sfx.bell();
      checkUnlocks();
    }
  });
  function breakCombo() {
    G.combo = G.bless && G.bless.has('banner') && G.combo >= 10 ? 10 : 0;
  }
  function applyPick(id: string) {
    const extras = applyBlessing(G, id, R);
    renderLives();
    if (extras.length)
      toast({ k: '双', msg: 'Twin blessing: ' + extras.map((b) => b.n).join(' and ') });
  }
  lifecycle.listen($('oScore'), 'click', (e) => {
    e.stopPropagation();
    audioInit();
    G.claps = (G.claps || 0) + 1;
    tn({ f0: 700 + G.claps * 90, dur: 0.06, g: 0.05 });
    if (G.claps >= 5 && !ST.applause) {
      ST.applause = 1;
      saveStats();
      sfx.popper();
      checkUnlocks();
    }
  });
  function openShrine() {
    knocks = 0;
    if (G.m.noShrine) {
      nextStep();
      return;
    }
    const opts = shrineOffers(G, R);
    if (!opts.length) {
      nextStep();
      return;
    }
    G.state = 'shrine';
    renderShrine($('blessList'), opts, (bl) => {
      if (G.state !== 'shrine') return;
      G.bless.add(bl.id);
      applyPick(bl.id);
      if (bl.t === 1) ST.rares++;
      if (bl.t === 2) ST.curses++;
      ST.shrines++;
      saveStats();
      computeMods();
      checkUnlocks();
      hud(true);
      showScreen(null);
      sfx.unlock();
      nextStep();
    });
    showScreen('shrine');
    sfx.drum();
  }

  /* ---------------- death & menus ---------------- */
  function struck(killer: Enemy | Boss | null, keep: boolean, label?: string | null) {
    G.clean = 0;
    if (!keep && G.bless.has('zanshin')) {
      const sk = Math.floor((G.wave - 1) / 3);
      if (G.zanKey !== sk) {
        G.zanKey = sk;
        keep = true;
        label = label || '残心';
      }
    }
    if (!keep && G.m.kiku && (G.kikuUsed || 0) < G.m.kiku) {
      G.kikuUsed = (G.kikuUsed || 0) + 1;
      keep = true;
      label = label || '菊';
    }
    const lost = G.combo;
    if (!keep) {
      breakCombo();
      G.pStreak = 0;
    }
    G.hits++;
    setScore();
    const p = L.player;
    addSlash(
      p.x + p.h * 0.4,
      p.y - p.h * 0.98,
      p.x - p.h * 0.28,
      p.y - p.h * 0.35,
      Math.max(4, p.h * 0.018),
      0.45,
    );
    inkBurst(p.x + p.h * 0.05, p.y - p.h * 0.7, -2.2, 16, p.h / 420);
    flash(0.35, '150,22,16');
    shake = Math.max(shake, 12 * S);
    hitStop = 0.08;
    sfx.hurt();
    buzz([40, 30, 60]);
    pop(
      W / 2,
      H * 0.45,
      label || (lost >= 3 ? `${lost} 連 broken` : 'Struck'),
      Math.max(20, 24 * S),
    );
    if (killer && 'def' in killer) {
      killer.state = 'strike';
      killer.t = 0;
      killer.zenBack = true;
    } else if (killer) {
      killer.k = killer.state === 'attack' ? Math.pow(clamp(killer.p), 1.6) : killer.k || 0;
      killer.state = 'strike';
      killer.t = 0;
      killer.zen = true;
      if (G.attacker === killer) {
        G.attacker = null;
        G.gapT = waveConfiguration().gap + 0.5;
      }
      if (waveConfiguration().refill && G.toSpawn > 0)
        G.pendingSpawns.push({ slot: killer.slot, t: 1.0 });
    }
  }
  function playerDie(killer: Enemy | Boss | null, reason: string) {
    if (G.state === 'dead' || G.state === 'over') return;
    if (reason === 'feint') {
      ST.feinted = (ST.feinted || 0) + 1;
      checkUnlocks();
    }
    const oldLives = G.lives,
      outcome = resolveDamage(G, reason);
    if (oldLives !== G.lives) renderLives();
    if (outcome.kind === 'hurt') {
      if (outcome.lifeLost) inkPulse = 1;
      struck(killer, outcome.keepCombo, outcome.label);
      return;
    }
    G.diedInBoss = !!(G.boss && G.boss.state !== 'dying');
    G.state = 'dead';
    G.deathT = 0;
    G.reason = reason;
    timeScale = 0.3;
    if (killer && !('def' in killer)) {
      killer.k = killer.state === 'attack' ? Math.pow(clamp(killer.p), 1.6) : killer.k || 0;
      killer.state = 'strike';
      killer.t = 0;
    } else if (killer) {
      killer.state = 'strike';
      killer.t = 0;
    }
    const p = L.player;
    addSlash(
      p.x + p.h * 0.4,
      p.y - p.h * 0.98,
      p.x - p.h * 0.28,
      p.y - p.h * 0.35,
      Math.max(5, p.h * 0.022),
      0.7,
    );
    inkBurst(p.x + p.h * 0.05, p.y - p.h * 0.7, -2.2, 40, p.h / 420);
    scraps(p.x + p.h * 0.05, p.y - p.h * 0.7, 10, p.h / 300);
    flash(0.45, '150,22,16');
    shake = Math.max(shake, 18 * S);
    letterbox(2.5);
    sfx.death();
    buzz([60, 40, 150]);
    clearHints();
    $('bossbar').classList.remove('on');
  }
  function showOver() {
    G.state = 'over';
    timeScale = 1;
    lbT = 0;
    clearHints();
    $('bossbar').classList.remove('on');
    const { record: rec, newBest: nb } = recordRun(ST, G);
    if (!G.zen) store.set('issen.best', ST.bestScore);
    saveStats();
    checkUnlocks();
    G.cardScore = G.score;
    G.card = null;
    G.claps = 0;
    renderGameOver($('over'), G, rec, nb, STAGES[G.stage]!.n);
    showScreen('over');
    hud(false);
    G.overReady = false;
    $('bAgain').disabled = true;
    lifecycle.timeout(() => {
      G.overReady = true;
      $('bAgain').disabled = false;
    }, 750);
    setBestLine();
  }
  function setBestLine() {
    $('tBest').textContent =
      (ST.bestScore ? `Best ${ST.bestScore.toLocaleString()}` : '') +
      (ST.bestRonin ? `   Ronin best ${ST.bestRonin.toLocaleString()}` : '');
  }
  function toTitle() {
    G.state = 'title';
    G.mode = 'normal';
    G.blade = false;
    G.zen = false;
    clearHints();
    showScreen('title');
    hud(false);
    $('bossbar').classList.remove('on');
    timeScale = 1;
    lbT = 0;
    if (G.stage !== 0) setStage(0, true);
    setupAttract();
    P.fall = 0;
    P.pose = { ...PREST };
    setBestLine();
  }
  function openPanel(id: Screen) {
    G.panelFrom = hudView.activeScreen || 'title';
    G.panel = id;
    if (id === 'armory') renderArmory();
    if (id === 'stats') renderStats();
    if (id === 'setup') renderSetup();
    showScreen(id);
  }
  const setupScreen = createSetupScreen($('setup'), SETUP, (setup) =>
    store.set('issen.setup', setup),
  );
  const renderSetup = setupScreen.render;
  function closePanel() {
    G.panel = null;
    showScreen(G.panelFrom);
  }
  const armory = createArmoryScreen($('armory'), {
    items: ITEMS,
    equipment: EQ,
    unlocks: UNL,
    statistics: ST,
    seals: SEALS,
    charms: CHARMCOL,
    events: {
      equipped: (equipment) => {
        store.set('issen.equip', equipment);
        computeMods();
        applySeal();
      },
      awaken: () => sfx.glint(),
      preview: demoKill,
    },
  });
  const renderArmory = armory.render;
  const KONAMI = 'up,up,down,down,left,right,left,right';
  let kseq: Direction[] = [];
  let tapN = 0,
    tapLast = 0;
  function titleTap() {
    if (G.state !== 'title' || G.panel) return;
    const now = performance.now();
    tapN = now - tapLast < 1500 ? tapN + 1 : 1;
    tapLast = now;
    audioInit();
    if (tapN < 20) {
      if (tapN >= 5) tn({ f0: 520 + (tapN - 5) * 55, dur: 0.07, g: 0.05 });
      return;
    }
    tapN = 0;
    sfx.caw();
    flash(0.3, '230,220,190');
    if (!ST.scarecrow) {
      ST.scarecrow = 1;
      saveStats();
      checkUnlocks();
    } else toast({ k: '案山子', msg: 'The Scarecrow is already yours' });
  }
  function konamiInput(d: Direction) {
    tapN = 0;
    if (G.state !== 'title' || G.panel) return;
    kseq.push(d);
    if (kseq.length > 8) kseq.shift();
    {
      const K = KONAMI.split(',');
      let m = 0;
      for (let n = Math.min(kseq.length, 8); n > 0; n--) {
        if (kseq.slice(-n).join() === K.slice(0, n).join()) {
          m = n;
          break;
        }
      }
      if (m > 0 && m < 8) {
        audioInit();
        tn({ f0: 900 + m * 120, dur: 0.08, g: 0.05 });
      }
    }
    if (kseq.join() === KONAMI) {
      kseq = [];
      audioInit();
      sfx.perfect();
      flash(0.4, '150,200,255');
      if (!ST.konami) {
        ST.konami = 1;
        saveStats();
        checkUnlocks();
      } else toast({ k: '光剣', msg: 'Kōken is already yours' });
    }
  }
  (() => {
    let sx = 0,
      sy = 0,
      id: number | null = null,
      done = false;
    const el = $('title');
    lifecycle.listen(el, 'pointerdown', (e) => {
      if (e.target instanceof Element && e.target.closest('button')) return;
      id = e.pointerId;
      done = false;
      sx = e.clientX;
      sy = e.clientY;
    });
    const fire = (e: PointerEvent) => {
      if (e.pointerId !== id || done) return;
      const dx = e.clientX - sx,
        dy = e.clientY - sy;
      if (dx * dx + dy * dy < 900) return;
      done = true;
      konamiInput(
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up',
      );
    };
    lifecycle.listen(el, 'pointermove', fire);
    lifecycle.listen(el, 'pointerup', (e) => {
      fire(e);
      if (e.pointerId === id && !done) titleTap();
      id = null;
    });
    lifecycle.listen(el, 'pointercancel', () => {
      id = null;
    });
  })();
  function renderStats() {
    renderStatistics($('statGrid'), ST, UNL.size, ITEMS.length);
  }
  const preview = createArmoryPreview($('prevC'), {
    random: R,
    now: () => performance.now(),
    sounds: sfx,
  });
  function demoKill() {
    preview.demo(EQ.fx, !!(G.m && G.m.bonk));
  }
  function drawPreview() {
    const rb = ROBES[EQ.robe] || {};
    preview.draw({
      time,
      wind,
      petActive: G.petT > 0,
      palette: cols,
      background: bg,
      appearance: {
        d: P.d,
        pal: robePal(EQ.robe),
        blade: bladeStyle(),
        variant: rb.variant,
        cape: rb.cape,
        coat: rb.coat,
        rf: rb,
        charm: CHARMCOL[EQ.charm],
        crest: EQ.crest === 'nocrest' ? null : EQ.crest,
        pet: petOf(),
      },
      pet: EQ.pet,
      film: EQ.film,
      effectsVisible: armory.tab === 'fx',
      font: FONT,
      seal: SEAL,
      mistSprite,
    });
  }

  /* ---------------- share card ---------------- */
  const saveSharedCard = createSharing();
  function makeCard() {
    G.card = createShareCard(cvs, G, {
      stage: STAGES[G.stage]!,
      font: FONT,
      seal: SEAL,
      grain: grainCanv[0],
    });
    return G.card;
  }
  function openShare() {
    const card = makeCard();
    $('shareImg').src = card.toDataURL('image/png');
    $('shareMsg').textContent = 'You can also press and hold the image to save it.';
    openPanel('share');
  }
  async function saveCard() {
    const card = G.card ?? makeCard();
    const message = await saveSharedCard(card, G.cardScore);
    if (message && !lifecycle.disposed) $('shareMsg').textContent = message;
  }

  /* ---------------- input ---------------- */
  const disposePointer = bindPointer(cvs, {
    activate: audioInit,
    threshold: () => {
      const k = G.m ? G.m.swipe : 1;
      return Math.max(22 * k, Math.min(W, H) * 0.055 * k);
    },
    swipe: onSwipe,
    tapDown: onTapDown,
    tap: onTap,
  });
  lifecycle.listen($('bPlay'), 'click', () => {
    audioInit();
    openPanel('setup');
  });
  lifecycle.listen($('bBegin'), 'click', () => {
    audioInit();
    G.panel = null;
    startRun();
  });
  lifecycle.listen($('bArmory'), 'click', () => openPanel('armory'));
  lifecycle.listen($('bStats'), 'click', () => openPanel('stats'));
  lifecycle.listen($('bAgain'), 'click', () => {
    if (G.overReady) {
      audioInit();
      startRun();
    }
  });
  lifecycle.listen($('bResume'), 'click', resume);
  lifecycle.listen($('bEnd'), 'click', endRun);
  lifecycle.listen($('pauseBtn'), 'pointerup', (e) => {
    e.stopPropagation();
    pause();
  });
  lifecycle.listen($('pauseBtn'), 'pointerdown', (e) => e.stopPropagation());
  lifecycle.listen($('bShare'), 'click', openShare);
  lifecycle.listen($('bMenu'), 'click', toTitle);
  lifecycle.listen($('bSave'), 'click', saveCard);
  document.querySelectorAll('[data-back]').forEach((b) => lifecycle.listen(b, 'click', closePanel));
  const disposeKeyboard = bindKeyboard({
    state: () => ({ phase: G.state, panelOpen: !!G.panel, overReady: G.overReady }),
    closePanel,
    titleDirection: konamiInput,
    start: () => {
      audioInit();
      startRun();
    },
    resume,
    pause,
    swipe: onSwipe,
    tapDown: onTapDown,
    tap: onTap,
  });
  function pause() {
    if (['playing', 'boss', 'between', 'standoff'].includes(G.state)) {
      G.pauseN = (G.pauseN || 0) + 1;
      if (G.pauseN >= 10 && !ST.fidget) {
        ST.fidget = 1;
        saveStats();
        checkUnlocks();
      }
      G.pausedFrom = G.state;
      G.state = 'paused';
      showScreen('paused');
    }
  }
  function resume() {
    if (G.state !== 'paused' || !G.pausedFrom) return;
    G.state = G.pausedFrom;
    showScreen(null);
    frameLoop.resetClock();
  }
  function endRun() {
    if (G.state !== 'paused' || !G.pausedFrom) return;
    G.state = G.pausedFrom;
    G.reason = 'quit';
    showOver();
  }
  lifecycle.listen(document, 'visibilitychange', () => {
    if (document.hidden) pause();
  });
  lifecycle.listen(window, 'blur', pause);

  /* ---------------- update ---------------- */
  function updateFx(dt: number, raw: number) {
    updateEffects(fx, dt, raw, {
      scale: S,
      wind,
      time,
      random: R,
      onSwordStuck: () => sfx.clink(),
    });
  }
  function updatePlayer(dt: number) {
    updatePlayerAnimation(P, dt, G.state === 'dead' || G.state === 'over');
  }
  function updateWeather(dt: number) {
    simulateWeather(WX, wx, dt, {
      weather: STAGES[G.stage]!.weather,
      phase: G.state,
      width: W,
      height: H,
      scale: S,
      wind,
      time,
      hazard: G.m.hazard,
      layout: L,
      random: R,
      flash,
      sounds: sfx,
      gustLeaves,
      onShake: (amount) => {
        shake = Math.max(shake, amount);
      },
    });
  }
  function update(dt: number, raw: number) {
    time += dt;
    wind =
      1 +
      0.55 * Math.sin(time * 0.31) +
      0.35 * Math.sin(time * 0.87 + 1) +
      0.2 * Math.sin(time * 2.3);
    if (['playing', 'boss', 'between', 'standoff', 'shrine'].includes(G.state)) G.runTime += raw;
    for (const m of mists) {
      m.x += m.v * (0.5 + wind * 0.5) * dt;
      if (m.x - m.w / 2 > W) m.x = -m.w / 2;
    }
    ambient().updateLeaves(leaves, dt, time, wind);
    if (G.freezeT > 0) G.freezeT -= dt;
    if (G.petT > 0) G.petT -= dt;
    updateWeather(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    if (G.boss) updateBoss(dt);
    updateWave(dt);
    if (G.state === 'standoff') updateStandoff(dt);
    if (G.state === 'between') {
      G.nextT -= dt;
      if (G.nextT <= 0) {
        if (!G.afterBoss && G.wave % 3 === 0) startBoss();
        else if (G.afterBoss) {
          G.afterBoss = false;
          openShrine();
        } else nextStep();
      }
    }
    if (G.state === 'dead') {
      G.deathT += raw;
      P.fall = clamp((G.deathT - 0.3) / 0.9);
      timeScale = lerp(0.3, 0.6, clamp(G.deathT / 1.5));
      if (G.deathT > 1.8) {
        if (G.bless.has('phoenix') && !G.phoenixUsed) reviveDaruma(true);
        else if (G.m.daruma && !G.darumaUsed) reviveDaruma();
        else showOver();
      }
    }
    updateFx(dt, raw);
    if (stageFade > 0) {
      stageFade = Math.max(0, stageFade - raw / 1.3);
      if (!stageFade) prevBg = null;
    }
    if (lbT > 0) {
      lbT -= raw;
      lb += (1 - lb) * (1 - Math.exp(-raw * 14));
    } else lb += (0 - lb) * (1 - Math.exp(-raw * 5));
    zoom += (1 - zoom) * (1 - Math.exp(-raw * 7));
    audio.update(raw, STAGES[G.stage]!.weather, wind, WX.wo);
  }

  /* ---------------- render ---------------- */
  function drawEnemy(e: Enemy) {
    const p = e.pos;
    const f: Figure = {
      x: p.x,
      y: p.y,
      h: p.h,
      fog: p.fog,
      alpha: p.alpha,
      d: e.d,
      pose: e.pose,
      lean: e.lean,
      variant: e.look,
      glint: e.glint,
    };
    if (e.state !== 'dying') {
      drawFigure(f);
      return;
    }
    const t = e.t,
      dtp = e.deathType;
    if (!dtp || dtp === 'split') {
      drawSplit(f, p, e.cutAng ?? 0, t, 0.9);
      return;
    }
    f.alpha = (f.alpha == null ? 1 : f.alpha) * (1 - clamp((t - 0.6) / 0.5));
    if (dtp === 'kneel' || dtp === 'disarm') {
      const k1 = easeOut(clamp(t / 0.3)),
        k2 = easeInOut(clamp((t - 0.3) / 0.5));
      f.y += p.h * 0.16 * k1;
      f.sy = 1 - 0.22 * k1;
      f.rot = (e.fallDir ?? 1) * 0.9 * k2;
      f.noSword = dtp === 'disarm';
    } else {
      const k = easeOut(clamp(t / 0.6));
      f.y -= p.h * 0.05 * k;
      f.x += (e.fallDir ?? 1) * p.h * 0.08 * k;
      f.rot = (e.fallDir ?? 1) * 0.5 * easeInOut(clamp((t - 0.2) / 0.6));
    }
    drawFigure(f);
  }
  function drawBoss() {
    const b = G.boss;
    if (!b) return;
    const p = b.pos;
    const f = {
      x: p.x,
      y: p.y,
      h: p.h,
      fog: p.fog,
      alpha: p.alpha,
      d: b.d,
      pose: b.pose,
      lean: b.lean,
      variant: b.def.v,
      glint: b.glint,
      pal: b.def.pal ? robePal(b.def.pal) : null,
      twin: b.def.twin,
      spear: b.def.spear,
    };
    if (b.state === 'dying') drawSplit(f, p, b.cutAng, b.t, 1.6);
    else drawFigure(f);
    if (G.m.ofuda && b.state === 'feint') {
      const w = Math.max(26, p.h * 0.12),
        hh = w * 2.2,
        tx = p.x + p.h * 0.42,
        ty = Math.max(hh / 2 + 64, p.y - p.h * 0.75);
      g.save();
      g.translate(tx, ty);
      g.rotate(Math.sin(time * 6) * 0.08);
      g.fillStyle = '#ece3cf';
      g.fillRect(-w / 2, -hh / 2, w, hh);
      g.strokeStyle = SEAL;
      g.lineWidth = 2;
      g.strokeRect(-w / 2 + 3, -hh / 2 + 3, w - 6, hh - 6);
      g.fillStyle = SEAL;
      g.font = `800 ${w * 0.75}px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('偽', 0, 0);
      g.restore();
    }
    if (b.state === 'flash') {
      const k = clamp(b.t / b.bp.flash);
      g.save();
      g.strokeStyle = `rgba(255,252,244,${0.9 * (1 - k * 0.4)})`;
      g.lineWidth = Math.max(2, p.h * 0.012);
      g.beginPath();
      g.arc(p.x, p.y - p.h * 0.62, lerp(p.h * 0.75, p.h * 0.2, k), 0, TAU);
      g.stroke();
      g.restore();
    }
  }
  function drawPlayer() {
    const p = L.player;
    drawFigure({
      x: p.x + P.lean * p.h,
      y: p.y + P.fall * p.h * 0.22,
      h: p.h,
      back: true,
      fog: 0,
      d: P.d,
      pose: P.pose,
      lean: 0,
      rot: -P.fall * 0.28,
      noShadow: true,
      pal: robePal(EQ.robe),
      blade: bladeStyle(),
      variant: (ROBES[EQ.robe] || {}).variant,
      cape: (ROBES[EQ.robe] || {}).cape,
      coat: (ROBES[EQ.robe] || {}).coat,
      rf: ROBES[EQ.robe],
      charm: CHARMCOL[EQ.charm],
      crest: EQ.crest === 'nocrest' ? null : EQ.crest,
      pet: petOf(),
    });
  }
  function drawGlyphs() {
    if (G.state === 'title' || !G.cfg) return;
    const ordered = waveConfiguration().ordered,
      night = STAGES[G.stage]!.weather === 'night',
      veilK = 1 - WX.veil * 0.85 * G.m.hazard;
    if (G.state === 'playing' || G.state === 'dead') {
      const live = G.enemies.filter(
        (e) => e.state === 'idle' || e.state === 'attack' || (e.state === 'enter' && e.t > 0.3),
      );
      const rk = ordered ? liveOrdered() : null;
      for (const e of live) {
        const p = e.pos,
          isA = e === G.attacker,
          r = clamp(p.h * 0.15, 13, isA ? 32 : 24),
          y = Math.max(p.y - p.h * 1.18 - r, r + 62);
        const shown = e.fake && !e.switched && !G.bless.has('mercy') ? e.fake : e.dir,
          rank = ordered ? rk!.indexOf(e) + 1 : 0;
        let alpha =
          e.state === 'enter' ? clamp((e.t - 0.3) / 0.3) : ordered && rank !== 1 ? 0.5 : 1;
        if (G.state === 'dead') alpha *= 0.4;
        alpha *= veilK;
        const seer = G.bless.has('foresight') && (ordered ? rank === 1 : isA);
        if (G.event === 'fog' && !isA && !seer) alpha = 0;
        let arrowA = null;
        if (night && !G.m.noFade) {
          arrowA = isA
            ? clamp(1 - (e.p - 0.22) / 0.15, 0.06, 1)
            : e.state === 'idle'
              ? clamp(1 - (e.t - 0.9) / 0.4, 0.06, 1)
              : 1;
        }
        if (G.blade) arrowA = 0;
        if (G.m.blind) arrowA = 0;
        else if (seer) arrowA = null;
        drawEnso(p.x, y, r, shown, {
          prog: isA && !G.m.noRing ? clamp(e.p) : null,
          alpha,
          rank,
          quiver: !!(e.fake && !e.switched),
          arrowA,
          frozen: isA && G.freezeT > 0,
          ghost: (G.bless.has('fox') || G.m.foxsight) && e.fake && !e.switched ? e.dir : null,
        });
      }
    }
    const so = G.so;
    if (so && G.state === 'standoff' && so.fired && !so.done) {
      const p = so.e.pos,
        r = clamp(p.h * 0.13, 22, 36);
      drawEnso(p.x - p.h * 0.42, Math.max(p.y - p.h * 0.8, r + 64), r, so.e.dir, {
        prog: clamp((so.t - so.ft) / so.win),
        alpha: 1,
        arrowA: G.blade || G.m.blind ? 0 : null,
        noArc: 1,
      });
    }
    const b = G.boss;
    if (b && b.state === 'stagger' && G.state === 'boss') {
      const p = b.pos,
        r = clamp(p.h * 0.11, 22, 38),
        ex = p.x - p.h * 0.42,
        ey = Math.max(p.y - p.h * 0.78, r + 64);
      const fk = b.sfake && b.t < b.sflip;
      drawEnso(ex, ey, r, fk ? b.sfake! : b.sdir, {
        prog: clamp(b.t / b.window),
        alpha: 1,
        arrowA: G.blade || G.m.blind || G.m.duelBlind ? 0 : null,
        noArc: 1,
        quiver: !!fk,
      });
      if (b.chainLen > 1) {
        const n = b.chainLen,
          sz = Math.max(6, r * 0.2),
          gp = sz * 2.3;
        for (let i = 0; i < n; i++) {
          g.save();
          g.translate(ex + (i - (n - 1) / 2) * gp, ey + r * 1.55);
          g.rotate(Math.PI / 4);
          g.fillStyle = i < b.chainLeft ? '#efe9dd' : 'rgba(239,233,221,.22)';
          g.strokeStyle = 'rgba(10,10,9,.6)';
          g.lineWidth = 1.5;
          g.fillRect(-sz / 2, -sz / 2, sz, sz);
          g.strokeRect(-sz / 2, -sz / 2, sz, sz);
          g.restore();
        }
      }
    }
  }
  function effectRenderer(context = g, state = fx, scale = S) {
    return createEffectRenderer(context, state, {
      scale,
      time,
      font: FONT,
      seal: SEAL,
      mistSprite,
    });
  }
  function drawFx() {
    effectRenderer().drawFx();
  }
  function drawFx2() {
    effectRenderer().drawFx2();
  }
  function drawStains() {
    effectRenderer().drawStains();
  }
  function drawPops() {
    effectRenderer().drawPops();
  }
  function drawStamps() {
    effectRenderer().drawStamps();
  }
  function drawPost(raw: number) {
    if (G.event === 'blood' && (G.state === 'playing' || G.state === 'dead')) {
      g.fillStyle = 'rgba(120,18,12,0.16)';
      g.fillRect(0, 0, W, H);
    }
    applyFilm(g, W, H, cvs, EQ.film);
    frameN++;
    const pat = grainPats[frameN % 3];
    if (pat) {
      g.save();
      g.translate(-((R() * 180) | 0), -((R() * 180) | 0));
      g.fillStyle = pat;
      g.fillRect(0, 0, W + 180, H + 180);
      g.restore();
    }
    const nit = EQ.film === 'nitrate';
    if (nit && R() < 0.03) {
      g.fillStyle = 'rgba(8,6,4,.55)';
      g.beginPath();
      g.arc(R() * W, R() * H, 6 + R() * 30, 0, TAU);
      g.fill();
    }
    if (R() < (nit ? 0.4 : 0.07))
      fx.scratches.push({
        x: R() * W,
        y0: R() < 0.5 ? 0 : R() * H * 0.5,
        y1: R() < 0.5 ? H : H * (0.5 + R() * 0.5),
        t: 0,
        life: 0.06 + R() * 0.3,
        a: 0.05 + R() * 0.12,
      });
    for (const s of fx.scratches) {
      s.t += raw;
      g.strokeStyle = `rgba(225,220,210,${s.a})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(s.x, s.y0);
      g.lineTo(s.x + 1.5, s.y1);
      g.stroke();
    }
    fx.scratches = fx.scratches.filter((s) => s.t < s.life);
    for (let i = 0; i < ((R() * 3) | 0); i++) {
      g.fillStyle = R() < 0.5 ? 'rgba(10,10,9,.35)' : 'rgba(230,225,215,.3)';
      g.beginPath();
      g.arc(R() * W, R() * H, 0.6 + R() * 1.6, 0, TAU);
      g.fill();
    }
    if (vig) {
      g.drawImage(vig, 0, 0, W, H);
      if (G.attacker && G.state === 'playing' && G.attacker.p >= pz() && !G.m.noArc) {
        g.globalAlpha = 0.5 + 0.2 * Math.sin(time * 30);
        g.drawImage(vig, 0, 0, W, H);
        g.globalAlpha = 1;
      }
    }
    if (STAGES[G.stage]!.weather === 'night' && vig) {
      g.globalAlpha = 0.35;
      g.drawImage(vig, 0, 0, W, H);
      g.globalAlpha = 1;
    }
    {
      const act = ['playing', 'boss', 'standoff', 'between', 'shrine', 'dead'].includes(G.state),
        lm = !G.zen && !G.hard && G.maxLives > 1;
      const tgt = act && lm ? clamp((G.maxLives - G.lives) / (G.maxLives - 1)) : 0;
      inkA += (tgt - inkA) * (1 - Math.exp(-raw * 3));
      if (act && lm && G.lives === 1 && G.state !== 'dead') {
        hbT -= raw;
        if (hbT <= 0) {
          hbT =
            (G.attacker && G.attacker.p >= pz()) ||
            (G.boss && ['windup', 'flash'].includes(G.boss.state))
              ? 0.6
              : 0.9;
          hbP = 1;
          sfx.heart();
          buzz(8);
        }
      }
      hbP = Math.max(0, hbP - raw * 3.5);
      inkPulse = Math.max(0, inkPulse - raw * 1.4);
      if (inkEdge && (inkA > 0.01 || inkPulse > 0.01)) {
        g.globalAlpha = clamp(inkA * 0.8 + hbP * 0.3 * inkA + inkPulse * 0.6);
        g.drawImage(inkEdge, 0, 0, W, H);
        g.globalAlpha = 1;
      }
    }
    if (lb > 0.005) {
      const bh = lb * H * 0.085;
      g.fillStyle = '#060605';
      g.fillRect(0, 0, W, bh);
      g.fillRect(0, H - bh, W, bh);
    }
    g.fillStyle = `rgba(0,0,0,${R() * (EQ.film === 'nitrate' ? 0.12 : 0.035)})`;
    g.fillRect(0, 0, W, H);
    if (flashA > 0) {
      g.fillStyle = `rgba(${flashCol},${flashA})`;
      g.fillRect(0, 0, W, H);
      flashA = Math.max(0, flashA - raw * 2.4);
    }
  }
  function render(raw: number) {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const sx = (R() - 0.5) * shake,
      sy =
        (R() - 0.5) * shake +
        (EQ.film === 'nitrate' ? Math.sin(time * 7) * 1.2 + (R() < 0.02 ? R() * 4 : 0) : 0);
    shake = Math.max(0, shake - raw * 45 * S);
    g.save();
    g.translate(sx, sy);
    if (zoom > 1.001) {
      g.translate(zoomX, zoomY);
      g.scale(zoom, zoom);
      g.translate(-zoomX, -zoomY);
    }
    if (bg) g.drawImage(bg, 0, 0, W, H);
    if (L.glows && L.glows.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const q of L.glows) {
        const a = 0.22 + 0.08 * Math.sin(time * 9 + q.x) + 0.05 * Math.sin(time * 23);
        const rg = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
        rg.addColorStop(0, `rgba(255,210,150,${a})`);
        rg.addColorStop(1, 'rgba(255,210,150,0)');
        g.fillStyle = rg;
        g.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      }
      g.restore();
    }
    if (prevBg && stageFade > 0) {
      const k = easeInOut(1 - stageFade),
        ex = -W * 0.15 + k * W * 1.35,
        stp = H / 40,
        ed = (y: number) =>
          ex + Math.sin(y * 0.021) * W * 0.035 + Math.sin(y * 0.07 + 1.7) * W * 0.012;
      g.save();
      g.beginPath();
      g.moveTo(W + 60, -10);
      g.lineTo(ed(-10), -10);
      for (let y = 0; y <= H + stp; y += stp) g.lineTo(ed(y), y);
      g.lineTo(W + 60, H + 10);
      g.closePath();
      g.clip();
      g.drawImage(prevBg, 0, 0, W, H);
      g.restore();
      g.fillStyle = 'rgba(10,9,8,.9)';
      for (let y = 0; y < H; y += 4) {
        const hs = Math.abs(Math.sin(y * 12.9898) * 43758.5453) % 1,
          len = W * (0.02 + 0.07 * hs);
        g.globalAlpha = 0.55 + 0.45 * hs;
        g.fillRect(ed(y) - len, y, len, 3);
      }
      g.globalAlpha = 1;
    }
    if (mistSprite)
      for (const m of mists) {
        g.globalAlpha = m.a;
        g.drawImage(mistSprite, m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
      }
    g.globalAlpha = 1;
    blades(mid, time);
    drawStains();
    drawLeaves(false);
    const b = G.boss;
    if (b && ['windup', 'flash', 'feint'].includes(b.state)) {
      const k = b.state === 'flash' ? 1 : clamp(b.t / b.dur);
      g.fillStyle = `rgba(0,0,0,${0.2 * k})`;
      g.fillRect(-30, -30, W + 60, H + 60);
    }
    const back = G.enemies
      .filter((e) => e !== G.attacker && e.state !== 'strike')
      .sort((a, c) => a.pos.y - c.pos.y);
    for (const e of back) drawEnemy(e);
    if (G.event === 'fog' && (G.state === 'playing' || G.state === 'dead')) {
      const y0 = L.horizonY,
        y1 = L.groundY + L.eH * 0.25,
        mc = STAGES[G.stage]!.mist,
        fg2 = g.createLinearGradient(0, y0, 0, y1);
      fg2.addColorStop(0, `rgba(${mc},0)`);
      fg2.addColorStop(0.3, `rgba(${mc},.88)`);
      fg2.addColorStop(0.85, `rgba(${mc},.88)`);
      fg2.addColorStop(1, `rgba(${mc},0)`);
      g.fillStyle = fg2;
      g.fillRect(-30, y0, W + 60, y1 - y0);
    }
    if (b) drawBoss();
    for (const e of G.enemies) if (e === G.attacker || e.state === 'strike') drawEnemy(e);
    drawBamboo();
    drawPlayer();
    drawPet();
    drawFoxfire();
    drawFx();
    drawFx2();
    blades(fg, time);
    drawGlyphs();
    drawSmoke();
    drawLeaves(true);
    drawWeather();
    drawPops();
    g.restore();
    drawStamps();
    drawPost(raw);
  }
  const frameLoop = createFrameLoop(
    {
      get hitStop() {
        return hitStop;
      },
      set hitStop(value) {
        hitStop = value;
      },
      get slowT() {
        return G.slowT;
      },
      set slowT(value) {
        G.slowT = value;
      },
      get timeScale() {
        return timeScale;
      },
    },
    {
      paused: () => G.state === 'paused',
      update,
      render,
      afterRender: () => {
        if (G.panel === 'armory') drawPreview();
      },
    },
  );

  /* ---------------- boot ---------------- */
  let rt = 0;
  function resize() {
    const r = cvs.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    cvs.width = Math.round(W * DPR);
    cvs.height = Math.round(H * DPR);
    layout();
    buildBG();
    buildMist();
    buildGrass();
    buildLeaves();
    buildWeather();
    buildPost();
    prevBg = null;
    stageFade = 0;
    for (const e of G.enemies) e.pos = enemyPos(e);
    if (G.boss) G.boss.pos = bossPos(G.boss);
  }
  lifecycle.listen(window, 'resize', () => {
    lifecycle.clearTimeout(rt);
    rt = lifecycle.timeout(resize, 80);
  });
  computeMods();
  applySeal();
  resize();
  setupAttract();
  setMuteIcon();
  checkUnlocks(true);
  setBestLine();
  if (document.fonts && document.fonts.load)
    document.fonts.load(`800 20px "Shippori Mincho B1"`, '一二三四五閃').catch(() => {});
  lifecycle.add(() => {
    frameLoop.stop();
    disposePointer();
    disposeKeyboard();
    setupScreen.dispose();
    armory.dispose();
    notifications.dispose();
    void audio.dispose()?.catch(() => {});
  });
  frameLoop.start();
  return lifecycle.dispose;
}
