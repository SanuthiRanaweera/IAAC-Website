import { jsPDF } from 'jspdf';

// Helper to sanitize strings for jsPDF
function safeText(str) {
  if (str === null || str === undefined) return '-';
  return String(str).trim() || '-';
}

/**
 * Generates an institutional A4 PDF document for a Past Student Application.
 * Filename format: IAAC_Past_Student_[StudentID].pdf
 */
export function downloadPastStudentPdf(app, { download = true } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 65;
  let y = 35;

  const checkPageBreak = (needed = 40) => {
    if (y + needed > pageHeight - marginBottom) {
      doc.addPage();
      y = 35;
    }
  };

  // 1. Header Banner
  doc.setFillColor(11, 21, 40); // #0B1528
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Header Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('IAAC', 40, 42);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 205, 230);
  doc.text('International Airline and Aviation College', 40, 58);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PAST STUDENT APPLICATION & RECORD UPDATE', 40, 74);

  // Top Right Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(190, 205, 230);
  doc.text(`Ref: ${safeText(app.applicationRef)}`, pageWidth - 40, 42, { align: 'right' });
  doc.text(`Student ID: ${safeText(app.studentId)}`, pageWidth - 40, 58, { align: 'right' });
  doc.text(`Date: ${new Date(app.createdAt || Date.now()).toLocaleDateString()}`, pageWidth - 40, 74, { align: 'right' });

  y = 115;

  // 2. Diploma Programme Box
  const diplomaName = safeText(app.diplomaProgramme || 'N/A');
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(40, y, pageWidth - 80, 42, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(191, 219, 254); // Blue 200
  doc.text('REGISTERED DIPLOMA PROGRAMME', 52, y + 15);

  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  doc.text(diplomaName, 52, y + 31);

  y += 58;

  // Helper function to draw structured sections
  const drawSection = (title, items) => {
    checkPageBreak(50);
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(40, y, pageWidth - 80, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(11, 21, 40);
    doc.text(title.toUpperCase(), 48, y + 15);
    y += 32;

    items.forEach(([label, value]) => {
      const textVal = safeText(value);
      const split = doc.splitTextToSize(textVal, 340);
      const fieldH = Math.max(split.length * 13, 14);

      checkPageBreak(fieldH + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text(`${label}:`, 48, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(split, 185, y);
      y += fieldH + 6;
    });

    y += 10;
  };

  // Section A - Personal Information
  drawSection('Section A – Personal Information', [
    ['Student Full Name', app.fullName],
    ['Certificate Name', app.certificateName],
    ['Date of Birth', app.dob ? new Date(app.dob).toLocaleDateString() : '-'],
    ['Identification Type', app.identificationType || 'NIC'],
    ['NIC / Passport Number', app.nicPassportNumber],
    ['Gender', app.gender],
    ['Residential Address', app.residentialAddress],
  ]);

  // Section B - Contact Information
  drawSection('Section B – Contact Information', [
    ['Email Address', app.email],
    ['Mobile Number', app.mobileNumber],
    ['WhatsApp Number', app.whatsappNumber],
  ]);

  // Section C - Educational Qualifications
  drawSection('Section C – Educational Qualifications', [
    ['School Attended', app.schoolAttended],
    ['G.C.E. O/L Exam Year', String(app.olYear || '-')],
    ['O/L Mathematics Result', app.olMathResult ? `${app.olMathResult} Grade` : '-'],
    ['O/L English Result', app.olEnglishResult ? `${app.olEnglishResult} Grade` : '-'],
  ]);

  // Section D - Overall O/L Results Summary Table
  checkPageBreak(65);
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 21, 40);
  doc.text('SECTION D – OVERALL O/L RESULTS SUMMARY', 48, y + 15);
  y += 32;

  const grades = [
    ['A Grades', app.olGradeCounts?.aCount ?? 0],
    ['B Grades', app.olGradeCounts?.bCount ?? 0],
    ['C Grades', app.olGradeCounts?.cCount ?? 0],
    ['S Grades', app.olGradeCounts?.sCount ?? 0],
    ['W/F Grades', app.olGradeCounts?.wCount ?? 0],
    ['Total Subjects', app.totalSubjects ?? 0],
  ];

  let startX = 48;
  const colW = (pageWidth - 96) / grades.length;
  doc.setFontSize(9);
  grades.forEach(([lbl, cnt]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, startX, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(cnt), startX, y + 14);
    startX += colW;
  });
  y += 34;

  // Section E - IAAC Registration Information
  drawSection('Section E – IAAC Registration Information', [
    ['IAAC Student ID', app.studentId],
    ['Diploma Programme', app.diplomaProgramme],
    ['Branch / Academy', app.branch || 'IAAC General'],
    ['Batch / Intake', app.batch || 'Regular'],
    ['Application Status', app.status || 'Pending'],
    ['Submission Date & Time', app.createdAt ? new Date(app.createdAt).toLocaleString() : '-'],
  ]);

  // Section F - Student Declaration & Signatures
  checkPageBreak(130);
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 21, 40);
  doc.text('SECTION F – STUDENT DECLARATION & VERIFICATION', 48, y + 15);
  y += 35;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const declarationText =
    '“I hereby confirm that all the information provided in this application is true and accurate to the best of my knowledge. I authorize IAAC to use this information for administrative and academic record-keeping purposes.”';
  const decLines = doc.splitTextToSize(declarationText, pageWidth - 96);
  doc.text(decLines, 48, y);
  y += decLines.length * 11 + 35;

  // Signatures & Stamp Placeholders
  checkPageBreak(75);
  const sigColW = (pageWidth - 96) / 3;

  // 1. Student Signature
  doc.setDrawColor(180, 190, 205);
  doc.line(48, y, 48 + sigColW - 15, y);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Student Signature', 48, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120);
  doc.text(`Date: ${new Date(app.createdAt || Date.now()).toLocaleDateString()}`, 48, y + 23);

  // 2. Admin Verification Signature
  doc.line(48 + sigColW, y, 48 + sigColW * 2 - 15, y);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Admin Verification Signature', 48 + sigColW, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120);
  doc.text('Authorized Academic Officer', 48 + sigColW, y + 23);

  // 3. Official College Stamp Space
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.rect(48 + sigColW * 2, y - 28, sigColW - 10, 52);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(148, 163, 184);
  doc.text('OFFICIAL IAAC STAMP', 48 + sigColW * 2 + (sigColW - 10) / 2, y + 1, { align: 'center' });

  // Footer Disclaimer on All Pages
  const totalP = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalP; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(40, pageHeight - 35, pageWidth - 40, pageHeight - 35);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'International Airline and Aviation College (IAAC) • Official Past Student Application Record',
      40,
      pageHeight - 22
    );
    doc.text(`Page ${i} of ${totalP}`, pageWidth - 40, pageHeight - 22, { align: 'right' });
  }

  // Safe Filename format: IAAC_Past_Student_[StudentID].pdf
  const fileSafeId = String(app.studentId || 'N/A').replace(/[^a-z0-9]+/gi, '_');
  const filename = `IAAC_Past_Student_${fileSafeId}.pdf`;

  if (download) {
    doc.save(filename);
  }
  return doc.output('datauristring');
}

