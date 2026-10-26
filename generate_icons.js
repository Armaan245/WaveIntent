const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG generator without dependencies
function createSolidPNG(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type (RGBA)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Raw image data with scanline filters (filter byte 0 per line)
  const lineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * lineLength);
  for (let y = 0; y < height; y++) {
    const offset = y * lineLength;
    rawData[offset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = offset + 1 + x * 4;
      // create a sleek dark gradient with mint green center
      const dist = Math.hypot(x - width / 2, y - height / 2) / (width / 2);
      if (dist < 0.4) {
        rawData[pixelOffset] = 0;     // R
        rawData[pixelOffset + 1] = 255; // G (Mint green)
        rawData[pixelOffset + 2] = 163; // B
        rawData[pixelOffset + 3] = 255; // A
      } else if (dist < 0.8) {
        rawData[pixelOffset] = 20;
        rawData[pixelOffset + 1] = 26;
        rawData[pixelOffset + 2] = 35;
        rawData[pixelOffset + 3] = 255;
      } else {
        rawData[pixelOffset] = 10;
        rawData[pixelOffset + 1] = 11;
        rawData[pixelOffset + 2] = 16;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table & calculator
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
}

function crc32(buf) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createSolidPNG(16, 16, 0, 255, 163));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createSolidPNG(48, 48, 0, 255, 163));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createSolidPNG(128, 128, 0, 255, 163));
console.log('Icons generated successfully in icons/');
