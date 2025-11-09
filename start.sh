#!/bin/bash
# NexNote Flask App Startup Script (Linux/Mac)
# This script checks prerequisites and starts the Flask application

echo "🚀 Starting NexNote Flask App..."
echo "================================"
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -f "./venv/bin/python" ]; then
    echo "❌ Virtual environment not found!"
    echo "   Please run: python3 -m venv venv"
    echo "   Then: source venv/bin/activate"
    echo "   Then: pip install -r requirements.txt"
    exit 1
fi

# Check if .env file exists
if [ ! -f "./.env" ]; then
    echo "⚠️  .env file not found!"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env with your API keys before running again."
    exit 1
fi

# Check if Ollama is running
echo "🔍 Checking Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not running!"
    echo "   Please start Ollama first: ollama serve"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo "🌐 Starting Flask server..."
echo "📱 Open http://localhost:5000 in your browser"
echo ""

# Run with venv Python
./venv/bin/python app.py
