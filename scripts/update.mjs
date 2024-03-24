import fs from 'fs';
import yauzl from 'yauzl';

const latest = fs.readFileSync('latest.txt', 'utf-8');

if (!fs.existsSync('svg')) {
  fs.mkdirSync('svg');
}

// Fetch website
const res = await fetch('https://kenney.nl/assets/input-prompts', {
  headers: { 'User-Agent': 'github.com/jf908/Kenney-Input-Prompts' },
});
const text = await res.text();

// Extract version
const newVersion = text.match(/<span class='type'>([^<]+)/)[1];

if (newVersion !== latest) {
  fs.writeFileSync('latest.txt', newVersion);

  // Extract download link
  const link = text.match(/<a id='donate-text' href='([^']+)'/)[1];

  // Download zip
  const zip = await fetch(link, {
    headers: { 'User-Agent': 'github.com/jf908/Kenney-Input-Prompts' },
  });

  // Create buffer
  const buffer = Buffer.from(await zip.arrayBuffer());

  // Save file names to check for duplicates
  const names = new Set();

  yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
    if (err) throw err;
    zipfile.readEntry();
    zipfile.on('entry', (entry) => {
      if (entry.fileName.endsWith('.svg')) {
        const filename = entry.fileName.split('/').at(-1);
        if (names.has(filename)) {
          throw `Duplicate Icon Name - "${filename}"`;
        }
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) throw err;
          readStream.on('end', function () {
            zipfile.readEntry();
          });
          readStream.pipe(
            fs.createWriteStream(`svg/${filename}`, { flags: 'w' })
          );
        });
      } else {
        zipfile.readEntry();
      }
    });
  });
}
