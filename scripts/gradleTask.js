const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function resolveGradleBin() {
  const localBase = path.join(os.homedir(), '.gradle', 'wrapper', 'dists', 'gradle-8.14.3-bin');
  if (fs.existsSync(localBase)) {
    const candidates = fs
      .readdirSync(localBase)
      .map(entry => path.join(localBase, entry, 'gradle-8.14.3', 'bin', 'gradle'))
      .filter(candidate => fs.existsSync(candidate));
    if (candidates.length > 0) {
      return candidates[0];
    }
  }
  return path.join(process.cwd(), 'android', 'gradlew');
}

function runGradleTask(tasks, extraArgs = []) {
  const gradleBin = resolveGradleBin();
  const args = [...tasks, ...extraArgs];
  const result = spawnSync(gradleBin, args, {
    cwd: path.join(process.cwd(), 'android'),
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

module.exports = {runGradleTask};
