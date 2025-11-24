/**
 * Custom API routes for Mastra
 * These endpoints extend the built-in Mastra API
 */

import { mastra } from './index';

// In-memory conversation storage
// In production, use a proper database
interface ConversationThread {
  customerId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

const conversations = new Map<string, ConversationThread>();

/**
 * Chat endpoint for conversational AI
 * This is similar to the Express endpoint but integrated with Mastra
 */
export async function chatHandler(request: Request) {
  try {
    const body = await request.json();
    const { threadId, customerId, message } = body;

    // Validation
    if (!customerId || !message) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: customerId and message are required'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate or use existing thread ID
    const conversationId = threadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get or create conversation thread
    let conversation = conversations.get(conversationId);
    if (!conversation) {
      conversation = {
        customerId,
        messages: []
      };
      conversations.set(conversationId, conversation);
    }

    // Add user message to conversation history
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Get the banking agent from Mastra
    const agent = mastra.getAgent('bankingAgent');
    
    if (!agent) {
      return new Response(
        JSON.stringify({ error: 'Banking agent not found' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Call the agent
    const agentResponse = await agent.generate(message);
    const assistantMessage = agentResponse.text || 'I apologize, but I could not process your request.';

    // Add assistant message to conversation history
    conversation.messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString()
    });

    // Return response
    return new Response(
      JSON.stringify({
        threadId: conversationId,
        customerId,
        message: assistantMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in chat handler:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Get conversation history
 */
export function getConversationHandler(threadId: string) {
  const conversation = conversations.get(threadId);
  
  if (!conversation) {
    return new Response(
      JSON.stringify({ error: 'Conversation not found' }),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({
      threadId,
      customerId: conversation.customerId,
      messages: conversation.messages
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Delete conversation
 */
export function deleteConversationHandler(threadId: string) {
  const existed = conversations.delete(threadId);
  
  if (!existed) {
    return new Response(
      JSON.stringify({ error: 'Conversation not found' }),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({
      message: 'Conversation deleted successfully',
      threadId
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Export routes configuration for Mastra
export const routes = {
  '/api/chat': {
    POST: chatHandler
  },
  '/api/conversation/:threadId': {
    GET: getConversationHandler,
    DELETE: deleteConversationHandler
  }
};
