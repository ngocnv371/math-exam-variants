import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Exam, ExamVersion } from "../types";

export const generateExamPDF = (exam: Exam) => {
  const doc = new jsPDF();
  let pageNumber = 1;

  // 1. Generate Exam Versions
  exam.versions.forEach((version, vIdx) => {
    if (vIdx > 0) doc.addPage();
    
    doc.setFontSize(18);
    doc.text(`KindMath Assessment: ${exam.title}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Form ${version.label}`, 170, 20);
    doc.line(20, 25, 190, 25);

    let y = 40;
    version.variants.forEach((variant, pIdx) => {
      const splitText = doc.splitTextToSize(`${pIdx + 1}. ${variant.text}`, 160);
      
      // Check if we need a new page
      if (y + splitText.length * 7 > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(splitText, 20, y);
      y += splitText.length * 7 + 5;

      if (variant.options && variant.options.length > 0) {
        variant.options.forEach((opt, oIdx) => {
          const label = String.fromCharCode(65 + oIdx);
          doc.text(`${label}) ${opt}`, 30, y);
          y += 7;
        });
        y += 5;
      } else {
        y += 15; // Space for answer
      }
    });
  });

  // 2. Master Comparison Table
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Master Comparison Table", 20, 20);
  
  const tableHeaders = ["#", ...exam.versions.map(v => `Form ${v.label}`)];
  const tableData = exam.originalProblems.map((_, pIdx) => {
    return [
      (pIdx + 1).toString(),
      ...exam.versions.map(v => v.variants[pIdx].correctAnswer)
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [tableHeaders],
    body: tableData,
  });

  // 3. Detailed Answer Keys
  exam.versions.forEach((version) => {
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`Answer Key: Form ${version.label}`, 20, 20);
    
    let y = 35;
    version.variants.forEach((variant, pIdx) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${pIdx + 1}. Correct Answer: ${variant.correctAnswer}`, 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      const splitExp = doc.splitTextToSize(`Explanation: ${variant.explanation}`, 160);
      doc.text(splitExp, 20, y);
      y += splitExp.length * 7 + 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  });

  doc.save(`${exam.title.replace(/\s+/g, '_')}_KindMath.pdf`);
};
