/**
 * Change-password flow smoke test. Run: node scripts/test-change-password.js
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
  const email = `pwd_${Date.now()}@example.com`;
  const mobile = `+9197${String(Date.now()).slice(-8)}`;
  const oldPassword = 'SecurePass123!';
  const newPassword = 'NewSecure456!';

  const register = await request('POST', '/auth/register', {
    body: { email, password: oldPassword, mobile },
  });

  if (register.status !== 201 || !register.json?.data?.accessToken) {
    console.error('FAIL register', register.status, register.json);
    process.exit(1);
  }

  const token = register.json.data.accessToken;
  console.log('PASS register');

  const weak = await request('POST', '/auth/change-password', {
    token,
    body: {
      currentPassword: oldPassword,
      newPassword: 'weak',
      confirmPassword: 'weak',
    },
  });
  console.log(
    weak.status === 400 ? 'PASS weak password rejected' : 'FAIL weak password',
    weak.status,
  );

  const wrongCurrent = await request('POST', '/auth/change-password', {
    token,
    body: {
      currentPassword: 'WrongPass123!',
      newPassword,
      confirmPassword: newPassword,
    },
  });
  console.log(
    wrongCurrent.status === 400 ? 'PASS wrong current password' : 'FAIL wrong current',
    wrongCurrent.status,
  );

  const mismatch = await request('POST', '/auth/change-password', {
    token,
    body: {
      currentPassword: oldPassword,
      newPassword,
      confirmPassword: 'Mismatch456!',
    },
  });
  console.log(
    mismatch.status === 400 ? 'PASS mismatch rejected' : 'FAIL mismatch',
    mismatch.status,
  );

  const change = await request('POST', '/auth/change-password', {
    token,
    body: {
      currentPassword: oldPassword,
      newPassword,
      confirmPassword: newPassword,
    },
  });

  if (change.status !== 200 || !change.json?.data?.accessToken) {
    console.error('FAIL change password', change.status, change.json);
    process.exit(1);
  }

  console.log('PASS change password', change.json?.data?.message);

  const oldLogin = await request('POST', '/auth/login', {
    body: { email, password: oldPassword },
  });
  console.log(
    oldLogin.status === 401 ? 'PASS old password rejected' : 'FAIL old password still works',
    oldLogin.status,
  );

  const newLogin = await request('POST', '/auth/login', {
    body: { email, password: newPassword },
  });
  console.log(
    newLogin.status === 200 ? 'PASS login with new password' : 'FAIL new login',
    newLogin.status,
  );

  if (newLogin.status !== 200) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
