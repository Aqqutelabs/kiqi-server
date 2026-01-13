// Quick diagnostic script to check database records
// Run this in your terminal: node -e "require('./dist/src/config/ConnectDB').default(); console.log('DB connected')"

const mongoose = require('mongoose');

async function checkDatabase() {
    try {
        // Check if PressReleaseProgress collection exists
        const collections = await mongoose.connection.db.listCollections().toArray();
        const progressCollectionExists = collections.some(c => c.name === 'press_release_progresses');
        
        console.log('Collections in database:');
        collections.forEach(c => console.log(`  - ${c.name}`));
        
        console.log(`\nPressReleaseProgress collection exists: ${progressCollectionExists}`);
        
        // Try to query existing progress records
        const PressReleaseProgress = mongoose.model('PressReleaseProgress');
        const count = await PressReleaseProgress.countDocuments();
        console.log(`\nTotal progress records in database: ${count}`);
        
        if (count > 0) {
            const latest = await PressReleaseProgress.findOne().sort({ created_at: -1 });
            console.log('\nLatest progress record:');
            console.log(JSON.stringify(latest, null, 2));
        }
    } catch (error) {
        console.error('Error checking database:', error.message);
    }
}

module.exports = checkDatabase;
