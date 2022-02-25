// Require file system access
fs = require("fs");

// Read file buffer
imgReadBuffer = fs.readFileSync("test-pattern.jpeg");

// Encode image buffer to hex
imgHexEncode = Buffer.from(imgReadBuffer).toString("hex");

// Output encoded data to console
console.log(imgHexEncode);

// Decode hex
var imgHexDecode = Buffer.from(imgHexEncode, "hex");

// Save decoded file file system
fs.writeFileSync("decodedHexImage.jpg", imgHexDecode);
