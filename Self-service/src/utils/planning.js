// frontend/src/utils/planning.js
// Helpers purs pour le planning — formatage, groupage, état des séances.

/** Format "14:00 – 16:00" from from_time/to_time strings */
export function formatTimeRange(session) {
  const from = session.from_time ? session.from_time.slice(0, 5) : '';
  const to = session.to_time ? session.to_time.slice(0, 5) : '';
  if (from && to) return `${from} – ${to}`;
  return from || to || '';
}

/** Parse "YYYY-MM-DD" + "HH:MM:SS" into a Date object */
export function sessionStart(session) {
  if (!session.date) return null;
  const time = session.from_time || '00:00:00';
  return new Date(`${session.date}T${time}`);
}

export function sessionEnd(session) {
  if (!session.date) return null;
  const time = session.to_time || '23:59:59';
  return new Date(`${session.date}T${time}`);
}

/** Returns 'upcoming' | 'current' | 'past' for the session */
export function getSessionState(session, now = new Date()) {
  const start = sessionStart(session);
  const end = sessionEnd(session);
  if (!start || !end) return 'upcoming';
  if (now >= start && now <= end) return 'current';
  if (end < now) return 'past';
  return 'upcoming';
}

/** Group sessions by day (YYYY-MM-DD key), sorted chronologically */
export function groupByDay(sessions) {
  const groups = new Map();
  for (const s of sessions) {
    if (!s.date) continue;
    if (!groups.has(s.date)) groups.set(s.date, []);
    groups.get(s.date).push(s);
  }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([date, items]) => ({
    date,
    sessions: items.sort((a, b) => (a.from_time || '').localeCompare(b.from_time || '')),
  }));
}

/** Human-readable day label: "Aujourd'hui", "Demain", or "Mardi 15 avril" */
export function formatDayLabel(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Aujourd\'hui';
  if (sameDay(d, tomorrow)) return 'Demain';

  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Build time slots with gaps between sessions (pauses) — for PlanningDay */
export function buildDaySlots(sessions, dayStartHour = 8, dayEndHour = 18) {
  if (!sessions.length) return [];

  const sorted = [...sessions].sort((a, b) =>
    (a.from_time || '').localeCompare(b.from_time || ''),
  );

  const slots = [];
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    slots.push({ type: 'session', session: s });

    // Gap to next session ?
    if (i < sorted.length - 1) {
      const currentEnd = s.to_time || '';
      const nextStart = sorted[i + 1].from_time || '';
      if (currentEnd && nextStart && currentEnd < nextStart) {
        // Gap > 30 min ?
        const [h1, m1] = currentEnd.split(':').map(Number);
        const [h2, m2] = nextStart.split(':').map(Number);
        const gapMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (gapMinutes >= 30) {
          slots.push({
            type: 'break',
            from: currentEnd.slice(0, 5),
            to: nextStart.slice(0, 5),
            duration: gapMinutes,
          });
        }
      }
    }
  }
  return slots;
}

/** Get start of week (Monday) for a given date — ISO string YYYY-MM-DD */
export function getWeekStart(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  const day = d.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Get end of week (Sunday) */
export function getWeekEnd(isoDate) {
  const d = new Date(getWeekStart(isoDate) + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

/** Add days to ISO date */
export function addDaysIso(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Get first day of month (ISO) */
export function getMonthStart(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

/** Get last day of month (ISO) */
export function getMonthEnd(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

/** Format month label: "Avril 2026" */
export function formatMonthLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** Format week label: "14 – 20 avril 2026" */
export function formatWeekLabel(isoDate) {
  const start = new Date(getWeekStart(isoDate) + 'T00:00:00');
  const end = new Date(getWeekEnd(isoDate) + 'T00:00:00');
  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return `${startDay} – ${endDay} ${month}`;
}
