const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.name.endsWith('.js')) files.push(fullPath);
  }
  return files;
}

function hasInjectImport(importBody) {
  return importBody
    .split(',')
    .map((part) => part.trim())
    .includes('Inject');
}

let count = 0;
for (const file of walk(path.join(__dirname, '..', 'src'))) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('@Inject(')) continue;

  const nestImport = content.match(
    /import\s+\{([^}]+)\}\s+from\s+['"]@nestjs\/common['"];/,
  );

  if (nestImport && !hasInjectImport(nestImport[1])) {
    content = content.replace(
      nestImport[0],
      `import { Inject, ${nestImport[1].trim()} } from '@nestjs/common';`,
    );
    fs.writeFileSync(file, content);
    count += 1;
  } else if (!nestImport) {
    content = `import { Inject } from '@nestjs/common';\n${content}`;
    fs.writeFileSync(file, content);
    count += 1;
  }
}

console.log(`Fixed Inject imports in ${count} files`);
