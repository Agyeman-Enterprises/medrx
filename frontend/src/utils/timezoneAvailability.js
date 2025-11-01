// Timezone Availability Logic
// Provider is in Guam (ChST UTC+10)
// Available: Tuesday-Sunday, 8 AM - 10 PM ChST

import { addHours, format, parse, isWithinInterval, startOfDay, addDays } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// Timezone mappings
export const TIMEZONES = {
  GUAM: 'Pacific/Guam',       // ChST UTC+10
  HAWAII: 'Pacific/Honolulu',  // HST UTC-10
  CALIFORNIA: 'America/Los_Angeles'  // PST/PDT UTC-8/-7
};

// Provider availability in Guam time
export const PROVIDER_AVAILABILITY = {
  timezone: TIMEZONES.GUAM,
  daysOfWeek: [2, 3, 4, 5, 6, 0], // Tuesday(2) through Sunday(0)
  startHour: 8,  // 8 AM ChST
  endHour: 22,   // 10 PM ChST
  slotDuration: 30 // 30 minute slots
};

/**
 * Convert Guam availability to patient's timezone
 * Guam 8 AM ChST = California 2 PM previous day (PST) or 1 PM (PDT)
 * Guam 10 PM ChST = California 4 AM same day (PST) or 3 AM (PDT)
 */
export const getAvailableSlotsForTimezone = (date, patientTimezone) => {
  const slots = [];
  
  // Check if date is available day in Guam
  const guamDate = utcToZonedTime(date, TIMEZONES.GUAM);
  const guamDayOfWeek = guamDate.getDay();
  
  // Skip if not an available day (Monday is 1, not available)
  if (!PROVIDER_AVAILABILITY.daysOfWeek.includes(guamDayOfWeek)) {
    return [];
  }
  
  // Generate slots for this day in Guam time
  for (let hour = PROVIDER_AVAILABILITY.startHour; hour < PROVIDER_AVAILABILITY.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += PROVIDER_AVAILABILITY.slotDuration) {
      // Create slot time in Guam timezone
      const guamSlotTime = new Date(guamDate);
      guamSlotTime.setHours(hour, minute, 0, 0);
      
      // Convert to patient's timezone
      const patientSlotTime = utcToZonedTime(
        zonedTimeToUtc(guamSlotTime, TIMEZONES.GUAM),
        patientTimezone
      );
      
      // Check if this slot falls on the selected date in patient's timezone
      if (format(patientSlotTime, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
        const timeString = format(patientSlotTime, 'HH:mm');
        const displayString = format(patientSlotTime, 'h:mm a');
        
        slots.push({
          time: timeString,
          display: displayString,
          guamTime: format(guamSlotTime, 'h:mm a') + ' ChST',
          date: patientSlotTime
        });
      }
    }
  }
  
  return slots;
};

/**
 * Get timezone label with offset
 */
export const getTimezoneLabel = (timezone) => {
  const labels = {
    [TIMEZONES.GUAM]: 'Guam (ChST, UTC+10)',
    [TIMEZONES.HAWAII]: 'Hawaii (HST, UTC-10)',
    [TIMEZONES.CALIFORNIA]: 'California (PST/PDT)'
  };
  return labels[timezone] || timezone;
};

/**
 * Check if a specific datetime is available
 * Used for DrChrono calendar integration
 */
export const isTimeSlotAvailable = (datetime, timezone) => {
  // Convert to Guam time
  const guamTime = utcToZonedTime(
    zonedTimeToUtc(datetime, timezone),
    TIMEZONES.GUAM
  );
  
  const dayOfWeek = guamTime.getDay();
  const hour = guamTime.getHours();
  
  // Check if day is available
  if (!PROVIDER_AVAILABILITY.daysOfWeek.includes(dayOfWeek)) {
    return false;
  }
  
  // Check if hour is within availability
  if (hour < PROVIDER_AVAILABILITY.startHour || hour >= PROVIDER_AVAILABILITY.endHour) {
    return false;
  }
  
  return true;
};

/**
 * Get available dates for the next 30 days
 */
export const getAvailableDates = (timezone) => {
  const availableDates = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const checkDate = addDays(today, i);
    const slots = getAvailableSlotsForTimezone(checkDate, timezone);
    
    if (slots.length > 0) {
      availableDates.push({
        date: checkDate,
        slotsCount: slots.length
      });
    }
  }
  
  return availableDates;
};

export default {
  TIMEZONES,
  PROVIDER_AVAILABILITY,
  getAvailableSlotsForTimezone,
  getTimezoneLabel,
  isTimeSlotAvailable,
  getAvailableDates
};
