// Generate minimal valid PNG icons for the Chrome extension
// These are simple green-on-dark squares with "AEP" branding

const fs = require('fs');
const path = require('path');

// Minimal PNG generator - creates a solid colored square PNG
function createPNG(size) {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(size, 0);  // width
    ihdrData.writeUInt32BE(size, 4);  // height
    ihdrData[8] = 8;   // bit depth
    ihdrData[9] = 2;   // color type (RGB)
    ihdrData[10] = 0;  // compression
    ihdrData[11] = 0;  // filter
    ihdrData[12] = 0;  // interlace

    const ihdrChunk = createChunk('IHDR', ihdrData);

    // IDAT chunk - create image data with a green circle on dark background
    const rawData = [];
    const center = size / 2;
    const radius = size * 0.4;
    const innerRadius = size * 0.25;

    for (let y = 0; y < size; y++) {
        rawData.push(0); // filter byte (none)
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius && dist > innerRadius) {
                // Green ring (#4ade80)
                rawData.push(74, 222, 128);
            } else if (dist <= innerRadius) {
                // Dark center with a lightning bolt shape
                const normalX = (x - center) / innerRadius;
                const normalY = (y - center) / innerRadius;
                // Simple "A" shape detection
                if (Math.abs(normalX) < 0.3 && normalY > -0.5 && normalY < 0.5) {
                    rawData.push(74, 222, 128); // green
                } else {
                    rawData.push(18, 18, 18); // dark bg #121212
                }
            } else {
                rawData.push(18, 18, 18); // dark bg #121212
            }
        }
    }

    // Compress with zlib (deflate)
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(Buffer.from(rawData));
    const idatChunk = createChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);

    return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const sizes = [16, 48, 128];
const outDir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
    const png = createPNG(size);
    const filePath = path.join(outDir, `icon${size}.png`);
    fs.writeFileSync(filePath, png);
    console.log(`Created ${filePath} (${png.length} bytes)`);
}

console.log('Done!');
