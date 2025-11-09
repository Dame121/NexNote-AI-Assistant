// Voice Chat - Modern Interface
let currentVoiceChatId = null;
let voiceMessages = [];
let isRecording = false;
let isSpeaking = false;
let autoSpeak = true;
let useWebSpeech = false;
let recognition = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeWebSpeechAPI();
    loadVoiceChatHistory();
    setupEventListeners();
    loadPreferences();
});

// Initialize Web Speech API
function initializeWebSpeechAPI() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('voiceMessageInput').value = transcript;
            updateVoiceStatus('✅ Recognized: ' + transcript);
            setTimeout(() => {
                hideVoiceStatus();
                sendVoiceMessage();
            }, 500);
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            hideVoiceStatus();
            stopRecordingAnimation();
            showNotification('Could not recognize speech. Try again.', 'warning');
        };
        
        recognition.onend = function() {
            isRecording = false;
            stopRecordingAnimation();
        };
        
        console.log('✅ Web Speech API available');
    } else {
        console.log('❌ Web Speech API not supported');
        const webSpeechToggle = document.getElementById('useWebSpeech');
        if (webSpeechToggle) {
            webSpeechToggle.disabled = true;
            webSpeechToggle.parentElement.parentElement.style.opacity = '0.5';
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    const recordBtn = document.getElementById('voiceRecordBtn');
    const sendBtn = document.getElementById('voiceSendBtn');
    const messageInput = document.getElementById('voiceMessageInput');
    const newChatBtn = document.getElementById('newVoiceChatBtn');
    const autoSpeakToggle = document.getElementById('autoSpeak');
    const speechRateSlider = document.getElementById('speechRate');
    const stopSpeakBtn = document.getElementById('stopSpeakBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettings');
    const clearInputBtn = document.getElementById('clearInputBtn');
    const useWebSpeechToggle = document.getElementById('useWebSpeech');
    
    // Voice recording - press and hold
    if (recordBtn) {
        recordBtn.addEventListener('mousedown', startRecording);
        recordBtn.addEventListener('mouseup', stopRecording);
        recordBtn.addEventListener('mouseleave', function() {
            if (isRecording) stopRecording();
        });
        
        // Touch events for mobile
        recordBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startRecording();
        });
        recordBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopRecording();
        });
    }
    
    // Send button
    if (sendBtn) {
        sendBtn.addEventListener('click', sendVoiceMessage);
    }
    
    // Enter key to send
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendVoiceMessage();
            }
        });
        
        // Escape key to clear
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                if (clearInputBtn) clearInputBtn.style.display = 'none';
            }
        });
        
        // Show/hide clear button
        messageInput.addEventListener('input', function() {
            if (clearInputBtn) {
                clearInputBtn.style.display = this.value ? 'block' : 'none';
            }
        });
    }
    
    // Clear input
    if (clearInputBtn) {
        clearInputBtn.addEventListener('click', function() {
            messageInput.value = '';
            this.style.display = 'none';
            messageInput.focus();
        });
    }
    
    // New chat
    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewVoiceChat);
    }
    
    // Auto-speak toggle
    if (autoSpeakToggle) {
        autoSpeakToggle.addEventListener('change', function() {
            autoSpeak = this.checked;
            localStorage.setItem('autoSpeak', this.checked);
        });
    }
    
    // Speech rate slider
    if (speechRateSlider) {
        speechRateSlider.addEventListener('input', function() {
            const rateValue = document.getElementById('rateValue');
            if (rateValue) {
                rateValue.textContent = this.value + ' wpm';
            }
            updateSpeechRate(this.value);
        });
    }
    
    // Stop speaking
    if (stopSpeakBtn) {
        stopSpeakBtn.addEventListener('click', stopSpeaking);
    }
    
    // Settings panel
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            const panel = document.getElementById('settingsPanel');
            if (panel) panel.classList.add('open');
        });
    }
    
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', function() {
            const panel = document.getElementById('settingsPanel');
            if (panel) panel.classList.remove('open');
        });
    }
    
    // Web Speech API toggle
    if (useWebSpeechToggle) {
        useWebSpeechToggle.addEventListener('change', function() {
            useWebSpeech = this.checked;
            localStorage.setItem('useWebSpeech', this.checked);
        });
    }
}

// Load saved preferences
function loadPreferences() {
    const savedAutoSpeak = localStorage.getItem('autoSpeak');
    if (savedAutoSpeak !== null) {
        autoSpeak = savedAutoSpeak === 'true';
        const toggle = document.getElementById('autoSpeak');
        if (toggle) toggle.checked = autoSpeak;
    }
    
    const savedWebSpeech = localStorage.getItem('useWebSpeech');
    if (savedWebSpeech !== null) {
        useWebSpeech = savedWebSpeech === 'true';
        const toggle = document.getElementById('useWebSpeech');
        if (toggle) toggle.checked = useWebSpeech;
    }
}

