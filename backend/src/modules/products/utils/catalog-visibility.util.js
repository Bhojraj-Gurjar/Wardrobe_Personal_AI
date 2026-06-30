import { Prisma } from '@prisma/client';

/**
 * Public catalog visibility — avoids Prisma JSON path NOT filters on nullable
 * cms_metadata, which incorrectly exclude rows when adminDeleted is unset.
 */
export function buildCatalogVisibilityFilter() {
  return {
    is_active: true,
    visibility: { not: 'HIDDEN' },
  };
}

/**
 * Admin product list — exclude soft-deleted CMS products only.
 * Use Prisma.DbNull for nullable JSON; plain `null` breaks JSON path filters in Prisma 7.
 */
export function buildAdminProductListFilter() {
  return {
    OR: [
      { cms_metadata: { equals: Prisma.DbNull } },
      {
        AND: [
          { cms_metadata: { not: Prisma.DbNull } },
          {
            NOT: {
              cms_metadata: {
                path: ['adminDeleted'],
                equals: true,
              },
            },
          },
        ],
      },
    ],
  };
}
