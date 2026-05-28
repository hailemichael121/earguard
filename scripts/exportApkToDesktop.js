const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {runGradleTask} = require('./gradleTask');

const root = process.cwd();
const packageJsonPath = path.join(root, 'package.json');
const buildMetaPath = path.join(root, 'build-meta.json');
const apkSourcePath = path.join(
  root,
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk',
);

if (!fs.existsSync(apkSourcePath)) {
  runGradleTask(['assembleRelease']);
}

if (!fs.existsSync(apkSourcePath)) {
  console.error(`APK not found at: ${apkSourcePath}`);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const buildMeta = JSON.parse(fs.readFileSync(buildMetaPath, 'utf8'));
const version = packageJson.version || '0.0.0';
const buildNumber = Number(buildMeta.buildNumber || 0);

const fileName = `EarGuard-v${version}+${buildNumber}.apk`;
const desktopDir = path.join(os.homedir(), 'Desktop');
const desktopTargetPath = path.join(desktopDir, fileName);
const releaseTargetPath = path.join(path.dirname(apkSourcePath), fileName);

if (!fs.existsSync(desktopDir)) {
  fs.mkdirSync(desktopDir, {recursive: true});
}

fs.copyFileSync(apkSourcePath, releaseTargetPath);
fs.copyFileSync(apkSourcePath, desktopTargetPath);

console.log(`APK exported to:\n- ${releaseTargetPath}\n- ${desktopTargetPath}`);
