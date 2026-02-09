import pdfParse from "pdf-parse/lib/pdf-parse.js";
import fs from "fs";

console.log("✅ pdf-parse imported successfully!");

// Create a dummy PDF buffer (header only) to test functionality if needed, 
// or just exit if we only care about the import working.
const dummyPdfBuffer = Buffer.from("%PDF-1.7\n%EOF");

try {
    const data = await pdfParse(dummyPdfBuffer);
    console.log("Text content:", data.text);
} catch (error) {
    // It might fail on dummy buffer, but if it gets here, the import worked.
    console.log("Import worked, but parsing failed (expected for dummy buffer):", error.message);
}
