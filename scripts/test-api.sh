#!/usr/bin/env bash

# Banking Agent API Test Script
# This script sends sample requests to test the API endpoints

API_URL="http://localhost:3000"
CUSTOMER_ID="cust_123"

echo "🏦 Banking Agent API Test Script"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "${BLUE}Checking if server is running...${NC}"
if curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${YELLOW}⚠ Server is not running. Please start it with: pnpm dev${NC}"
    exit 1
fi
echo ""

# Test 1: Health check
echo -e "${BLUE}Test 1: Health Check${NC}"
curl -s "${API_URL}/health" | jq '.'
echo ""
echo ""

# Test 2: Check account balance
echo -e "${BLUE}Test 2: Check Account Balance${NC}"
RESPONSE=$(curl -s -X POST "${API_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"${CUSTOMER_ID}\",
    \"message\": \"What is my account balance?\"
  }")
echo "$RESPONSE" | jq '.'
THREAD_ID=$(echo "$RESPONSE" | jq -r '.threadId')
echo ""
echo ""

# Test 3: Continue conversation - list transactions
echo -e "${BLUE}Test 3: List Recent Transactions (same thread)${NC}"
sleep 1
curl -s -X POST "${API_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"threadId\": \"${THREAD_ID}\",
    \"customerId\": \"${CUSTOMER_ID}\",
    \"message\": \"Show me my recent transactions\"
  }" | jq '.'
echo ""
echo ""

# Test 4: Transfer funds
echo -e "${BLUE}Test 4: Transfer Funds${NC}"
sleep 1
curl -s -X POST "${API_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"threadId\": \"${THREAD_ID}\",
    \"customerId\": \"${CUSTOMER_ID}\",
    \"message\": \"Transfer 100 dollars from my checking to savings\"
  }" | jq '.'
echo ""
echo ""

# Test 5: Dispute transaction (feature flagged)
echo -e "${BLUE}Test 5: Dispute Transaction (Feature Flagged)${NC}"
sleep 1
curl -s -X POST "${API_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"threadId\": \"${THREAD_ID}\",
    \"customerId\": \"${CUSTOMER_ID}\",
    \"message\": \"I want to dispute transaction tx_001\"
  }" | jq '.'
echo ""
echo ""

# Test 6: Get conversation history
echo -e "${BLUE}Test 6: Get Conversation History${NC}"
curl -s "${API_URL}/api/conversation/${THREAD_ID}" | jq '.'
echo ""
echo ""

# Test 7: General support question
echo -e "${BLUE}Test 7: General Support Question${NC}"
sleep 1
curl -s -X POST "${API_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"threadId\": \"${THREAD_ID}\",
    \"customerId\": \"${CUSTOMER_ID}\",
    \"message\": \"What are your branch hours?\"
  }" | jq '.'
echo ""
echo ""

echo -e "${GREEN}✓ All tests completed!${NC}"
echo -e "${YELLOW}Thread ID: ${THREAD_ID}${NC}"
echo ""
echo "To view the full conversation:"
echo "  curl ${API_URL}/api/conversation/${THREAD_ID} | jq '.'"
echo ""
echo "To delete the conversation:"
echo "  curl -X DELETE ${API_URL}/api/conversation/${THREAD_ID}"
