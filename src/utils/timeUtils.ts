/**
 * Calculates start and end times for a driving lesson based on:
 * - startTime string (e.g. "14:00" or "2" or "02:00")
 * - lessonCount (1 or 2)
 * - durationMinutes (e.g. 40)
 *
 * Example:
 * startTime "14:00", count 1, duration 40 => "מ-14:00 עד 14:40"
 * startTime "14:00", count 2, duration 40 => "מ-14:00 עד 15:20"
 */
export function calculateLessonTimeRange(
  rawStartTime: string | undefined,
  lessonCount: number,
  durationMinutes: number = 40
): { formattedRange: string; startFormatted: string; endFormatted: string } {
  if (!rawStartTime || !rawStartTime.trim()) {
    return {
      formattedRange: '',
      startFormatted: '',
      endFormatted: '',
    };
  }

  let str = rawStartTime.trim();
  let hours = 14;
  let minutes = 0;

  if (str.includes(':')) {
    const [hStr, mStr] = str.split(':');
    hours = parseInt(hStr, 10);
    minutes = parseInt(mStr, 10) || 0;
  } else {
    const parsed = parseInt(str, 10);
    if (!isNaN(parsed)) {
      // If user typed 1..7 (common afternoon driving hours in Israel), assume PM (13..19)
      if (parsed >= 1 && parsed <= 7) {
        hours = parsed + 12;
      } else {
        hours = parsed;
      }
    }
  }

  if (isNaN(hours) || hours < 0 || hours > 23) hours = 14;
  if (isNaN(minutes) || minutes < 0 || minutes > 59) minutes = 0;

  const totalLessonMinutes = (Number(lessonCount) || 1) * (Number(durationMinutes) || 40);

  const startTotalMinutes = hours * 60 + minutes;
  const endTotalMinutes = (startTotalMinutes + totalLessonMinutes) % 1440;

  const endHours = Math.floor(endTotalMinutes / 60);
  const endMinutes = endTotalMinutes % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const startFormatted = `${pad(hours)}:${pad(minutes)}`;
  const endFormatted = `${pad(endHours)}:${pad(endMinutes)}`;

  return {
    formattedRange: `מ-${startFormatted} עד ${endFormatted}`,
    startFormatted,
    endFormatted,
  };
}
