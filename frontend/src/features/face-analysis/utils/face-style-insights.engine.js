function normalizeTraitKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function formatTraitLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function createInsight(id, title, recommendation, why) {
  return {
    id,
    title,
    recommendation,
    why,
    text: recommendation,
    enabled: true,
  };
}

function createSection(id, title, subtitle, items) {
  return {
    id,
    title,
    subtitle,
    items: items.filter(Boolean),
  };
}

const FACE_SHAPE_NECKLINES = {
  oval: {
    picks: ['Crew necks', 'Henleys', 'Moderate V-necks', 'Classic collared shirts'],
    avoid: ['Extremely wide boat necks that shorten the neck'],
    why: (shape) => `Your ${shape} face shape has balanced proportions, so necklines that frame the face without adding width or length work best.`,
  },
  round: {
    picks: ['Deep V-necks', 'Open collars', 'Vertical placket details', 'Long pendant necklines'],
    avoid: ['High round necks and wide crew necks that add facial width'],
    why: (shape) => `Your ${shape} face shape benefits from vertical lines that create length and sharpen soft contours.`,
  },
  square: {
    picks: ['Rounded scoop necks', 'Soft cowl necks', 'Open camp collars', 'Curved henley plackets'],
    avoid: ['Stiff mandarin collars and boxy high necks that emphasize jaw angles'],
    why: (shape) => `Your ${shape} face shape has a defined jawline — softer necklines balance angular structure.`,
  },
  rectangle: {
    picks: ['Rounded scoop necks', 'Soft cowl necks', 'Layered open collars'],
    avoid: ['Deep plunging necklines that over-elongate the face'],
    why: (shape) => `Your ${shape} face shape is elongated — rounded necklines break vertical length while keeping balance.`,
  },
  oblong: {
    picks: ['Boat necks', 'Wide collars', 'Horizontal neck detail', 'Moderate crew necks'],
    avoid: ['Deep vertical necklines with no horizontal balance'],
    why: (shape) => `Your ${shape} face shape looks best with necklines that add horizontal balance to length.`,
  },
  heart: {
    picks: ['Boat necks', 'Wider collar spreads', 'Lower neckline detail', 'Soft square necks'],
    avoid: ['Heavy top embellishment that widens the forehead visually'],
    why: (shape) => `Your ${shape} face shape is wider at the forehead — necklines that balance the upper face with the jaw work well.`,
  },
  diamond: {
    picks: ['Collared shirts', 'Medium V-necks', 'Structured necklines', 'Soft roll-necks'],
    avoid: ['Ultra-narrow collars that over-emphasize cheek width'],
    why: (shape) => `Your ${shape} face shape has prominent cheekbones — structured collars highlight balance between forehead and chin.`,
  },
  triangle: {
    picks: ['Boat necks', 'Structured shoulder detail', 'Brighter top colors', 'Open necklines'],
    avoid: ['Narrow dark tops that draw focus to a wider jaw'],
    why: (shape) => `Your ${shape} face shape is wider at the jaw — necklines and color that lift focus upward create harmony.`,
  },
};

