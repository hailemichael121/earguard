const fs = require('node:fs');
const path = require('node:path');

const targetPath = path.join(
  process.cwd(),
  'node_modules',
  '.pnpm',
  '@react-native+gradle-plugin@0.85.3',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts',
);

if (!fs.existsSync(targetPath)) {
  console.log('Gradle plugin settings file not found, skipping patch.');
  process.exit(0);
}

const original = fs.readFileSync(targetPath, 'utf8');
const marker = 'foojay-resolver-convention';
if (!original.includes(marker)) {
  console.log('Gradle plugin patch already applied.');
  process.exit(0);
}

const patched = original.replace(
  /plugins\s*\{\s*id\("org\.gradle\.toolchains\.foojay-resolver-convention"\)\.version\("0\.5\.0"\)\s*\}/m,
  '// foojay resolver plugin disabled for offline/local compatibility',
);

fs.writeFileSync(targetPath, patched);
console.log('Patched React Native gradle plugin settings.');
