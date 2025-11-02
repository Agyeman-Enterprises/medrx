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
// These are the INTERSECTION of Guam 8AM-10PM and patient's local 10AM-10PM
export const TIMEZONE_WINDOWS = {
  [TIMEZONES.CALIFORNIA]: {
    // CA is ~18 hours behind Guam
    // Guam 8 AM = CA 2 PM previous day
    // Guam 4 PM = CA 10 PM (CA cutoff)
    startHour: 14, // 2 PM CA time
    endHour: 22,   // 10 PM CA time
    label: 'California (Available 2 PM - 10 PM)',
    guamEquivalent: 'Guam 8 AM - 4 PM'
  },
  [TIMEZONES.HAWAII]: {
    // HI is 20 hours behind Guam
    // Guam 8 AM = HI 12 PM noon previous day
    // Guam 6 PM = HI 10 PM (HI cutoff)
    startHour: 12, // 12 PM HI time
    endHour: 22,   // 10 PM HI time
    label: 'Hawaii (Available 12 PM - 10 PM)',
    guamEquivalent: 'Guam 8 AM - 6 PM'
  },
  [TIMEZONES.GUAM]: {
    // Guam patients see full availability
    startHour: 8,  // 8 AM Guam time
    endHour: 22,   // 10 PM Guam time
    label: 'Guam (Available 8 AM - 10 PM)',
    guamEquivalent: 'Full availability'
  }
};

/**
 * Get available time slots for a date in patient's timezone
 */
export const getAvailableSlotsForTimezone = (date, patientTimezone) => {
  if (!date || !patientTimezone) return [];
  
  const slots = [];
  const dayOfWeek = date.getDay();
  
  // Check if this day is available (Monday closed)
  if (!AVAILABLE_DAYS.includes(dayOfWeek)) {
    return [];
  }
  
  const window = TIMEZONE_WINDOWS[patientTimezone];
  if (!window) {
    console.error('Unknown timezone:', patientTimezone);
    return [];
  }
  
  // Generate 30-minute slots within the available window
  for (let hour = window.startHour; hour < window.endHour; hour++) {
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
