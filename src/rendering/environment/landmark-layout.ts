/** Measured alpha>16 source windows plus four-pixel padding, original atlases preserved.
 * Anchors are normalized within these cropped windows, visually measured ground contacts.
 */
export const LANDMARK_LAYOUT = {
  woodland: {
    width: 1254,
    height: 1254,
    frames: [
      {
        frame: {
          x: 88,
          y: 198,
          width: 534,
          height: 328,
        },
        anchorX: 0.8183520599250936,
        anchorY: 0.9847560975609756,
      },
      {
        frame: {
          x: 885,
          y: 149,
          width: 217,
          height: 407,
        },
        anchorX: 0.5299539170506913,
        anchorY: 0.9877149877149877,
      },
      {
        frame: {
          x: 90,
          y: 771,
          width: 476,
          height: 325,
        },
        anchorX: 0.5042016806722689,
        anchorY: 0.9846153846153847,
      },
      {
        frame: {
          x: 762,
          y: 804,
          width: 406,
          height: 300,
        },
        anchorX: 0.30295566502463056,
        anchorY: 0.9833333333333333,
      },
    ],
  },
  snowWoodland: {
    width: 1254,
    height: 1254,
    frames: [
      {
        frame: {
          x: 86,
          y: 195,
          width: 541,
          height: 334,
        },
        anchorX: 0.8114602587800369,
        anchorY: 0.9850299401197605,
      },
      {
        frame: {
          x: 881,
          y: 145,
          width: 224,
          height: 413,
        },
        anchorX: 0.53125,
        anchorY: 0.9878934624697336,
      },
      {
        frame: {
          x: 86,
          y: 767,
          width: 481,
          height: 331,
        },
        anchorX: 0.5072765072765073,
        anchorY: 0.9848942598187311,
      },
      {
        frame: {
          x: 758,
          y: 802,
          width: 414,
          height: 305,
        },
        anchorX: 0.30676328502415456,
        anchorY: 0.9836065573770492,
      },
    ],
  },
  stones: {
    width: 1254,
    height: 1254,
    frames: [
      {
        frame: {
          x: 24,
          y: 44,
          width: 575,
          height: 550,
        },
        anchorX: 0.5060869565217392,
        anchorY: 0.9709090909090909,
      },
      {
        frame: {
          x: 615,
          y: 281,
          width: 620,
          height: 308,
        },
        anchorX: 0.5161290322580645,
        anchorY: 0.9545454545454546,
      },
      {
        frame: {
          x: 107,
          y: 654,
          width: 533,
          height: 565,
        },
        anchorX: 0.49906191369606,
        anchorY: 0.9663716814159292,
      },
      {
        frame: {
          x: 716,
          y: 661,
          width: 391,
          height: 554,
        },
        anchorX: 0.5089514066496164,
        anchorY: 0.9693140794223827,
      },
    ],
  },
  bambooLandmarks: {
    width: 1254,
    height: 1254,
    frames: [
      {
        frame: {
          x: 83,
          y: 71,
          width: 489,
          height: 640,
        },
        anchorX: 0.5153374233128835,
        anchorY: 0.975,
      },
      {
        frame: {
          x: 755,
          y: 122,
          width: 386,
          height: 599,
        },
        anchorX: 0.5051813471502591,
        anchorY: 0.9649415692821369,
      },
      {
        frame: {
          x: 43,
          y: 805,
          width: 561,
          height: 357,
        },
        anchorX: 0.49376114081996436,
        anchorY: 0.938375350140056,
      },
      {
        frame: {
          x: 715,
          y: 858,
          width: 520,
          height: 314,
        },
        anchorX: 0.4980769230769231,
        anchorY: 0.9363057324840764,
      },
    ],
  },
  cherryLandmarks: {
    width: 1254,
    height: 1254,
    frames: [
      {
        frame: {
          x: 113,
          y: 86,
          width: 401,
          height: 509,
        },
        anchorX: 0.5211970074812967,
        anchorY: 0.9901768172888016,
      },
      {
        frame: {
          x: 627,
          y: 241,
          width: 574,
          height: 359,
        },
        anchorX: 0.5940766550522648,
        anchorY: 0.9860724233983287,
      },
      {
        frame: {
          x: 75,
          y: 707,
          width: 557,
          height: 456,
        },
        anchorX: 0.7235188509874326,
        anchorY: 0.9890350877192983,
      },
      {
        frame: {
          x: 703,
          y: 758,
          width: 497,
          height: 410,
        },
        anchorX: 0.6177062374245473,
        anchorY: 0.9902439024390244,
      },
    ],
  },
} as const;
export type LandmarkFamily = keyof typeof LANDMARK_LAYOUT;
