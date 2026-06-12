/** ATELIER motion constants — the only easings/durations allowed in the app. */
export const EASE = {
  luxe: [0.22, 1, 0.36, 1],     // all entrances
  exit: [0.55, 0, 1, 0.45],     // all exits
  settle: [0.34, 1.2, 0.64, 1], // countdown numerals, success
} as const;

export const DUR = { touch: 0.12, fast: 0.25, screen: 0.45, cinematic: 0.7 } as const;

/* Screen transition — wrap each screen in <motion.div {...screenTransition}>,
   pages in <AnimatePresence mode="wait"> */
export const screenTransition = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.screen, ease: EASE.luxe } },
  exit: { opacity: 0, y: -16, transition: { duration: DUR.screen * 0.6, ease: EASE.exit } },
};

/* Card cascade — parent gets `cascade`, children get `cascadeItem` */
export const cascade = { animate: { transition: { staggerChildren: 0.04 } } };
export const cascadeItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE.luxe } },
};

/* Touch feedback — spread onto any pressable motion element */
export const press = {
  whileTap: { scale: 0.98, filter: 'brightness(0.92)' },
  transition: { duration: DUR.touch },
};

/* Capture flash — ivory overlay, 90ms peak */
export const flash = {
  initial: { opacity: 0 },
  animate: { opacity: [0, 1, 0], transition: { duration: 0.09, times: [0, 0.4, 1] } },
};

/* Photo develop — darkroom reveal after capture */
export const develop = {
  initial: { filter: 'brightness(0)', scale: 1.03 },
  animate: {
    filter: 'brightness(1)', scale: 1,
    transition: { duration: DUR.cinematic, ease: EASE.luxe },
  },
};

/* Success name settle */
export const settleIn = {
  initial: { opacity: 0, scale: 1.06 },
  animate: { opacity: 1, scale: 1, transition: { duration: DUR.cinematic, ease: EASE.settle } },
};
