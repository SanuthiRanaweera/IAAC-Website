import React, { useState, useMemo } from 'react';
import { 
  FileText, CheckCircle, Clock, ArrowUpRight, TrendingUp, 
  Calendar, Bell, Plus, Eye, ChevronRight, Award, Compass, 
  BookOpen, ArrowRight, AlertTriangle
} from 'lucide-react';

export default function DashboardOverview({
  applications = [],
  messages = [],
  courses = [],
  events = [],
  notices = [],
  setActiveTab,
  onOpenNewNotice,
  onOpenNewEvent,
  onSelectApplication,
}) {
  const [chartPeriod, setChartPeriod] = useState('monthly'); // 'daily', 'weekly', 'monthly'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 1. Live KPI metrics computed directly from real MongoDB state
  const totalApps = applications.length;
  const approvedApps = applications.filter((a) => a.isDone === true || a.status === 'approved').length;
  const reviewedApps = applications.filter((a) => !a.isDone && (a.reviewStatus === 'reviewed' || a.status === 'reviewed')).length;
  const pendingApps = applications.filter((a) => !a.isDone && a.reviewStatus !== 'reviewed' && a.status !== 'reviewed' && a.status !== 'rejected').length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newTodayApps = applications.filter((a) => {
    if (!a.createdAt) return false;
    const d = new Date(a.createdAt);
    return d >= today;
  }).length;

  // Percentage calculation with 1 decimal place accuracy (e.g. 99.7% and 0.3%)
  const formatPct = (count, total) => {
    if (!total || total === 0) return '0%';
    const val = (count / total) * 100;
    if (val === 100) return '100%';
    if (val === 0) return '0%';
    return `${val.toFixed(1)}%`;
  };

  const approvalRateNum = totalApps > 0 ? (approvedApps / totalApps) * 100 : 0;
  const pendingRateNum = totalApps > 0 ? (pendingApps / totalApps) * 100 : 0;
  const reviewedRateNum = totalApps > 0 ? (reviewedApps / totalApps) * 100 : 0;

  // 2. Compute dynamic chart data based on selected period
  const chartData = useMemo(() => {
    if (!applications.length) {
      return [
        { label: 'Jan', count: 0 },
        { label: 'Feb', count: 0 },
        { label: 'Mar', count: 0 },
        { label: 'Apr', count: 0 },
        { label: 'May', count: 0 },
        { label: 'Jun', count: 0 },
      ];
    }

    if (chartPeriod === 'daily') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        const count = applications.filter((a) => {
          if (!a.createdAt) return false;
          const dt = new Date(a.createdAt);
          return dt >= start && dt <= end;
        }).length;

        days.push({ label: dayStr, count });
      }
      return days;
    }

    if (chartPeriod === 'weekly') {
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const end = new Date();
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 7);

        const count = applications.filter((a) => {
          if (!a.createdAt) return false;
          const dt = new Date(a.createdAt);
          return dt >= start && dt <= end;
        }).length;

        weeks.push({ label: `Week ${4 - i}`, count });
      }
      return weeks;
    }

    // Monthly: last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString('default', { month: 'short' });
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();

      const count = applications.filter((a) => {
        if (!a.createdAt) return false;
        const dt = new Date(a.createdAt);
        return dt.getFullYear() === targetYear && dt.getMonth() === targetMonth;
      }).length;

      months.push({ label: mLabel, count });
    }
    return months;
  }, [applications, chartPeriod]);

  const maxChartVal = Math.max(...chartData.map((d) => d.count), 5);

  // Recent 5 Applications
  const recentApplications = applications.slice(0, 5);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header (No duplicate "Dashboard Overview" text) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, Admin
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here's your IAAC administration summary and live activity overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
          >
            <FileText size={15} />
            <span>View Applications</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewNotice}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add Notice</span>
          </button>
        </div>
      </div>

      {/* 4 Professional KPI Cards with Exact Padding & Alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        {/* KPI 1: Total Applications */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between h-full min-h-[160px] min-w-0">
          {/* Top Section */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Total Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
          </div>
          {/* Middle Section */}
          <div className="my-2.5">
            <div className="text-3xl sm:text-[34px] font-black text-slate-900 tracking-tight leading-none">
              {totalApps}
            </div>
          </div>
          {/* Bottom Section */}
          <p className="text-xs sm:text-[13px] text-slate-400 font-normal truncate">
            All student submissions
          </p>
        </div>

        {/* KPI 2: New Applications */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between h-full min-h-[160px] min-w-0">
          {/* Top Section */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider truncate">
              New Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
          </div>
          {/* Middle Section */}
          <div className="my-2.5">
            <div className="text-3xl sm:text-[34px] font-black text-slate-900 tracking-tight leading-none">
              {newTodayApps}
            </div>
          </div>
          {/* Bottom Section */}
          <p className="text-xs sm:text-[13px] text-indigo-600 font-medium truncate">
            Registered today
          </p>
        </div>

        {/* KPI 3: Pending Review */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all flex flex-col justify-between h-full min-h-[160px] min-w-0">
          {/* Top Section */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Pending Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
          {/* Middle Section */}
          <div className="my-2.5">
            <div className="text-3xl sm:text-[34px] font-black text-amber-600 tracking-tight leading-none">
              {pendingApps}
            </div>
          </div>
          {/* Bottom Section */}
          <p className="text-xs sm:text-[13px] text-amber-700 font-medium truncate">
            {formatPct(pendingApps, totalApps)} of total submissions
          </p>
        </div>

        {/* KPI 4: Approved Applications */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between h-full min-h-[160px] min-w-0">
          {/* Top Section */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Approved Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle size={18} />
            </div>
          </div>
          {/* Middle Section */}
          <div className="my-2.5">
            <div className="text-3xl sm:text-[34px] font-black text-emerald-600 tracking-tight leading-none">
              {approvedApps}
            </div>
          </div>
          {/* Bottom Section */}
          <p className="text-xs sm:text-[13px] text-emerald-700 font-medium truncate">
            {formatPct(approvedApps, totalApps)} approved rate
          </p>
        </div>
      </div>

      {/* Analytics Row: Overview Trend Chart & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Applications Overview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Volume of student submissions over time
                </p>
              </div>

              {/* Period Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 self-start sm:self-auto">
                {['daily', 'weekly', 'monthly'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all ${
                      chartPeriod === period
                        ? 'bg-white text-blue-600 shadow-xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Trend Chart */}
            <div className="h-60 w-full relative">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 500 200"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="180" x2="500" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

                {(() => {
                  const points = chartData.map((d, idx) => {
                    const x = (idx / (chartData.length - 1 || 1)) * 480 + 10;
                    const y = 180 - (d.count / (maxChartVal || 1)) * 140;
                    return { x, y, ...d };
                  });

                  if (points.length < 2) return null;

                  const pathD = points.reduce(
                    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                    ''
                  );
                  const areaD = `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#chartGradient2)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {points.map((pt, idx) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint === idx ? 5.5 : 3.5}
                          className="fill-blue-600 stroke-white stroke-2 cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredPoint(idx)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>

              {hoveredPoint !== null && chartData[hoveredPoint] && (
                <div
                  className="absolute -top-3 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg pointer-events-none -translate-x-1/2 z-10 whitespace-nowrap"
                  style={{
                    left: `${(hoveredPoint / (chartData.length - 1 || 1)) * 96 + 2}%`,
                  }}
                >
                  <div className="font-bold">{chartData[hoveredPoint].label}</div>
                  <div className="text-blue-300">
                    {chartData[hoveredPoint].count} Applications
                  </div>
                </div>
              )}

              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-3 px-2">
                {chartData.map((d, idx) => (
                  <span key={idx} className="truncate max-w-[60px] text-center">
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution Donut Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Admission Status Ratio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live database proportion
            </p>

            <div className="relative w-40 h-40 mx-auto my-5 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="38" fill="transparent" stroke="#10B981" strokeWidth="12"
                  strokeDasharray={`${(approvalRateNum * 238.7) / 100} 238.7`}
                  strokeDashoffset="0" strokeLinecap="round"
                />
                <circle
                  cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" strokeWidth="12"
                  strokeDasharray={`${(pendingRateNum * 238.7) / 100} 238.7`}
                  strokeDashoffset={`-${(approvalRateNum * 238.7) / 100}`}
                  strokeLinecap="round"
                />
                <circle
                  cx="50" cy="50" r="38" fill="transparent" stroke="#94A3B8" strokeWidth="12"
                  strokeDasharray={`${(reviewedRateNum * 238.7) / 100} 238.7`}
                  strokeDashoffset={`-${((approvalRateNum + pendingRateNum) * 238.7) / 100}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">{totalApps}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-900">Approved</span>
                </div>
                <span className="font-bold text-emerald-800">
                  {approvedApps} ({formatPct(approvedApps, totalApps)})
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-semibold text-amber-900">Pending Review</span>
                </div>
                <span className="font-bold text-amber-800">
                  {pendingApps} ({formatPct(pendingApps, totalApps)})
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="font-semibold text-slate-700">Reviewed (Not Eligible)</span>
                </div>
                <span className="font-bold text-slate-700">
                  {reviewedApps} ({formatPct(reviewedApps, totalApps)})
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className="w-full mt-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Detailed Analytics</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Recent Applications & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Submissions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest student applications received
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No applications recorded in database yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-1">Applicant</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-1 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentApplications.map((app) => {
                    const name = app.fullName || app.name || 'Unnamed Applicant';
                    const initials = name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    const isDone = app.isDone === true || app.status === 'approved';

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">{name}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {app.email || app.mobile || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 font-medium max-w-[150px] truncate text-[11px]">
                          {app.course || app.courseApplied || app.program || 'N/A'}
                        </td>
                        <td className="py-3 text-slate-400 text-[11px]">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.reviewStatus === 'reviewed' || app.status === 'reviewed'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isDone
                              ? 'Approved'
                              : app.reviewStatus === 'reviewed' || app.status === 'reviewed'
                              ? 'Reviewed'
                              : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 pr-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectApplication(app.id);
                              setActiveTab('applications');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Quick Actions
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Frequent administrative operations
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('applications')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <FileText size={15} />
                </div>
                <p className="text-xs font-bold text-slate-800">Applications</p>
                <p className="text-[10px] text-slate-400">Review & approve</p>
              </button>

              <button
                type="button"
                onClick={onOpenNewNotice}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Bell size={15} />
                </div>
                <p className="text-xs font-bold text-slate-800">Add Notice</p>
                <p className="text-[10px] text-slate-400">Post & popup</p>
              </button>

              <button
                type="button"
                onClick={onOpenNewEvent}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Calendar size={15} />
                </div>
                <p className="text-xs font-bold text-slate-800">Add Event</p>
                <p className="text-[10px] text-slate-400">Schedule calendar</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Award size={15} />
                </div>
                <p className="text-xs font-bold text-slate-800">Reports</p>
                <p className="text-[10px] text-slate-400">PDF & CSV export</p>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>Database Status</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
