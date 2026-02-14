const { calculatePlanEndDate } = require('../src/utils/dateUtils');

const testCases = [
    { months: 1, expectedDays: 30, description: '1 Month' },
    { months: 6, expectedDays: 180, description: '6 Months' }, // Approx
    { months: 0.066, expectedDays: 2, description: 'Free Trial (0.066 months)' },
];

console.log('--- Testing calculatePlanEndDate re-run ---');

testCases.forEach(({ months, description }) => {
    const startDate = new Date();
    const endDate = calculatePlanEndDate(startDate, months);

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(`\nTest Case: ${description}`);
    console.log(`Duration: ${months} months`);
    console.log(`Start Date: ${startDate.toISOString()}`);
    console.log(`End Date:   ${endDate.toISOString()}`);
    console.log(`Difference in Days: ${diffDays}`);
});

console.log('\n--- End of Test ---');
