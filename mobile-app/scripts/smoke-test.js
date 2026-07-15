const fs = require('fs');
const path = require('path');

const required = [
  'App.js',
  'src/services/api.js',
  'src/data/demoCatalog.js',
  'src/components/SongCard.js',
  'src/components/TabButton.js',
  'src/screens/HomeScreen.js',
  'src/screens/SearchScreen.js',
  'src/screens/LibraryScreen.js',
  'src/screens/ProfileScreen.js'
];

const missing = required.filter((file) => !fs.existsSync(path.join(__dirname, '..', file)));

if (missing.length) {
  console.error(`Missing files: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Mobile app smoke test passed.');