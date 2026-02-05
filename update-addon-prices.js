const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const PublisherSchema = new mongoose.Schema({}, { strict: false });
const Publisher = mongoose.model('Publisher', PublisherSchema, 'publishers');

const DEFAULT_ADDON_PRICES = {
  backdating: 5000, // ₦5k
  socialPosting: 10000, // ₦10k
  featuredPlacement: 15000, // ₦15k per unit
  newsletterInclusion: 8000, // ₦8k
  authorByline: 3000, // ₦3k
  paidAmplification: {
    minBudget: 25000, // ₦25k
    maxBudget: 250000 // ₦250k
  },
  whitePaperGating: 12000 // ₦12k
};

async function updateAddonPrices() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('🔌 Connecting to MongoDB...');
    console.log(`📍 URI: ${mongoUri ? mongoUri.substring(0, 50) + '...' : 'Not found'}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all publishers
    const publishers = await Publisher.find({});
    console.log(`Found ${publishers.length} publishers\n`);

    let updated = 0;
    for (const publisher of publishers) {
      if (!publisher.addOns) {
        publisher.addOns = {};
      }

      // Update each addon with default prices
      publisher.addOns.backdating = {
        enabled: publisher.addOns.backdating?.enabled || false,
        price: publisher.addOns.backdating?.price || DEFAULT_ADDON_PRICES.backdating
      };

      publisher.addOns.socialPosting = {
        enabled: publisher.addOns.socialPosting?.enabled || false,
        price: publisher.addOns.socialPosting?.price || DEFAULT_ADDON_PRICES.socialPosting
      };

      publisher.addOns.featuredPlacement = {
        enabled: publisher.addOns.featuredPlacement?.enabled || false,
        pricePerUnit: publisher.addOns.featuredPlacement?.pricePerUnit || DEFAULT_ADDON_PRICES.featuredPlacement,
        maxQuantity: publisher.addOns.featuredPlacement?.maxQuantity || 5
      };

      publisher.addOns.newsletterInclusion = {
        enabled: publisher.addOns.newsletterInclusion?.enabled || false,
        price: publisher.addOns.newsletterInclusion?.price || DEFAULT_ADDON_PRICES.newsletterInclusion
      };

      publisher.addOns.authorByline = {
        enabled: publisher.addOns.authorByline?.enabled || false,
        price: publisher.addOns.authorByline?.price || DEFAULT_ADDON_PRICES.authorByline
      };

      publisher.addOns.paidAmplification = {
        enabled: publisher.addOns.paidAmplification?.enabled || false,
        minBudget: publisher.addOns.paidAmplification?.minBudget || DEFAULT_ADDON_PRICES.paidAmplification.minBudget,
        maxBudget: publisher.addOns.paidAmplification?.maxBudget || DEFAULT_ADDON_PRICES.paidAmplification.maxBudget
      };

      publisher.addOns.whitePaperGating = {
        enabled: publisher.addOns.whitePaperGating?.enabled || false,
        price: publisher.addOns.whitePaperGating?.price || DEFAULT_ADDON_PRICES.whitePaperGating,
        leadGenEnabled: publisher.addOns.whitePaperGating?.leadGenEnabled || false
      };

      await Publisher.findByIdAndUpdate(publisher._id, { addOns: publisher.addOns });
      console.log(`✅ Updated: ${publisher.name} (${publisher.publisherId})`);
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} publishers with addon prices`);
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateAddonPrices();
