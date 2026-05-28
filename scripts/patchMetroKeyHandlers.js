const fs = require('node:fs');
const path = require('node:path');

const MARKER = 'EAR_GUARD_ANDROID_KEY_PATCH';

function findAttachKeyHandlerFiles(root) {
  const files = [];
  const pnpmDir = path.join(root, 'node_modules', '.pnpm');
  if (fs.existsSync(pnpmDir)) {
    for (const entry of fs.readdirSync(pnpmDir)) {
      if (!entry.startsWith('@react-native+community-cli-plugin@')) {
        continue;
      }
      const candidate = path.join(
        pnpmDir,
        entry,
        'node_modules',
        '@react-native',
        'community-cli-plugin',
        'dist',
        'commands',
        'start',
        'attachKeyHandlers.js',
      );
      if (fs.existsSync(candidate)) {
        files.push(candidate);
      }
    }
  }

  const hoisted = path.join(
    root,
    'node_modules',
    '@react-native',
    'community-cli-plugin',
    'dist',
    'commands',
    'start',
    'attachKeyHandlers.js',
  );
  if (fs.existsSync(hoisted)) {
    files.push(hoisted);
  }

  return [...new Set(files)];
}

function patchFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  if (original.includes(MARKER)) {
    return false;
  }

  let patched = original;

  if (!patched.includes('var _child_process = require("child_process");')) {
    patched = patched.replace(
      'var _util = require("util");',
      'var _child_process = require("child_process");\nvar _path = require("path");\nvar _util = require("util");',
    );
  }

  const androidCase = `
      case "a":
        reporter.update({
          type: "unstable_server_log",
          level: "info",
          data: "Opening app on Android...",
        });
        _child_process.spawn(
          "bash",
          [_path.join(process.cwd(), "scripts", "run-android-from-metro.sh")],
          {stdio: "inherit", env: process.env},
        );
        break;`;

  if (!patched.includes('case "a":')) {
    patched = patched.replace(
      '      case "j":',
      `${androidCase}
      case "j":`,
    );
  }

  patched = patched.replace(
    /data: `Key commands available:[\s\S]*?open DevTools\n`,/,
    `data: \`Key commands available (${MARKER}):

  \${(0, _util.styleText)(["bold", "inverse"], " a ")} - run on Android
  \${(0, _util.styleText)(["bold", "inverse"], " r ")} - reload app(s)
  \${(0, _util.styleText)(["bold", "inverse"], " d ")} - open Dev Menu
  \${(0, _util.styleText)(["bold", "inverse"], " j ")} - open DevTools
\`,`,
  );

  fs.writeFileSync(filePath, patched);
  return true;
}

const files = findAttachKeyHandlerFiles(process.cwd());
if (files.length === 0) {
  console.log('Metro key handler file not found, skipping patch.');
  process.exit(0);
}

let patchedCount = 0;
for (const file of files) {
  if (patchFile(file)) {
    patchedCount += 1;
    console.log(`Patched Metro key handlers: ${file}`);
  }
}

if (patchedCount === 0) {
  console.log('Metro key handler patch already applied.');
}
