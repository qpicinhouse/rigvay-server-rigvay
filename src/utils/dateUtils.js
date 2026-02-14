/**
 * Calculates the plan end date based on duration in months.
 * Handles fractional months by converting them to days (assuming 30 days/month).
 * 
 * @param {Date} startDate - The start date of the plan
 * @param {number} durationMonths - Duration in months (can be fractional, e.g. 0.066)
 * @returns {Date} The calculated end date
 */
const calculatePlanEndDate = (startDate, durationMonths) => {
    const endDate = new Date(startDate);

    // Check if it's a whole number (integer)
    if (Number.isInteger(durationMonths)) {
        endDate.setMonth(endDate.getMonth() + durationMonths);
    } else {
        // For fractional months, convert to days (approx 30 days per month)
        // 0.066 months * 30 = ~1.98 days -> rounded to 2 days
        const days = Math.round(durationMonths * 30);
        endDate.setDate(endDate.getDate() + days);
    }

    return endDate;
};

module.exports = { calculatePlanEndDate };
