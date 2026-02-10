// Generate minimal valid PNG icons for the Chrome extension
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(size, 0);
    ihdrData.writeUInt32BE(size, 4);
    ihdrData[8] = 8; ihdrData[9] = 2;
    const ihdrChunk = createChunk('IHDR', ihdrData);
    const rawData = [];
    const center = size / 2;
    const r = size * 0.42;
    const ir = size * 0.28;
    for (let y = 0; y < size; y++) {
        rawData.push(0);
        for (let x = 0; x < size; x++) {
            const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
            if (dist < r && dist > ir) { rawData.push(74, 222, 128); }
            else if (dist <= ir && Math.abs(x - center) < size * 0.08) { rawData.push(74, 222, 128); }
            else { rawData.push(18, 18, 18); }
        }
    }
    const compressed = zlib.deflateSync(Buffer.from(rawData));
    const idatChunk = createChunk('IDAT', compressed);
    const iendChunk = createChunk('IEND', Buffer.alloc(0));
    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}
function createChunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
}
function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0); }
    return (c ^ 0xFFFFFFFF) >>> 0;
}
const outDir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });
[16, 48, 128].forEach(s => {
    const p = path.join(outDir, `icon${s}.png`);
    fs.writeFileSync(p, createPNG(s));
    console.log(`Created ${p}`);
});