const SKIN_TONE_PALETTES = {
  fair: {
    recommended: ['Soft navy', 'Charcoal', 'Dusty rose', 'Cool burgundy', 'Slate blue'],
    avoid: ['Harsh neon tones and washed-out beige-on-beige combinations'],
    seasonal: 'Cool Spring / Soft Summer palette',
    why: (tone) => `Your ${tone} skin tone has cool undertones — muted jewel tones and soft contrast flatter without overpowering.`,
  },
  light: {
    recommended: ['Powder blue', 'Soft teal', 'Rose mauve', 'Light olive', 'Warm grey'],
    avoid: ['Overly pale yellow-beige that blends into the complexion'],
    seasonal: 'Light Spring / Soft Summer palette',
    why: (tone) => `Your ${tone} skin tone pairs well with gentle contrast and mid-tone colors that do not wash out your features.`,
  },
  medium: {
    recommended: ['Emerald', 'Terracotta', 'Mustard gold', 'Cobalt', 'Warm white'],
    avoid: ['Muted grey-brown tones that flatten warmth'],
    seasonal: 'Warm Autumn / Deep Autumn palette',
    why: (tone) => `Your ${tone} skin tone carries warm undertones — rich earth tones and saturated mid-tones enhance your natural glow.`,
  },
  wheatish: {
    recommended: ['Olive green', 'Burnt orange', 'Deep teal', 'Camel', 'Maroon'],
    avoid: ['Cool ash grey near the face without contrast'],
    seasonal: 'Warm Autumn palette',
    why: (tone) => `Your ${tone} skin tone responds well to warm, sun-kissed colors that mirror its golden undertones.`,
  },
  tan: {
    recommended: ['Burnt sienna', 'Forest green', 'Deep coral', 'Indigo', 'Cream'],
    avoid: ['Pale pastels with insufficient contrast against rich skin'],
    seasonal: 'Deep Autumn / Warm Spring palette',
    why: (tone) => `Your ${tone} complexion supports deeper warm hues and crisp neutrals with strong contrast.`,
  },
  olive: {
    recommended: ['Olive green', 'Rust', 'Deep burgundy', 'Off-white', 'Bronze'],
    avoid: ['Yellow-green shades that clash with olive undertones'],
    seasonal: 'Deep Autumn palette',
    why: (tone) => `Your ${tone} skin tone has golden-green undertones — earthy reds, deep greens, and warm neutrals harmonize beautifully.`,
  },
  brown: {
    recommended: ['Emerald', 'Royal blue', 'Burnt orange', 'Gold', 'Rich cream'],
    avoid: ['Muted taupe and muddy brown-on-brown layering'],
    seasonal: 'Deep Autumn / Winter contrast palette',
    why: (tone) => `Your ${tone} skin tone looks striking with bold, saturated colors and high-contrast neutrals.`,
  },
  dark: {
    recommended: ['Emerald green', 'Deep navy', 'Burgundy', 'Bright white', 'Metallic gold'],
    avoid: ['Dull charcoal-brown combinations with no contrast'],
    seasonal: 'Deep Winter / rich jewel palette',
    why: (tone) => `Your ${tone} skin tone is enhanced by vivid jewel tones, crisp whites, and saturated depth.`,
  },
  deep: {
    recommended: ['Earth tones', 'Burgundy', 'Emerald green', 'Deep navy', 'Warm gold accents'],
    avoid: ['Washed-out pastels with low contrast'],
    seasonal: 'Deep Autumn / Winter palette',
    why: (tone) => `Your ${tone} skin tone pairs powerfully with rich, saturated colors and warm metallics.`,
  },
};

const HAIR_STYLE_OUTFIT_HINTS = {
  side_part: {
    styles: ['Smart casual blazers', 'Structured overshirts', 'Clean tailored polos'],
    why: (hair) => `Your ${hair} hairstyle has clean directional structure — polished smart-casual layers complement it well.`,
  },
  curly: {
    styles: ['Relaxed linen shirts', 'Unstructured knits', 'Layered casual jackets'],
    why: (hair) => `Your ${hair} hair adds natural volume — relaxed textures and soft layers balance the silhouette.`,
  },
  straight: {
    styles: ['Minimalist cuts', 'Sleek monochrome outfits', 'Sharp casual tailoring'],
    why: (hair) => `Your ${hair} hair reads sleek — clean lines and minimal layering keep the look cohesive.`,
  },
  buzz_cut: {
    styles: ['Graphic streetwear', 'Bold color-block tops', 'Structured street jackets'],
    why: (hair) => `Your ${hair} creates a strong, defined frame — bold shapes and clean structure match its confidence.`,
  },
  wavy: {
    styles: ['Layered smart-casual outfits', 'Textured knits', 'Relaxed overshirts'],
    why: (hair) => `Your ${hair} hair has natural movement — layered smart-casual pieces echo its texture without competing.`,
  },
  undercut: {
    styles: ['Modern street tailoring', 'Bomber jackets', 'Slim-fit structured tops'],
    why: (hair) => `Your ${hair} adds edge and definition — modern structured pieces mirror its contrast.`,
  },
  crew_cut: {
    styles: ['Classic casual staples', 'Henleys', 'Denim and bomber combinations'],
    why: (hair) => `Your ${hair} is clean and versatile — classic casual staples keep the look balanced.`,
  },
};

