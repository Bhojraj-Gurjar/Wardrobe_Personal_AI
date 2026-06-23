export const PRODUCT_CATEGORY_GROUP_SEED = [
  {
    code: 'MEN',
    name: 'Men',
    description: 'Menswear categories',
    sort_order: 1,
    categories: [
      { slug: 'men-t-shirts', name: 'T-Shirts', sort_order: 1 },
      { slug: 'men-shirts', name: 'Shirts', sort_order: 2 },
      { slug: 'men-jackets', name: 'Jackets', sort_order: 3 },
      { slug: 'men-jeans', name: 'Jeans', sort_order: 4 },
      { slug: 'men-trousers', name: 'Trousers', sort_order: 5 },
      { slug: 'men-suits', name: 'Suits', sort_order: 6 },
    ],
  },
  {
    code: 'WOMEN',
    name: 'Women',
    description: 'Reserved for future womenswear categories',
    sort_order: 2,
    categories: [],
  },
  {
    code: 'ACCESSORIES',
    name: 'Accessories',
    description: 'Fashion accessories',
    sort_order: 3,
    categories: [
      { slug: 'watches', name: 'Watches', sort_order: 1 },
      { slug: 'sunglasses', name: 'Sunglasses', sort_order: 2 },
      { slug: 'bags', name: 'Bags', sort_order: 3 },
      { slug: 'belts', name: 'Belts', sort_order: 4 },
    ],
  },
  {
    code: 'FOOTWEAR',
    name: 'Footwear',
    description: 'Shoes and sandals',
    sort_order: 4,
    categories: [
      { slug: 'shoes', name: 'Shoes', sort_order: 1 },
      { slug: 'sneakers', name: 'Sneakers', sort_order: 2 },
      { slug: 'sandals', name: 'Sandals', sort_order: 3 },
    ],
  },
];
