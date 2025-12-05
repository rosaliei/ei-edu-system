#!/bin/bash

echo "🚀 Starting CV Submission Portal..."
echo "=================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "✅ Server starting on http://localhost:3000"
echo ""
echo "Access Points:"
echo "  👨‍🏫 Teacher Dashboard: http://localhost:3000/teacher-dashboard.html"
echo "  📊 Live Monitor: http://localhost:3000/teacher-monitor.html"
echo "  📝 Student Form: http://localhost:3000/student.html?token=TOKEN"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="
echo ""

npm start
