// Timezone Availability Logic - SIMPLIFIED
// Provider is in Guam (ChST UTC+10), Available: Tuesday-Sunday, 8 AM - 10 PM ChST
// Patients can only book 10 AM - 10 PM THEIR local time

import { format, parse } from 'date-fns';

// Timezone mappings
export const TIMEZONES = {
  GUAM: 'Pacific/Guam',
  HAWAII: 'Pacific/Honolulu',
  CALIFORNIA: 'America/Los_Angeles'
};

// Provider availability days (0=Sunday, 1=Monday, etc.)
export const AVAILABLE_DAYS = [0, 2, 3, 4, 5, 6]; // Tuesday-Sunday (Monday=1 is excluded)

/**
 * Calculate available time windows for each timezone
 * Shows intersection of provider Guam hours AND patient local 10 AM-10 PM window
 */
export const TIMEZONE_WINDOWS = {
  [TIMEZONES.CALIFORNIA]: {
    // California is 18 hours behind Guam (PST) or 17 hours (PDT)
    // Guam 8 AM = CA 2 PM previous day
    // Guam 4 PM = CA 10 PM (CA cutoff)
    // Available: CA 2 PM - 10 PM = Guam 8 AM - 4 PM
    localStartHour: 14, // 2 PM California time
    localEndHour: 22,   // 10 PM California time
    guamStartHour: 8,   // Corresponds to Guam 8 AM
    guamEndHour: 16,    // Corresponds to Guam 4 PM
    label: 'California (PST/PDT)',
    offset: -18 // Approximate (varies with DST)
  },
  [TIMEZONES.HAWAII]: {
    // Hawaii is 20 hours behind Guam
    // Guam 8 AM = HI 12 PM noon previous day
    // Guam 6 PM = HI 10 PM (HI cutoff)
    // Available: HI 12 PM - 10 PM = Guam 8 AM - 6 PM
    localStartHour: 12, // 12 PM Hawaii time
    localEndHour: 22,   // 10 PM Hawaii time
    guamStartHour: 8,   // Corresponds to Guam 8 AM
    guamEndHour: 18,    // Corresponds to Guam 6 PM
    label: 'Hawaii (HST)',
    offset: -20
  },
  [TIMEZONES.GUAM]: {
    // Guam patients see full availability
    localStartHour: 8,  // 8 AM Guam time
    localEndHour: 22,   // 10 PM Guam time
    guamStartHour: 8,
    guamEndHour: 22,
    label: 'Guam (ChST)',
    offset: 0
  }
};

/**
 * Get available time slots for a specific date and timezone
 * Returns slots in patient's local time that fit BOTH constraints
 */
export const getAvailableSlotsForTimezone = (date, patientTimezone) => {
  const slots = [];
  const window = TIMEZONE_WINDOWS[patientTimezone];
  
  if (!window) {
    console.error('Unknown timezone:', patientTimezone);
    return [];
  }
  
  // Check if this is an available day (check in Guam time logic)
  const dayOfWeek = date.getDay();
  
  // Simple check: assume same day for now (proper implementation would convert)
  if (!PROVIDER_AVAILABILITY.daysOfWeek.includes(dayOfWeek)) {
    return [];
  }
  
  // Generate slots based on the intersection window
  // Use the local time window that maps to Guam availability
  for (let hour = window.localStartHour; hour < window.localEndHour; hour++) {
    for (let minute = 0; minute < 60; minute += PROVIDER_AVAILABILITY.slotDuration) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayString = format(
        parse(timeString, 'HH:mm', date),
        'h:mm a'
      );
      
      // Calculate corresponding Guam time for display
      const guamHour = hour - window.offset;
      const guamTimeString = `${guamHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const guamDisplay = format(
        parse(guamTimeString, 'HH:mm', date),
        'h:mm a'
      ) + ' ChST';
      
      slots.push({
        time: timeString,
        display: displayString,
        guamTime: guamDisplay,
        date: date
      });
    }
  }
  
  return slots;
};

/**
 * Get timezone label with booking window info
 */
export const getTimezoneLabel = (timezone) => {
  const window = TIMEZONE_WINDOWS[timezone];
  if (!window) return timezone;
  
  const startTime = format(parse(`${window.localStartHour}:00`, 'HH:mm', new Date()), 'h a');
  const endTime = format(parse(`${window.localEndHour}:00`, 'HH:mm', new Date()), 'h a');
  
  return `${window.label} (Available: ${startTime} - ${endTime})`;
};

/**
 * Check if a specific datetime is available
 */
export const isTimeSlotAvailable = (datetime, timezone) => {
  if (!datetime || !timezone) return false;
  
  const dayOfWeek = datetime.getDay();
  const hour = datetime.getHours();
  
  // Check if day is available (Monday closed)
  if (!AVAILABLE_DAYS.includes(dayOfWeek)) {
    return false;
  }
  
  const window = TIMEZONE_WINDOWS[timezone];
  if (!window) return false;
  
  // Check if hour is within available window
  return hour >= window.startHour && hour < window.endHour;
};

export default {
  TIMEZONES,
  PROVIDER_AVAILABILITY,
  TIMEZONE_WINDOWS,
  getAvailableSlotsForTimezone,
  getTimezoneLabel,
  isTimeSlotAvailable
};
