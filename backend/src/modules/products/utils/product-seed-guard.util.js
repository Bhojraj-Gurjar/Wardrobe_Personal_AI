import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  isSkuSeedSuppressed,
  recordSeedSuppression,
} = require('../../../../scripts/lib/product-seed-guard.cjs');

export {
  isSkuSeedSuppressed,
  recordSeedSuppression,
};
