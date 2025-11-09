# 🤝 Contributing to NexNote

Thank you for your interest in contributing to NexNote! This document provides guidelines and instructions for contributing to the project.

## 📋 Getting Started

### Prerequisites
- Python 3.8 or higher
- Git
- Ollama installed locally
- Pinecone account (for vector database)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nexnote.git
   cd nexnote
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Install Ollama Models**
   ```bash
   ollama pull deepseek-r1:1.5b
   ollama pull nomic-embed-text
   ```

## 🔧 Development Guidelines

### Code Style
- Follow PEP 8 style guide for Python code
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions focused and concise

### Project Structure
```
nexnote/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
├── utils/                # Backend utilities
│   ├── pinecone_handler.py
│   ├── ollama_handler.py
│   ├── chat_history.py
│   ├── study_assistant.py
│   └── calendar_manager.py
├── templates/            # HTML templates
├── static/              # CSS, JS, assets
│   ├── css/
│   └── js/
├── chat_history/        # Runtime data
├── study_progress/      # Runtime data
└── uploads/             # Runtime data
```

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, documented code
   - Test your changes thoroughly
   - Update documentation if needed

3. **Test Your Code**
   ```bash
   python app.py
   # Test the feature in your browser
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: brief description of your changes"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

## 🐛 Reporting Bugs

When reporting bugs, please include:
- Python version
- Ollama version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages/screenshots

## 💡 Feature Requests

Feature requests are welcome! Please:
- Check existing issues first
- Clearly describe the feature
- Explain the use case
- Consider implementation complexity

## 📝 Commit Message Guidelines

Use clear, descriptive commit messages:
- `Add: new feature description`
- `Fix: bug description`
- `Update: what was updated`
- `Remove: what was removed`
- `Refactor: what was refactored`

## 🧪 Testing

Before submitting a PR:
- [ ] Code runs without errors
- [ ] All features work as expected
- [ ] No console errors in browser
- [ ] Documentation is updated
- [ ] .env.example is updated if needed

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

If you have questions:
- Check existing issues
- Create a new issue with the "question" label
- Be specific and provide context

---

Thank you for contributing to NexNote! 🎉
