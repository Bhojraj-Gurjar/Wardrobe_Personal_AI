import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const SKIP = new Set([
  path.join(ROOT, 'stores', 'auth-store.js'),
  path.join(ROOT, 'features', 'auth', 'components', 'session-provider.js'),
  path.join(ROOT, 'features', 'auth', 'hooks', 'use-auth-guard-state.js'),
  path.join(ROOT, 'features', 'auth', 'hooks', 'use-logout-mutation.js'),
  path.join(ROOT, 'features', 'auth', 'hooks', 'use-auth-hydrated.js'),
  path.join(ROOT, 'features', 'auth', 'utils', 'clear-auth-session.js'),
]);

const ADMIN_FILES = new Set([
  path.join(ROOT, 'features', 'admin', 'components', 'admin-header.js'),
  path.join(ROOT, 'features', 'customer-support', 'hooks', 'use-admin-support.js'),
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }

    if (/\.(js|ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }

  return files;
}

function updateImports(content, isAdminFile) {
  const importLine = isAdminFile
    ? "import { getAdminAccessToken, useAdminAccessToken, useAdminProfile } from '@/stores/auth-store';"
    : "import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';";

  if (content.includes("from '@/stores/auth-store'")) {
    return content.replace(
      /import\s*\{[^}]+\}\s*from\s*'@\/stores\/auth-store';/g,
      importLine,
    );
  }

  return `${importLine}\n${content}`;
}

function transformFile(filePath) {
  if (SKIP.has(filePath)) {
    return false;
  }

  const isAdminFile = ADMIN_FILES.has(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  if (!content.includes('useAuthStore')) {
    return false;
  }

  if (isAdminFile) {
    content = content
      .replace(/useAuthStore\(\(state\) => state\.accessToken\)/g, 'useAdminAccessToken()')
      .replace(/useAuthStore\(\(state\) => state\.user\)/g, 'useAdminProfile()')
      .replace(/useAuthStore\.getState\(\)\.accessToken/g, 'getAdminAccessToken()');
  } else {
    content = content
      .replace(/useAuthStore\(\(state\) => state\.accessToken\)/g, 'useUserAccessToken()')
      .replace(/useAuthStore\(\(state\) => state\.user\)/g, 'useUserProfile()')
      .replace(/useAuthStore\(\(state\) => state\.user\?\.id\)/g, 'useUserProfile()?.id')
      .replace(/useAuthStore\.getState\(\)\.accessToken/g, 'getUserAccessToken()')
      .replace(/useAuthStore\.getState\(\)\.user\?\.id/g, 'useAuthStore.getState().userSession.user?.id');
  }

  content = updateImports(content, isAdminFile);

  if (filePath.endsWith('use-change-password.js')) {
    content = content
      .replace(
        /import \{[^}]+\} from '@\/stores\/auth-store';/,
        "import { useSetUserSession, useUserAccessToken, useUserProfile } from '@/stores/auth-store';",
      )
      .replace(/const setSession = useAuthStore\(\(state\) => state\.setSession\);/, 'const setUserSession = useSetUserSession();')
      .replace(/setSession\(/g, 'setUserSession(');
  }

  if (filePath.endsWith('use-face-login.js')) {
    content = content.replace(
      /establishSession\(\{\s*accessToken:/g,
      "establishSession({ context: AUTH_CONTEXT.USER, accessToken:",
    );
    if (!content.includes('AUTH_CONTEXT')) {
      content = content.replace(
        /import \{ establishSession \}/,
        "import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';\nimport { establishSession }",
      );
    }
  }

  if (filePath.endsWith('use-admin-support.js')) {
    content = content.replace(
      /const \{ isAuthenticated \} = useSession\(\);/,
      "const { isAuthenticated } = useSession(AUTH_CONTEXT.ADMIN);",
    );
    if (!content.includes('AUTH_CONTEXT')) {
      content = `import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';\n${content}`;
    }
  }

  if (!content.includes('useAuthStore') && content.includes(', useAuthStore')) {
    content = content.replace(', useAuthStore', '');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    return true;
  }

  return false;
}

const files = walk(ROOT);
let changed = 0;

for (const file of files) {
  if (transformFile(file)) {
    changed += 1;
    console.log('updated', path.relative(ROOT, file));
  }
}

console.log(`done: ${changed} files`);
