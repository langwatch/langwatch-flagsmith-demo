/**
 * API Integration Tests for the Banking Agent
 * 
 * These tests validate the HTTP API endpoints work correctly.
 * Note: These are integration tests, not Scenario tests.
 * For agent behavior testing, see banking_agent.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CUSTOMER_ID = 'cust_123';

describe('Banking Agent API - Integration Tests', () => {
  let threadId: string | undefined;

  beforeAll(async () => {
    // Ensure the API server is running
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) {
        throw new Error('API server is not running');
      }
    } catch (error) {
      throw new Error('API server is not running. Please start it with: pnpm dev');
    }
  });

  afterAll(async () => {
    // Clean up: delete the test conversation if it exists
    if (threadId) {
      try {
        await fetch(`${API_URL}/api/conversation/${threadId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn('Failed to clean up test conversation:', error);
      }
    }
  });

  it('should respond to health check', async () => {
    const response = await fetch(`${API_URL}/health`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('activeConversations');
  });

  it('should handle a chat message and return a response', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: CUSTOMER_ID,
        message: 'What is my account balance?',
      }),
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('threadId');
    expect(data).toHaveProperty('customerId');
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('timestamp');
    
    // Store thread ID for next tests
    threadId = data.threadId;
    
    // The message should be a non-empty string
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
  });

  it('should maintain conversation context across messages', async () => {
    // First message
    const response1 = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: CUSTOMER_ID,
        message: 'What is my checking account balance?',
      }),
    });

    const data1 = await response1.json();
    const testThreadId = data1.threadId;

    // Second message in the same thread
    const response2 = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId: testThreadId,
        customerId: CUSTOMER_ID,
        message: 'And what about my savings account?',
      }),
    });

    const data2 = await response2.json();
    
    // Should use the same thread ID
    expect(data2.threadId).toBe(testThreadId);
    expect(data2.message.length).toBeGreaterThan(0);

    // Clean up
    await fetch(`${API_URL}/api/conversation/${testThreadId}`, {
      method: 'DELETE',
    });
  });

  it('should retrieve conversation history', async () => {
    // Create a conversation
    const chatResponse = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: CUSTOMER_ID,
        message: 'Hello',
      }),
    });

    const chatData = await chatResponse.json();
    const testThreadId = chatData.threadId;

    // Get conversation history
    const historyResponse = await fetch(`${API_URL}/api/conversation/${testThreadId}`);
    expect(historyResponse.ok).toBe(true);
    
    const history = await historyResponse.json();
    expect(history).toHaveProperty('threadId');
    expect(history).toHaveProperty('customerId');
    expect(history).toHaveProperty('messages');
    expect(Array.isArray(history.messages)).toBe(true);
    expect(history.messages.length).toBeGreaterThan(0);

    // Check message structure
    const message = history.messages[0];
    expect(message).toHaveProperty('role');
    expect(message).toHaveProperty('content');
    expect(message).toHaveProperty('timestamp');

    // Clean up
    await fetch(`${API_URL}/api/conversation/${testThreadId}`, {
      method: 'DELETE',
    });
  });

  it('should delete a conversation', async () => {
    // Create a conversation
    const chatResponse = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: CUSTOMER_ID,
        message: 'Test',
      }),
    });

    const chatData = await chatResponse.json();
    const testThreadId = chatData.threadId;

    // Delete the conversation
    const deleteResponse = await fetch(`${API_URL}/api/conversation/${testThreadId}`, {
      method: 'DELETE',
    });

    expect(deleteResponse.ok).toBe(true);
    
    const deleteData = await deleteResponse.json();
    expect(deleteData.message).toBe('Conversation deleted successfully');
    expect(deleteData.threadId).toBe(testThreadId);

    // Verify it's actually deleted
    const getResponse = await fetch(`${API_URL}/api/conversation/${testThreadId}`);
    expect(getResponse.status).toBe(404);
  });

  it('should return 400 for invalid requests', async () => {
    // Missing customerId
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test message',
        // Missing customerId
      }),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should return 404 for non-existent conversation', async () => {
    const response = await fetch(`${API_URL}/api/conversation/invalid_thread_id`);
    expect(response.status).toBe(404);
  });
});
