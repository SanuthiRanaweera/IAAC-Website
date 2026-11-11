import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Download, Filter, Printer, FileText, 
  Calendar, Award, CheckCircle, Clock, BookOpen, MapPin, Eye,
  Sparkles, RotateCcw
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const REPORT_TYPES = [
  { id: 'monthly', label: 'Monthly Application Report', desc: 'Track admissions volume grouped by calendar month and campus' },
  { id: 'annual', label: 'Annual Application Report', desc: 'Comprehensive yearly admissions overview with totals and trends' },
  { id: 'course', label: 'Course-Based Application Report', desc: 'Student intake breakdown by specific diploma program' },
  { id: 'pending', label: 'Pending Applications Report', desc: 'All student submissions awaiting review, grouped by branch' },
  { id: 'summary', label: 'Admissions Summary Report', desc: 'Executive high-level summary with approval rates & campus shares' },
];

export default function AdminReports({
  applications = [],
}) {
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'

  // Extract unique years
  const availableYears = useMemo(() => {
    const set = new Set();
    applications.forEach((a) => {
      if (a.createdAt) {
        const d = new Date(a.createdAt);
        if (!isNaN(d.getTime())) set.add(d.getFullYear());
      }
    });
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [applications]);

  // Extract unique courses
  const availableCourses = useMemo(() => {
    const set = new Set();
    applications.forEach((a) => {
      const c = a.course || a.courseApplied || a.program;
      if (c) set.add(c.trim());
    });
    return Array.from(set).sort();
  }, [applications]);

  // Filter applications for the active report configuration
  const reportRecords = useMemo(() => {
    return applications.filter((app) => {
      if (!app.createdAt) return false;
      const d = new Date(app.createdAt);
      if (isNaN(d.getTime())) return false;

      // Year filter (annual report or specific year)
      if (yearFilter !== 'all' && d.getFullYear() !== Number(yearFilter)) {
        return false;
      }

      // Month filter
      if (monthFilter !== 'all' && d.getMonth() + 1 !== Number(monthFilter)) {
        return false;
      }

      // Course filter
      if (courseFilter !== 'all') {
        const c = (app.course || app.courseApplied || app.program || '').trim();
        if (c !== courseFilter) return false;
      }

      // Status filter
      if (selectedReportType === 'pending') {
        if (app.isDone) return false;
      } else {
        if (statusFilter === 'pending' && app.isDone) return false;
        if (statusFilter === 'approved' && !app.isDone) return false;
      }

      return true;
    });
  }, [applications, selectedReportType, yearFilter, monthFilter, courseFilter, statusFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (reportRecords.length === 0) {
      alert('No records available for export with current filters.');
      return;
    }

    const headers = [
      'Application ID',
      'Student Name',
      'Email',
      'Mobile',
      'WhatsApp',
      'Applied Course',
      'Academy / Campus',
      'O/L Math',
      'O/L English',
      'Status',
      'Submission Date',
    ];

    const rows = reportRecords.map((a) => [
      `"${a.id || ''}"`,
      `"${(a.fullName || a.name || '').replace(/"/g, '""')}"`,
      `"${a.email || ''}"`,
      `"${a.mobile || a.phone || a.contact || ''}"`,
      `"${a.whatsapp || ''}"`,
      `"${(a.course || a.courseApplied || a.program || '').replace(/"/g, '""')}"`,
      `"${(a.academy || '').replace(/"/g, '""')}"`,
      `"${a.olResults?.math || ''}"`,
      `"${a.olResults?.english || ''}"`,
      `"${a.isDone ? 'Approved' : 'Pending'}"`,
      `"${a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IAAC_${selectedReportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF Handler (Professional multi-page layout via jsPDF)
  const handleExportPDF = () => {
    if (reportRecords.length === 0) {
      alert('No records available for export with current filters.');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const marginTop = 40;
    const marginBottom = 40;

    // Header Background
    doc.setFillColor(11, 21, 40); // Deep Navy
    doc.rect(0, 0, pageW, 70, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('International Airline & Aviation College (IAAC)', marginX, 35);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 200, 240);
    const reportTitle = REPORT_TYPES.find((r) => r.id === selectedReportType)?.label || 'Admissions Report';
    doc.text(`${reportTitle} • Generated: ${new Date().toLocaleDateString()} • Total Records: ${reportRecords.length}`, marginX, 55);

    // Table Columns Setup
    const headers = ['#', 'Student Name', 'Contact Email / Phone', 'Diploma Programme', 'Academy', 'O/L M/E', 'Status', 'Date'];
    const colWidths = [30, 150, 150, 170, 100, 50, 60, 60];
    const tableW = colWidths.reduce((a, b) => a + b, 0);
    const rowH = 22;
    const headerH = 24;
    let y = 90;

    const drawTableHeader = () => {
      doc.setFillColor(37, 99, 235); // Blue 600
      doc.rect(marginX, y, tableW, headerH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      let x = marginX;
      headers.forEach((h, i) => {
        doc.text(h, x + 6, y + 16);
        x += colWidths[i];
      });
      y += headerH;
    };

    drawTableHeader();

    reportRecords.forEach((app, idx) => {
      if (y + rowH > pageH - marginBottom) {
        doc.addPage();
        y = marginTop;
        drawTableHeader();
      }

      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, tableW, rowH, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      const name = (app.fullName || app.name || '-').slice(0, 24);
      const contact = `${app.email || app.mobile || '-'}`.slice(0, 24);
      const course = (app.course || app.courseApplied || app.program || '-').slice(0, 28);
      const academy = (app.academy || '-').slice(0, 16);
      const math = app.olResults?.math || '-';
      const eng = app.olResults?.english || '-';
      const status = app.isDone ? 'Approved' : 'Pending';
      const date = app.createdAt ? new Date(app.createdAt).toISOString().slice(0, 10) : '-';

      const rowValues = [String(idx + 1), name, contact, course, academy, `${math}/${eng}`, status, date];

      let x = marginX;
      rowValues.forEach((val, i) => {
        doc.text(val, x + 6, y + 15);
        x += colWidths[i];
      });

      // row line
      doc.setDrawColor(230, 235, 245);
      doc.line(marginX, y + rowH, marginX + tableW, y + rowH);

      y += rowH;
    });

    // Pagination footers
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(140);
      doc.text('IAAC Smart Admin 2.0 • Official Electronic Report', marginX, pageH - 20);
      doc.text(`Page ${p} of ${totalPages}`, pageW - marginX, pageH - 20, { align: 'right' });
    }

    doc.save(`IAAC_${selectedReportType}_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Report Types Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {REPORT_TYPES.map((rep) => {
          const isSelected = selectedReportType === rep.id;
          return (
            <button
              key={rep.id}
              type="button"
              onClick={() => setSelectedReportType(rep.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-white border-slate-200/80 hover:border-blue-300 text-slate-800 shadow-xs'
              }`}
            >
              <div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                }`}>
                  <FileSpreadsheet size={16} />
                </div>
                <h4 className="font-bold text-xs leading-snug">{rep.label}</h4>
              </div>
              <p className={`text-[10px] mt-2 line-clamp-2 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {rep.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar & Export Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {REPORT_TYPES.find((r) => r.id === selectedReportType)?.label}
            </h3>
            <p className="text-xs text-slate-400">
              Configure parameters and export verified records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Download size={14} />
              <span>Export PDF Report</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Academic Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none"
            >
              <option value="all">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none"
            >
              <option value="all">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Course / Diploma
            </label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none truncate"
            >
              <option value="all">All Courses</option>
              {availableCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Filter
            </label>
            <select
              disabled={selectedReportType === 'pending'}
              value={selectedReportType === 'pending' ? 'pending' : statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none disabled:opacity-60"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Data Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-slate-900">
              Live Report Preview
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {reportRecords.length} records ready to export
            </span>
          </div>
        </div>

        {reportRecords.length === 0 ? (
          <div className="py-16 text-center">
            <FileSpreadsheet size={32} className="text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No matching applications</h4>
            <p className="text-xs text-slate-400 mt-1">Select a different year or month filter to preview data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 shadow-xs">
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 pl-4">#</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Campus</th>
                  <th className="py-3 px-3">O/L Math / Eng</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pr-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportRecords.slice(0, 50).map((app, idx) => (
                  <tr key={app.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 pl-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{app.fullName || app.name || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate">{app.course || app.courseApplied || app.program || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">{app.mobile || app.phone || app.email || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{app.academy || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">
                      {app.olResults?.math || '-'}/{app.olResults?.english || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {app.isDone ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                      {app.createdAt ? new Date(app.createdAt).toISOString().slice(0, 10) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
