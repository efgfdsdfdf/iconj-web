const { jsPDF } = require("jspdf");

try {
  const doc = new jsPDF();
  const lines = doc.splitTextToSize("https://example.com/very/long/url/that/needs/to/wrap", 50);
  doc.textWithLink(lines, 10, 20, { url: "https://example.com" });
  console.log("textWithLink worked with array!");
} catch (e) {
  console.error("Crash on textWithLink array:", e);
}
