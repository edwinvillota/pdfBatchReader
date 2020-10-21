const fs = require('fs');

function base64Encode(path) {
  const bitmap = fs.readFileSync(path);
  return Buffer.from(bitmap).toString('base64');
}

module.exports = base64Encode;
