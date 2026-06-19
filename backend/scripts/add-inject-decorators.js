const fs = require('fs');
const path = require('path');

const GLOBAL_IMPORTS = {
  ConfigService: '@nestjs/config',
  JwtService: '@nestjs/jwt',
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

function buildClassIndex(files) {
  const index = new Map();
  const classPattern =
    /export(?:\s+@[\w.]+\([^)]*\)\s*)*\s*class\s+(\w+)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(classPattern)) {
      index.set(match[1], file);
    }
  }

  return index;
}

function paramToClassName(param) {
  return param.charAt(0).toUpperCase() + param.slice(1);
}

function ensureImport(content, className, importPath) {
  if (new RegExp(`\\b${className}\\b`).test(content.split('constructor')[0])) {
    const importRegex = new RegExp(
      `import\\s+\\{[^}]*\\b${className}\\b[^}]*\\}\\s+from\\s+['"][^'"]+['"];`,
    );
    if (importRegex.test(content)) {
      return content;
    }

    const nestImport = content.match(
      /import\s+\{([^}]+)\}\s+from\s+['"]@nestjs\/common['"];/,
    );
    if (nestImport && className === 'Inject') {
      if (!nestImport[1].includes('Inject')) {
        return content.replace(
          nestImport[0],
          `import { Inject,${nestImport[1].trim()} } from '@nestjs/common';`,
        );
      }
      return content;
    }
  }

  if (content.includes(`import { ${className} `) || content.includes(`, ${className}`)) {
    return content;
  }

  const importLine = `import { ${className} } from '${importPath}';\n`;
  const lastImport = content.lastIndexOf('\nimport ');
  if (lastImport === -1) {
    return importLine + content;
  }

  const insertAt = content.indexOf('\n', lastImport + 1) + 1;
  return content.slice(0, insertAt) + importLine + content.slice(insertAt);
}

function ensureInjectImport(content) {
  const nestImport = content.match(
    /import\s+\{([^}]+)\}\s+from\s+['"]@nestjs\/common['"];/,
  );
  if (!nestImport) {
    return `import { Inject } from '@nestjs/common';\n${content}`;
  }
  if (nestImport[1].includes('Inject')) {
    return content;
  }
  return content.replace(
    nestImport[0],
    `import { Inject, ${nestImport[1].trim()} } from '@nestjs/common';`,
  );
}

function transformConstructor(content, classIndex, filePath) {
  if (!content.includes('constructor(')) {
    return null;
  }

  const constructorMatch = content.match(
    /constructor\s*\(([\s\S]*?)\)\s*\{/,
  );
  if (!constructorMatch || constructorMatch[1].includes('@Inject')) {
    return null;
  }

  const params = constructorMatch[1]
    .split(',')
    .map((param) => param.trim())
    .filter(Boolean);

  if (params.length === 0) {
    return null;
  }

  let updated = content;
  updated = ensureInjectImport(updated);

  const injectedParams = params.map((param) => {
    const className = paramToClassName(param);
    let importPath = GLOBAL_IMPORTS[className];

    if (!importPath && classIndex.has(className)) {
      const targetFile = classIndex.get(className);
      importPath = path
        .relative(path.dirname(filePath), targetFile)
        .replace(/\\/g, '/')
        .replace(/\.js$/, '');
      if (!importPath.startsWith('.')) {
        importPath = `./${importPath}`;
      }
    }

    if (importPath) {
      updated = ensureImport(updated, className, importPath);
    }

    return `@Inject(${className}) ${param}`;
  });

  updated = updated.replace(
    constructorMatch[0],
    `constructor(${injectedParams.join(', ')}) {`,
  );

  return updated;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = walk(srcDir);
const classIndex = buildClassIndex(files);
let count = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const updated = transformConstructor(content, classIndex, file);
  if (updated) {
    fs.writeFileSync(file, updated);
    count += 1;
  }
}

console.log(`Added @Inject to ${count} files`);
