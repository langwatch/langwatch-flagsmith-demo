/**
 * Example client for the Banking Agent API
 * 
 * This demonstrates how a frontend application would interact with the banking agent.
 */

interface ChatRequest {
  threadId?: string;
  customerId: string;
  message: string;
}

interface ChatResponse {
  threadId: string;
  customerId: string;
  message: string;
  timestamp: string;
}

class BankingAgentClient {
  private baseUrl: string;
  private threadId?: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a message to the banking agent
   */
  async chat(customerId: string, message: string): Promise<ChatResponse> {
    const request: ChatRequest = {
      customerId,
      message,
    };

    // Include threadId if we have one (for conversation continuity)
    if (this.threadId) {
      request.threadId = this.threadId;
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    
    // Store threadId for subsequent messages
    this.threadId = data.threadId;
    
    return data;
  }

  /**
   * Get conversation history
   */
  async getConversation(threadId?: string) {
    const id = threadId || this.threadId;
    if (!id) {
      throw new Error('No thread ID available');
    }

    const response = await fetch(`${this.baseUrl}/api/conversation/${id}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear conversation
   */
  async clearConversation(threadId?: string) {
    const id = threadId || this.threadId;
    if (!id) {
      throw new Error('No thread ID available');
    }

    const response = await fetch(`${this.baseUrl}/api/conversation/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    // Clear local threadId if we deleted the current conversation
    if (id === this.threadId) {
      this.threadId = undefined;
    }

    return response.json();
  }

  /**
   * Reset the client (start a new conversation)
   */
  reset() {
    this.threadId = undefined;
  }
}

// Example usage
async function main() {
  const client = new BankingAgentClient();
  const customerId = 'cust_123';

  console.log('🏦 Banking Agent Client Example\n');

  try {
    // First message - check balance
    console.log('User: What is my account balance?');
    let response = await client.chat(customerId, 'What is my account balance?');
    console.log(`Agent: ${response.message}\n`);

    // Second message - list transactions
    console.log('User: Can you show me my recent transactions?');
    response = await client.chat(customerId, 'Can you show me my recent transactions?');
    console.log(`Agent: ${response.message}\n`);

    // Third message - transfer funds
    console.log('User: Transfer $100 from my checking to my savings account');
    response = await client.chat(customerId, 'Transfer $100 from my checking to my savings account');
    console.log(`Agent: ${response.message}\n`);

    // Fourth message - dispute a transaction (feature-flagged)
    console.log('User: I want to dispute transaction tx_001');
    response = await client.chat(customerId, 'I want to dispute transaction tx_001');
    console.log(`Agent: ${response.message}\n`);

    // Get full conversation history
    console.log('📜 Fetching conversation history...');
    const conversation = await client.getConversation();
    console.log(`Thread ID: ${conversation.threadId}`);
    console.log(`Total messages: ${conversation.messages.length}\n`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { BankingAgentClient };
