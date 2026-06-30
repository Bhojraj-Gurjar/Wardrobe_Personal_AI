/**
 * Smoke-test major API flows. Run while server is up: node scripts/smoke-test.js
 */
const BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

async function request(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function run() {
  const results = [];
  const log = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  const health = await request('GET', '/health');
  log('GET /health', health.status === 200 && health.json.success);

  const email = `smoke_${Date.now()}@example.com`;
  const mobile = `+9198${String(Date.now()).slice(-8)}`;
  const register = await request('POST', '/auth/register', {
    body: {
      email,
      password: 'SecurePass123!',
      mobile,
    },
  });
  const token = register.json?.data?.accessToken;
  log(
    'POST /auth/register',
    register.status === 201 && Boolean(token),
    register.json?.message?.[0] || register.json?.data?.user?.email,
  );

  const login = await request('POST', '/auth/login', {
    body: { email, password: 'SecurePass123!' },
  });
  log('POST /auth/login', login.status === 200 && login.json.success);

  const profile = await request('GET', '/users/profile', { token });
  log('GET /users/profile', profile.status === 200);

  const updateProfile = await request('PUT', '/users/profile', {
    token,
    body: {
      name: 'Smoke Tester',
      gender: 'FEMALE',
      age: 28,
      height: 165,
      weight: 58,
      country: 'India',
      language: 'English',
      body_type: 'AVERAGE',
      skin_tone: 'MEDIUM',
      preferences: {
        occupation: 'EMPLOYEE',
        shopping_frequency: 'MONTHLY',
        budget_preference: 'MID_RANGE',
        preferred_categories: ['CASUAL', 'FORMAL'],
        favorite_colors: ['Navy', 'White', 'Beige'],
        favorite_brands: ['Zara'],
        fashion_influencers: ['@styleicon'],
      },
    },
  });
  log(
    'PUT /users/profile',
    updateProfile.status === 200,
    updateProfile.status !== 200 ? JSON.stringify(updateProfile.json) : '',
  );

  const createProduct = await request('POST', '/products', {
    body: {
      sku: `SKU-${Date.now()}`,
      name: 'Smoke Test Jacket',
      description: 'Test product',
      category_id: 'cat-demo',
      brand_id: 'brand-demo',
      price: 99.99,
      color: 'Navy',
    },
  });
  const productId = createProduct.json?.data?.id;
  log('POST /products', createProduct.status === 201 && Boolean(productId));

  const listProducts = await request('GET', '/products?page=1&limit=5');
  log('GET /products', listProducts.status === 200);

  const wishlist = await request('POST', '/wishlist', {
    token,
    body: { product_id: productId },
  });
  log('POST /wishlist', wishlist.status === 201);

  const getWishlist = await request('GET', '/wishlist', { token });
  log('GET /wishlist', getWishlist.status === 200);

  const order = await request('POST', '/orders', {
    token,
    body: { total_amount: 99.99, product_id: productId },
  });
  const orderId = order.json?.data?.id;
  log('POST /orders', order.status === 201 && Boolean(orderId));

  const listOrders = await request('GET', '/orders', { token });
  log('GET /orders', listOrders.status === 200);

  const fashionDna = await request('POST', '/fashion-dna/generate', { token });
  log('POST /fashion-dna/generate', fashionDna.status === 201 || fashionDna.status === 200);

  const productView = await request('POST', '/user-activity/product-views', {
    token,
    body: { product_id: productId },
  });
  log('POST /user-activity/product-views', productView.status === 201);

  const search = await request('POST', '/user-activity/searches', {
    token,
    body: { query: 'casual jacket' },
  });
  log('POST /user-activity/searches', search.status === 201);

  let activityTraits = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const fashionDnaCheck = await request('GET', '/fashion-dna/me', { token });
    activityTraits = fashionDnaCheck.json?.data?.activityTraits;
    if (activityTraits?.activity_volume?.product_views >= 1) {
      break;
    }
  }

  const hasActivity =
    activityTraits
    && activityTraits.activity_volume?.wishlist >= 1
    && activityTraits.activity_volume?.product_views >= 1
    && activityTraits.activity_volume?.searches >= 1;
  log(
    'GET /fashion-dna/me (activity traits)',
    hasActivity,
    hasActivity ? '' : JSON.stringify(activityTraits),
  );

  const recommendations = await request('GET', '/recommendations?limit=5', { token });
  log('GET /recommendations', recommendations.status === 200);

  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((error) => {
  console.error('Smoke test crashed:', error.message);
  process.exit(1);
});