// Start voice recording
function startRecording() {
    if (isRecording) return;
    
    isRecording = true;
    startRecordingAnimation();
    showVoiceStatus('🎤 Listening...');
    
    if (useWebSpeech && recognition) {
        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            fallbackToServerRecognition();
        }
    }
}

// Stop recording and process
async function stopRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    
    if (useWebSpeech && recognition) {
        recognition.stop();
    } else {
        await fallbackToServerRecognition();
    }
}

// Fallback to server-side recognition
async function fallbackToServerRecognition() {
    updateVoiceStatus('🔍 Processing speech...');
    
    try {
        const response = await fetch('/api/voice/speech_to_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.text) {
            document.getElementById('voiceMessageInput').value = data.text;
            hideVoiceStatus();
            stopRecordingAnimation();
            setTimeout(() => sendVoiceMessage(), 300);
        } else {
            hideVoiceStatus();
            stopRecordingAnimation();
            showNotification(data.error || 'Could not recognize speech', 'warning');
        }
    } catch (error) {
        console.error('Speech recognition error:', error);
        hideVoiceStatus();
        stopRecordingAnimation();
        showNotification('Error processing speech', 'danger');
    }
}

// Recording animations
function startRecordingAnimation() {
    const recordBtn = document.getElementById('voiceRecordBtn');
    if (recordBtn) {
        recordBtn.classList.add('recording');
        recordBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    }
}

function stopRecordingAnimation() {
    const recordBtn = document.getElementById('voiceRecordBtn');
    if (recordBtn) {
        recordBtn.classList.remove('recording');
        recordBtn.style.background = '';
    }
}

// Voice status management
function showVoiceStatus(message) {
    const statusDiv = document.getElementById('voiceStatus');
    const statusText = document.getElementById('voiceStatusText');
    if (statusDiv && statusText) {
        statusText.textContent = message;
        statusDiv.style.display = 'block';
    }
}

function updateVoiceStatus(message) {
    const statusText = document.getElementById('voiceStatusText');
    if (statusText) {
        statusText.textContent = message;
    }
}

function hideVoiceStatus() {
    const statusDiv = document.getElementById('voiceStatus');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
}

