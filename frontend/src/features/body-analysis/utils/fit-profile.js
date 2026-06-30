import {
  FIT_PROFILE_FIELD_CONFIG,
  FIT_PROFILE_SECTION_LABELS,
  FIT_PROFILE_SECTION_ORDER,
} from '../constants/fit-profile-sections';

function normalizeSection(section) {
  if (!section?.id) {
    return null;
  }

  const fields = FIT_PROFILE_FIELD_CONFIG.map((field) => {
    const value = section[field.key];

    if (field.type === 'list') {
      return {
        ...field,
        items: Array.isArray(value) ? value.filter(Boolean) : [],
      };
    }

    return {
      ...field,
      value: value ?? null,
    };
  }).filter((field) =>
    field.type === 'list' ? field.items.length > 0 : Boolean(field.value),
  );

  if (!fields.length) {
    return null;
  }

  return {
    id: section.id,
    title: section.title || FIT_PROFILE_SECTION_LABELS[section.id] || section.id,
    fields,
  };
}

export function normalizeFitProfile(fitProfile) {
  if (!fitProfile || typeof fitProfile !== 'object') {
    return null;
  }

  const sectionMap = new Map();

  if (Array.isArray(fitProfile.sections)) {
    for (const section of fitProfile.sections) {
      if (section?.id) {
        sectionMap.set(section.id, section);
      }
    }
  }

  const orderedSections = FIT_PROFILE_SECTION_ORDER.map((sectionId) => {
    const section = sectionMap.get(sectionId);
    return normalizeSection(section);
  }).filter(Boolean);

  if (!orderedSections.length) {
    return null;
  }

  return {
    summary: fitProfile.summary || null,
    bodyType: fitProfile.bodyType || null,
    bodyShape: fitProfile.bodyShape || null,
    sections: orderedSections,
  };
}
