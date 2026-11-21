'use client';

import { useState, useEffect } from 'react';
import { BellRing, ArrowRight } from 'lucide-react';

function getLocalTodayIso(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export default function AthleteWellnessReminderBanner({
  wellnessLogs,
  onLogClick,
}: {
  wellnessLogs: any[];
  onLogClick: () => void;
}) {
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const isAfter10Am = now.getHours() >= 10;
      const todayStr = getLocalTodayIso();
      const hasLoggedToday = wellnessLogs.some((w) => w.log_date === todayStr);
      setShowReminder(isAfter10Am && !hasLoggedToday);
    };

    checkStatus();
    const timer = setInterval(checkStatus, 60000);
    return () => clearInterval(timer);
  }, [wellnessLogs]);

  if (!showReminder) return null;

  return (
    <div className="bg-amber-950/60 border border-amber-500/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
          <BellRing className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <strong className="text-sm text-amber-300 block">
            Daily Wellness Check-In Reminder (10:00 AM+)
          </strong>
          <span className="text-slate-200">
            You haven&apos;t submitted your morning readiness &amp; soreness check-in for today yet.
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogClick}
        className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3.5 py-2 rounded-lg transition"
      >
        Log Wellness Now <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
