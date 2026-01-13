"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PressRelease_1 = require("../models/PressRelease");
const Publisher_1 = require("../models/Publisher");
const Order_1 = require("../models/Order");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kiqi';
// Sample publishers data
const publishers = [
    {
        publisherId: 'forbes_standard',
        name: 'Forbes',
        price: '₦220,000',
        avg_publish_time: '24-48 Hours',
        industry_focus: ['Finance', 'Tech', 'Business'],
        region_reach: ['USA', 'Europe', 'Global'],
        audience_reach: '2M+ Monthly Readers',
        key_features: ['Premium Quality', 'Verified Publisher', 'High Engagement', 'Global Reach'],
        metrics: {
            domain_authority: 92,
            trust_score: 86,
            avg_traffic: 75,
            social_signals: 95
        }
    },
    {
        publisherId: 'techcrunch_pro',
        name: 'TechCrunch',
        price: '₦450,000',
        avg_publish_time: '12-24 Hours',
        industry_focus: ['Tech', 'Startups', 'Innovation'],
        region_reach: ['USA', 'Europe', 'Asia'],
        audience_reach: '1.5M+ Monthly Readers',
        key_features: ['Fast Publication', 'Tech Focus', 'Startup Community', 'Industry Authority'],
        metrics: {
            domain_authority: 94,
            trust_score: 88,
            avg_traffic: 82,
            social_signals: 90
        }
    },
    {
        publisherId: 'techcabal_standard',
        name: 'TechCabal',
        price: '₦150,000',
        avg_publish_time: '24 Hours',
        industry_focus: ['African Tech', 'Startups', 'Innovation'],
        region_reach: ['Nigeria', 'Kenya', 'Africa'],
        audience_reach: '500K+ Monthly Readers',
        key_features: ['African Focus', 'Tech Ecosystem', 'Local Authority'],
        metrics: {
            domain_authority: 75,
            trust_score: 82,
            avg_traffic: 68,
            social_signals: 78
        }
    }
];
// Sample press releases
const generatePressReleases = (userId) => {
    const statuses = ['Draft', 'Published', 'Scheduled'];
    const campaigns = ['Product Launch', 'Funding Round', 'Company News', 'Partnership Announcement'];
    return Array.from({ length: 5 }, (_, index) => ({
        title: `Press Release ${index + 1}: ${campaigns[index % campaigns.length]}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        distribution: 'Forbes, TechCabal, TechCrunch',
        campaign: campaigns[index % campaigns.length],
        performance_views: `${Math.floor(Math.random() * 10 + 1)}.${Math.floor(Math.random() * 9)}K`,
        date_created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        content: `This is a sample press release content for ${campaigns[index % campaigns.length]}.
    
    [Company Name] today announced [major news] that will impact [target audience].
    
    "This is a significant milestone for our company," said [Executive Name], [Title].
    
    For more information, visit [website] or contact [email].`,
        user_id: userId,
        metrics: {
            total_views: Math.floor(Math.random() * 10000),
            total_clicks: Math.floor(Math.random() * 1000),
            engagement_rate: `${Math.floor(Math.random() * 15 + 5)}%`,
            avg_time_on_page: `${Math.floor(Math.random() * 3 + 1)}:${Math.floor(Math.random() * 60)}`
        },
        distribution_report: publishers.map(pub => ({
            outlet_name: pub.name,
            outlet_status: Math.random() > 0.3 ? 'Published' : 'Pending',
            outlet_clicks: Math.floor(Math.random() * 500),
            outlet_views: `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)}K`,
            publication_link: `https://www.${pub.name.toLowerCase()}.com/press-release-${index + 1}`,
            publication_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
    }));
};
// Sample orders
const generateOrders = (userId) => {
    return Array.from({ length: 3 }, (_, index) => {
        const selectedPublications = publishers
            .slice(0, Math.floor(Math.random() * publishers.length + 1))
            .map(pub => ({
            name: pub.name,
            price: pub.price,
            details: `${pub.audience_reach}, ${pub.region_reach.join(', ')}`
        }));
        const subtotal = selectedPublications.reduce((acc, pub) => {
            return acc + parseInt(pub.price.replace(/[^\d]/g, ''));
        }, 0);
        const vat_amount = subtotal * 0.075;
        const total_amount = subtotal + vat_amount;
        return {
            user_id: userId,
            publications: selectedPublications,
            order_summary: {
                subtotal: `₦${subtotal.toLocaleString()}`,
                vat_percentage: '7.5%',
                vat_amount: `₦${vat_amount.toLocaleString()}`,
                total_amount: `₦${total_amount.toLocaleString()}`
            },
            payment_method: 'Paystack',
            status: ['Pending', 'Completed'][Math.floor(Math.random() * 2)]
        };
    });
};
function seedData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            yield mongoose_1.default.connect(MONGODB_URI);
            console.log('Connected to MongoDB');
            // Clear existing data
            yield Promise.all([
                Publisher_1.Publisher.deleteMany({}),
                PressRelease_1.PressRelease.deleteMany({}),
                Order_1.Order.deleteMany({})
            ]);
            console.log('Cleared existing data');
            // Insert publishers
            yield Publisher_1.Publisher.insertMany(publishers);
            console.log('Added publishers');
            // Create test user ID if not provided
            const testUserId = new mongoose_1.default.Types.ObjectId();
            // Insert press releases
            const pressReleases = generatePressReleases(testUserId.toString());
            yield PressRelease_1.PressRelease.insertMany(pressReleases);
            console.log('Added press releases');
            // Insert orders
            const orders = generateOrders(testUserId.toString());
            yield Order_1.Order.insertMany(orders);
            console.log('Added orders');
            console.log('Test data seeded successfully!');
            console.log(`Test User ID: ${testUserId}`);
            // Example curl commands for testing
            console.log('\nExample curl commands for testing:');
            console.log(`
Test Commands (replace YOUR_AUTH_TOKEN with actual token):

1. Get Dashboard Metrics:
curl -X GET 'http://localhost:3000/api/press-releases/dashboard' \\
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN'

2. Get Press Releases List:
curl -X GET 'http://localhost:3000/api/press-releases/list' \\
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN'

3. Get Publishers List:
curl -X GET 'http://localhost:3000/api/press-releases/publishers' \\
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN'

4. Create New Press Release:
curl -X POST 'http://localhost:3000/api/press-releases/create' \\
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "campaign_id": "sample_campaign",
    "title": "New Product Launch",
    "pr_content": "Sample press release content",
    "status": "Draft"
  }'

5. Create Order:
curl -X POST 'http://localhost:3000/api/press-releases/orders' \\
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "publications": [
      {
        "name": "Forbes",
        "price": "₦220,000",
        "details": "2M+ Monthly Readers, Global"
      }
    ],
    "payment_method": "Paystack"
  }'
`);
        }
        catch (error) {
            console.error('Error seeding data:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('Disconnected from MongoDB');
        }
    });
}
// Run the seeding
seedData();
