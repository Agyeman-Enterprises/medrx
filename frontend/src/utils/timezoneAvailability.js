// Timezone Availability Logic - UPDATED
// Provider is in Guam (ChST UTC+10), Available: 10 AM - 6 PM ChST
// Maximum booking time: 11 PM (2300h) in user's local timezone
// Available days: Tuesday-Saturday in Guam

import { format, parse } from 'date-fns';

// Timezone mappings
export const TIMEZONES = {
  GUAM: 'Pacific/Guam',
  HAWAII: 'Pacific/Honolulu',
  CALIFORNIA: 'America/Los_Angeles'
};

// Provider availability days (0=Sunday, 1=Monday, etc.)
// Tuesday-Saturday in Guam
export const AVAILABLE_DAYS = [2, 3, 4, 5, 6]; // Tuesday-Saturday in Guam

// Timezone-specific booking windows
// Guam hours: 10 AM - 6 PM ChST
// Maximum user time: 11 PM (2300h) in their timezone
export const TIMEZONE_WINDOWS = {
  [TIMEZONES.CALIFORNIA]: {
    // CA is 18 hours behind Guam (or 6 hours ahead, depending on DST)
    // Guam 10 AM ChST = CA 4 PM PDT / 5 PM PST
    // Guam 6 PM ChST = CA 12 AM PDT / 1 AM PST (next day)
    // But we cap at 11 PM (23:00) user time
    startHour: 16, // 4 PM CA time (Guam 10 AM), but adjust for DST
    endHour: 23,   // 11 PM CA time (max allowed, Guam would be 5 PM)
    maxUserHour: 23, // Maximum 11 PM user time
    label: 'California (Available 4 PM - 11 PM)',
    guamEquivalent: 'Guam 10 AM - 6 PM ChST'
  },
  [TIMEZONES.HAWAII]: {
    // HI is 20 hours behind Guam
    // Guam 10 AM ChST = HI 2 PM HST
    // Guam 6 PM ChST = HI 10 PM HST
    startHour: 14, // 2 PM HI time (Guam 10 AM)
    endHour: 23,   // 11 PM HI time (max allowed, Guam would be 5 PM)
    maxUserHour: 23, // Maximum 11 PM user time
    label: 'Hawaii (Available 2 PM - 11 PM)',
    guamEquivalent: 'Guam 10 AM - 6 PM ChST'
  },
  [TIMEZONES.GUAM]: {
    // Guam patients see 10 AM - 6 PM ChST
    startHour: 10,  // 10 AM Guam time
    endHour: 18,    // 6 PM Guam time
    maxUserHour: 18, // 6 PM is within max
    label: 'Guam (Available 10 AM - 6 PM)',
    guamEquivalent: 'Full availability (10 AM - 6 PM ChST)'
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
  
  // Generate 15-minute slots within the available window
  // Cap at maxUserHour (11 PM / 2300h) for user timezone
  const maxHour = Math.min(window.endHour, window.maxUserHour || 23);
  
  for (let hour = window.startHour; hour < maxHour; hour++) {
    // Don't go past 11 PM (23:00) in user timezone
    if (hour >= 23) {
      break;
    }
    
    for (let minute of [0, 15, 30, 45]) {
      // Don't create slots past 11 PM
      if (hour === 23 && minute > 0) {
        break;
      }
      
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
  
  // Check if day is available (Tuesday-Saturday in Guam)
  if (!AVAILABLE_DAYS.includes(dayOfWeek)) {
    return false;
  }
  
  const window = TIMEZONE_WINDOWS[timezone];
  if (!window) return false;
  
  // Check if hour is within lunch break
  if (hour >= window.lunchStartHour && hour < window.lunchEndHour) {
    return false;
  }
  
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