const BEARD_COLLAR_HINTS = {
  clean_shaven: {
    collars: ['Crew necks', 'Henleys', 'Minimalist collars', 'Open casual shirts'],
    why: (beard) => `With a ${beard} look, clean necklines and minimalist collars keep focus on your facial structure.`,
  },
  clean: {
    collars: ['Crew necks', 'Henleys', 'Minimalist collars'],
    why: () => 'A clean-shaven look pairs best with simple necklines that highlight jaw definition.',
  },
  none: {
    collars: ['Crew necks', 'Henleys', 'Minimalist collars'],
    why: () => 'Without facial hair, streamlined necklines showcase your natural jawline.',
  },
  light_beard: {
    collars: ['Open collars', 'Button-down shirts', 'Lightweight knits'],
    why: (beard) => `Your ${beard} adds texture — open collars and relaxed knits avoid overcrowding the lower face.`,
  },
  stubble: {
    collars: ['Open collars', 'Casual henleys', 'Unstructured shirts'],
    why: (beard) => `Your ${beard} has casual edge — relaxed open collars feel natural and balanced.`,
  },
  full_beard: {
    collars: ['Open collars', 'Wide neck openings', 'Layered casual shirts'],
    why: (beard) => `Your ${beard} adds volume around the jaw — open collars and wider neck openings prevent a cramped look.`,
  },
  full: {
    collars: ['Open collars', 'Wide neck openings', 'Layered casual shirts'],
    why: (beard) => `Your ${beard} adds volume around the jaw — open collars keep the neckline balanced.`,
  },
};

const FACE_SHAPE_OUTERWEAR = {
  oval: ['Structured blazers', 'Bomber jackets', 'Tailored overshirts'],
  round: ['Longline coats', 'Single-breasted blazers', 'Vertical-zip jackets'],
  square: ['Soft-shoulder blazers', 'Unstructured chore coats', 'Curved-hem jackets'],
  heart: ['Cropped jackets', 'A-line coats', 'Lightweight trenches'],
  diamond: ['Collared overshirts', 'Defined-shoulder blazers', 'Structured bombers'],
  rectangle: ['Cropped wide jackets', 'Horizontal pocket detail coats', 'Boxy street layers'],
  oblong: ['Cropped jackets', 'Wide lapel coats', 'Horizontal detail outerwear'],
  triangle: ['Structured shoulder jackets', 'Contrast-color outerwear', 'Wide-collar coats'],
};

const FACE_SHAPE_EYEWEAR = {
  oval: ['Most frame shapes work — aviators, wayfarers, and round frames'],
  round: ['Angular and rectangular frames', 'Wayfarers with sharp edges'],
  square: ['Round and oval frames', 'Thin metal frames with soft curves'],
  heart: ['Bottom-heavy frames', 'Light rimless or thin metal styles'],
  diamond: ['Oval and cat-eye frames', 'Rimless styles that soften cheek emphasis'],
  rectangle: ['Wide frames with horizontal emphasis', 'Aviators and browline styles'],
  oblong: ['Oversized or wide frames', 'Frames with decorative temples'],
  triangle: ['Top-heavy frames', 'Browline and cat-eye styles'],
};

function resolveFaceShapeKey(faceShape) {
  const key = normalizeTraitKey(faceShape);

  if (key === 'rectangular') {
    return 'rectangle';
  }

  return key || 'oval';
}

