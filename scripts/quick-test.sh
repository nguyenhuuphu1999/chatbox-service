#!/bin/bash

# Quick Test Script for Chat Flow
# This script tests the basic functionality

echo "🚀 Starting Quick Chat Flow Test"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

# Check if server is running
echo "🔍 Checking if server is running..."
curl -s http://localhost:3000/health > /dev/null
if [ $? -eq 0 ]; then
    print_status "Server is running" 0
else
    print_status "Server is not running. Please start the server first." 1
    exit 1
fi

# Test 1: Create users
echo ""
echo "👥 Creating test users..."

# Create Alice
ALICE_RESPONSE=$(curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "userKey": "alice_test",
    "userName": "alice",
    "phoneNumber": "+1234567890",
    "fullName": "Alice Test",
    "avatar": "https://example.com/alice.jpg"
  }')

if echo "$ALICE_RESPONSE" | grep -q "alice_test"; then
    print_status "Alice user created" 0
else
    print_status "Failed to create Alice user" 1
fi

# Create Bob
BOB_RESPONSE=$(curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "userKey": "bob_test",
    "userName": "bob",
    "phoneNumber": "+0987654321",
    "fullName": "Bob Test",
    "avatar": "https://example.com/bob.jpg"
  }')

if echo "$BOB_RESPONSE" | grep -q "bob_test"; then
    print_status "Bob user created" 0
else
    print_status "Failed to create Bob user" 1
fi

# Test 2: Health checks
echo ""
echo "🏥 Testing health endpoints..."

# General health
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "status"; then
    print_status "General health check passed" 0
else
    print_status "General health check failed" 1
fi

# Database health
DB_HEALTH_RESPONSE=$(curl -s http://localhost:3000/health/database)
if echo "$DB_HEALTH_RESPONSE" | grep -q "status"; then
    print_status "Database health check passed" 0
else
    print_status "Database health check failed" 1
fi

# Test 3: Get users
echo ""
echo "👤 Testing user retrieval..."

# Get Alice
ALICE_GET=$(curl -s http://localhost:3000/users/alice_test)
if echo "$ALICE_GET" | grep -q "alice_test"; then
    print_status "Alice user retrieved" 0
else
    print_status "Failed to retrieve Alice user" 1
fi

# Get Bob
BOB_GET=$(curl -s http://localhost:3000/users/bob_test)
if echo "$BOB_GET" | grep -q "bob_test"; then
    print_status "Bob user retrieved" 0
else
    print_status "Failed to retrieve Bob user" 1
fi

echo ""
echo "================================"
echo -e "${YELLOW}📝 Manual Socket.IO Testing Required${NC}"
echo ""
echo "To test Socket.IO functionality, you need to:"
echo "1. Use Postman WebSocket or browser console"
echo "2. Connect to: ws://localhost:3000/chat"
echo "3. Use header: user-key: alice_test"
echo "4. Follow the test scenario in docs/TEST_SCENARIO_FULL_CHAT_FLOW.md"
echo ""
echo "Or run the automated test:"
echo "npm run test:chat-flow"
echo ""
echo "================================"
echo -e "${GREEN}🎉 Quick test completed!${NC}"
