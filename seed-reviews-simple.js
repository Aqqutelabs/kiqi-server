const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Review } = require('./dist/src/models/Review');

async function seedSimpleReviews() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kiqi');

        // Read the simple test data
        const testData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'sample-data', 'review-test-data-simple.json'), 'utf8')
        );

        // Clear existing reviews
        await Review.deleteMany({});
        console.log('🧹 Cleared existing reviews');

        // Insert sample reviews
        const reviews = await Review.insertMany(testData.sampleReviews);
        console.log(`✅ Seeded ${reviews.length} reviews successfully`);

        // Calculate and display summary for first press release
        const pressReleaseId = testData.testData.pressReleaseIds[0];
        const verifiedReviews = await Review.find({
            press_release_id: pressReleaseId,
            status: 'verified'
        });

        if (verifiedReviews.length > 0) {
            const totalRating = verifiedReviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = (totalRating / verifiedReviews.length).toFixed(1);

            console.log(`\n📊 Summary for Press Release ${pressReleaseId}:`);
            console.log(`   Total Reviews: ${verifiedReviews.length}`);
            console.log(`   Average Rating: ${averageRating} ⭐`);
        }

        console.log('\n🎯 Test Data IDs:');
        console.log(`   Press Release ID: ${pressReleaseId}`);
        console.log(`   Sample Review ID: ${reviews[0]._id}`);

        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error seeding reviews:', error);
        mongoose.disconnect();
    }
}

// Run the seed function
seedSimpleReviews();