function buildMetricContext(metrics = {}) {
  const lengthToJaw = Number(metrics.length_to_jaw_ratio || metrics.lengthToJawRatio);
  const foreheadToJaw = Number(metrics.forehead_to_jaw_ratio || metrics.foreheadToJawRatio);
  const cheekToJaw = Number(metrics.cheek_to_jaw_ratio || metrics.cheekToJawRatio);

  const notes = [];

  if (Number.isFinite(lengthToJaw) && lengthToJaw >= 1.35) {
    notes.push('Your facial length is slightly elongated');
  } else if (Number.isFinite(lengthToJaw) && lengthToJaw <= 1.12) {
    notes.push('Your face has compact vertical proportions');
  }

  if (Number.isFinite(foreheadToJaw) && foreheadToJaw >= 1.08) {
    notes.push('your forehead reads slightly wider than your jaw');
  } else if (Number.isFinite(foreheadToJaw) && foreheadToJaw <= 0.92) {
    notes.push('your jaw reads slightly wider than your forehead');
  }

  if (Number.isFinite(cheekToJaw) && cheekToJaw >= 1.08) {
    notes.push('your cheekbones are a defining feature');
  }

  return notes;
}

function buildColorsSection(skinToneKey, skinToneLabel) {
  const palette = SKIN_TONE_PALETTES[skinToneKey] || SKIN_TONE_PALETTES.medium;

  return createSection(
    'colors',
    'Recommended Colors',
    'Palette tuned to your analyzed skin tone',
    [
      createInsight(
        'colors-wear',
        'Wear these colors',
        palette.recommended.join(', '),
        palette.why(skinToneLabel),
      ),
      createInsight(
        'colors-avoid',
        'Colors to use carefully',
        palette.avoid.join(', '),
        `These shades can flatten or clash with your ${skinToneLabel.toLowerCase()} undertones when worn near the face.`,
      ),
      createInsight(
        'colors-season',
        'Seasonal palette',
        palette.seasonal,
        `This seasonal palette aligns with the undertones detected in your ${skinToneLabel.toLowerCase()} skin analysis.`,
      ),
    ],
  );
}

function buildNecklinesSection(faceShapeKey, faceShapeLabel, beardKey, beardLabel, metrics) {
  const rules = FACE_SHAPE_NECKLINES[faceShapeKey] || FACE_SHAPE_NECKLINES.oval;
  const beardRules = BEARD_COLLAR_HINTS[beardKey] || BEARD_COLLAR_HINTS.clean_shaven;
  const metricNotes = buildMetricContext(metrics);
  const metricSuffix = metricNotes.length ? ` We also detected that ${metricNotes.join(', and ')}.` : '';

  return createSection(
    'necklines',
    'Best Necklines',
    'Necklines that complement your facial structure',
    [
      createInsight(
        'necklines-face',
        'Best for your face shape',
        rules.picks.join(', '),
        `${rules.why(faceShapeLabel)}${metricSuffix}`,
      ),
      createInsight(
        'necklines-beard',
        'Collars & necklines with your beard',
        beardRules.collars.join(', '),
        beardRules.why(beardLabel),
      ),
      createInsight(
        'necklines-avoid',
        'Use with caution',
        rules.avoid.join(', '),
        `These necklines can work against the natural balance of a ${faceShapeLabel.toLowerCase()} face.`,
      ),
    ],
  );
}

function buildTopsSection(faceShapeKey, faceShapeLabel, hairKey, hairLabel, skinToneLabel) {
  const hairRules = HAIR_STYLE_OUTFIT_HINTS[hairKey] || {
    styles: ['Versatile casual shirts', 'Well-fitted knits', 'Smart casual layers'],
    why: (hair) => `Your ${hair} hairstyle pairs with clean, well-proportioned tops that do not overpower your features.`,
  };

  const shapeTops = {
    oval: 'Classic fits across crew necks, polos, and oxford shirts',
    round: 'Vertical stripe knits, slim-fit henleys, and open placket shirts',
    square: 'Soft drape tees, curved-hem shirts, and lightweight knits',
    heart: 'Lower-detail tops, wrap-style shirts, and balanced prints',
    diamond: 'Structured shoulders, crisp shirts, and clean tailoring',
    rectangle: 'Horizontal detail tops, layered shirts, and cropped jackets over tees',
    triangle: 'Brighter or patterned tops with structured shoulders',
  };

  return createSection(
    'tops',
    'Best Tops',
    'Shirts and tops matched to your traits',
    [
      createInsight(
        'tops-shape',
        'Face-shape tops',
        shapeTops[faceShapeKey] || shapeTops.oval,
        `Selected for your ${faceShapeLabel.toLowerCase()} face shape to maintain balanced facial proportions.`,
      ),
      createInsight(
        'tops-hair',
        'Hair-compatible styles',
        hairRules.styles.join(', '),
        hairRules.why(hairLabel),
      ),
      createInsight(
        'tops-tone',
        'Color pairing',
        `Prioritize tops in colors that complement your ${skinToneLabel.toLowerCase()} skin tone near the face.`,
        'Keeping strong color contrast close to the face enhances your analyzed undertones.',
      ),
    ],
  );
}

