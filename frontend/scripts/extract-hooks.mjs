import { readFileSync } from 'node:fs';

const chunk = readFileSync('.tmp-8885.js', 'utf8');
const patterns = [
  /queryKey:\["admin-[^"]+"\]/g,
  /queryKey:\['admin-[^']+'\]/g,
  /"admin-[a-z-]+"/g,
];
for (const pattern of patterns) {
  const keys = [...chunk.matchAll(pattern)].map((m) => m[0]);
  if (keys.length) {
    console.log('pattern', pattern, '\n', [...new Set(keys)].sort().join('\n'));
  }
}
