const fs = require('node:fs');
const path = require('node:path');

const dir = path.join(__dirname, 'images');
const files = fs.readdirSync(dir)
  .filter((file) => file.toLowerCase().endsWith('.jpeg'))
  .sort((a, b) => Number(a.slice(0, -5)) - Number(b.slice(0, -5)));

files.forEach((file, index) => {
  const temp = path.join(dir, `__rename_${index}.jpeg`);
  fs.renameSync(path.join(dir, file), temp);
});

files.forEach((_, index) => {
  fs.renameSync(
    path.join(dir, `__rename_${index}.jpeg`),
    path.join(dir, `${index + 1}.jpeg`)
  );
});

console.log(`Renamed ${files.length} images.`);