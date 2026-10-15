// Forwards the local dev services to every connected Android device (phone or emulator), so the app can
// reach them at http://localhost:<port>. Re-run after reconnecting a cable or restarting the emulator.
//   npm run reverse
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Metro, Census3, relayer, proof service
const PORTS = [8081, 7788, 8790, 8787];

const sdkAdb = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const adb = fs.existsSync(sdkAdb) ? sdkAdb : 'adb';

const devices = execFileSync(adb, ['devices'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.trim().split(/\s+/))
  .filter(([serial, state]) => serial && state === 'device')
  .map(([serial]) => serial);

if (devices.length === 0) {
  console.error('No authorized Android device found (check the USB cable and the USB debugging prompt).');
  process.exit(1);
}

for (const serial of devices) {
  for (const port of PORTS) {
    execFileSync(adb, ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`]);
  }
  console.log(`${serial}: forwarded ${PORTS.join(', ')}`);
}
