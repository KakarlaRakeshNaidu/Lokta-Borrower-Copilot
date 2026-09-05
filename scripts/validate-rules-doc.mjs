import { readFileSync } from 'node:fs';

const source = readFileSync('src/domain/rules/ruleCatalog.ts', 'utf8');
const rulesDoc = readFileSync('RULES.md', 'utf8');
const ids = [...source.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
const missing = ids.filter((id) => !rulesDoc.includes(id));
if (missing.length) {
  console.error(`RULES.md is missing rule ids: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`RULES.md covers ${ids.length} rule ids.`);