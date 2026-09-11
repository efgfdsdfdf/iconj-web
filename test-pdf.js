const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable");

try {
  const doc = new jsPDF();
  
  doc.text("Hello", 10, 10);
  
  const lines = doc.splitTextToSize("https://example.com/very/long/url/that/needs/to/wrap", 50);
  console.log("Lines:", lines);
  
  // doc.textWithLink(lines, 10, 20, { url: "https://example.com" });
  
  console.log("PDF generation test passed!");
} catch (e) {
  console.error("PDF Crash:", e);
}
