"""
Flask Migration of NexNote - Personal AI Study Assistant
Main application file with routes and configuration
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_session import Session
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime, timedelta
from pathlib import Path
import hashlib
from dotenv import load_dotenv

# Import custom modules
from utils.pinecone_handler import (
    initialize_pinecone, extract_text_from_file, process_uploaded_files,
    search_knowledge_base, get_uploaded_files, clear_knowledge_base
)
from utils.ollama_handler import get_nexnote_response
from utils.chat_history import (
    save_chat_history, load_chat_history, get_all_chats,
    delete_chat, generate_chat_title
)

# Import optional modules
try:
    from utils.calendar_manager import CalendarManager, parse_schedule_request, format_event_display, CALENDAR_AVAILABLE
    calendar_enabled_import = True
except ImportError:
    calendar_enabled_import = False
    CALENDAR_AVAILABLE = False

try:
    from utils.study_assistant import (
        generate_summary, generate_quiz, extract_key_concepts,
        generate_flashcards, mark_notes_studied, get_study_progress
    )
    study_features_available = True
except ImportError:
    study_features_available = False

# Voice assistant disabled
voice_assistant_available = False

# Load environment variables from the flask_app directory
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

# Flask app configuration
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './.flask_session/'
Session(app)

# Create necessary directories
Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)
Path('./.flask_session/').mkdir(exist_ok=True)
Path('chat_history').mkdir(exist_ok=True)
Path('study_progress').mkdir(exist_ok=True)

# Configuration from environment
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "nexnote-notes")
CHAT_MODEL = os.getenv("CHAT_MODEL", "deepseek-r1:1.5b")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
calendar_enabled = os.getenv("ENABLE_CALENDAR", "false").lower() == "true" and calendar_enabled_import and CALENDAR_AVAILABLE

# Debug: Print configuration status
print(f"🔍 Configuration loaded:")
print(f"   Pinecone API Key: {'✅ Found' if PINECONE_API_KEY else '❌ Not found'}")
print(f"   Pinecone Index: {PINECONE_INDEX_NAME}")
print(f"   Chat Model: {CHAT_MODEL}")
print(f"   .env file path: {os.path.join(basedir, '.env')}")
print(f"   .env file exists: {os.path.exists(os.path.join(basedir, '.env'))}")

# Allowed file extensions
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'md'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Make variables available to all templates
@app.context_processor
def inject_globals():
    """Inject global variables into all templates"""
    return {
        'study_features_available': study_features_available,
        'calendar_enabled': calendar_enabled,
        'voice_assistant_available': voice_assistant_available,
        'pinecone_configured': bool(PINECONE_API_KEY),
        'chat_model': CHAT_MODEL,
        'embedding_model': EMBEDDING_MODEL,
        'index_name': PINECONE_INDEX_NAME
    }

# ==================== ROUTES ====================

@app.route('/')
def index():
    """Main landing page"""
    # Initialize session variables
    if 'messages' not in session:
        session['messages'] = []
    if 'current_chat_id' not in session:
        session['current_chat_id'] = None
    if 'chat_title' not in session:
        session['chat_title'] = "New Chat"
    if 'calendar_authenticated' not in session:
        session['calendar_authenticated'] = False
    
    return render_template('index.html',
                         pinecone_configured=bool(PINECONE_API_KEY),
                         calendar_enabled=calendar_enabled,
                         study_features_available=study_features_available,
                         chat_model=CHAT_MODEL,
                         embedding_model=EMBEDDING_MODEL,
                         index_name=PINECONE_INDEX_NAME)

@app.route('/chat')
def chat():
    """Chat interface"""
    return render_template('chat.html',
                         chat_title=session.get('chat_title', 'New Chat'),
                         messages=session.get('messages', []))

@app.route('/study-tools')
def study_tools():
    """Study tools interface"""
    if not study_features_available:
        return redirect(url_for('index'))
    
    uploaded_files = get_uploaded_files(PINECONE_API_KEY, PINECONE_INDEX_NAME) if PINECONE_API_KEY else {}
    
    return render_template('study_tools.html', 
                         uploaded_files=uploaded_files)

@app.route('/calendar')
def calendar_view():
    """Calendar interface"""
    if not calendar_enabled:
        return redirect(url_for('index'))
    
    return render_template('calendar.html',
                         authenticated=session.get('calendar_authenticated', False))

# Voice chat feature disabled
# @app.route('/voice-chat')
# def voice_chat():
#     """Voice chat interface"""
#     if not voice_assistant_available:
#         return redirect(url_for('index'))
#     
#     return render_template('voice_chat.html',
#                          chat_title=session.get('chat_title', 'Voice Assistant'),
#                          messages=session.get('messages', []))

# ==================== API ROUTES ====================

@app.route('/api/send_message', methods=['POST'])
def send_message():
    """Process chat messages"""
    data = request.get_json()
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Initialize chat ID if needed
    if not session.get('current_chat_id'):
        session['current_chat_id'] = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Generate title from first message
    if not session.get('messages'):
        session['chat_title'] = generate_chat_title(user_message)
    
    # Check for calendar request
    schedule_keywords = ['schedule', 'remind', 'add event', 'create event', 'set reminder', 'add to calendar']
    is_schedule_request = any(keyword in user_message.lower() for keyword in schedule_keywords)
    
    if is_schedule_request and calendar_enabled and session.get('calendar_authenticated'):
        # Handle calendar request
        parsed = parse_schedule_request(user_message)
        if parsed and parsed['datetime']:
            cal_mgr = CalendarManager()
            event = cal_mgr.create_event(
                title=parsed['title'],
                start_time=parsed['datetime'],
                duration_minutes=parsed['duration'],
                description=f"Created by NexNote from: {user_message}",
                reminder_minutes=parsed['reminder']
            )
            
            if event:
                response = f"✅ I've scheduled **{parsed['title']}** for {parsed['datetime'].strftime('%B %d, %Y at %I:%M %p')}.\n\n"
                response += f"🔔 You'll get a reminder {parsed['reminder']} minutes before.\n\n"
                response += f"[View in Google Calendar]({event.get('htmlLink', '')})"
            else:
                response = "❌ Sorry, I couldn't create the calendar event. Please try again."
        else:
            response = "I couldn't understand the schedule. Try: 'Schedule OS Revision tomorrow at 8 PM'"
    else:
        # Normal chat flow
        # Search knowledge base - use top 3 for better context
        context = []
        if PINECONE_API_KEY:
            context = search_knowledge_base(user_message, PINECONE_API_KEY, PINECONE_INDEX_NAME, top_k=3)
        
        # Get conversation history for context (exclude system messages, only user/assistant)
        conversation_history = []
        if 'messages' in session:
            # Convert stored messages to proper format for LLM
            conversation_history = [
                {'role': msg['role'], 'content': msg['content']} 
                for msg in session['messages']
            ]
        
        # Get response from Ollama with conversation history
        response = get_nexnote_response(user_message, context, CHAT_MODEL, conversation_history)
        
        # Format sources
        sources = []
        if context:
            for match in context:
                sources.append({
                    'filename': match.get('metadata', {}).get('filename', 'Unknown'),
                    'score': match.get('score', 0.0),
                    'text': match.get('metadata', {}).get('text', '')[:200]
                })
    
    # Add to chat history
    if 'messages' not in session:
        session['messages'] = []
    
    session['messages'].append({'role': 'user', 'content': user_message})
    session['messages'].append({'role': 'assistant', 'content': response})
    session.modified = True
    
    # Auto-save chat
    if session.get('current_chat_id'):
        save_chat_history(
            session['current_chat_id'],
            session['messages'],
            session.get('chat_title', 'New Chat')
        )
    
    return jsonify({
        'response': response,
        'sources': sources if not is_schedule_request else [],
        'chat_title': session.get('chat_title')
    })

@app.route('/api/upload_files', methods=['POST'])
def upload_files():
    """Handle file uploads"""
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files[]')
    uploaded_count = 0
    uploaded_filenames = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            uploaded_count += 1
            uploaded_filenames.append(filename)
    
    # Process ONLY newly uploaded files with Pinecone
    if PINECONE_API_KEY and uploaded_count > 0:
        file_objects = []
        for filename in uploaded_filenames:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if not os.path.exists(filepath):
                continue
                
            # Create a file-like object with proper attributes
            class FileObject:
                def __init__(self, path, name):
                    self.filepath = path
                    self.filename = name
                    self._file = None
                
                def read(self):
                    with open(self.filepath, 'rb') as f:
                        return f.read()
                
                def seek(self, pos):
                    pass  # Stub for compatibility
            
            file_objects.append(FileObject(filepath, filename))
        
        if file_objects:
            success = process_uploaded_files(file_objects, PINECONE_API_KEY, PINECONE_INDEX_NAME)
            if not success:
                return jsonify({'error': 'Failed to process files'}), 500
    
    return jsonify({
        'success': True,
        'uploaded_count': uploaded_count
    })

@app.route('/api/get_uploaded_files', methods=['GET'])
def api_get_uploaded_files():
    """Get list of uploaded files"""
    if not PINECONE_API_KEY:
        return jsonify({'files': {}})
    
    files = get_uploaded_files(PINECONE_API_KEY, PINECONE_INDEX_NAME)
    return jsonify({'files': files})

@app.route('/api/new_chat', methods=['POST'])
def new_chat():
    """Start a new chat"""
    # Save current chat if exists
    if session.get('current_chat_id') and session.get('messages'):
        save_chat_history(
            session['current_chat_id'],
            session['messages'],
            session.get('chat_title', 'New Chat')
        )
    
    # Reset session
    session['current_chat_id'] = datetime.now().strftime("%Y%m%d_%H%M%S")
    session['messages'] = []
    session['chat_title'] = "New Chat"
    session.modified = True
    
    return jsonify({'success': True})

@app.route('/api/load_chat/<chat_id>', methods=['GET'])
def load_chat(chat_id):
    """Load a specific chat"""
    chat_data = load_chat_history(chat_id)
    
    if chat_data:
        session['current_chat_id'] = chat_id
        session['messages'] = chat_data['messages']
        session['chat_title'] = chat_data['title']
        session.modified = True
        
        return jsonify({
            'success': True,
            'messages': chat_data['messages'],
            'title': chat_data['title']
        })
    
    return jsonify({'error': 'Chat not found'}), 404

@app.route('/api/get_chats', methods=['GET'])
def get_chats():
    """Get all chat histories"""
    chats = get_all_chats()
    return jsonify({'chats': chats})

@app.route('/api/delete_chat/<chat_id>', methods=['DELETE'])
def api_delete_chat(chat_id):
    """Delete a chat"""
    success = delete_chat(chat_id)
    return jsonify({'success': success})

@app.route('/api/clear_knowledge_base', methods=['POST'])
def api_clear_knowledge_base():
    """Clear all knowledge base and uploaded files"""
    if not PINECONE_API_KEY:
        return jsonify({'error': 'Pinecone not configured'}), 400
    
    # Clear Pinecone index
    success = clear_knowledge_base(PINECONE_API_KEY, PINECONE_INDEX_NAME)
    
    # Delete all uploaded files from uploads folder
    if success:
        upload_folder = app.config['UPLOAD_FOLDER']
        for filename in os.listdir(upload_folder):
            if filename != '.gitkeep':  # Keep the .gitkeep file
                filepath = os.path.join(upload_folder, filename)
                try:
                    os.remove(filepath)
                    print(f"Deleted file: {filename}")
                except Exception as e:
                    print(f"Error deleting {filename}: {str(e)}")
    
    return jsonify({'success': success})

# ==================== STUDY TOOLS API ====================

@app.route('/api/generate_summary', methods=['POST'])
def api_generate_summary():
    """Generate summary for a file"""
    if not study_features_available:
        return jsonify({'error': 'Study features not available'}), 400
    
    data = request.get_json()
    filename = data.get('filename')
    
    # Get file content from Pinecone
    context = search_knowledge_base(f"content from {filename}", PINECONE_API_KEY, PINECONE_INDEX_NAME, top_k=10)
    file_text = "\n\n".join([m.get('metadata', {}).get('text', '') for m in context if m.get('metadata', {}).get('filename') == filename])
    
    if file_text:
        summary = generate_summary(file_text, CHAT_MODEL)
        return jsonify({'summary': summary})
    
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/generate_quiz', methods=['POST'])
def api_generate_quiz():
    """Generate quiz for a file"""
    if not study_features_available:
        return jsonify({'error': 'Study features not available'}), 400
    
    data = request.get_json()
    filename = data.get('filename')
    num_questions = data.get('num_questions', 5)
    
    context = search_knowledge_base(f"content from {filename}", PINECONE_API_KEY, PINECONE_INDEX_NAME, top_k=10)
    file_text = "\n\n".join([m.get('metadata', {}).get('text', '') for m in context if m.get('metadata', {}).get('filename') == filename])
    
    if file_text:
        questions = generate_quiz(file_text, num_questions, CHAT_MODEL)
        return jsonify({'questions': questions})
    
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/submit_quiz', methods=['POST'])
def api_submit_quiz():
    """Submit quiz answers and get score"""
    if not study_features_available:
        return jsonify({'error': 'Study features not available'}), 400
    
    data = request.get_json()
    answers = data.get('answers', {})
    questions = data.get('questions', [])
    filename = data.get('filename')
    
    correct = 0
    for i, question in enumerate(questions):
        if str(i) in answers and answers[str(i)] == question.get('correct'):
            correct += 1
    
    score = int((correct / len(questions)) * 100) if questions else 0
    
    # Save progress
    mark_notes_studied(filename, score)
    
    return jsonify({
        'correct': correct,
        'total': len(questions),
        'score': score
    })

@app.route('/api/extract_concepts', methods=['POST'])
def api_extract_concepts():
    """Extract key concepts from a file"""
    if not study_features_available:
        return jsonify({'error': 'Study features not available'}), 400
    
    data = request.get_json()
    filename = data.get('filename')
    
    context = search_knowledge_base(f"content from {filename}", PINECONE_API_KEY, PINECONE_INDEX_NAME, top_k=10)
    file_text = "\n\n".join([m.get('metadata', {}).get('text', '') for m in context if m.get('metadata', {}).get('filename') == filename])
    
    if file_text:
        concepts = extract_key_concepts(file_text, CHAT_MODEL)
        return jsonify({'concepts': concepts})
    
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/generate_flashcards', methods=['POST'])
def api_generate_flashcards():
    """Generate flashcards for a file"""
    if not study_features_available:
        return jsonify({'error': 'Study features not available'}), 400
    
    data = request.get_json()
    filename = data.get('filename')
    num_cards = data.get('num_cards', 10)
    
    context = search_knowledge_base(f"content from {filename}", PINECONE_API_KEY, PINECONE_INDEX_NAME, top_k=10)
    file_text = "\n\n".join([m.get('metadata', {}).get('text', '') for m in context if m.get('metadata', {}).get('filename') == filename])
    
    if file_text:
        flashcards = generate_flashcards(file_text, num_cards, CHAT_MODEL)
        return jsonify({'flashcards': flashcards})
    
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/get_study_progress', methods=['GET'])
def api_get_study_progress():
    """Get study progress"""
    if not study_features_available:
        return jsonify({'error': 'Study features not available'}), 400
    
    progress = get_study_progress()
    return jsonify({'progress': progress})

# ==================== CALENDAR API ====================

@app.route('/api/calendar/authenticate', methods=['POST'])
def api_calendar_authenticate():
    """Authenticate with Google Calendar"""
    if not calendar_enabled:
        return jsonify({'error': 'Calendar not enabled'}), 400
    
    cal_mgr = CalendarManager()
    success = cal_mgr.authenticate()
    
    if success:
        session['calendar_authenticated'] = True
        session.modified = True
        return jsonify({'success': True})
    
    return jsonify({'error': 'Authentication failed'}), 400

@app.route('/api/calendar/create_event', methods=['POST'])
def api_calendar_create_event():
    """Create a calendar event"""
    if not calendar_enabled or not session.get('calendar_authenticated'):
        return jsonify({'error': 'Calendar not available'}), 400
    
    data = request.get_json()
    
    # Parse natural language or form data
    if data.get('natural_language'):
        parsed = parse_schedule_request(data['natural_language'])
        if not parsed or not parsed['datetime']:
            return jsonify({'error': 'Could not parse schedule'}), 400
        
        title = parsed['title']
        start_time = parsed['datetime']
        duration = parsed['duration']
        description = "Created by NexNote"
        reminder = parsed['reminder']
    else:
        title = data.get('title')
        date_str = data.get('date')
        time_str = data.get('time')
        duration = data.get('duration', 60)
        description = data.get('description', '')
        reminder = data.get('reminder', 30)
        
        # Combine date and time - parse as naive datetime first
        naive_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        
        # Localize to the detected local timezone
        from tzlocal import get_localzone
        import pytz
        local_tz = pytz.timezone(str(get_localzone()))
        start_time = local_tz.localize(naive_dt)
    
    cal_mgr = CalendarManager()
    event = cal_mgr.create_event(
        title=title,
        start_time=start_time,
        duration_minutes=int(duration),
        description=description,
        reminder_minutes=int(reminder)
    )
    
    if event:
        return jsonify({
            'success': True,
            'event': {
                'id': event.get('id'),
                'title': title,
                'start': start_time.isoformat(),
                'htmlLink': event.get('htmlLink')
            }
        })
    
    return jsonify({'error': 'Failed to create event'}), 400

@app.route('/api/calendar/get_events', methods=['GET'])
def api_calendar_get_events():
    """Get upcoming calendar events"""
    if not calendar_enabled or not session.get('calendar_authenticated'):
        return jsonify({'error': 'Calendar not available'}), 400
    
    max_results = request.args.get('max_results', 10, type=int)
    
    cal_mgr = CalendarManager()
    events = cal_mgr.get_upcoming_events(max_results)
    
    formatted_events = []
    for event in events:
        formatted_events.append({
            'id': event.get('id'),
            'summary': event.get('summary'),
            'start': event.get('start', {}).get('dateTime', event.get('start', {}).get('date')),
            'description': event.get('description', ''),
            'htmlLink': event.get('htmlLink', ''),
            'formatted': format_event_display(event)
        })
    
    return jsonify({'events': formatted_events})

@app.route('/api/calendar/delete_event/<event_id>', methods=['DELETE'])
def api_calendar_delete_event(event_id):
    """Delete a calendar event"""
    if not calendar_enabled or not session.get('calendar_authenticated'):
        return jsonify({'error': 'Calendar not available'}), 400
    
    cal_mgr = CalendarManager()
    success = cal_mgr.delete_event(event_id)
    
    return jsonify({'success': success})

# ==================== VOICE ASSISTANT API (DISABLED) ====================

# Voice assistant API routes disabled
# @app.route('/api/voice/check_microphone', methods=['GET'])
# def api_voice_check_microphone():
#     """Check if microphone is available"""
#     if not voice_assistant_available:
#         return jsonify({'error': 'Voice assistant not available'}), 400
#     
#     voice_assistant = get_voice_assistant()
#     result = voice_assistant.check_microphone()
#     return jsonify(result)

# @app.route('/api/voice/speech_to_text', methods=['POST'])
# def api_voice_speech_to_text():
#     """Convert speech to text"""
#     if not voice_assistant_available:
#         return jsonify({'error': 'Voice assistant not available'}), 400
#     
#     voice_assistant = get_voice_assistant()
#     result = voice_assistant.speech_to_text(timeout=5, phrase_time_limit=30)
#     return jsonify(result)

# @app.route('/api/voice/text_to_speech', methods=['POST'])
# def api_voice_text_to_speech():
#     """Convert text to speech"""
#     if not voice_assistant_available:
#         return jsonify({'error': 'Voice assistant not available'}), 400
#     
#     data = request.get_json()
#     text = data.get('text', '')
#     
#     if not text:
#         return jsonify({'error': 'No text provided'}), 400
#     
#     voice_assistant = get_voice_assistant()
#     success = voice_assistant.text_to_speech(text, blocking=False)
#     
#     return jsonify({'success': success})

# @app.route('/api/voice/stop_speaking', methods=['POST'])
# def api_voice_stop_speaking():
#     """Stop current speech"""
#     if not voice_assistant_available:
#         return jsonify({'error': 'Voice assistant not available'}), 400
#     
#     voice_assistant = get_voice_assistant()
#     voice_assistant.stop_speaking()
#     
#     return jsonify({'success': True})

# @app.route('/api/voice/set_rate', methods=['POST'])
# def api_voice_set_rate():
#     """Set speech rate"""
#     if not voice_assistant_available:
#         return jsonify({'error': 'Voice assistant not available'}), 400
#     
#     data = request.get_json()
#     rate = data.get('rate', 175)
#     
#     voice_assistant = get_voice_assistant()
#     success = voice_assistant.set_rate(rate)
#     
#     return jsonify({'success': success})

# @app.route('/api/voice/send_message', methods=['POST'])
# def api_voice_send_message():
#     """Process voice chat messages (same as regular chat but returns for voice)"""
#     data = request.get_json()
#     user_message = data.get('message', '')
#     
#     if not user_message:
#         return jsonify({'error': 'No message provided'}), 400
#     
#     # Initialize chat ID if needed
#     if not session.get('current_chat_id'):
#         session['current_chat_id'] = datetime.now().strftime("%Y%m%d_%H%M%S")
#     
#     # Generate title from first message
#     if not session.get('messages'):
#         session['chat_title'] = generate_chat_title(user_message)
#     
#     # Search knowledge base
#     context = []
#     if PINECONE_API_KEY:
#         context = search_knowledge_base(user_message, PINECONE_API_KEY, PINECONE_INDEX_NAME, top_k=3)
#     
#     # Get response from Ollama
#     response = get_nexnote_response(user_message, context, CHAT_MODEL)
#     
#     # Format sources
#     sources = []
#     if context:
#         for match in context:
#             sources.append({
#                 'filename': match.get('metadata', {}).get('filename', 'Unknown'),
#                 'score': match.get('score', 0.0),
#                 'text': match.get('metadata', {}).get('text', '')[:200]
#             })
#     
#     # Add to chat history
#     if 'messages' not in session:
#         session['messages'] = []
#     
#     session['messages'].append({'role': 'user', 'content': user_message})
#     session['messages'].append({'role': 'assistant', 'content': response})
#     session.modified = True
#     
#     # Auto-save chat
#     if session.get('current_chat_id'):
#         save_chat_history(
#             session['current_chat_id'],
#             session['messages'],
#             session.get('chat_title', 'Voice Chat')
#         )
#     
#     return jsonify({
#         'response': response,
#         'sources': sources,
#         'chat_title': session.get('chat_title')
#     })

# @app.route('/api/voice/new_chat', methods=['POST'])
# def api_voice_new_chat():
#     """Start a new voice chat"""
#     # Save current chat if exists
#     if session.get('current_chat_id') and session.get('messages'):
#         save_chat_history(
#             session['current_chat_id'],
#             session['messages'],
#             session.get('chat_title', 'Voice Chat')
#         )
#     
#     # Reset session
#     session['current_chat_id'] = datetime.now().strftime("%Y%m%d_%H%M%S")
#     session['messages'] = []
#     session['chat_title'] = "Voice Chat"
#     session.modified = True
#     
#     return jsonify({'success': True})

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

# ==================== MAIN ====================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
