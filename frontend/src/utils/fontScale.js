// Changing the SCALE value in this file affects the font sizes across all pages (they become bigger or smaller)
// 1.0 = original | 1.1 = 10% larger | 1.2 = 20% larger | 1.15 = recommended

export const SCALE = 1.15;

// Body text sizes
export const fs = {
  xxs:  Math.round(9  * SCALE), // 10
  xs:   Math.round(10 * SCALE), // 11
  sm:   Math.round(11 * SCALE), // 12
  base: Math.round(12 * SCALE), // 13
  md:   Math.round(13 * SCALE), // 14
  lg:   Math.round(14 * SCALE), // 16
  xl:   Math.round(15 * SCALE), // 17
};

// Bebas Neue heading sizes
export const fh = {
  h5:   Math.round(18 * SCALE), // 20
  h4:   Math.round(22 * SCALE), // 25
  h3:   Math.round(28 * SCALE), // 32
  h2sm: Math.round(32 * SCALE), // 36  (mobile h1)
  h2:   Math.round(40 * SCALE), // 46  (desktop h1)
  h1sm: Math.round(42 * SCALE), // 48  (mobile hero)
  h1:   Math.round(56 * SCALE), // 64  (desktop hero)
  pts:  Math.round(72 * SCALE), // 82  (big points number)
  hero: Math.round(80 * SCALE), // 92  (landing hero)
};

// Space Mono sizes
export const fm = {
  xs:   Math.round(9  * SCALE),
  sm:   Math.round(10 * SCALE),
  base: Math.round(11 * SCALE),
  md:   Math.round(12 * SCALE),
  lg:   Math.round(13 * SCALE),
};