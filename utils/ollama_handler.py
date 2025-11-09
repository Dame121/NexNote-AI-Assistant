"""
Ollama LLM handler
Manages interactions with local Ollama models
"""

import ollama
from typing import List, Dict, Generator


def get_nexnote_response(user_message: str, context: List[Dict], model: str, conversation_history: List[Dict] = None) -> str:
    """Get response from Ollama model with context and conversation history"""
    if conversation_history is None:
        conversation_history = []
    
    # Build context from retrieved documents - use top 3 for better context
    context_text = "\n\n".join([
        f"📄 From {match.get('metadata', {}).get('filename', 'Unknown')}:\n{match.get('metadata', {}).get('text', '')[:800]}"
        for match in context[:3] if match.get('metadata', {}).get('text')
    ])
    
    # Enhanced system prompt for better responses
    system_prompt = """You are NexNote, an intelligent AI study assistant. You help students learn by providing clear, concise, and conversational responses.

Guidelines:
- Answer naturally and conversationally
- Use simple formatting sparingly (only when it truly helps clarity)
- Focus on the actual content, not excessive structure
- Be helpful and friendly without being overly formal
- When using the knowledge base, integrate the information smoothly into your answer
- Remember the conversation context and refer back to previous messages when relevant"""

    if context_text:
        prompt = f"""Based on the following information from the knowledge base:

{context_text}

Question: {user_message}

Provide a clear and natural answer. Use simple formatting only when necessary for clarity (like separating topics or highlighting key points)."""
    else:
        prompt = f"""Question: {user_message}

Provide a clear and natural answer. Keep it conversational and easy to understand."""
    
    try:
        # Build messages array with conversation history
        messages = [{'role': 'system', 'content': system_prompt}]
        
        # Add conversation history (limit to last 10 messages to avoid context overflow)
        if conversation_history:
            # Only include the last 10 messages (5 exchanges)
            recent_history = conversation_history[-10:]
            messages.extend(recent_history)
        
        # Add current user message
        messages.append({'role': 'user', 'content': prompt})
        
        # Get response from Ollama with GPU-optimized options
        response = ollama.chat(
            model=model,
            messages=messages,
            options={
                'num_predict': 1024,     # Reduced for faster responses (was 2048)
                'temperature': 0.7,      # Slightly lower for faster generation
                'top_k': 40,            # Reduced for speed
                'top_p': 0.9,           # Reduced for speed
                'num_ctx': 2048,        # Reduced context for faster processing (was 4096)
                'repeat_penalty': 1.1,  # Reduce repetition
                'num_gpu': -1,          # Use all available GPUs (-1 = auto, 0 = CPU only)
                'num_thread': 8,        # CPU threads for parallel processing
                'use_mmap': True,       # Memory mapping for faster loading
                'use_mlock': False,     # Don't lock memory (allows swapping if needed)
            }
        )
        
        return response['message']['content']
    except Exception as e:
        return f"❌ **Error**: {str(e)}\n\n**Troubleshooting:**\n- Make sure Ollama is running: `ollama serve`\n- Check if model '{model}' is available: `ollama list`\n- Try pulling the model: `ollama pull {model}`\n- Check GPU usage: Task Manager > Performance > GPU"


def get_nexnote_response_stream(user_message: str, context: List[Dict], model: str, conversation_history: List[Dict] = None) -> Generator[str, None, None]:
    """Get streaming response from Ollama model with context and conversation history"""
    if conversation_history is None:
        conversation_history = []
    
    # Build context from retrieved documents - use top 3 for better context
    context_text = "\n\n".join([
        f"📄 From {match.get('metadata', {}).get('filename', 'Unknown')}:\n{match.get('metadata', {}).get('text', '')[:800]}"
        for match in context[:3] if match.get('metadata', {}).get('text')
    ])
    
    # Enhanced system prompt for better responses
    system_prompt = """You are NexNote, an intelligent AI study assistant. You help students learn by providing clear, concise, and conversational responses.

Guidelines:
- Answer naturally and conversationally
- Use simple formatting sparingly (only when it truly helps clarity)
- Focus on the actual content, not excessive structure
- Be helpful and friendly without being overly formal
- When using the knowledge base, integrate the information smoothly into your answer
- Remember the conversation context and refer back to previous messages when relevant"""

    if context_text:
        prompt = f"""Based on the following information from the knowledge base:

{context_text}

Question: {user_message}

Provide a clear and natural answer. Use simple formatting only when necessary for clarity (like separating topics or highlighting key points)."""
    else:
        prompt = f"""Question: {user_message}

Provide a clear and natural answer. Keep it conversational and easy to understand."""
    
    try:
        # Build messages array with conversation history
        messages = [{'role': 'system', 'content': system_prompt}]
        
        # Add conversation history (limit to last 10 messages to avoid context overflow)
        if conversation_history:
            # Only include the last 10 messages (5 exchanges)
            recent_history = conversation_history[-10:]
            messages.extend(recent_history)
        
        # Add current user message
        messages.append({'role': 'user', 'content': prompt})
        
        # Stream response from Ollama with GPU optimization
        stream = ollama.chat(
            model=model,
            messages=messages,
            stream=True,
            options={
                'num_predict': 1024,
                'temperature': 0.7,
                'top_k': 40,
                'top_p': 0.9,
                'num_ctx': 2048,
                'repeat_penalty': 1.1,
                'num_gpu': -1,          # Use all available GPUs
                'num_thread': 8,        # CPU threads
                'use_mmap': True,
                'use_mlock': False,
            }
        )
        
        for chunk in stream:
            if chunk.get('message', {}).get('content'):
                yield chunk['message']['content']
                
    except Exception as e:
        yield f"❌ **Error**: {str(e)}\n\n**Troubleshooting:**\n- Make sure Ollama is running\n- Check if model is available\n- Try: `ollama pull {model}`"
