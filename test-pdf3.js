const { jsPDF } = require("jspdf");

try {
  const doc = new jsPDF();
  const lines = doc.splitTextToSize("https://example.com/very/long/url/that/needs/to/wrap", 50);
  doc.text(lines, 10, 20);
  doc.link(10, 15, 50, lines.length * 5, { url: "https://example.com" });
  console.log("doc.link worked!");
} catch (e) {
  console.error("Crash on doc.link:", e);
}
