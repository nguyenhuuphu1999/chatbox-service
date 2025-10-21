#!/bin/bash

# Script to kill processes using port 3000/3001
echo "🔍 Checking for processes using port 3000..."
PROCESSES_3000=$(lsof -ti :3000)
if [ ! -z "$PROCESSES_3000" ]; then
    echo "⚠️ Found processes using port 3000: $PROCESSES_3000"
    echo "🔪 Killing processes..."
    kill -9 $PROCESSES_3000
    echo "✅ Killed processes on port 3000"
else
    echo "✅ Port 3000 is free"
fi

echo ""
echo "🔍 Checking for processes using port 3001..."
PROCESSES_3001=$(lsof -ti :3001)
if [ ! -z "$PROCESSES_3001" ]; then
    echo "⚠️ Found processes using port 3001: $PROCESSES_3001"
    echo "🔪 Killing processes..."
    kill -9 $PROCESSES_3001
    echo "✅ Killed processes on port 3001"
else
    echo "✅ Port 3001 is free"
fi

echo ""
echo "🔍 Checking for nest/node processes..."
pkill -f "nest start" 2>/dev/null && echo "✅ Killed nest processes" || echo "ℹ️ No nest processes found"
pkill -f "node.*main" 2>/dev/null && echo "✅ Killed node main processes" || echo "ℹ️ No node main processes found"

echo ""
echo "🎉 All done! You can now start your application."

