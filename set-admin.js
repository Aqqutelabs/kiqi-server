const mongoose = require('mongoose');
const { UserModel } = require('./dist/src/models/User');

async function setAdminRole(email) {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kiqi');
        const user = await UserModel.findOneAndUpdate(
            { email },
            { role: 'admin' },
            { new: true }
        );
        if (user) {
            console.log(`User ${email} set as admin`);
        } else {
            console.log(`User ${email} not found`);
        }
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Usage: node set-admin.js user@example.com
const email = process.argv[2];
if (!email) {
    console.log('Usage: node set-admin.js <email>');
} else {
    setAdminRole(email);
}