/**
 * Direct Printing function that opens an institutional printable document without UI elements.
 */
export function printPastStudentApp(app) {
  const fileSafeId = String(app.studentId || 'N/A').replace(/[^a-z0-9]+/gi, '_');
  const title = `IAAC_Past_Student_${fileSafeId}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          line-height: 1.45;
          margin: 0;
          padding: 0;
          font-size: 11pt;
        }
        .header {
          border-bottom: 2px solid #0B1528;
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .college-title {
          font-size: 16pt;
          font-weight: 800;
          color: #0B1528;
          text-transform: uppercase;
          letter-spacing: -0.5px;
        }
        .form-heading {
          font-size: 12pt;
          font-weight: 700;
          color: #1e3a8a;
          margin-top: 2px;
        }
        .meta-box {
          text-align: right;
          font-size: 9pt;
          color: #64748b;
          font-family: monospace;
        }
        .diploma-box {
          background: #f1f5f9;
          border-left: 4px solid #1e3a8a;
          padding: 10px 14px;
          margin-bottom: 18px;
        }
        .diploma-label {
          font-size: 8pt;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .diploma-value {
          font-size: 12pt;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2px;
        }
        .section-box {
          margin-bottom: 18px;
        }
        .section-title {
          background: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
          padding: 6px 8px;
          font-size: 9.5pt;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px 16px;
          font-size: 9.5pt;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dotted #e2e8f0;
          padding-bottom: 4px;
        }
        .info-label {
          color: #64748b;
          font-weight: 600;
        }
        .info-value {
          color: #0f172a;
          font-weight: 700;
          text-align: right;
        }
        .ol-summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          font-size: 9pt;
          text-align: center;
        }
        .ol-summary-table th {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 6px;
          font-weight: 700;
          color: #475569;
        }
        .ol-summary-table td {
          border: 1px solid #cbd5e1;
          padding: 6px;
          font-weight: 800;
          color: #0f172a;
        }
        .declaration-box {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 10px 14px;
          font-size: 8.5pt;
          color: #475569;
          font-style: italic;
          margin-top: 20px;
          margin-bottom: 30px;
        }
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: 40px;
        }
        .sig-block {
          border-top: 1px solid #0f172a;
          padding-top: 6px;
          font-size: 8.5pt;
          font-weight: 700;
          color: #334155;
          text-align: center;
        }
        .stamp-box {
          border: 1px dashed #94a3b8;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8pt;
          color: #94a3b8;
          font-weight: 700;
        }
        .footer-note {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 8pt;
          color: #94a3b8;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="college-title">International Airline & Aviation College</div>
          <div class="form-heading">Past Student Application & Information Record</div>
        </div>
        <div class="meta-box">
          <div>Ref: <strong>${safeText(app.applicationRef)}</strong></div>
          <div>Student ID: <strong>${safeText(app.studentId)}</strong></div>
          <div>Date: ${new Date(app.createdAt || Date.now()).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="diploma-box">
        <div class="diploma-label">Registered Diploma Programme</div>
        <div class="diploma-value">${safeText(app.diplomaProgramme)}</div>
      </div>

      <!-- Section A -->
      <div class="section-box">
        <div class="section-title">Section A – Personal Information</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${safeText(app.fullName)}</span></div>
          <div class="info-row"><span class="info-label">Certificate Name:</span><span class="info-value">${safeText(app.certificateName)}</span></div>
          <div class="info-row"><span class="info-label">Date of Birth:</span><span class="info-value">${app.dob ? new Date(app.dob).toLocaleDateString() : '-'}</span></div>
          <div class="info-row"><span class="info-label">Gender:</span><span class="info-value">${safeText(app.gender)}</span></div>
          <div class="info-row"><span class="info-label">${safeText(app.identificationType || 'NIC')}:</span><span class="info-value">${safeText(app.nicPassportNumber)}</span></div>
          <div class="info-row" style="grid-column: span 2;"><span class="info-label">Residential Address:</span><span class="info-value">${safeText(app.residentialAddress)}</span></div>
        </div>
      </div>

      <!-- Section B -->
      <div class="section-box">
        <div class="section-title">Section B – Contact Details</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Email Address:</span><span class="info-value">${safeText(app.email)}</span></div>
          <div class="info-row"><span class="info-label">Mobile Number:</span><span class="info-value">${safeText(app.mobileNumber)}</span></div>
          <div class="info-row"><span class="info-label">WhatsApp Number:</span><span class="info-value">${safeText(app.whatsappNumber)}</span></div>
        </div>
      </div>

      <!-- Section C & D -->
      <div class="section-box">
        <div class="section-title">Section C & D – Educational Qualifications</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">School Attended:</span><span class="info-value">${safeText(app.schoolAttended)}</span></div>
          <div class="info-row"><span class="info-label">O/L Year:</span><span class="info-value">${safeText(app.olYear)}</span></div>
          <div class="info-row"><span class="info-label">O/L Mathematics Result:</span><span class="info-value">${safeText(app.olMathResult)} Grade</span></div>
          <div class="info-row"><span class="info-label">O/L English Result:</span><span class="info-value">${safeText(app.olEnglishResult)} Grade</span></div>
        </div>

        <table class="ol-summary-table">
          <thead>
            <tr>
              <th>A Grades</th>
              <th>B Grades</th>
              <th>C Grades</th>
              <th>S Grades</th>
              <th>W/F Grades</th>
              <th>Total Calculated Subjects</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${app.olGradeCounts?.aCount ?? 0}</td>
              <td>${app.olGradeCounts?.bCount ?? 0}</td>
              <td>${app.olGradeCounts?.cCount ?? 0}</td>
              <td>${app.olGradeCounts?.sCount ?? 0}</td>
              <td>${app.olGradeCounts?.wCount ?? 0}</td>
              <td>${app.totalSubjects ?? 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section E -->
      <div class="section-box">
        <div class="section-title">Section E – IAAC Registration Details</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">IAAC Student ID:</span><span class="info-value">${safeText(app.studentId)}</span></div>
          <div class="info-row"><span class="info-label">Branch / Academy:</span><span class="info-value">${safeText(app.branch || 'IAAC General')}</span></div>
          <div class="info-row"><span class="info-label">Batch / Intake:</span><span class="info-value">${safeText(app.batch || 'Regular')}</span></div>
          <div class="info-row"><span class="info-label">Processing Status:</span><span class="info-value">${safeText(app.status)}</span></div>
        </div>
      </div>

      <!-- Section F -->
      <div class="declaration-box">
        <strong>Section F – Student Declaration:</strong><br />
        “I hereby confirm that all the information provided in this application is true and accurate to the best of my knowledge. I authorize IAAC to use this information for administrative and academic record-keeping purposes.”
      </div>

      <!-- Signatures & Stamp -->
      <div class="signature-grid">
        <div class="sig-block">
          <div>Student Signature</div>
          <div style="font-size: 7.5pt; font-weight: normal; color: #64748b; margin-top: 3px;">Date: ${new Date(app.createdAt || Date.now()).toLocaleDateString()}</div>
        </div>
        <div class="sig-block">
          <div>Authorized Administration Signature</div>
          <div style="font-size: 7.5pt; font-weight: normal; color: #64748b; margin-top: 3px;">IAAC Academic Registrar</div>
        </div>
        <div class="stamp-box">
          OFFICIAL IAAC STAMP
        </div>
      </div>

      <div class="footer-note">
        This document is an official institutional record generated by the International Airline and Aviation College Administration System.
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert('Pop-up was blocked. Please allow pop-ups for this site to print the application.');
  }
}