function buildOuterwearSection(faceShapeKey, faceShapeLabel, beardLabel) {
  const picks = FACE_SHAPE_OUTERWEAR[faceShapeKey] || FACE_SHAPE_OUTERWEAR.oval;

  return createSection(
    'outerwear',
    'Best Outerwear',
    'Jackets and layers that frame your face',
    [
      createInsight(
        'outerwear-picks',
        'Recommended jackets',
        picks.join(', '),
        `These outerwear silhouettes add definition without overpowering your ${faceShapeLabel.toLowerCase()} proportions.`,
      ),
      createInsight(
        'outerwear-beard',
        'Layering with your beard style',
        beardLabel.toLowerCase().includes('clean') || beardLabel.toLowerCase().includes('shaven')
          ? 'Structured lapels and clean bomber collars sharpen a clean-shaven look.'
          : 'Open-front layers and unstructured jackets leave room around a bearded jawline.',
        `Outerwear neckline choice should respect your ${beardLabel.toLowerCase()} grooming style.`,
      ),
    ],
  );
}

function buildAccessoriesSection(faceShapeKey, faceShapeLabel, hairLabel, beardLabel) {
  const accessoryMap = {
    oval: ['Statement watches', 'Medium pendants', 'Classic leather belts'],
    round: ['Long pendants', 'Vertical scarf drapes', 'Angular belt buckles'],
    square: ['Round watches', 'Soft scarf folds', 'Curved pendants'],
    heart: ['Drop earrings', 'Lower-position pendants', 'Minimal top-heavy hats'],
    diamond: ['Stud earrings', 'Delicate chains', 'Medium-width belts'],
    rectangle: ['Wide scarves', 'Horizontal pin details', 'Broader watch faces'],
    triangle: ['Statement earrings higher on the face', 'Brighter scarves', 'Structured caps'],
  };

  const picks = accessoryMap[faceShapeKey] || accessoryMap.oval;

  return createSection(
    'accessories',
    'Best Accessories',
    'Finishing pieces calibrated to your features',
    [
      createInsight(
        'accessories-picks',
        'Recommended accessories',
        picks.join(', '),
        `These accessories complement a ${faceShapeLabel.toLowerCase()} face by balancing its natural proportions.`,
      ),
      createInsight(
        'accessories-grooming',
        'Grooming-aware styling',
        beardLabel.toLowerCase().includes('full') || beardLabel.toLowerCase().includes('light')
          ? 'Keep accessories minimal near the jaw so facial hair remains the focal point.'
          : 'Minimalist accessories work well with your grooming style and keep the face uncluttered.',
        `Your ${hairLabel.toLowerCase()} hair and ${beardLabel.toLowerCase()} beard influenced this accessory balance.`,
      ),
    ],
  );
}

function buildEyewearSection(faceShapeKey, faceShapeLabel) {
  const picks = FACE_SHAPE_EYEWEAR[faceShapeKey] || FACE_SHAPE_EYEWEAR.oval;

  return createSection(
    'eyewear',
    'Best Eyewear',
    'Frame shapes that harmonize with your face',
    [
      createInsight(
        'eyewear-picks',
        'Frame recommendations',
        picks.join('; '),
        `Eyewear for a ${faceShapeLabel.toLowerCase()} face should contrast or soften your dominant facial angles.`,
      ),
    ],
  );
}

