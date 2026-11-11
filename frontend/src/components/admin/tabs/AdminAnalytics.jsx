import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, CheckCircle, Clock, Calendar, 
  Filter, RotateCcw, Award, Globe, Activity, ArrowUpRight
} from 'lucide-react';

export default function AdminAnalytics({
  applications = [],
  courses = [],
}) {
  const [dateRange, setDateRange] = useState('all'); // '30days', '6months', 'thisYear', 'all'
  const [courseFilter, setCourseFilter] = useState('all');
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);

  // Extract unique courses
  const uniqueCourses = useMemo(() => {
    const set = new Set();
    applications.forEach((a) => {
      const c = a.course || a.courseApplied || a.program;
      if (c) set.add(c.trim());
    });
    return Array.from(set).sort();
  }, [applications]);

  // Filtered dataset
  const filteredApps = useMemo(() => {
    const now = new Date();
    return applications.filter((app) => {
      if (!app.createdAt) return true;
      const d = new Date(app.createdAt);

      if (dateRange === '30days') {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        if (d < past) return false;
      } else if (dateRange === '6months') {
        const past = new Date();
        past.setMonth(past.getMonth() - 6);
        if (d < past) return false;
      } else if (dateRange === 'thisYear') {
        if (d.getFullYear() !== now.getFullYear()) return false;
      }

      if (courseFilter !== 'all') {
        const c = (app.course || app.courseApplied || app.program || '').trim();
        if (c !== courseFilter) return false;
      }

      return true;
    });
  }, [applications, dateRange, courseFilter]);

  // Overall metrics
  const total = filteredApps.length;
  const approved = filteredApps.filter((a) => a.isDone).length;
  const pending = filteredApps.filter((a) => !a.isDone).length;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const pendingRate = total > 0 ? 100 - approvalRate : 0;

  // Monthly breakdown for Trend Chart
  const monthlyTrends = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString('default', { month: 'short' });
      const yr = d.getFullYear();
      const m = d.getMonth();

      const count = filteredApps.filter((a) => {
        if (!a.createdAt) return false;
        const dt = new Date(a.createdAt);
        return dt.getFullYear() === yr && dt.getMonth() === m;
      }).length;

      months.push({ label: mLabel, count });
    }
    return months;
  }, [filteredApps]);

  const maxTrendVal = Math.max(...monthlyTrends.map((d) => d.count), 5);

  // Breakdown by Course
  const courseBreakdown = useMemo(() => {
    const map = {};
    filteredApps.forEach((a) => {
      const c = (a.course || a.courseApplied || a.program || 'Other / General').trim();
      map[c] = (map[c] || 0) + 1;
    });

    const list = Object.entries(map).map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    return list.sort((a, b) => b.count - a.count);
  }, [filteredApps, total]);

  // Breakdown by Campus / Academy
  const branchBreakdown = useMemo(() => {
    const map = {};
    filteredApps.forEach((a) => {
      const b = (a.academy || a.branch || 'IAAC City Academy').trim();
      map[b] = (map[b] || 0) + 1;
    });

    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [filteredApps, total]);

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Admission Analytics & Intelligence</h3>
          <p className="text-xs text-slate-400">Data-driven performance metrics derived from real database records</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none"
          >
            <option value="all">All-Time Data</option>
            <option value="thisYear">This Year ({new Date().getFullYear()})</option>
            <option value="6months">Past 6 Months</option>
            <option value="30days">Last 30 Days</option>
          </select>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none max-w-[180px] truncate"
          >
            <option value="all">All Courses</option>
            {uniqueCourses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(dateRange !== 'all' || courseFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setDateRange('all');
                setCourseFilter('all');
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Reset Filters"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Filtered Submissions
          </span>
          <div className="text-3xl font-extrabold text-slate-900">{total}</div>
          <p className="text-xs text-slate-500 mt-2">Applications within selected range</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Admission Approval Rate
          </span>
          <div className="text-3xl font-extrabold text-emerald-600">{approvalRate}%</div>
          <p className="text-xs text-slate-500 mt-2">{approved} students enrolled</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Pending Review Rate
          </span>
          <div className="text-3xl font-extrabold text-amber-600">{pendingRate}%</div>
          <p className="text-xs text-slate-500 mt-2">{pending} awaiting verification</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Most Popular Diploma
          </span>
          <div className="text-sm font-extrabold text-blue-700 truncate mt-1">
            {courseBreakdown[0]?.name || 'N/A'}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {courseBreakdown[0] ? `${courseBreakdown[0].count} applications (${courseBreakdown[0].pct}%)` : 'No data'}
          </p>
        </div>
      </div>

      {/* Charts Grid: Monthly Trend Line Chart & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Application Trend Progression
              </h3>
              <p className="text-xs text-slate-400">
                6-Month trajectory of incoming student enrolments
              </p>
            </div>
          </div>

          <div className="h-64 w-full relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="180" x2="500" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

              {(() => {
                const points = monthlyTrends.map((d, idx) => {
                  const x = (idx / (monthlyTrends.length - 1 || 1)) * 480 + 10;
                  const y = 180 - (d.count / (maxTrendVal || 1)) * 140;
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
                    <path d={areaD} fill="url(#analyticsGradient)" />
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
                        r={hoveredTrendIdx === idx ? 6 : 4}
                        className="fill-blue-600 stroke-white stroke-2 cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredTrendIdx(idx)}
                        onMouseLeave={() => setHoveredTrendIdx(null)}
                      />
                    ))}
                  </>
                );
              })()}
            </svg>

            {hoveredTrendIdx !== null && monthlyTrends[hoveredTrendIdx] && (
              <div
                className="absolute -top-3 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg pointer-events-none -translate-x-1/2 z-10 whitespace-nowrap"
                style={{
                  left: `${(hoveredTrendIdx / (monthlyTrends.length - 1 || 1)) * 96 + 2}%`,
                }}
              >
                <div className="font-bold">{monthlyTrends[hoveredTrendIdx].label}</div>
                <div className="text-blue-300">
                  {monthlyTrends[hoveredTrendIdx].count} Applications
                </div>
              </div>
            )}

            <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-3 px-2">
              {monthlyTrends.map((d, idx) => (
                <span key={idx}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Status Distribution Donut Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Status Distribution</h3>
            <p className="text-xs text-slate-400">Processed vs pending application volume</p>

            <div className="relative w-44 h-44 mx-auto my-6 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="38" fill="transparent" stroke="#10B981" strokeWidth="12"
                  strokeDasharray={`${(approvalRate * 238.7) / 100} 238.7`}
                  strokeDashoffset="0" strokeLinecap="round"
                />
                <circle
                  cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" strokeWidth="12"
                  strokeDasharray={`${((100 - approvalRate) * 238.7) / 100} 238.7`}
                  strokeDashoffset={`-${(approvalRate * 238.7) / 100}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">{total}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-900">Approved</span>
                </div>
                <span className="font-bold text-emerald-800">{approved} ({approvalRate}%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-semibold text-amber-900">Pending</span>
                </div>
                <span className="font-bold text-amber-800">{pending} ({pendingRate}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Breakdown Horizontal Bars & Campus Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Popularity Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Applications by Diploma Programme
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Breakdown across academic offerings
          </p>

          <div className="space-y-4">
            {courseBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No course data recorded yet.</p>
            ) : (
              courseBreakdown.slice(0, 6).map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[70%]">
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-700">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Campus & Web Analytics Integration Card */}
        <div className="space-y-6">
          {/* Campus Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Campus / Academy Allocation
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Geographic distribution of student applications
            </p>

            <div className="space-y-3">
              {branchBreakdown.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800 text-xs">{b.name}</span>
                  <span className="font-bold text-blue-700 text-xs bg-blue-50 px-2.5 py-1 rounded-lg">
                    {b.count} ({b.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Website Traffic Integration Setup Card (Phase 7 rule) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                <h4 className="font-bold text-sm">Website Traffic Analytics</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-300">
                Setup Required
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              External web traffic tracking (Google Analytics 4 / Cloudflare Web Analytics) can be connected by adding your Measurement ID in the website configuration. Once connected, visitor counts, referral channels, and pageviews will populate here automatically without mock data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
