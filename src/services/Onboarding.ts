// MOCK DATABASE for onboarding data
const wordpressConnections: any[] = [];
const chatbotSettings: any[] = [];

export const onboardingService = {
    saveWordpressConnection: async (data: any) => {
        // In a real app, you would encrypt the password before saving
        const connection = { id: Date.now().toString(), ...data };
        wordpressConnections.push(connection);
        console.log("Wordpress Connections:", wordpressConnections);
        return connection;
    },
    
    saveChatbotSettings: async (data: any) => {
        const settings = { id: Date.now().toString(), ...data };
        chatbotSettings.push(settings);
        console.log("Chatbot Settings:", chatbotSettings);
        return settings;
    }
};