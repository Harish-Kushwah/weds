const fs = require('node:fs');
const path = require('node:path');

const dir = path.join(__dirname, 'images');
const supportedExtensions = new Set(['.jpeg', '.jpg', '.png']);
const files = fs.readdirSync(dir)
  .filter((file) => supportedExtensions.has(path.extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

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
