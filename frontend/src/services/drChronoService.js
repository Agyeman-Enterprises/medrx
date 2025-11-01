import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * DrChrono Calendar Integration Service
 * Checks provider availability before booking
 */

export const drChronoService = {
  /**
   * Check if provider is available at given time
   * @param {Date} datetime - Requested appointment datetime
   * @param {string} timezone - Patient timezone
   * @returns {Promise<{available: boolean, conflicts: Array}>}
   */
  async checkAvailability(datetime, timezone) {
    try {
      const response = await axios.post(`${API}/drchrono/check-availability`, {
        datetime: datetime.toISOString(),
        timezone,
        duration: 30 // 30 minute appointment
      });
      
      return {
        available: response.data.available,
        conflicts: response.data.conflicts || []
      };
    } catch (error) {
      console.error('DrChrono availability check failed:', error);
      // Return true by default if check fails (graceful degradation)
      return {
        available: true,
        conflicts: [],
        error: error.message
      };
    }
  },

  /**
   * Get provider's busy times for a date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>} Array of busy time slots
   */
  async getBusyTimes(startDate, endDate) {
    try {
      const response = await axios.get(`${API}/drchrono/busy-times`, {
        params: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      });
      
      return response.data.busy_times || [];
    } catch (error) {
      console.error('Failed to fetch busy times:', error);
      return [];
    }
  },

  /**
   * Get DrChrono calendar URL (iframe)
   * @returns {string} Calendar URL from environment
   */
  getCalendarUrl() {
    // This is the ICS calendar link - can be used to display in app
    return process.env.REACT_APP_DRCHRONO_CALENDAR_LINK;
  }
};

export default drChronoService;