// Send voice message
async function sendVoiceMessage() {
    const messageInput = document.getElementById('voiceMessageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    addVoiceMessage('user', message);
    messageInput.value = '';
    const clearBtn = document.getElementById('clearInputBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/voice/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        removeTypingIndicator();
        
        if (data.response) {
            addVoiceMessage('assistant', data.response);
            
            if (autoSpeak) {
                speakText(data.response);
            }
        } else {
            showNotification('No response received', 'warning');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        showNotification('Error sending message', 'danger');
    }
}

// Speak text using TTS
async function speakText(text) {
    try {
        isSpeaking = true;
        const stopBtn = document.getElementById('stopSpeakBtn');
        if (stopBtn) stopBtn.style.display = 'flex';
        
        const response = await fetch('/api/voice/text_to_speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
        
        const data = await response.json();
        
        // Estimate speech duration (roughly 150 words per minute)
        const words = text.split(' ').length;
        const duration = (words / 150) * 60 * 1000;
        
        setTimeout(() => {
            isSpeaking = false;
            if (stopBtn) stopBtn.style.display = 'none';
        }, duration);
        
    } catch (error) {
        console.error('TTS error:', error);
        isSpeaking = false;
        const stopBtn = document.getElementById('stopSpeakBtn');
        if (stopBtn) stopBtn.style.display = 'none';
    }
}

// Stop speaking
async function stopSpeaking() {
    try {
        await fetch('/api/voice/stop_speaking', {
            method: 'POST'
        });
        
        isSpeaking = false;
        const stopBtn = document.getElementById('stopSpeakBtn');
        if (stopBtn) stopBtn.style.display = 'none';
    } catch (error) {
        console.error('Error stopping speech:', error);
    }
}

// Update speech rate
async function updateSpeechRate(rate) {
    try {
        await fetch('/api/voice/set_rate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rate: parseInt(rate) })
        });
    } catch (error) {
        console.error('Error setting rate:', error);
    }
}

// Add message to UI
function addVoiceMessage(role, content) {
    const messagesDiv = document.getElementById('voiceMessages');
    if (!messagesDiv) return;
    
    // Remove empty state if present
    const emptyState = messagesDiv.querySelector('.voice-empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `voice-message ${role}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = role === 'user' ? '👤' : '🤖';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = content;
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);
    messagesDiv.appendChild(messageDiv);
    
    // Scroll to bottom
    const container = document.getElementById('voiceMessagesContainer');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
    
    // Save to messages array
    voiceMessages.push({ role, content });
}

// Show typing indicator
function showTypingIndicator() {
    const messagesDiv = document.getElementById('voiceMessages');
    if (!messagesDiv) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'voice-message assistant';
    indicator.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-bubble" style="display: flex; align-items: center; gap: 0.5rem;">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
            <span>Thinking...</span>
        </div>
    `;
    
    // Add typing dots animation if not already added
    if (!document.getElementById('typingDotsStyle')) {
        const style = document.createElement('style');
        style.id = 'typingDotsStyle';
        style.textContent = `
            .typing-dots { display: flex; gap: 4px; }
            .typing-dots span {
                width: 8px; height: 8px; border-radius: 50%;
                background: currentColor; opacity: 0.4;
                animation: typingDot 1.4s infinite;
            }
            .typing-dots span:nth-child(1) { animation-delay: 0s; }
            .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
            .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typingDot {
                0%, 60%, 100% { opacity: 0.4; transform: scale(1); }
                30% { opacity: 1; transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
    
    messagesDiv.appendChild(indicator);
    
    const container = document.getElementById('voiceMessagesContainer');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Create new voice chat
async function createNewVoiceChat() {
    try {
        const response = await fetch('/api/voice/new_chat', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentVoiceChatId = null;
            voiceMessages = [];
            const messagesDiv = document.getElementById('voiceMessages');
            if (messagesDiv) {
                messagesDiv.innerHTML = `
                    <div class="voice-empty-state">
                        <div class="voice-empty-icon">
                            <div class="microphone-animation">
                                <i class="bi bi-mic-fill"></i>
                                <div class="sound-wave">
                                    <span></span><span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                        <h3>Ready to Listen</h3>
                        <p>Click and hold the microphone button to speak, or type your message below</p>
                        <div class="quick-tips">
                            <div class="tip-item">
                                <i class="bi bi-lightbulb-fill"></i>
                                <span>Ask about your notes</span>
                            </div>
                            <div class="tip-item">
                                <i class="bi bi-search"></i>
                                <span>Search for information</span>
                            </div>
                            <div class="tip-item">
                                <i class="bi bi-chat-dots-fill"></i>
                                <span>Natural conversation</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            loadVoiceChatHistory();
            showNotification('New conversation started', 'success');
        }
    } catch (error) {
        console.error('Error creating new chat:', error);
        showNotification('Error creating new chat', 'danger');
    }
}

// Load voice chat history
async function loadVoiceChatHistory() {
    try {
        const response = await fetch('/api/get_chats');
        const data = await response.json();
        
        const historyDiv = document.getElementById('voiceChatHistory');
        if (!historyDiv) return;
        
        historyDiv.innerHTML = '';
        
        if (data.chats && data.chats.length > 0) {
            data.chats.slice(0, 10).forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.className = 'voice-history-item';
                chatItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div onclick="loadVoiceChat('${chat.id}')" style="flex: 1; cursor: pointer;">
                            <div style="font-weight: 600; margin-bottom: 0.25rem;">${chat.title}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${chat.date}</div>
                        </div>
                        <button onclick="deleteVoiceChat('${chat.id}', event)" 
                                style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.5rem;">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
                historyDiv.appendChild(chatItem);
            });
        } else {
            historyDiv.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No conversations yet</p>';
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Load specific voice chat
async function loadVoiceChat(chatId) {
    try {
        const response = await fetch(`/api/load_chat/${chatId}`);
        const data = await response.json();
        
        if (data.success) {
            currentVoiceChatId = chatId;
            voiceMessages = data.messages;
            
            const messagesDiv = document.getElementById('voiceMessages');
            if (messagesDiv) {
                messagesDiv.innerHTML = '';
                
                data.messages.forEach(msg => {
                    addVoiceMessage(msg.role, msg.content);
                });
            }
            
            const panel = document.getElementById('settingsPanel');
            if (panel) panel.classList.remove('open');
        }
    } catch (error) {
        console.error('Error loading chat:', error);
        showNotification('Error loading chat', 'danger');
    }
}

// Delete voice chat
async function deleteVoiceChat(chatId, event) {
    event.stopPropagation();
    
    if (!confirm('Delete this conversation?')) return;
    
    try {
        const response = await fetch(`/api/delete_chat/${chatId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadVoiceChatHistory();
            if (currentVoiceChatId === chatId) {
                createNewVoiceChat();
            }
            showNotification('Conversation deleted', 'success');
        }
    } catch (error) {
        console.error('Error deleting chat:', error);
        showNotification('Error deleting chat', 'danger');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const colors = {
        'success': '#22c55e',
        'danger': '#ef4444',
        'warning': '#f59e0b',
        'info': '#6366f1'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 90px;
        right: 2rem;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add slide animations
if (!document.getElementById('slideAnimations')) {
    const animStyle = document.createElement('style');
    animStyle.id = 'slideAnimations';
    animStyle.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(animStyle);
}
