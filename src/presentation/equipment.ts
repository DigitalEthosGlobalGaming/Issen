import { BLADES, ROBES } from '../game/content/cosmetics.ts';
import { SPECIAL, STEEL_THIRD } from '../game/content/awakenings.ts';
import { ROBE_AWAKENINGS } from '../game/content/robe-awakenings.ts';
import type { Equipment } from '../platform/saves.ts';
import type { RunState } from '../game/run-state.ts';
import type { PlayerAnimation } from '../game/player/player.ts';
import type { PreviewFrame } from '../rendering/armory-preview.ts';
import type { Palette } from '../rendering/palette.ts';
import type { createLightingRig } from '../rendering/lighting-rig.ts';
import type { createEnvironmentState } from './environment-state.ts';
export interface EquipmentPresentationViews {
  readonly EQ: Readonly<Equipment>;
  readonly robePal: (id: string) => Palette;
  readonly isRobeSp: () => boolean;
  readonly isSteelThird: () => boolean;
  readonly isSp: () => boolean;
  readonly $: (id: 'prevC') => HTMLCanvasElement;
  readonly lightingRig: Pick<ReturnType<typeof createLightingRig>, 'lighting'>;
  readonly presentationState: { readonly time: number; readonly wind: number };
  readonly density: () => number;
  readonly reducedMotion: () => boolean;
  readonly reducedFlashes: () => boolean;
  readonly G: Readonly<Pick<RunState, 'petT'>>;
  readonly cols: PreviewFrame['palette'];
  readonly environmentState: Readonly<Pick<ReturnType<typeof createEnvironmentState>, 'bg' | 'mistSprite'>>;
  readonly P: Readonly<Pick<PlayerAnimation, 'd'>>;
  readonly petOf: () => string;
  readonly FONT: string;
  readonly SEAL: string;
}
/** Equipment visuals and preview frames borrow read-only rule selections. */
export function createEquipmentPresentation(readViews: () => EquipmentPresentationViews) {
  const BASEBLADE = {
    len: 0.52,
    d: '#5c5a56',
    m: '#a8a59f',
    l: '#f6f3ec',
    edge: 'rgba(255,253,246,.9)',
  };
  const CHARMCOL: Record<string, string> = {
    'pilgrims-bead': '#7e654c',
    'first-strike': '#b8322a',
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
  function playerRobePalette() {
    const { EQ, robePal, isRobeSp } = readViews();
    const base = robePal(EQ.robe);
    const accent = isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]?.st?.c : null;
    return accent
      ? { ...base, robeL: `rgb(${accent})`, inner: `rgb(${accent})`, obi: `rgb(${accent})` }
      : base;
  }
  function bladeStyle() {
    const { EQ, isSteelThird, isSp } = readViews();
    const b = BLADES[EQ.blade];
    if (isSteelThird())
      return {
        ...(b || BASEBLADE),
        aura: STEEL_THIRD.aura,
        glow: 'rgba(170,225,255,.62)',
        edge: 'rgba(225,248,255,.98)',
        edgeW: 0.008,
      };
    return isSp()
      ? Object.assign(
          {},
          b || BASEBLADE,
          { aura: SPECIAL[EQ.blade]!.aura },
          SPECIAL[EQ.blade]!.st || {},
        )
      : b;
  }
  function previewFrame(film: string, effectsVisible: boolean, target = readViews().$('prevC')): PreviewFrame {
    const { EQ, lightingRig, presentationState, density, reducedMotion, reducedFlashes, G, cols, environmentState, P, isRobeSp, petOf, FONT, SEAL } = readViews();
    const rb = ROBES[EQ.robe] || {};
    return {
      lighting: lightingRig.lighting(target.width, target.height),
      time: presentationState.time,
      wind: presentationState.wind,
      effectDensity: density(),
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
      petActive: G.petT > 0,
      palette: cols,
      background: environmentState.bg,
      appearance: {
        d: P.d,
        pal: playerRobePalette(),
        robeAura: isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]?.aura : null,
        blade: bladeStyle(),
        bladeId: EQ.blade,
        robeId: EQ.robe,
        variant: rb.variant,
        cape: rb.cape,
        coat: rb.coat,
        rf: rb,
        charm: CHARMCOL[EQ.charm],
        charmId: EQ.charm,
        crest: EQ.crest === 'nocrest' ? null : EQ.crest,
        pet: petOf(),
      },
      pet: EQ.pet,
      film,
      effectsVisible,
      font: FONT,
      seal: SEAL,
      mistSprite: environmentState.mistSprite,
    };
  }

  return { CHARMCOL, playerRobePalette, bladeStyle, previewFrame };
}
