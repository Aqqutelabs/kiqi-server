// Example of how to use the AI Chat API

// First message (starting a new chat)
async function startNewChat() {
  const response = await fetch('http://your-api/ai-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: "Hello, I'd like to discuss email marketing strategies."
    })
  });

  const data = await response.json();
  // data will include a sessionId - save this for follow-up messages
  const { sessionId, aiResponse } = data;
  console.log('AI Response:', aiResponse);
  console.log('Session ID (save this):', sessionId);
  return sessionId;
}

// Follow-up message (using existing session)
async function continueChat(sessionId: string, message: string) {
  const response = await fetch('http://your-api/ai-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId, // Include the sessionId from the previous response
      message
    })
  });

  const data = await response.json();
  console.log('AI Response:', data.aiResponse);
}

// Example usage:
async function exampleChatSession() {
  try {
    // Start a new chat
    console.log('Starting new chat...');
    const sessionId = await startNewChat();

    // Continue the conversation
    console.log('\nSending follow-up message...');
    await continueChat(sessionId, "Can you give me specific examples of effective email subject lines?");

    // Another follow-up
    console.log('\nSending another follow-up...');
    await continueChat(sessionId, "How can I improve open rates for these emails?");

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
exampleChatSession();