import { GoogleAiServiceImpl } from '../services/impl/GoogleAi.service.impl.new';

async function testEmailGeneration() {
    try {
        const aiService = new GoogleAiServiceImpl();
        
        // Step 1: Generate initial email
        console.log('Generating initial email...');
        const initialEmail = await aiService.generateEmail(
            "Write a marketing email announcing our new AI-powered email generation service"
        );
        
        console.log('\nInitial Email:');
        console.log('ID:', initialEmail._id);
        console.log('Content:', initialEmail.result);
        
        // Step 2: Regenerate the email with modifications
        console.log('\nRegenerating email with modifications...');
        const regeneratedEmail = await aiService.regenerateEmail(
            initialEmail._id,
            "Make it more concise and add a clear call to action at the end"
        );
        
        console.log('\nRegenerated Email:');
        console.log('Original ID:', regeneratedEmail.emailId);
        console.log('New Content:', regeneratedEmail.regenerated);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the test
testEmailGeneration();