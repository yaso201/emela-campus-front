// frontend/src/utils/planning.js
// Helpers purs pour le planning — formatage, groupage, état des séances.

/** Format a Date object as YYYY-MM-DD in LOCAL timezone (not UTC).
 *  Fixes: UTC ISO date conversion can be off-by-one
 *  in timezones ahead of UTC (e.g. Africa/Porto-Novo UTC+1, Europe/Paris UTC+2).
 */
export function toLocalIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function sessionDate(session) {
  return session?.date || session?.schedule_date || null;
}

export function normalizePlanningSession(session = {}) {
  const date = sessionDate(session);
  const title = session.title || session.course_name || session.course || 'Séance';
  const status = session.status || session.custom_planning_status || session.custom_status || 'Planifié';

  return {
    ...session,
    date,
    schedule_date: session.schedule_date || date,
    title,
    course_name: session.course_name || title,
    subtitle: session.subtitle || session.student_group || session.instructor_name || '',
    status,
    custom_planning_status: session.custom_planning_status || status,
  };
}

export function isCancelledStatus(status) {
  const value = String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return ['annule', 'cancelled', 'canceled'].includes(value);
}

export function timeToMinutes(time, fallback = 0) {
  if (!time) return fallback;
  const [hours, minutes] = String(time).split(':').map(Number);
  if (!Number.isFinite(hours)) return fallback;
  return (hours * 60) + (Number.isFinite(minutes) ? minutes : 0);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function sessionDurationMinutes(session, fallback = 60) {
  const start = timeToMinutes(session?.from_time, null);
  const end = timeToMinutes(session?.to_time, null);
  if (start === null || end === null || end <= start) return fallback;
  return end - start;
}

export function buildSessionOverlapLayout(sessions) {
  const items = sessions
    .map((session, index) => {
      const normalized = normalizePlanningSession(session);
      const start = timeToMinutes(normalized.from_time, 0);
      const end = start + sessionDurationMinutes(normalized, 60);
      return {
        session: normalized,
        start,
        end,
        index,
        columnIndex: 0,
        columnCount: 1,
      };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end || a.index - b.index);

  const clusters = [];
  let current = [];
  let clusterEnd = -Infinity;

  for (const item of items) {
    if (current.length > 0 && item.start >= clusterEnd) {
      clusters.push(current);
      current = [];
      clusterEnd = -Infinity;
    }
    current.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (current.length > 0) clusters.push(current);

  for (const cluster of clusters) {
    const columnEnds = [];
    for (const item of cluster) {
      let columnIndex = columnEnds.findIndex((end) => item.start >= end);
      if (columnIndex === -1) columnIndex = columnEnds.length;
      columnEnds[columnIndex] = item.end;
      item.columnIndex = columnIndex;
    }
    const columnCount = Math.max(columnEnds.length, 1);
    for (const item of cluster) {
      item.columnCount = columnCount;
    }
  }

  return items.sort((a, b) => a.index - b.index);
}

/** Format "14:00 – 16:00" from from_time/to_time strings */
export function formatTimeRange(session) {
  const from = session.from_time ? session.from_time.slice(0, 5) : '';
  const to = session.to_time ? session.to_time.slice(0, 5) : '';
  if (from && to) return `${from} – ${to}`;
  return from || to || '';
}

/** Parse "YYYY-MM-DD" + "HH:MM:SS" into a Date object */
export function sessionStart(session) {
  const date = sessionDate(session);
  if (!date) return null;
  const time = session.from_time || '00:00:00';
  return new Date(`${date}T${time}`);
}

export function sessionEnd(session) {
  const date = sessionDate(session);
  if (!date) return null;
  const time = session.to_time || '23:59:59';
  return new Date(`${date}T${time}`);
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

export function getSessionVisualState(session, now = new Date()) {
  const normalized = normalizePlanningSession(session);
  if (isCancelledStatus(normalized.status)) return 'cancelled';
  return getSessionState(normalized, now);
}

/** Group sessions by day (YYYY-MM-DD key), sorted chronologically */
export function groupByDay(sessions) {
  const groups = new Map();
  for (const s of sessions) {
    const normalized = normalizePlanningSession(s);
    if (!normalized.date) continue;
    if (!groups.has(normalized.date)) groups.set(normalized.date, []);
    groups.get(normalized.date).push(normalized);
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

/** Get start of week (Monday) for a given date — ISO string YYYY-MM-DD */
export function getWeekStart(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  const day = d.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalIsoDate(d);
}

/** Get end of week (Sunday) */
export function getWeekEnd(isoDate) {
  const d = new Date(getWeekStart(isoDate) + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return toLocalIsoDate(d);
}

export function getWeekDays(isoDate) {
  const start = getWeekStart(isoDate);
  const todayIso = toLocalIsoDate(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const iso = addDaysIso(start, index);
    const d = new Date(`${iso}T00:00:00`);
    return {
      iso,
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: iso === todayIso,
      isWeekend: index >= 5,
    };
  });
}

/** Add days to ISO date */
export function addDaysIso(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalIsoDate(d);
}

/** Get first day of month (ISO) */
export function getMonthStart(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(1);
  return toLocalIsoDate(d);
}

/** Get last day of month (ISO) */
export function getMonthEnd(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setMonth(d.getMonth() + 1, 0);
  return toLocalIsoDate(d);
}

export function getMonthGridDays(isoDate) {
  const monthStart = getMonthStart(isoDate);
  const start = new Date(monthStart + 'T00:00:00');
  const dayOfWeek = start.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(start.getDate() - daysFromMonday);

  const monthStartDate = new Date(monthStart + 'T00:00:00');
  const todayIso = toLocalIsoDate(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const iso = toLocalIsoDate(current);
    const dayIndex = index % 7;
    return {
      iso,
      day: current.getDate(),
      inCurrentMonth: current.getMonth() === monthStartDate.getMonth(),
      isToday: iso === todayIso,
      isWeekend: dayIndex >= 5,
    };
  });
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
