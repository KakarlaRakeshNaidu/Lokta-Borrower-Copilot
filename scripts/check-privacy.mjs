import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = ['localStorage', 'sessionStorage', 'console.log(', 'gtag(', 'analytics'];
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(ts|tsx|css|html)$/.test(path)) files.push(path);
  }
}
walk('src');
const hits = [];
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const token of forbidden) {
    if (content.includes(token)) hits.push(`${file}: ${token}`);
  }
}
if (hits.length) {
  console.error(`Privacy check failed:\n${hits.join('\n')}`);
  process.exit(1);
}
console.log('Privacy check passed: no browser storage, analytics or production console logging in src/.');