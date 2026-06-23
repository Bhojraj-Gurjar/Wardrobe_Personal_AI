"use strict";
/**
 * Catalog seed — 5 products × 13 categories = 65 products.
 * Image URLs verified against Unsplash / Pexels (no hotlink-blocked retailers).
 */ const { resolveStableProductId } = require('../../../../scripts/lib/product-identity.cjs');
/** Verified public image URLs — 5 per subcategory (HEAD-checked). */ const VERIFIED_IMAGE_URLS = {
    'men-t-shirts': [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/6311474/pexels-photo-6311474.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/6311391/pexels-photo-6311391.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    'men-shirts': [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    'men-jackets': [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/6311390/pexels-photo-6311390.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    'men-jeans': [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    'men-trousers': [
        'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&h=1200&q=80'
    ],
    'men-suits': [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/769579/pexels-photo-769579.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    watches: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/997910/pexels-photo-997910.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    sunglasses: [
        'https://images.pexels.com/photos/157675/fashion-men-s-individuality-black-and-white-157675.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1300550/pexels-photo-1300550.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/2783873/pexels-photo-2783873.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    bags: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    belts: [
        'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    shoes: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    sneakers: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&h=1200&q=80',
        'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'
    ],
    sandals: [
        'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&h=1200&q=80'
    ]
};
function deriveCatalogRating(sku) {
    let hash = 0;
    for(let index = 0; index < sku.length; index += 1){
        hash = (hash + sku.charCodeAt(index) * (index + 3)) % 1000;
    }
    return Math.round((4.2 + hash % 75 / 100) * 10) / 10;
}
function deriveReviewCount(sku) {
    let hash = 0;
    for(let index = 0; index < sku.length; index += 1){
        hash = (hash + sku.charCodeAt(index) * (index + 7)) % 10000;
    }
    return 48 + hash % 420;
}
const CATEGORY_META = {
    'men-t-shirts': {
        category: 'MEN',
        gender: 'MALE',
        avatarCategory: 'TOP',
        overlayOrderBase: 30
    },
    'men-shirts': {
        category: 'MEN',
        gender: 'MALE',
        avatarCategory: 'TOP',
        overlayOrderBase: 30
    },
    'men-jackets': {
        category: 'MEN',
        gender: 'MALE',
        avatarCategory: 'JACKET',
        overlayOrderBase: 40
    },
    'men-jeans': {
        category: 'MEN',
        gender: 'MALE',
        avatarCategory: 'BOTTOM',
        overlayOrderBase: 10
    },
    'men-trousers': {
        category: 'MEN',
        gender: 'MALE',
        avatarCategory: 'BOTTOM',
        overlayOrderBase: 10
    },
    'men-suits': {
        category: 'MEN',
        gender: 'MALE',
        avatarCategory: 'TOP',
        overlayOrderBase: 30
    },
    watches: {
        category: 'ACCESSORIES',
        gender: 'UNISEX',
        avatarCategory: 'ACCESSORY',
        overlayOrderBase: 50
    },
    sunglasses: {
        category: 'ACCESSORIES',
        gender: 'UNISEX',
        avatarCategory: 'ACCESSORY',
        overlayOrderBase: 50
    },
    bags: {
        category: 'ACCESSORIES',
        gender: 'UNISEX',
        avatarCategory: 'ACCESSORY',
        overlayOrderBase: 50
    },
    belts: {
        category: 'ACCESSORIES',
        gender: 'UNISEX',
        avatarCategory: 'ACCESSORY',
        overlayOrderBase: 25
    },
    shoes: {
        category: 'FOOTWEAR',
        gender: 'UNISEX',
        avatarCategory: 'FOOTWEAR',
        overlayOrderBase: 20
    },
    sneakers: {
        category: 'FOOTWEAR',
        gender: 'UNISEX',
        avatarCategory: 'FOOTWEAR',
        overlayOrderBase: 20
    },
    sandals: {
        category: 'FOOTWEAR',
        gender: 'UNISEX',
        avatarCategory: 'FOOTWEAR',
        overlayOrderBase: 20
    }
};
const CATALOG_LINES = [
    // MEN — T-Shirts
    {
        subcategory: 'men-t-shirts',
        brand: 'Nike',
        name: 'Nike Dri-FIT Legend T-Shirt',
        price: 35,
        color: 'Black',
        fabric: 'Polyester',
        fitType: 'regular',
        styleTags: [
            'sportswear',
            'minimal'
        ],
        occasionTags: [
            'gym',
            'casual'
        ],
        productUrl: 'https://www.nike.com/t/dri-fit-legend-mens-fitness-t-shirt-5XV7O7rm'
    },
    {
        subcategory: 'men-t-shirts',
        brand: 'Adidas',
        name: 'Adidas Essentials Feelready Tee',
        price: 30,
        color: 'Navy',
        fabric: 'Cotton blend',
        fitType: 'regular',
        styleTags: [
            'casual',
            'sportswear'
        ],
        occasionTags: [
            'weekend',
            'travel'
        ],
        productUrl: 'https://www.adidas.com/us/mens-t-shirts'
    },
    {
        subcategory: 'men-t-shirts',
        brand: 'Puma',
        name: 'Puma Essentials Logo Tee',
        price: 28,
        color: 'White',
        fabric: 'Cotton',
        fitType: 'regular',
        styleTags: [
            'streetwear',
            'casual'
        ],
        occasionTags: [
            'casual',
            'weekend'
        ],
        productUrl: 'https://www.puma.com/us/en/mens/clothing/t-shirts'
    },
    {
        subcategory: 'men-t-shirts',
        brand: 'Uniqlo',
        name: 'Uniqlo Supima Cotton Crew Neck T-Shirt',
        price: 19.9,
        color: 'Heather Gray',
        fabric: 'Supima cotton',
        fitType: 'regular',
        styleTags: [
            'minimal',
            'basics'
        ],
        occasionTags: [
            'everyday',
            'office-casual'
        ],
        productUrl: 'https://www.uniqlo.com/us/en/men/tops/t-shirts'
    },
    {
        subcategory: 'men-t-shirts',
        brand: 'H&M',
        name: 'H&M Regular Fit Cotton T-Shirt',
        price: 12.99,
        color: 'Olive',
        fabric: 'Cotton',
        fitType: 'regular',
        styleTags: [
            'basics',
            'casual'
        ],
        occasionTags: [
            'everyday',
            'casual'
        ],
        productUrl: 'https://www2.hm.com/en_us/men/products/t-shirts-tank-tops.html'
    },
    // MEN — Shirts
    {
        subcategory: 'men-shirts',
        brand: 'Tommy Hilfiger',
        name: 'Tommy Hilfiger Slim Fit Oxford Shirt',
        price: 89.5,
        color: 'Light Blue',
        fabric: 'Oxford cotton',
        fitType: 'slim',
        styleTags: [
            'preppy',
            'smart-casual'
        ],
        occasionTags: [
            'office',
            'dinner'
        ],
        productUrl: 'https://usa.tommy.com/en/men/clothing/shirts/'
    },
    {
        subcategory: 'men-shirts',
        brand: 'Zara',
        name: 'Zara Textured Weave Shirt',
        price: 49.9,
        color: 'White',
        fabric: 'Cotton blend',
        fitType: 'regular',
        styleTags: [
            'contemporary',
            'minimal'
        ],
        occasionTags: [
            'office-casual',
            'date-night'
        ],
        productUrl: 'https://www.zara.com/us/en/man-shirts-l7436.html'
    },
    {
        subcategory: 'men-shirts',
        brand: 'Uniqlo',
        name: 'Uniqlo Easy Care Broadcloth Shirt',
        price: 39.9,
        color: 'Pale Pink',
        fabric: 'Broadcloth cotton',
        fitType: 'regular',
        styleTags: [
            'minimal',
            'office'
        ],
        occasionTags: [
            'work',
            'formal-casual'
        ],
        productUrl: 'https://www.uniqlo.com/us/en/men/tops/shirts'
    },
    {
        subcategory: 'men-shirts',
        brand: 'H&M',
        name: 'H&M Slim Fit Easy-iron Shirt',
        price: 24.99,
        color: 'Charcoal',
        fabric: 'Cotton',
        fitType: 'slim',
        styleTags: [
            'office',
            'basics'
        ],
        occasionTags: [
            'work',
            'interview'
        ],
        productUrl: 'https://www2.hm.com/en_us/men/products/shirts.html'
    },
    {
        subcategory: 'men-shirts',
        brand: "Levi's",
        name: "Levi's Classic Camp Shirt",
        price: 69.5,
        color: 'Indigo',
        fabric: 'Cotton',
        fitType: 'relaxed',
        styleTags: [
            'heritage',
            'casual'
        ],
        occasionTags: [
            'weekend',
            'vacation'
        ],
        productUrl: 'https://www.levi.com/US/en_US/clothing/men/shirts/c/levi_clothing_men_shirts'
    },
    // MEN — Jackets
    {
        subcategory: 'men-jackets',
        brand: 'Nike',
        name: 'Nike Sportswear Club Fleece Jacket',
        price: 75,
        color: 'Gray',
        fabric: 'Fleece',
        fitType: 'regular',
        styleTags: [
            'sportswear',
            'layering'
        ],
        occasionTags: [
            'casual',
            'travel'
        ],
        productUrl: 'https://www.nike.com/t/sportswear-club-fleece-full-zip-hoodie-76b3s7'
    },
    {
        subcategory: 'men-jackets',
        brand: 'Adidas',
        name: 'Adidas Essentials 3-Stripes Track Jacket',
        price: 70,
        color: 'Black',
        fabric: 'Recycled polyester',
        fitType: 'regular',
        styleTags: [
            'sportswear',
            'retro'
        ],
        occasionTags: [
            'gym',
            'streetwear'
        ],
        productUrl: 'https://www.adidas.com/us/mens-jackets'
    },
    {
        subcategory: 'men-jackets',
        brand: 'Woodland',
        name: 'Woodland Proplanet Outdoor Jacket',
        price: 120,
        color: 'Olive Green',
        fabric: 'Nylon blend',
        fitType: 'regular',
        styleTags: [
            'outdoor',
            'utility'
        ],
        occasionTags: [
            'hiking',
            'travel'
        ],
        productUrl: 'https://www.woodlandworldwide.com/collections/men-jackets'
    },
    {
        subcategory: 'men-jackets',
        brand: 'Tommy Hilfiger',
        name: 'Tommy Hilfiger Lightweight Puffer Jacket',
        price: 199,
        color: 'Navy',
        fabric: 'Polyester shell',
        fitType: 'regular',
        styleTags: [
            'preppy',
            'winter'
        ],
        occasionTags: [
            'commute',
            'travel'
        ],
        productUrl: 'https://usa.tommy.com/en/men/clothing/jackets-coats/'
    },
    {
        subcategory: 'men-jackets',
        brand: 'Zara',
        name: 'Zara Faux Leather Biker Jacket',
        price: 129,
        color: 'Brown',
        fabric: 'Faux leather',
        fitType: 'slim',
        styleTags: [
            'edgy',
            'contemporary'
        ],
        occasionTags: [
            'night-out',
            'casual'
        ],
        productUrl: 'https://www.zara.com/us/en/man-jackets-l7366.html'
    },
    // MEN — Jeans
    {
        subcategory: 'men-jeans',
        brand: "Levi's",
        name: "Levi's 501 Original Fit Jeans",
        price: 98,
        color: 'Medium Indigo',
        fabric: 'Denim',
        fitType: 'original',
        styleTags: [
            'heritage',
            'classic'
        ],
        occasionTags: [
            'everyday',
            'casual'
        ],
        productUrl: 'https://www.levi.com/US/en_US/clothing/men/jeans/501-original-fit-mens-jeans/p/005010019'
    },
    {
        subcategory: 'men-jeans',
        brand: 'Zara',
        name: 'Zara Slim Fit Jeans',
        price: 59.9,
        color: 'Dark Blue',
        fabric: 'Denim',
        fitType: 'slim',
        styleTags: [
            'contemporary',
            'casual'
        ],
        occasionTags: [
            'weekend',
            'date-night'
        ],
        productUrl: 'https://www.zara.com/us/en/man-jeans-l659.html'
    },
    {
        subcategory: 'men-jeans',
        brand: 'H&M',
        name: 'H&M Slim Straight Jeans',
        price: 39.99,
        color: 'Black',
        fabric: 'Denim',
        fitType: 'slim',
        styleTags: [
            'basics',
            'casual'
        ],
        occasionTags: [
            'everyday',
            'casual'
        ],
        productUrl: 'https://www2.hm.com/en_us/men/products/jeans.html'
    },
    {
        subcategory: 'men-jeans',
        brand: 'Uniqlo',
        name: 'Uniqlo Stretch Selvedge Slim Jeans',
        price: 59.9,
        color: 'Blue',
        fabric: 'Stretch denim',
        fitType: 'slim',
        styleTags: [
            'minimal',
            'japanese'
        ],
        occasionTags: [
            'office-casual',
            'everyday'
        ],
        productUrl: 'https://www.uniqlo.com/us/en/men/bottoms/jeans'
    },
    {
        subcategory: 'men-jeans',
        brand: 'Tommy Hilfiger',
        name: 'Tommy Hilfiger Slim Mercer Stretch Jeans',
        price: 99.5,
        color: 'Mid Wash',
        fabric: 'Stretch denim',
        fitType: 'slim',
        styleTags: [
            'preppy',
            'casual'
        ],
        occasionTags: [
            'weekend',
            'travel'
        ],
        productUrl: 'https://usa.tommy.com/en/men/clothing/jeans/'
    },
    // MEN — Trousers
    {
        subcategory: 'men-trousers',
        brand: 'Zara',
        name: 'Zara Relaxed Fit Pleated Trousers',
        price: 69.9,
        color: 'Beige',
        fabric: 'Poly viscose',
        fitType: 'relaxed',
        styleTags: [
            'contemporary',
            'tailored'
        ],
        occasionTags: [
            'office',
            'events'
        ],
        productUrl: 'https://www.zara.com/us/en/man-trousers-l659.html'
    },
    {
        subcategory: 'men-trousers',
        brand: 'H&M',
        name: 'H&M Regular Fit Chinos',
        price: 34.99,
        color: 'Khaki',
        fabric: 'Cotton twill',
        fitType: 'regular',
        styleTags: [
            'smart-casual',
            'basics'
        ],
        occasionTags: [
            'work',
            'casual'
        ],
        productUrl: 'https://www2.hm.com/en_us/men/products/trousers.html'
    },
    {
        subcategory: 'men-trousers',
        brand: 'Uniqlo',
        name: 'Uniqlo Ultra Stretch Active Trousers',
        price: 49.9,
        color: 'Black',
        fabric: 'Stretch polyester',
        fitType: 'tapered',
        styleTags: [
            'minimal',
            'comfort'
        ],
        occasionTags: [
            'travel',
            'everyday'
        ],
        productUrl: 'https://www.uniqlo.com/us/en/men/bottoms/pants'
    },
    {
        subcategory: 'men-trousers',
        brand: 'Tommy Hilfiger',
        name: 'Tommy Hilfiger Tailored Fit Chino',
        price: 89.5,
        color: 'Navy',
        fabric: 'Cotton twill',
        fitType: 'tailored',
        styleTags: [
            'preppy',
            'office'
        ],
        occasionTags: [
            'work',
            'business-casual'
        ],
        productUrl: 'https://usa.tommy.com/en/men/clothing/pants-chinos/'
    },
    {
        subcategory: 'men-trousers',
        brand: 'Adidas',
        name: 'Adidas Tiro 24 Training Pants',
        price: 55,
        color: 'Dark Gray',
        fabric: 'Recycled polyester',
        fitType: 'tapered',
        styleTags: [
            'sportswear',
            'athleisure'
        ],
        occasionTags: [
            'gym',
            'casual'
        ],
        productUrl: 'https://www.adidas.com/us/mens-pants'
    },
    // MEN — Suits
    {
        subcategory: 'men-suits',
        brand: 'Tommy Hilfiger',
        name: 'Tommy Hilfiger Modern Fit Suit Jacket',
        price: 399,
        color: 'Charcoal',
        fabric: 'Wool blend',
        fitType: 'modern',
        styleTags: [
            'formal',
            'preppy'
        ],
        occasionTags: [
            'wedding',
            'business'
        ],
        productUrl: 'https://usa.tommy.com/en/men/clothing/suits-blazers/'
    },
    {
        subcategory: 'men-suits',
        brand: 'Zara',
        name: 'Zara Slim Fit Suit Blazer',
        price: 169,
        color: 'Navy',
        fabric: 'Poly viscose',
        fitType: 'slim',
        styleTags: [
            'formal',
            'contemporary'
        ],
        occasionTags: [
            'interview',
            'events'
        ],
        productUrl: 'https://www.zara.com/us/en/man-suits-l658.html'
    },
    {
        subcategory: 'men-suits',
        brand: 'H&M',
        name: 'H&M Slim Fit Suit Jacket',
        price: 119,
        color: 'Black',
        fabric: 'Polyester blend',
        fitType: 'slim',
        styleTags: [
            'formal',
            'affordable'
        ],
        occasionTags: [
            'ceremony',
            'office'
        ],
        productUrl: 'https://www2.hm.com/en_us/men/products/suits-blazers.html'
    },
    {
        subcategory: 'men-suits',
        brand: 'Uniqlo',
        name: 'Uniqlo Stretch Wool Blend Jacket',
        price: 149.9,
        color: 'Dark Gray',
        fabric: 'Wool blend',
        fitType: 'regular',
        styleTags: [
            'minimal',
            'business'
        ],
        occasionTags: [
            'work',
            'formal'
        ],
        productUrl: 'https://www.uniqlo.com/us/en/men/outerwear-and-blazers/jackets-and-blazers'
    },
    {
        subcategory: 'men-suits',
        brand: "Levi's",
        name: "Levi's Wool Blend Blazer",
        price: 178,
        color: 'Blue',
        fabric: 'Wool blend',
        fitType: 'regular',
        styleTags: [
            'heritage',
            'smart-casual'
        ],
        occasionTags: [
            'dinner',
            'office-casual'
        ],
        productUrl: 'https://www.levi.com/US/en_US/clothing/men/outerwear/c/levi_clothing_men_outerwear'
    },
    // ACCESSORIES — Watches
    {
        subcategory: 'watches',
        brand: 'Fossil',
        name: 'Fossil Grant Chronograph Watch',
        price: 165,
        color: 'Brown leather',
        fabric: 'Stainless steel',
        fitType: 'standard',
        styleTags: [
            'classic',
            'heritage'
        ],
        occasionTags: [
            'everyday',
            'office'
        ],
        productUrl: 'https://www.fossil.com/en-us/products/grant-chronograph-brown-leather-watch/FS4835.html'
    },
    {
        subcategory: 'watches',
        brand: 'Fossil',
        name: 'Fossil Machine Chronograph',
        price: 189,
        color: 'Black silicone',
        fabric: 'Stainless steel',
        fitType: 'standard',
        styleTags: [
            'sport',
            'modern'
        ],
        occasionTags: [
            'casual',
            'weekend'
        ],
        productUrl: 'https://www.fossil.com/en-us/products/machine-chronograph-black-silicone-watch/FS4656.html'
    },
    {
        subcategory: 'watches',
        brand: 'Fossil',
        name: 'Fossil Neutra Chronograph',
        price: 175,
        color: 'Silver',
        fabric: 'Stainless steel',
        fitType: 'standard',
        styleTags: [
            'minimal',
            'dress'
        ],
        occasionTags: [
            'work',
            'events'
        ],
        productUrl: 'https://www.fossil.com/en-us/shop/watches/mens-watches/'
    },
    {
        subcategory: 'watches',
        brand: 'Fossil',
        name: 'Fossil Townsman Automatic',
        price: 295,
        color: 'Blue dial',
        fabric: 'Leather strap',
        fitType: 'standard',
        styleTags: [
            'dress',
            'automatic'
        ],
        occasionTags: [
            'formal',
            'business'
        ],
        productUrl: 'https://www.fossil.com/en-us/shop/watches/mens-watches/'
    },
    {
        subcategory: 'watches',
        brand: 'Fossil',
        name: 'Fossil Minimalist Three-Hand',
        price: 129,
        color: 'Tan leather',
        fabric: 'Stainless steel',
        fitType: 'standard',
        styleTags: [
            'minimal',
            'casual'
        ],
        occasionTags: [
            'everyday',
            'travel'
        ],
        productUrl: 'https://www.fossil.com/en-us/shop/watches/mens-watches/'
    },
    // ACCESSORIES — Sunglasses
    {
        subcategory: 'sunglasses',
        brand: 'Ray-Ban',
        name: 'Ray-Ban Aviator Classic',
        price: 171,
        color: 'Gold/Green',
        fabric: 'Metal frame',
        fitType: 'standard',
        styleTags: [
            'iconic',
            'aviator'
        ],
        occasionTags: [
            'travel',
            'outdoor'
        ],
        productUrl: 'https://www.ray-ban.com/usa/sunglasses/RB3025%20AVIATOR'
    },
    {
        subcategory: 'sunglasses',
        brand: 'Ray-Ban',
        name: 'Ray-Ban Wayfarer Classic',
        price: 171,
        color: 'Black/Green',
        fabric: 'Acetate frame',
        fitType: 'standard',
        styleTags: [
            'iconic',
            'retro'
        ],
        occasionTags: [
            'casual',
            'city'
        ],
        productUrl: 'https://www.ray-ban.com/usa/sunglasses/RB2140%20WAYFARER'
    },
    {
        subcategory: 'sunglasses',
        brand: 'Ray-Ban',
        name: 'Ray-Ban Clubmaster Classic',
        price: 181,
        color: 'Tortoise/Gold',
        fabric: 'Acetate-metal',
        fitType: 'standard',
        styleTags: [
            'retro',
            'smart'
        ],
        occasionTags: [
            'weekend',
            'driving'
        ],
        productUrl: 'https://www.ray-ban.com/usa/sunglasses/RB3016%20CLUBMASTER'
    },
    {
        subcategory: 'sunglasses',
        brand: 'Ray-Ban',
        name: 'Ray-Ban Round Metal',
        price: 171,
        color: 'Gold/Green',
        fabric: 'Metal frame',
        fitType: 'standard',
        styleTags: [
            'vintage',
            'round'
        ],
        occasionTags: [
            'festival',
            'travel'
        ],
        productUrl: 'https://www.ray-ban.com/usa/sunglasses/RB3447%20ROUND%20METAL'
    },
    {
        subcategory: 'sunglasses',
        brand: 'Ray-Ban',
        name: 'Ray-Ban Erika Classic',
        price: 171,
        color: 'Black/Grey',
        fabric: 'Injected frame',
        fitType: 'standard',
        styleTags: [
            'modern',
            'casual'
        ],
        occasionTags: [
            'everyday',
            'vacation'
        ],
        productUrl: 'https://www.ray-ban.com/usa/sunglasses/RB4171%20ERIKA'
    },
    // ACCESSORIES — Bags
    {
        subcategory: 'bags',
        brand: 'Nike',
        name: 'Nike Brasilia Training Backpack',
        price: 45,
        color: 'Black',
        fabric: 'Polyester',
        fitType: 'standard',
        styleTags: [
            'sportswear',
            'utility'
        ],
        occasionTags: [
            'gym',
            'travel'
        ],
        productUrl: 'https://www.nike.com/t/brasilia-9-5-training-backpack-23L-8TQT9n0K'
    },
    {
        subcategory: 'bags',
        brand: 'Adidas',
        name: 'Adidas Classic 3-Stripes Backpack',
        price: 40,
        color: 'Navy',
        fabric: 'Polyester',
        fitType: 'standard',
        styleTags: [
            'sportswear',
            'casual'
        ],
        occasionTags: [
            'school',
            'commute'
        ],
        productUrl: 'https://www.adidas.com/us/bags'
    },
    {
        subcategory: 'bags',
        brand: 'Puma',
        name: 'Puma Phase Backpack',
        price: 35,
        color: 'Gray',
        fabric: 'Polyester',
        fitType: 'standard',
        styleTags: [
            'streetwear',
            'casual'
        ],
        occasionTags: [
            'everyday',
            'travel'
        ],
        productUrl: 'https://www.puma.com/us/en/accessories/bags'
    },
    {
        subcategory: 'bags',
        brand: 'Woodland',
        name: 'Woodland Adventure Rucksack',
        price: 89,
        color: 'Olive',
        fabric: 'Canvas',
        fitType: 'standard',
        styleTags: [
            'outdoor',
            'rugged'
        ],
        occasionTags: [
            'hiking',
            'weekend'
        ],
        productUrl: 'https://www.woodlandworldwide.com/collections/bags'
    },
    {
        subcategory: 'bags',
        brand: 'Fossil',
        name: 'Fossil Buckner Convertible Backpack',
        price: 198,
        color: 'Brown',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'heritage',
            'commuter'
        ],
        occasionTags: [
            'work',
            'travel'
        ],
        productUrl: 'https://www.fossil.com/en-us/shop/bags/backpacks/'
    },
    // ACCESSORIES — Belts
    {
        subcategory: 'belts',
        brand: "Levi's",
        name: "Levi's Reversible Leather Belt",
        price: 34.5,
        color: 'Black/Brown',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'heritage',
            'classic'
        ],
        occasionTags: [
            'everyday',
            'work'
        ],
        productUrl: 'https://www.levi.com/US/en_US/accessories/mens-belts/c/levi_accessories_men_belts'
    },
    {
        subcategory: 'belts',
        brand: 'Tommy Hilfiger',
        name: 'Tommy Hilfiger Reversible Dress Belt',
        price: 49.5,
        color: 'Brown',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'preppy',
            'formal'
        ],
        occasionTags: [
            'office',
            'events'
        ],
        productUrl: 'https://usa.tommy.com/en/men/accessories/belts/'
    },
    {
        subcategory: 'belts',
        brand: 'Fossil',
        name: 'Fossil Dean Leather Belt',
        price: 38,
        color: 'Cognac',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'classic',
            'casual'
        ],
        occasionTags: [
            'everyday',
            'weekend'
        ],
        productUrl: 'https://www.fossil.com/en-us/shop/belts/mens-belts/'
    },
    {
        subcategory: 'belts',
        brand: 'Woodland',
        name: 'Woodland Casual Leather Belt',
        price: 29,
        color: 'Tan',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'outdoor',
            'rugged'
        ],
        occasionTags: [
            'casual',
            'travel'
        ],
        productUrl: 'https://www.woodlandworldwide.com/collections/belts'
    },
    {
        subcategory: 'belts',
        brand: 'Zara',
        name: 'Zara Leather Belt with Metal Buckle',
        price: 39.9,
        color: 'Black',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'contemporary',
            'minimal'
        ],
        occasionTags: [
            'office-casual',
            'night-out'
        ],
        productUrl: 'https://www.zara.com/us/en/man-accessories-belts-l622.html'
    },
    // FOOTWEAR — Shoes
    {
        subcategory: 'shoes',
        brand: 'Clarks',
        name: 'Clarks Bushacre 2 Desert Boot',
        price: 150,
        color: 'Beeswax',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'heritage',
            'desert-boot'
        ],
        occasionTags: [
            'casual',
            'smart-casual'
        ],
        productUrl: 'https://www.clarks.com/en-us/mens-boots/bushacre-2-p-26133180'
    },
    {
        subcategory: 'shoes',
        brand: 'Clarks',
        name: 'Clarks Un Costa Lace Oxford',
        price: 130,
        color: 'Black leather',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'dress',
            'comfort'
        ],
        occasionTags: [
            'office',
            'formal-casual'
        ],
        productUrl: 'https://www.clarks.com/en-us/mens-oxfords'
    },
    {
        subcategory: 'shoes',
        brand: 'Clarks',
        name: 'Clarks Cotrell Edge Oxford',
        price: 110,
        color: 'Brown',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'classic',
            'office'
        ],
        occasionTags: [
            'work',
            'interview'
        ],
        productUrl: 'https://www.clarks.com/en-us/mens-oxfords'
    },
    {
        subcategory: 'shoes',
        brand: 'Woodland',
        name: 'Woodland Leather Outdoor Shoe',
        price: 95,
        color: 'Brown',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'outdoor',
            'rugged'
        ],
        occasionTags: [
            'hiking',
            'travel'
        ],
        productUrl: 'https://www.woodlandworldwide.com/collections/men-shoes'
    },
    {
        subcategory: 'shoes',
        brand: 'Woodland',
        name: 'Woodland Casual Lace-Up Shoe',
        price: 85,
        color: 'Tan',
        fabric: 'Nubuck',
        fitType: 'standard',
        styleTags: [
            'casual',
            'outdoor'
        ],
        occasionTags: [
            'weekend',
            'commute'
        ],
        productUrl: 'https://www.woodlandworldwide.com/collections/men-shoes'
    },
    // FOOTWEAR — Sneakers
    {
        subcategory: 'sneakers',
        brand: 'Nike',
        name: 'Nike Air Force 1 07',
        price: 115,
        color: 'White',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'streetwear',
            'iconic'
        ],
        occasionTags: [
            'casual',
            'everyday'
        ],
        productUrl: 'https://www.nike.com/t/air-force-1-07-mens-shoes-5QFp5Z/CW2288-111'
    },
    {
        subcategory: 'sneakers',
        brand: 'Nike',
        name: 'Nike Dunk Low Retro',
        price: 115,
        color: 'Panda',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'streetwear',
            'retro'
        ],
        occasionTags: [
            'casual',
            'city'
        ],
        productUrl: 'https://www.nike.com/t/dunk-low-retro-mens-shoes-5FQW5F/DD1391-100'
    },
    {
        subcategory: 'sneakers',
        brand: 'Adidas',
        name: 'Adidas Gazelle Indoor',
        price: 120,
        color: 'Blue',
        fabric: 'Suede',
        fitType: 'standard',
        styleTags: [
            'retro',
            'terrace'
        ],
        occasionTags: [
            'weekend',
            'streetwear'
        ],
        productUrl: 'https://www.adidas.com/us/gazelle-shoes'
    },
    {
        subcategory: 'sneakers',
        brand: 'Adidas',
        name: 'Adidas Samba OG',
        price: 100,
        color: 'Black/White',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'classic',
            'football'
        ],
        occasionTags: [
            'casual',
            'travel'
        ],
        productUrl: 'https://www.adidas.com/us/samba-shoes'
    },
    {
        subcategory: 'sneakers',
        brand: 'Puma',
        name: 'Puma Suede Classic XXI',
        price: 75,
        color: 'Red',
        fabric: 'Suede',
        fitType: 'standard',
        styleTags: [
            'retro',
            'streetwear'
        ],
        occasionTags: [
            'casual',
            'festival'
        ],
        productUrl: 'https://www.puma.com/us/en/mens/shoes/sneakers'
    },
    // FOOTWEAR — Sandals
    {
        subcategory: 'sandals',
        brand: 'Adidas',
        name: 'Adidas Adilette Aqua Slides',
        price: 35,
        color: 'Black',
        fabric: 'Synthetic',
        fitType: 'standard',
        styleTags: [
            'sportswear',
            'slides'
        ],
        occasionTags: [
            'pool',
            'casual'
        ],
        productUrl: 'https://www.adidas.com/us/mens-sandals-slides'
    },
    {
        subcategory: 'sandals',
        brand: 'Puma',
        name: 'Puma Leadcat 2.0 Slides',
        price: 30,
        color: 'Navy',
        fabric: 'Synthetic',
        fitType: 'standard',
        styleTags: [
            'casual',
            'sport'
        ],
        occasionTags: [
            'vacation',
            'gym'
        ],
        productUrl: 'https://www.puma.com/us/en/mens/shoes/sandals-slides'
    },
    {
        subcategory: 'sandals',
        brand: 'Woodland',
        name: 'Woodland Outdoor Adventure Sandals',
        price: 55,
        color: 'Brown',
        fabric: 'Synthetic leather',
        fitType: 'standard',
        styleTags: [
            'outdoor',
            'rugged'
        ],
        occasionTags: [
            'hiking',
            'beach'
        ],
        productUrl: 'https://www.woodlandworldwide.com/collections/sandals'
    },
    {
        subcategory: 'sandals',
        brand: 'Clarks',
        name: 'Clarks Brixby Shore Sandal',
        price: 90,
        color: 'Tan leather',
        fabric: 'Leather',
        fitType: 'standard',
        styleTags: [
            'comfort',
            'summer'
        ],
        occasionTags: [
            'vacation',
            'weekend'
        ],
        productUrl: 'https://www.clarks.com/en-us/mens-sandals'
    },
    {
        subcategory: 'sandals',
        brand: 'Nike',
        name: 'Nike Victori One Slide',
        price: 32,
        color: 'White',
        fabric: 'Synthetic',
        fitType: 'standard',
        styleTags: [
            'sportswear',
            'minimal'
        ],
        occasionTags: [
            'casual',
            'pool'
        ],
        productUrl: 'https://www.nike.com/t/victori-one-mens-slides-3gQl64'
    }
];
function slugifyBrand(brand) {
    return brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function buildSku(subcategory, brand, index) {
    const prefix = subcategory.replace(/-/g, '').toUpperCase().slice(0, 8);
    return `WA-${prefix}-${slugifyBrand(brand).toUpperCase()}-${String(index + 1).padStart(2, '0')}`;
}
function defaultSizes(subcategory) {
    if ([
        'watches',
        'sunglasses',
        'bags',
        'belts'
    ].includes(subcategory)) {
        return [
            'One Size'
        ];
    }
    if (subcategory === 'sandals') {
        return [
            '7',
            '8',
            '9',
            '10',
            '11',
            '12'
        ];
    }
    if ([
        'shoes',
        'sneakers'
    ].includes(subcategory)) {
        return [
            '7',
            '8',
            '9',
            '10',
            '11',
            '12'
        ];
    }
    return [
        'S',
        'M',
        'L',
        'XL',
        'XXL'
    ];
}
function buildCatalogProducts() {
    const perCategoryIndex = {};
    return CATALOG_LINES.map((line)=>{
        const meta = CATEGORY_META[line.subcategory];
        const index = perCategoryIndex[line.subcategory] ?? 0;
        perCategoryIndex[line.subcategory] = index + 1;
        const sku = line.sku ?? buildSku(line.subcategory, line.brand, index);
        return {
            id: resolveStableProductId(sku),
            sku,
            name: line.name,
            description: `${line.name} by ${line.brand}. Part of the Wardrobe AI ${line.subcategory.replace(/-/g, ' ')} collection.`,
            category: meta.category,
            subcategory: line.subcategory,
            gender: meta.gender,
            brand: line.brand,
            price: line.price,
            currency: 'USD',
            color: line.color,
            fabric: line.fabric,
            fitType: line.fitType,
            styleTags: line.styleTags,
            occasionTags: line.occasionTags,
            sizeOptions: defaultSizes(line.subcategory),
            imageUrl: VERIFIED_IMAGE_URLS[line.subcategory][index],
            rating: deriveCatalogRating(sku),
            reviewCount: deriveReviewCount(sku),
            productUrl: line.productUrl,
            avatarCategory: meta.avatarCategory,
            overlayOrder: meta.overlayOrderBase + index,
            isActive: true
        };
    });
}
const PRODUCT_CATALOG_SEED = buildCatalogProducts();
/** Frozen SKU list — do not rename or reorder without a migration plan. */ const CATALOG_SKU_REGISTRY = Object.freeze(PRODUCT_CATALOG_SEED.map((product)=>product.sku));
module.exports = {
    PRODUCT_CATALOG_SEED,
    CATALOG_LINES,
    CATALOG_SKU_REGISTRY
};

//# sourceMappingURL=product-catalog.seed.js.map