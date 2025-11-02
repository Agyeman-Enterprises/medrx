// Timezone Availability Logic - UPDATED
// Provider is in Guam (ChST UTC+10), Available: Tuesday-Saturday, 9 AM - 4 PM ChST
// Lunch break: 12 PM - 1 PM ChST (blocked)
// This translates to Monday-Friday in Hawaii/California markets

import { format, parse } from 'date-fns';

// Timezone mappings
export const TIMEZONES = {
  GUAM: 'Pacific/Guam',
  HAWAII: 'Pacific/Honolulu',
  CALIFORNIA: 'America/Los_Angeles'
};

// Provider availability days (0=Sunday, 1=Monday, etc.)
// Tuesday-Saturday in Guam = Monday-Friday in HI/CA (due to timezone difference)
export const AVAILABLE_DAYS = [2, 3, 4, 5, 6]; // Tuesday-Saturday in Guam

// Timezone-specific booking windows
// Guam hours: 9 AM - 4 PM Tuesday-Saturday (with 12-1 PM lunch break)
export const TIMEZONE_WINDOWS = {
  [TIMEZONES.CALIFORNIA]: {
    // CA is ~18 hours behind Guam
    // Guam 9 AM Tue = CA 3 PM Mon
    // Guam 4 PM = CA 10 PM
    // Note: 12-1 PM Guam = 6-7 PM CA (lunch blocked)
    startHour: 15, // 3 PM CA time (Guam 9 AM)
    endHour: 22,   // 10 PM CA time (Guam 4 PM)
    lunchStartHour: 18, // 6 PM CA (Guam 12 PM)
    lunchEndHour: 19,   // 7 PM CA (Guam 1 PM)
    label: 'California (Available 3 PM - 10 PM)',
    guamEquivalent: 'Guam 9 AM - 4 PM (lunch 12-1 PM)'
  },
  [TIMEZONES.HAWAII]: {
    // HI is 20 hours behind Guam
    // Guam 9 AM Tue = HI 1 PM Mon
    // Guam 4 PM = HI 8 PM
    // Note: 12-1 PM Guam = 4-5 PM HI (lunch blocked)
    startHour: 13, // 1 PM HI time (Guam 9 AM)
    endHour: 20,   // 8 PM HI time (Guam 4 PM)
    lunchStartHour: 16, // 4 PM HI (Guam 12 PM)
    lunchEndHour: 17,   // 5 PM HI (Guam 1 PM)
    label: 'Hawaii (Available 1 PM - 8 PM)',
    guamEquivalent: 'Guam 9 AM - 4 PM (lunch 12-1 PM)'
  },
  [TIMEZONES.GUAM]: {
    // Guam patients see 9 AM - 4 PM with lunch break
    startHour: 9,  // 9 AM Guam time
    endHour: 16,   // 4 PM Guam time
    lunchStartHour: 12, // 12 PM Guam
    lunchEndHour: 13,   // 1 PM Guam
    label: 'Guam (Available 9 AM - 4 PM)',
    guamEquivalent: 'Full availability (lunch 12-1 PM)'
  }
};

/**
 * Get available time slots for a date in patient's timezone
 */
export const getAvailableSlotsForTimezone = (date, patientTimezone) => {
  if (!date || !patientTimezone) return [];
  
  const slots = [];
  const dayOfWeek = date.getDay();
  
  // Check if this day is available (Tuesday-Saturday in Guam)
  if (!AVAILABLE_DAYS.includes(dayOfWeek)) {
    return [];
  }
  
  const window = TIMEZONE_WINDOWS[patientTimezone];
  if (!window) {
    console.error('Unknown timezone:', patientTimezone);
    return [];
  }
  
  // Generate 30-minute slots within the available window, excluding lunch break
  for (let hour = window.startHour; hour < window.endHour; hour++) {
    // Skip lunch hour (12-1 PM in respective timezone)
    if (hour >= window.lunchStartHour && hour < window.lunchEndHour) {
      continue;
    }
    
    for (let minute of [0, 30]) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      try {
        const timeObj = parse(timeString, 'HH:mm', new Date());
        const displayString = format(timeObj, 'h:mm a');
        
        slots.push({
          time: timeString,
          display: displayString,
          guamTime: window.guamEquivalent
        });
      } catch (error) {
        console.error('Error formatting time:', timeString, error);
      }
    }
  }
  
  return slots;
};

/**
 * Get timezone label with availability window
 */
export const getTimezoneLabel = (timezone) => {
  const window = TIMEZONE_WINDOWS[timezone];
  return window ? window.label : timezone;
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
  TIMEZONE_WINDOWS,
  AVAILABLE_DAYS,
  getAvailableSlotsForTimezone,
  getTimezoneLabel,
  isTimeSlotAvailable
};
