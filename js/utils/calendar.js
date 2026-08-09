/**
 * Calendar (.ics) Export
 * Generate downloadable .ics files for reminders.
 */

/**
 * Generate an .ics file string for a reminder.
 * @param {object} options
 * @param {string} options.title - Event title
 * @param {string} options.description - Event description
 * @param {Date} options.startDate - Start date
 * @param {number} options.durationDays - Duration in days (default 1)
 * @param {string} options.location - Optional location
 * @returns {string} ICS content
 */
export function generateICS({ title, description = '', startDate, durationDays = 1, location = '' }) {
  const dtStart = formatDateICS(startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  const dtEnd = formatDateICS(endDate);
  const now = formatDateICS(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MeroKagaj//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `DTSTAMP:${now}`,
    `UID:${generateUID()}@merokagaj`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : '',
    location ? `LOCATION:${escapeICS(location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

/**
 * Download an .ics file.
 */
export function downloadICS(filename, icsContent) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'reminder.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create a reminder for a service (e.g., passport expiry, license renewal).
 */
export function createServiceReminder(serviceName, reminderDate, notes = '') {
  const ics = generateICS({
    title: `Reminder: ${serviceName}`,
    description: notes || `Time to check/renew your ${serviceName}. Visit MeroKagaj for latest requirements.`,
    startDate: reminderDate,
    durationDays: 1,
  });
  downloadICS(`${serviceName.replace(/\s+/g, '-').toLowerCase()}-reminder.ics`, ics);
}

function formatDateICS(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function escapeICS(str) {
  return str.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
}

function generateUID() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
