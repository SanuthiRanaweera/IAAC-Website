import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Shield, Key, Bell, Check, RefreshCw, 
  Database, Info, AlertTriangle, Sparkles, ExternalLink
} from 'lucide-react';

export default function AdminSettings({
  user,
  onRefresh,
}) {
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem('iaac_admin_prefs');
      return stored ? JSON.parse(stored) : {
        defaultTab: 'dashboard',
        compactDensity: false,
        soundAlerts: true,
        emailNotifications: true,
      };
    } catch {
      return {
        defaultTab: 'dashboard',
        compactDensity: false,
        soundAlerts: true,
        emailNotifications: true,
      };
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = () => {
    try {
      localStorage.setItem('iaac_admin_prefs', JSON.stringify(preferences));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h3 className="font-bold text-slate-900 text-lg">System & Administrator Settings</h3>
        <p className="text-xs text-slate-400">Manage administrator profile, security parameters, and portal preferences</p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          <span>Dashboard preferences saved successfully!</span>
        </div>
      )}

      {/* Admin Profile Details */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User size={18} className="text-blue-600" />
          <h4 className="font-bold text-slate-900 text-sm">Administrator Profile</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Admin Name
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
              {user?.name || 'Administrator'}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Authorized Email
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
              {user?.email || 'admin@iaaccampus.com'}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Security Role
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-blue-700 flex items-center gap-1.5">
              <Shield size={14} className="text-blue-600" />
              <span>{user?.role === 'admin' ? 'Super Administrator (Full Privileges)' : 'Staff Admin'}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Authentication Scheme
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              JWT Bearer (1-Day Sliding Expiry)
            </div>
          </div>
        </div>
      </div>

      {/* Security & Credentials Notice (Phase 13 requirement) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Key size={18} className="text-amber-500" />
          <h4 className="font-bold text-slate-900 text-sm">Security & Credential Management</h4>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>Environment-Level Authentication Protection</span>
          </div>
          <p className="leading-relaxed">
            IAAC administrator credentials (<code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 font-mono text-[11px]">ADMIN_EMAIL</code>, <code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 font-mono text-[11px]">ADMIN_PASSWORD</code>, and <code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 font-mono text-[11px]">JWT_SECRET</code>) are managed directly on the backend server environment variables. This architecture ensures zero exposure of admin passwords to the database or client-side storage.
          </p>
          <p className="text-[11px] text-amber-800">
            To rotate the administrator password or email, update the corresponding values in <code className="font-mono font-bold">backend/.env</code> and restart the server.
          </p>
        </div>
      </div>

      {/* Dashboard Preferences */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Settings size={18} className="text-blue-600" />
          <h4 className="font-bold text-slate-900 text-sm">Portal Preferences</h4>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Default Landing View
            </label>
            <select
              value={preferences.defaultTab}
              onChange={(e) => setPreferences({ ...preferences, defaultTab: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none w-full sm:w-64"
            >
              <option value="dashboard">Dashboard Overview</option>
              <option value="applications">Applications Management</option>
              <option value="notices">Notices & Smart Popup</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>

          <div className="pt-2 space-y-2.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.compactDensity}
                onChange={(e) => setPreferences({ ...preferences, compactDensity: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="font-semibold text-slate-800">
                Compact Table Density (Show more rows per page with tighter spacing)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.soundAlerts}
                onChange={(e) => setPreferences({ ...preferences, soundAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="font-semibold text-slate-800">
                Sound Alerts on New Student Enrolment
              </span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Force Refresh All Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
