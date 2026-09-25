import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import {
  Settings,
  Shield,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AdminSettings = () => {
  const [settings, setSettings] = useState(() => settingsService.getSettings());
  const { success, warning } = useToast();

  const handleToggle = (key) => {
    const updated = {
      ...settings,
      securityDefaults: {
        ...settings.securityDefaults,
        [key]: !settings.securityDefaults?.[key],
      },
    };
    setSettings(updated);
    settingsService.updateSettings(updated);
    success('Setting Updated', 'New assessment deterrent policy applied.');
  };

  const handleLimitChange = (val) => {
    const updated = {
      ...settings,
      securityDefaults: {
        ...settings.securityDefaults,
        warningLimit: parseInt(val, 10),
      },
    };
    setSettings(updated);
    settingsService.updateSettings(updated);
    success('Updated', `Tab warning limit set to ${val}.`);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Reset platform to default seed data? All custom courses, questions, and student attempts created in this browser session will be restored to clean demo fixtures.'
      )
    ) {
      settingsService.resetAllData();
      setSettings(settingsService.getSettings());
      success('Platform Reset', 'Demo data reseeded successfully.');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const sec = settings.securityDefaults || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">System Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure default anti-cheat exam deterrent policies, warning thresholds, and storage fixtures.
        </p>
      </div>

      {/* Security Reality Notice (Prompt Section 64) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-amber-300 block">Assessment Security Reality & Architecture Scope</strong>
          <p className="text-amber-200/90 leading-relaxed">
            The exam environment implements strict browser-level deterrents (clipboard locking, context menu suppression, fullscreen listeners, and Page Visibility tab tracking). These mechanisms discourage casual search lookups and accidental window switching.
          </p>
        </div>
      </div>

      {/* Security Deterrents Panel (Prompt Section 67) */}
      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Default Quiz Security Deterrents
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These defaults are automatically applied when new weekly assessments are created.
            </p>
          </div>
          <Badge variant="cyan">Policies Active</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'disableCopy', label: 'Disable Copy Events', desc: 'Prevents text copying from questions' },
            { key: 'disableCut', label: 'Disable Cut Events', desc: 'Blocks cut interactions' },
            { key: 'disablePaste', label: 'Disable Paste Events', desc: 'Prevents clipboard injection' },
            { key: 'disableSelection', label: 'Disable Text Selection', desc: 'Applies user-select: none' },
            { key: 'disableContextMenu', label: 'Disable Right-Click', desc: 'Suppresses context menu in quiz' },
            { key: 'requireFullscreen', label: 'Require Fullscreen Mode', desc: 'Prompts fullscreen mode before start' },
            { key: 'tabDetection', label: 'Tab Switch Detection', desc: 'Monitors visibility change' },
            { key: 'autoSubmitOnViolations', label: 'Auto-Submit on Violations', desc: 'Forces submission when warnings exceeded' },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key)}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer select-none transition-colors"
            >
              <div>
                <strong className="text-xs font-semibold text-white block">{item.label}</strong>
                <span className="text-[11px] text-slate-400">{item.desc}</span>
              </div>
              <button
                type="button"
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  sec[item.key] ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    sec[item.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 max-w-xs">
          <Select
            label="Tab Violation Warning Limit"
            value={sec.warningLimit || 3}
            onChange={(e) => handleLimitChange(e.target.value)}
            options={[
              { value: '1', label: '1 Warning (Strict)' },
              { value: '2', label: '2 Warnings' },
              { value: '3', label: '3 Warnings (Standard Default)' },
              { value: '5', label: '5 Warnings (Lenient)' },
            ]}
          />
        </div>
      </Card>

      {/* Demo Reset Panel */}
      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            Storage & Demo Data Management
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Need a clean slate? Reset all courses, questions, students, and quiz attempts back to default factory seed data.
          </p>
        </div>

        <div className="pt-2">
          <Button variant="danger" size="md" icon={RotateCcw} onClick={handleResetData}>
            Reset All Platform Demo Data
          </Button>
        </div>
      </Card>
    </div>
  );
};