function buildOutfitCombinationsSection(
  faceShapeLabel,
  skinToneLabel,
  hairLabel,
  beardLabel,
  hairKey,
) {
  const casual = hairKey === 'curly' || hairKey === 'wavy'
    ? 'Textured knit + relaxed chinos + clean sneakers'
    : 'Crisp shirt + tailored chinos + minimal sneakers';

  const smart = hairKey === 'undercut' || hairKey === 'side_part'
    ? 'Structured overshirt + dark denim + leather boots'
    : 'Smart blazer + neutral tee + tapered trousers';

  return createSection(
    'outfits',
    'Outfit Combinations',
    'Complete looks built from your analyzed traits',
    [
      createInsight(
        'outfit-casual',
        'Everyday casual',
        casual,
        `Balanced for your ${faceShapeLabel.toLowerCase()} face, ${skinToneLabel.toLowerCase()} skin tone, and ${hairLabel.toLowerCase()} hair.`,
      ),
      createInsight(
        'outfit-smart',
        'Smart casual',
        smart,
        `Adds structure around a ${beardLabel.toLowerCase()} grooming style without hiding your natural features.`,
      ),
      createInsight(
        'outfit-color',
        'Color strategy',
        `Anchor the outfit with one skin-tone-friendly color near the face and neutral bottoms.`,
        `This keeps attention on colors that flatter your analyzed ${skinToneLabel.toLowerCase()} undertones.`,
      ),
    ],
  );
}

export function buildFaceStyleInsights(analysis = {}, { hasReport = false } = {}) {
  if (!hasReport) {
    return { sections: [], highlights: [] };
  }

  const faceShapeKey = resolveFaceShapeKey(analysis.faceShape);
  const skinToneKey = normalizeTraitKey(analysis.skinTone) || 'medium';
  const hairKey = normalizeTraitKey(analysis.hairStyle) || 'straight';
  const beardKey = normalizeTraitKey(analysis.beardType || analysis.beardStyle) || 'clean_shaven';

  const faceShapeLabel = formatTraitLabel(analysis.faceShape || faceShapeKey);
  const skinToneLabel = formatTraitLabel(analysis.skinTone || skinToneKey);
  const hairLabel = formatTraitLabel(analysis.hairStyle || hairKey);
  const beardLabel = formatTraitLabel(analysis.beardType || analysis.beardStyle || 'Clean Shaven');

  const metrics = analysis.faceShapeMetrics || analysis.rawAiResponse?.faceShapeMetrics || {};

  const sections = [
    buildColorsSection(skinToneKey, skinToneLabel),
    buildNecklinesSection(faceShapeKey, faceShapeLabel, beardKey, beardLabel, metrics),
    buildTopsSection(faceShapeKey, faceShapeLabel, hairKey, hairLabel, skinToneLabel),
    buildOuterwearSection(faceShapeKey, faceShapeLabel, beardLabel),
    buildAccessoriesSection(faceShapeKey, faceShapeLabel, hairLabel, beardLabel),
    buildEyewearSection(faceShapeKey, faceShapeLabel),
    buildOutfitCombinationsSection(faceShapeLabel, skinToneLabel, hairLabel, beardLabel, hairKey),
  ].filter((section) => section.items.length > 0);

  const highlights = sections
    .flatMap((section) => section.items.slice(0, 1))
    .slice(0, 4)
    .map((item) => item.recommendation);

  return { sections, highlights };
}

/** @deprecated Use buildFaceStyleInsights — kept for internal flat-list compatibility */
export function buildStyleRecommendations(analysis, hasReport) {
  const payload = typeof analysis === 'string'
    ? { faceShape: analysis }
    : (analysis || {});

  const insights = buildFaceStyleInsights(payload, { hasReport });

  return insights.sections.flatMap((section) =>
    section.items.map((item, index) => ({
      id: `${section.id}-${index}`,
      text: item.recommendation,
      title: item.title,
      why: item.why,
      sectionId: section.id,
      enabled: true,
    })),
  );
}
