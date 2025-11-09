# 🤖 NexNote - AI-Powered Study Assistant

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)](https://flask.palletsprojects.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-purple.svg)](https://www.pinecone.io)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-orange.svg)](https://ollama.ai)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **A production-ready Flask application implementing Retrieval-Augmented Generation (RAG) with Pinecone vector database and Ollama's local LLM for intelligent document querying and study assistance.**

**Built as response to "Build Your Own Jarvis" assignment - A personal AI assistant powered by self-hosted LLM with vector database integration for contextual knowledge retrieval.**

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technologies Used](#-technologies-used)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

NexNote is a comprehensive AI-powered study assistant that combines modern web technologies with advanced natural language processing. Built in response to the **"Build Your Own Jarvis"** programming assignment, this application demonstrates a complete implementation of a personal AI assistant powered by a self-hosted large language model (LLM) with vector database integration.

The application allows users to upload their study materials (PDF, DOCX, TXT, Markdown) and interact with an AI assistant that can answer questions, generate quizzes, create flashcards, and provide intelligent summaries based on the uploaded content - all using **Retrieval-Augmented Generation (RAG)** architecture.

### Assignment Requirements Fulfilled

✅ **Self-hosted LLM**: Ollama integration with DeepSeek R1 (1.5B parameters)  
✅ **Vector Database**: Pinecone for semantic search and knowledge retrieval  
✅ **Conversational Interface**: Full-featured chat UI with context awareness  
✅ **Knowledge Storage**: Document ingestion, chunking, and embedding generation  
✅ **Contextual Responses**: RAG implementation for accurate, source-attributed answers  

### Beyond Assignment Requirements

🚀 **Enhanced Study Tools**: Quiz generation, flashcards, concept extraction  
🚀 **Progress Tracking**: Study analytics and performance monitoring  
🚀 **Calendar Integration**: Google Calendar API for study scheduling  
🚀 **Production-Ready**: Security, error handling, comprehensive documentation  
🚀 **RESTful API**: 20+ endpoints for programmatic access

## ✨ Key Features

### 🧠 AI & Machine Learning
- **Retrieval-Augmented Generation (RAG)**: Combines vector similarity search with LLM generation
- **Semantic Search**: Uses `nomic-embed-text` embeddings (768 dimensions) for accurate context retrieval
- **Local LLM Processing**: Privacy-preserving AI using Ollama with DeepSeek R1 model
- **Contextual Conversations**: Maintains conversation history for coherent multi-turn dialogues
- **Source Attribution**: Transparent citing of source documents with relevance scores

### 📚 Study & Learning Tools
- **📝 Smart Summarization**: AI-generated concise summaries of uploaded materials
- **❓ Quiz Generation**: Automatic multiple-choice quiz creation with customizable difficulty
- **🎯 Concept Extraction**: Identifies and highlights key concepts, terms, and definitions
- **🗂️ Flashcard Creator**: Generates spaced-repetition flashcards for active recall
- **📊 Progress Analytics**: Tracks study sessions, quiz scores, and learning metrics
- **📅 Study Scheduling**: Optional Google Calendar integration for time management

### � Technical Features
- **RESTful API**: Well-documented API endpoints for all functionalities
- **Session Management**: Secure Flask sessions with configurable session storage
- **File Processing Pipeline**: Robust document parsing with error handling
- **Responsive UI**: Mobile-first design with modern CSS and vanilla JavaScript
- **AJAX Operations**: Asynchronous requests for smooth user experience
- **Error Handling**: Comprehensive error pages and graceful degradation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                   (HTML/CSS/JavaScript)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Flask Application                          │
│                      (Python 3.8+)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Routes &   │  │   Business   │  │   Utility    │         │
│  │  Controllers │──│     Logic    │──│   Modules    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────┬───────────────────┬───────────────────┬──────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Pinecone      │ │     Ollama      │ │  Google         │
│  Vector DB      │ │   Local LLM     │ │  Calendar API   │
│  (Embeddings)   │ │  (Generation)   │ │  (Optional)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Data Flow
1. **Document Upload** → Text Extraction → Chunking → Embedding Generation → Pinecone Storage
2. **User Query** → Embedding Generation → Semantic Search → Context Retrieval → LLM Generation → Response
3. **Study Tools** → Context Retrieval → Specialized Prompts → LLM Processing → Formatted Output

## 🛠️ Technologies Used

### Backend
- **Flask 3.0.0** - Modern Python web framework
- **Pinecone** - Serverless vector database for embeddings
- **Ollama** - Self-hosted LLM inference engine
- **PyPDF2** - PDF text extraction
- **python-docx** - Microsoft Word document processing
- **Flask-Session** - Server-side session management

### Frontend
- **HTML5/CSS3** - Modern semantic markup and styling
- **Vanilla JavaScript** - No framework dependencies, lightweight
- **AJAX/Fetch API** - Asynchronous communication
- **Responsive Design** - Mobile-first approach

### AI & ML
- **DeepSeek R1 (1.5B)** - Efficient local language model
- **nomic-embed-text** - Open-source embedding model (768d)
- **RAG Architecture** - Retrieval-Augmented Generation pattern

### Optional Integrations
- **Google Calendar API** - Study session scheduling
- **OAuth 2.0** - Secure authentication flow

## � Installation

### Prerequisites

Before installation, ensure you have:

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.8+ | Application runtime |
| **Ollama** | Latest | Local LLM inference |
| **Pinecone Account** | Free tier | Vector database |
| **Git** | Latest | Version control |

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/nexnote.git
cd nexnote
```

### Step 2: Environment Setup

#### Automated Setup (Recommended)

**Windows:**
```powershell
# Run the automated setup script
.\setup.ps1

# This script will:
# - Create virtual environment
# - Install all dependencies
# - Download Ollama models
# - Create .env configuration file
```

**Linux/Mac:**
```bash
# Make script executable
chmod +x start.sh

# Manual setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Download Ollama models
ollama pull deepseek-r1:1.5b
ollama pull nomic-embed-text
```

#### Manual Setup

1. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   
   # Activate (Windows)
   venv\Scripts\activate
   
   # Activate (Linux/Mac)
   source venv/bin/activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Ollama Models:**
   ```bash
   # Chat model (1.5B parameters, ~1GB)
   ollama pull deepseek-r1:1.5b
   
   # Embedding model (~274MB)
   ollama pull nomic-embed-text
   ```

### Step 3: Configuration

1. **Copy Environment Template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your credentials:**
   ```env
   # Required: Pinecone Configuration
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_INDEX_NAME=nexnote-notes
   
   # Required: Flask Secret (generate with: python -c "import secrets; print(secrets.token_hex(32))")
   SECRET_KEY=your_generated_secret_key_here
   
   # Optional: Model Configuration
   CHAT_MODEL=deepseek-r1:1.5b
   EMBEDDING_MODEL=nomic-embed-text
   
   # Optional: Features
   ENABLE_CALENDAR=false
   ```

3. **Get Pinecone API Key:**
   - Sign up at [pinecone.io](https://www.pinecone.io)
   - Navigate to API Keys section
   - Copy your API key to `.env`

4. **Create Pinecone Index:**
   - Go to Pinecone dashboard
   - Create new index named `nexnote-notes`
   - Set dimensions: **768** (for nomic-embed-text)
   - Metric: **cosine**
   - Environment: Select your preferred region

### Step 4: Optional - Google Calendar Integration

If you want calendar features:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download credentials as `credentials.json`
6. Place in project root directory
7. Set `ENABLE_CALENDAR=true` in `.env`

## 💻 Usage

### Starting the Application

1. **Start Ollama server** (if not already running):
   ```bash
   ollama serve
   ```

2. **Launch NexNote**:
   
   **Using startup scripts:**
   ```powershell
   # Windows
   .\start.ps1
   
   # Linux/Mac
   ./start.sh
   ```
   
   **Or manually:**
   ```bash
   python app.py
   ```

3. **Access the application**:
   - Open browser: `http://localhost:5000`
   - Application loads with current configuration status

### Workflow Guide

#### 1. Upload Study Materials

1. Click **"📁 Upload Files"** in the home page or sidebar
2. Select documents (PDF, DOCX, TXT, MD) - up to 16MB each
3. Click **"Process Files"**
4. System automatically:
   - Extracts text from documents
   - Splits into semantic chunks (~500 tokens)
   - Generates 768-dimensional embeddings
   - Stores in Pinecone with metadata
5. Success notification confirms upload

#### 2. Chat with AI Assistant

1. Navigate to **Chat** page
2. Type your question in the input field
3. AI assistant:
   - Searches top 3 most relevant document chunks
   - Generates context-aware response using LLM
   - Provides source citations with relevance scores
4. View conversation history in sidebar
5. Create new chats or load previous conversations

**Example interactions:**
```
You: "What is the time complexity of binary search?"
AI: "According to your uploaded notes, binary search has O(log n) 
     time complexity because it divides the search space in half 
     with each iteration..."
     
     Sources: algorithms.pdf (relevance: 0.89)
```

#### 3. Generate Study Materials

Navigate to **Study Tools** page:

- **📝 Summarize Notes**:
  - Select document
  - Click "Generate Summary"
  - Receive concise overview with key points

- **❓ Create Quiz**:
  - Choose document
  - Set number of questions (1-20)
  - Generate multiple-choice quiz
  - Take quiz and get instant feedback
  - View score and explanations

- **🎯 Extract Concepts**:
  - Select document
  - Extract key terms, definitions, formulas
  - Organized by importance

- **🗂️ Make Flashcards**:
  - Choose document
  - Set number of cards
  - Generate front/back flashcards
  - Export or review online

#### 4. Schedule Study Sessions (Optional)

If calendar integration is enabled:

1. Go to **Calendar** page
2. Click "Authenticate with Google"
3. Grant permissions
4. Create events:
   - **Form mode**: Fill in details manually
   - **Natural language**: "Schedule Data Structures review Friday 7 PM"
5. View upcoming sessions
6. Receive reminders on Google Calendar

### Advanced Features

#### Managing Knowledge Base

- **View Files**: See all uploaded documents with chunk counts
- **Clear Database**: Remove all documents from Pinecone
- **Delete Specific Files**: Remove individual documents (via API)

#### Chat Management

- **New Chat**: Start fresh conversation
- **Load Chat**: Resume previous discussion
- **Delete Chat**: Remove conversation history
- **Export Chat**: Save conversation (via browser)

### 💾 Chat History (Saved Automatically)

- The application saves chat conversations automatically on the server so you can resume or review them later.
- Saved chat files are stored in the `chat_history/` directory in the project root. This directory is git-ignored by default (`.gitignore`) so your conversations and any sensitive data are not committed to source control.
- File format: each saved conversation is stored as a JSON file named with a timestamp-like id (for example `20251109_143022.json`) containing metadata (title, timestamp) and an array of message objects ({ role, content, timestamp }).
- Clearing history:
  - From the web UI: use the **Delete Chat** action to remove individual conversations.
  - From the server: remove files in the `chat_history/` folder. Example (PowerShell):
    ```powershell
    # Delete all saved chats (irreversible)
    Remove-Item -Path .\chat_history\* -Force
    ```
- Exporting chats:
  - Use the **Export Chat** action in the UI to copy or download a conversation in JSON format.
  - You can also directly read the JSON files from `chat_history/` to process or back them up.
- Privacy note: chat history may contain sensitive information from uploaded documents or your prompts. Treat `chat_history/` files as sensitive and do not share them publicly.

#### Progress Tracking

- View quiz scores over time
- Track study sessions
- Monitor document coverage

## 📡 API Documentation

NexNote provides a comprehensive RESTful API for all features.

### Authentication & Sessions

All requests use Flask session cookies. No additional authentication required for local usage.

### Chat Endpoints

#### Send Message
```http
POST /api/send_message
Content-Type: application/json

{
  "message": "Explain recursion in simple terms"
}

Response: 200 OK
{
  "response": "Recursion is a programming technique...",
  "sources": [
    {
      "filename": "programming101.pdf",
      "score": 0.89,
      "text": "Recursion occurs when a function calls itself..."
    }
  ],
  "chat_title": "Recursion Discussion"
}
```

#### Create New Chat
```http
POST /api/new_chat

Response: 200 OK
{
  "success": true
}
```

#### Load Chat History
```http
GET /api/load_chat/<chat_id>

Response: 200 OK
{
  "success": true,
  "messages": [...],
  "title": "Previous Chat"
}
```

#### Get All Chats
```http
GET /api/get_chats

Response: 200 OK
{
  "chats": [
    {
      "id": "20251109_143022",
      "title": "Recursion Discussion",
      "timestamp": "2025-11-09T14:30:22",
      "message_count": 8
    }
  ]
}
```

### File Management Endpoints

#### Upload Files
```http
POST /api/upload_files
Content-Type: multipart/form-data

files[]: <binary data>

Response: 200 OK
{
  "success": true,
  "uploaded_count": 3
}
```

#### Get Uploaded Files
```http
GET /api/get_uploaded_files

Response: 200 OK
{
  "files": {
    "algorithms.pdf": {
      "chunks": 24,
      "size": "245KB",
      "uploaded_at": "2025-11-09T10:15:00"
    },
    "datastructures.docx": {
      "chunks": 18,
      "size": "156KB",
      "uploaded_at": "2025-11-09T10:20:00"
    }
  }
}
```

#### Clear Knowledge Base
```http
POST /api/clear_knowledge_base

Response: 200 OK
{
  "success": true
}
```

### Study Tools Endpoints

#### Generate Summary
```http
POST /api/generate_summary
Content-Type: application/json

{
  "filename": "chapter3.pdf"
}

Response: 200 OK
{
  "summary": "Chapter 3 introduces advanced algorithms including:\n- Binary Search Trees\n- Graph traversal (BFS/DFS)\n- Dynamic Programming basics..."
}
```

#### Generate Quiz
```http
POST /api/generate_quiz
Content-Type: application/json

{
  "filename": "algorithms.pdf",
  "num_questions": 5
}

Response: 200 OK
{
  "questions": [
    {
      "question": "What is the time complexity of binary search?",
      "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      "correct": 1,
      "explanation": "Binary search divides the search space in half each iteration"
    }
  ]
}
```

#### Submit Quiz Answers
```http
POST /api/submit_quiz
Content-Type: application/json

{
  "filename": "algorithms.pdf",
  "questions": [...],
  "answers": {
    "0": 1,
    "1": 2,
    "2": 0
  }
}

Response: 200 OK
{
  "correct": 4,
  "total": 5,
  "score": 80
}
```

#### Extract Key Concepts
```http
POST /api/extract_concepts
Content-Type: application/json

{
  "filename": "datastructures.pdf"
}

Response: 200 OK
{
  "concepts": [
    {
      "term": "Binary Search Tree",
      "definition": "A tree data structure where each node has at most two children...",
      "importance": "high"
    }
  ]
}
```

#### Generate Flashcards
```http
POST /api/generate_flashcards
Content-Type: application/json

{
  "filename": "algorithms.pdf",
  "num_cards": 10
}

Response: 200 OK
{
  "flashcards": [
    {
      "front": "What is Big O notation?",
      "back": "Mathematical notation describing algorithm complexity..."
    }
  ]
}
```

### Calendar Endpoints (Optional)

#### Authenticate
```http
POST /api/calendar/authenticate

Response: 200 OK
{
  "success": true
}
```

#### Create Event
```http
POST /api/calendar/create_event
Content-Type: application/json

{
  "title": "Algorithm Study Session",
  "date": "2025-11-10",
  "time": "19:00",
  "duration": 90,
  "description": "Review sorting algorithms",
  "reminder": 30
}

Response: 200 OK
{
  "success": true,
  "event": {
    "id": "event123",
    "title": "Algorithm Study Session",
    "start": "2025-11-10T19:00:00",
    "htmlLink": "https://calendar.google.com/..."
  }
}
```

#### Get Events
```http
GET /api/calendar/get_events?max_results=10

Response: 200 OK
{
  "events": [...]
}
```

### Error Responses

All endpoints return appropriate HTTP status codes:

```http
400 Bad Request
{
  "error": "No message provided"
}

404 Not Found
{
  "error": "Chat not found"
}

500 Internal Server Error
{
  "error": "Failed to process file"
}
```

6. **Optional: Enable Calendar Integration**:
   - Get Google Calendar API credentials ([Guide](https://developers.google.com/calendar/api/quickstart/python))
   - Save as `credentials.json` in the project root
   - Set `ENABLE_CALENDAR=true` in `.env`
   - Restart the app

## 📅 Google Calendar Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Download credentials as `credentials.json`
6. Place `credentials.json` in the `flask_app` directory
7. Set `ENABLE_CALENDAR=true` in `.env`
8. Restart the Flask app

## 📁 Project Structure

```
nexnote/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── LICENSE                     # MIT License
├── README.md                   # This file
├── CONTRIBUTING.md             # Contribution guidelines
├── setup.ps1                   # Windows setup script
├── start.ps1                   # Windows start script
├── start.sh                    # Linux/Mac start script
├── utils/                      # Backend modules
│   ├── __init__.py
│   ├── pinecone_handler.py    # Vector database operations
│   ├── ollama_handler.py      # LLM interactions
│   ├── chat_history.py        # Chat management
│   ├── study_assistant.py     # Study tools
│   └── calendar_manager.py    # Calendar integration
├── templates/                  # HTML templates
│   ├── base.html              # Base template
│   ├── index.html             # Home page
│   ├── chat.html              # Chat interface
│   ├── study_tools.html       # Study tools page
│   ├── calendar.html          # Calendar page
│   ├── 404.html               # Error pages
│   └── 500.html
├── static/                     # Static assets
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   └── js/
│       ├── main.js            # Core functionality
│       ├── chat.js            # Chat interface
│       ├── study.js           # Study tools
│       └── calendar.js        # Calendar features
├── chat_history/              # Saved conversations (gitignored)
├── study_progress/            # Study tracking data (gitignored)
└── uploads/                   # Temporary file uploads (gitignored)
```

## 🔌 API Endpoints

### Chat
- `POST /api/send_message` - Send a chat message
- `POST /api/new_chat` - Start a new conversation
- `GET /api/load_chat/<chat_id>` - Load a specific chat
- `GET /api/get_chats` - Get all chat histories
- `DELETE /api/delete_chat/<chat_id>` - Delete a chat

### File Management
- `POST /api/upload_files` - Upload and process files
- `GET /api/get_uploaded_files` - List uploaded files
- `POST /api/clear_knowledge_base` - Clear all uploaded files

### Study Tools
- `POST /api/generate_summary` - Generate note summary
- `POST /api/generate_quiz` - Create a quiz
- `POST /api/submit_quiz` - Submit quiz answers
- `POST /api/extract_concepts` - Extract key concepts
- `POST /api/generate_flashcards` - Create flashcards
- `GET /api/get_study_progress` - Get study statistics

### Calendar (if enabled)
- `POST /api/calendar/authenticate` - Authenticate with Google
- `POST /api/calendar/create_event` - Create calendar event
- `GET /api/calendar/get_events` - Get upcoming events
- `DELETE /api/calendar/delete_event/<event_id>` - Delete event

## 🎨 Customization

### Modify Models
Edit the `.env` file to change models:
```env
CHAT_MODEL=llama2  # Or any other Ollama model
EMBEDDING_MODEL=nomic-embed-text
```

### Adjust UI Theme
Edit `static/css/style.css` and modify the CSS variables in `:root`

### Change Port
Modify the last line in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=8080)  # Change port here
```

## 🐛 Troubleshooting

### Ollama Connection Issues
- Make sure Ollama is running: `ollama serve`
- Check if models are downloaded: `ollama list`
- Verify models:
  ```bash
  ollama pull deepseek-r1:1.5b
  ollama pull nomic-embed-text
  ```

### Pinecone Errors
- Verify your API key in `.env`
- Check your Pinecone dashboard for quota limits
- Ensure the index dimension is 768 (for nomic-embed-text)

### File Upload Issues
- Check file size limits (default: 16MB)
- Verify file permissions in the `uploads/` directory
- Ensure supported file types: TXT, PDF, DOCX, MD

### Session Issues
- Clear browser cookies
- Check that `.flask_session/` directory exists
- Regenerate SECRET_KEY if needed

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:
- Setting up the development environment
- Code style and standards
- Submitting pull requests
- Reporting bugs and feature requests

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Support the Project

If you find NexNote useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing code

## � Contact & Support

- Create an [Issue](../../issues) for bug reports or feature requests
- Check existing issues before creating a new one
- Provide detailed information for faster resolution

## 🎯 Tips for Best Results

1. **Upload Quality**: Upload well-structured documents for better results
2. **Chunk Size**: Files are automatically chunked for optimal search
3. **Model Selection**: Use DeepSeek R1 for fast responses, or switch to larger models for better quality
4. **Regular Study**: Use the quiz feature regularly to track learning progress
5. **Calendar Integration**: Schedule regular study sessions to stay organized

## 🎓 Educational Value

This project demonstrates:
- **RAG Architecture**: Real-world implementation of Retrieval-Augmented Generation
- **Vector Databases**: Practical use of embeddings and semantic search
- **LLM Integration**: Working with local language models
- **Full-Stack Development**: Complete web application from backend to frontend
- **API Design**: RESTful API principles and best practices
- **Security**: Environment variable management, session handling, input validation

## 🔍 Code Quality

- **Type Hints**: Python type annotations for better code clarity
- **Documentation**: Comprehensive docstrings and comments
- **Error Handling**: Graceful error management with user-friendly messages
- **Logging**: Detailed application logs for debugging
- **Modular Design**: Separation of concerns with utility modules
- **Security**: Input sanitization, secure file handling, CSRF protection

## 📈 Performance Metrics

- **Response Time**: Typical query response in 2-5 seconds (depending on context)
- **Embedding Generation**: ~100ms per document chunk
- **Vector Search**: Sub-second similarity search with Pinecone
- **File Processing**: Handles documents up to 16MB
- **Concurrent Users**: Supports multiple simultaneous sessions

## 🚧 Known Limitations

- **File Size**: 16MB maximum per file upload
- **Supported Formats**: PDF, DOCX, TXT, MD only
- **Calendar**: Requires Google account for calendar features
- **Local LLM**: Response quality depends on model size and hardware
- **Embeddings**: English language optimized (nomic-embed-text)

## 🗺️ Roadmap

Future enhancements planned:
- [ ] Support for additional file formats (PPT, XLSX)
- [ ] Multi-language support for embeddings
- [ ] Advanced analytics dashboard
- [ ] Export functionality (notes, quizzes, flashcards)
- [ ] Collaborative features (shared study groups)
- [ ] Mobile app (iOS/Android)
- [ ] Docker containerization
- [ ] CI/CD pipeline with GitHub Actions

## 🏆 Acknowledgments

- **Damewan Bareh** - Project Developer and Creator
- **Ollama** - For providing excellent local LLM infrastructure
- **Pinecone** - For their vector database platform
- **Flask** - For the robust web framework
- **OpenAI** - For advancing AI and making it accessible
- **All Contributors** - For their valuable contributions

## 📊 Project Statistics

![Language](https://img.shields.io/github/languages/top/YOUR_USERNAME/nexnote)
![Code Size](https://img.shields.io/github/languages/code-size/YOUR_USERNAME/nexnote)
![Last Commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/nexnote)

---

**Built with ❤️ using Flask, Ollama, and Pinecone**

*Developed by Damewan Bareh as part of the Diligent Internship Assignment*
