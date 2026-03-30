const fs = require('fs');
const path = require('path');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const args = process.argv.slice(2);
const mode = args[0];
let newVersion = args[0];

const repoRoot = path.resolve(__dirname, '..');
const appJsonPath = path.join(repoRoot, 'app.json');
const stringsPath = path.join(repoRoot, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');

if (!fs.existsSync(appJsonPath)) die('app.json not found');
if (!fs.existsSync(stringsPath)) die('strings.xml not found');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

if (!newVersion) {
  // If no arg, read runtimeVersion from app.json
  if (appJson.expo && appJson.expo.runtimeVersion) {
    newVersion = appJson.expo.runtimeVersion;
  } else if (appJson.runtimeVersion) {
    newVersion = appJson.runtimeVersion;
  } else {
    die('No version provided and no runtimeVersion found in app.json');
  }
}

// Update app.json.runtimeVersion to newVersion (if different)
if (!appJson.expo) appJson.expo = {};
if (appJson.expo.runtimeVersion !== newVersion) {
  appJson.expo.runtimeVersion = newVersion;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
  console.log(`Updated app.json runtimeVersion -> ${newVersion}`);
} else {
  console.log(`app.json runtimeVersion already ${newVersion}`);
}

// Update strings.xml
let xml = fs.readFileSync(stringsPath, 'utf8');
const re = /<string name="expo_runtime_version">([^<]*)<\/string>/;
if (re.test(xml)) {
  xml = xml.replace(re, `<string name="expo_runtime_version">${newVersion}</string>`);
  fs.writeFileSync(stringsPath, xml, 'utf8');
  console.log(`Updated strings.xml expo_runtime_version -> ${newVersion}`);
} else {
  // insert before closing </resources>
  const insertPoint = xml.lastIndexOf('</resources>');
  if (insertPoint === -1) die('Invalid strings.xml: missing </resources>');
  const toInsert = `  <string name="expo_runtime_version">${newVersion}</string>\n`;
  xml = xml.slice(0, insertPoint) + toInsert + xml.slice(insertPoint);
  fs.writeFileSync(stringsPath, xml, 'utf8');
  console.log(`Inserted expo_runtime_version ${newVersion} into strings.xml`);
}

console.log('Done.');
