const fs = require('fs');
const path = require('path');

function isDecoratorStart(line) {
  return /^\s*@/.test(line);
}

function findDecoratorBlockStart(lines, exportLineIndex) {
  let end = exportLineIndex - 1;
  while (end >= 0 && lines[end].trim() === '') {
    end -= 1;
  }

  if (end < 0) {
    return null;
  }

  let start = end;
  while (start >= 0) {
    while (start >= 0 && !isDecoratorStart(lines[start])) {
      start -= 1;
    }

    if (start < 0) {
      return null;
    }

    let prev = start - 1;
    while (prev >= 0 && lines[prev].trim() === '') {
      prev -= 1;
    }

    if (prev >= 0 && isDecoratorStart(lines[prev])) {
      start = prev;
      continue;
    }

    break;
  }

  return start;
}

function transformContent(content) {
  const lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(\s*)export class /);
    if (!match) {
      continue;
    }

    const start = findDecoratorBlockStart(lines, i);
    if (start === null) {
      continue;
    }

    const block = lines.slice(start, i);
    if (block[0].includes('export @')) {
      continue;
    }

    block[0] = block[0].replace(/^(\s*)/, `$1export `);
    lines.splice(start, i - start, ...block);
    lines[i] = lines[i].replace(/export class /, 'class ');
    changed = true;
  }

  return changed ? lines.join('\n') : null;
}

function walk(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += walk(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const updated = transformContent(fs.readFileSync(fullPath, 'utf8'));
      if (updated) {
        fs.writeFileSync(fullPath, updated);
        count += 1;
      }
    }
  }
  return count;
}

const updated = walk(path.join(__dirname, '..', 'src'));
console.log(`Updated ${updated} files`);
