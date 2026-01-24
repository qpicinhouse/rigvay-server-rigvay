const mongoose = require('mongoose');
const Plan = require('../src/models/Plan.model');

require('dotenv').config({ path: '../.env' });

console.log('MONGO_URI:', process.env.MONGO_URI);


const plans = [
  {
    name: 'Starter',
    amount: 500,
    displayAmount: '$500 / Car',
    durationMonths: 1,
    carLimit: 1,
    unlimited: false,
    discount: 0,
    discountText: '0% OFF | 0% OFF | 0% OFF |',
    features: [
      'Validity : 1 Month',
      'Kick Starts Your Business',
      'Upgrade Plan For Benefits'
    ]
  },
  {
    name: 'Pro',
    amount: 5000,
    displayAmount: '$5000 / 1M',
    durationMonths: 1,
    carLimit: 5,
    unlimited: false,
    discount: 0,
    discountText: '0% OFF | 0% OFF | 0% OFF |',
    features: [
      'Validity : 1 Month',
      'Kick Starts Your Business',
      'Unlimited Car Listings'
    ]
  },
  {
    name: 'Max',
    amount: 10000,
    displayAmount: '$10000 / 4M',
    durationMonths: 4,
    carLimit: 20,
    unlimited: false,
    discount: 33,
    discountText: '33% OFF | 33% OFF | 33% OFF |',
    features: [
      'Validity : 4 Months',
      'Hassle free for a Quarter',
      'Unlimited Car Listings',
      'Seller Leads'
    ]
  },
  {
    name: 'Ultra',
    amount: 15000,
    displayAmount: '$15000 / 6M',
    durationMonths: 6,
    carLimit: 0,
    unlimited: true,
    discount: 50,
    discountText: '50% OFF | 50% OFF | 50% OFF |',
    features: [
      'Validity : 6 Months',
      'Hassle free for half a Year',
      'Unlimited Car Listings',
      'Seller Leads'
    ]
  },
  {
    name: 'Ultra Max',
    amount: 20000,
    displayAmount: '$20000 / 1Y',
    durationMonths: 12,
    carLimit: 0,
    unlimited: true,
    discount: 66,
    discountText: '66% OFF | 66% OFF | 66% OFF |',
    features: [
      'Validity : 12 Months',
      'Hassle free for a Year',
      'Unlimited Car Listings',
      'Seller Leads'
    ]
  },
  {
    name: 'Free Trial',
    amount: 0,
    displayAmount: 'Free / 48h',
    durationMonths: 0.066,
    carLimit: 1,
    unlimited: false,
    discount: 0,
    discountText: '0% OFF | 0% OFF | 0% OFF |',
    features: [
      'Validity : 48h',
      'Hassle free for few hours',
      '1 Car Listings',
    ]
  }
];

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Plan.deleteMany({});
    console.log('Cleared existing plans');

    await Plan.insertMany(plans);
    console.log('Plans seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  }
};

seedPlans();

