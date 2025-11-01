// Timezone Availability Logic
// Provider is in Guam (ChST UTC+10)
// Available: Tuesday-Sunday, 8 AM - 10 PM ChST
// Patients can only book 10 AM - 10 PM THEIR local time
// Show INTERSECTION of both windows

import { format, parse, addHours } from 'date-fns';

// Timezone mappings
export const TIMEZONES = {
  GUAM: 'Pacific/Guam',       // ChST UTC+10
  HAWAII: 'Pacific/Honolulu',  // HST UTC-10 (20 hours behind Guam)
  CALIFORNIA: 'America/Los_Angeles'  // PST/PDT UTC-8/-7 (18/17 hours behind Guam)
};

// Provider availability in Guam time
export const PROVIDER_AVAILABILITY = {
  timezone: TIMEZONES.GUAM,
  daysOfWeek: [2, 3, 4, 5, 6, 0], // Tuesday(2) through Sunday(0) - Monday closed
  startHour: 8,  // 8 AM ChST
  endHour: 22,   // 10 PM ChST
  slotDuration: 30 // 30 minute slots
};

// Patient booking windows (THEIR local time)
export const PATIENT_BOOKING_WINDOW = {
  startHour: 10,  // 10 AM local
  endHour: 22     // 10 PM local
};

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
  const hour = datetime.getHours();
  const dayOfWeek = datetime.getDay();
  const window = TIMEZONE_WINDOWS[timezone];
  
  if (!window) return false;
  
  // Check if day is available (Monday closed)
  if (!PROVIDER_AVAILABILITY.daysOfWeek.includes(dayOfWeek)) {
    return false;
  }
  
  // Check if hour is within the timezone's available window
  if (hour < window.localStartHour || hour >= window.localEndHour) {
    return false;
  }
  
  return true;
};

export default {
  TIMEZONES,
  PROVIDER_AVAILABILITY,
  TIMEZONE_WINDOWS,
  getAvailableSlotsForTimezone,
  getTimezoneLabel,
  isTimeSlotAvailable
};
