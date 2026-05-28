const {spawnSync} = require('node:child_process');
const {runGradleTask} = require('./gradleTask');

runGradleTask(['app:installDebug', '-PreactNativeDevServerPort=8081']);

const startResult = spawnSync(
  'adb',
  ['shell', 'am', 'start', '-n', 'com.example.earguard/.MainActivity'],
  {stdio: 'inherit'},
);

if (startResult.status !== 0) {
  process.exit(startResult.status || 1);
}

