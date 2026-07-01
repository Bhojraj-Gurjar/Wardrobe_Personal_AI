import { Prisma } from '@prisma/client';

/**
 * Public catalog visibility — avoids Prisma JSON path NOT filters on nullable
 * cms_metadata, which incorrectly exclude rows when adminDeleted is unset.
 */
export function buildCatalogVisibilityFilter() {
  return {
    is_active: true,
    visibility: { notIn: ['HIDDEN', 'DRAFT'] },
  };
}

/**
 * Admin product list — exclude soft-deleted CMS products only.
 * Use Prisma.DbNull for nullable JSON; plain `null` breaks JSON path filters in Prisma 7.
 * Prefer `path + not: true` over `NOT { path + equals: true }` — the latter drops rows
 * when adminDeleted is unset on non-null cms_metadata (e.g. wizard-created products).
 */
export function buildAdminProductListFilter() {
  return {
    OR: [
      { cms_metadata: { equals: Prisma.DbNull } },
      {
        cms_metadata: {
          path: ['adminDeleted'],
          not: true,
        },
      },
    ],
  };
}
