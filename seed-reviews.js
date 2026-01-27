const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Review } = require('./dist/src/models/Review');

async function seedReviews() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kiqi');

        // Read the sample data
        const reviewsData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'sample-data', 'press-release-reviews-test-data.json'), 'utf8')
        );

        // Clear existing reviews for testing
        await Review.deleteMany({});

        // Insert the sample reviews
        const reviews = await Review.insertMany(reviewsData);

        console.log(`✅ Seeded ${reviews.length} reviews successfully`);

        // Calculate and display summary
        const summary = await Review.aggregate([
            {
                $match: { status: 'verified' }
            },
            {
                $group: {
                    _id: '$press_release_id',
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        console.log('\n📊 Review Summary:');
        summary.forEach(item => {
            const distribution = {
                5: item.ratingDistribution.filter(r => r === 5).length,
                4: item.ratingDistribution.filter(r => r === 4).length,
                3: item.ratingDistribution.filter(r => r === 3).length,
                2: item.ratingDistribution.filter(r => r === 2).length,
                1: item.ratingDistribution.filter(r => r === 1).length
            };

            console.log(`Press Release ${item._id}:`);
            console.log(`  Total Reviews: ${item.totalReviews}`);
            console.log(`  Average Rating: ${item.averageRating.toFixed(1)}`);
            console.log(`  Distribution: 5★: ${distribution[5]}, 4★: ${distribution[4]}, 3★: ${distribution[3]}, 2★: ${distribution[2]}, 1★: ${distribution[1]}`);
        });

        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error seeding reviews:', error);
        mongoose.disconnect();
    }
}

// Run the seed function
seedReviews();