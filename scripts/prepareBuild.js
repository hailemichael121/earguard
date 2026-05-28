const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const packageJsonPath = path.join(root, 'package.json');
const buildMetaPath = path.join(root, 'build-meta.json');
const androidGradlePath = path.join(root, 'android', 'app', 'build.gradle');
const iosPbxprojPath = path.join(
  root,
  'ios',
  'EarGuard.xcodeproj',
  'project.pbxproj',
);
const buildInfoTsPath = path.join(root, 'src', 'buildInfo.ts');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const buildMeta = JSON.parse(fs.readFileSync(buildMetaPath, 'utf8'));

const nextBuildNumber = Number(buildMeta.buildNumber || 0) + 1;
const builtAt = new Date().toISOString();
const version = packageJson.version;
const buildLabel = `v${version}+${nextBuildNumber}`;

buildMeta.buildNumber = nextBuildNumber;
buildMeta.lastBuiltAt = builtAt;
fs.writeFileSync(buildMetaPath, `${JSON.stringify(buildMeta, null, 2)}\n`);

const androidGradle = fs.readFileSync(androidGradlePath, 'utf8');
const updatedAndroidGradle = androidGradle
  .replace(/versionCode\s+\d+/g, `versionCode ${nextBuildNumber}`)
  .replace(/versionName\s+"[^"]+"/g, `versionName "${version}"`);
fs.writeFileSync(androidGradlePath, updatedAndroidGradle);

const iosProject = fs.readFileSync(iosPbxprojPath, 'utf8');
const updatedIosProject = iosProject
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${nextBuildNumber};`)
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
fs.writeFileSync(iosPbxprojPath, updatedIosProject);

const buildInfoContent = `export const BUILD_INFO = {
  version: '${version}',
  buildNumber: ${nextBuildNumber},
  buildLabel: '${buildLabel}',
  builtAt: '${builtAt}',
} as const;
`;
fs.writeFileSync(buildInfoTsPath, buildInfoContent);

console.log(`Prepared build ${buildLabel}`);
