"""
Chat history management
Handles saving, loading, and managing chat conversations
"""

import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

CHAT_HISTORY_DIR = Path("chat_history")
CHAT_HISTORY_DIR.mkdir(exist_ok=True)


def save_chat_history(chat_id: str, messages: List[Dict], title: str):
    """Save chat history to a JSON file"""
    try:
        chat_file = CHAT_HISTORY_DIR / f"{chat_id}.json"
        chat_data = {
            'id': chat_id,
            'title': title,
            'messages': messages,
            'timestamp': datetime.now().isoformat(),
            'message_count': len(messages)
        }
        with open(chat_file, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception as e:
        print(f"Error saving chat: {str(e)}")
        return False


def load_chat_history(chat_id: str) -> Optional[Dict]:
    """Load chat history from a JSON file"""
    try:
        chat_file = CHAT_HISTORY_DIR / f"{chat_id}.json"
        if chat_file.exists():
            with open(chat_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"Error loading chat: {str(e)}")
        return None


def get_all_chats() -> List[Dict]:
    """Get all saved chat histories"""
    try:
        chats = []
        for chat_file in CHAT_HISTORY_DIR.glob("*.json"):
            try:
                with open(chat_file, 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)
                    chats.append({
                        'id': chat_data.get('id'),
                        'title': chat_data.get('title', 'Untitled Chat'),
                        'timestamp': chat_data.get('timestamp'),
                        'message_count': chat_data.get('message_count', 0)
                    })
            except:
                continue
        
        # Sort by timestamp (newest first)
        chats.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return chats
    except Exception as e:
        print(f"Error getting chats: {str(e)}")
        return []


def delete_chat(chat_id: str):
    """Delete a chat history file"""
    try:
        chat_file = CHAT_HISTORY_DIR / f"{chat_id}.json"
        if chat_file.exists():
            chat_file.unlink()
            return True
        return False
    except Exception as e:
        print(f"Error deleting chat: {str(e)}")
        return False


def generate_chat_title(first_message: str) -> str:
    """Generate a chat title from the first user message"""
    title = first_message[:50]
    if len(first_message) > 50:
        title += "..."
    return title
