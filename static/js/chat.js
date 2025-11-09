// Chat functionality for NexNote Flask Application

let currentSources = [];
let messageIdCounter = 0;

// ==================== UTILITIES ====================

function scrollToBottom(smooth = true) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

function fillPrompt(text) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = text;
    messageInput.focus();
    // Auto-resize
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight) + 'px';
}

function clearInput() {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();
}

function clearCurrentChat() {
    if (confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
        fetch('/api/new_chat', { method: 'POST' })
            .then(() => window.location.reload())
            .catch(err => showToast('Failed to clear chat', 'error'));
    }
}

function updateChatStats() {
    const messages = document.querySelectorAll('.message-wrapper:not(.typing-indicator .message-wrapper)');
    const messageCount = Math.floor(messages.length / 2); // Divide by 2 (user + assistant pairs)
    document.getElementById('messageCount').textContent = messageCount;
}

function copyMessage(button) {
    const messageText = button.closest('.message-content').querySelector('.message-text').innerText;
    navigator.clipboard.writeText(messageText).then(() => {
        showToast('Message copied to clipboard!', 'success');
        button.innerHTML = '<span>✅</span>';
        setTimeout(() => {
            button.innerHTML = '<span>📋</span>';
        }, 2000);
    }).catch(err => {
        showToast('Failed to copy message', 'error');
    });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== MESSAGE HANDLING ====================

function addMessageToChat(role, content, messageId = null) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Remove empty state if exists
    const emptyState = chatMessages.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const id = messageId || `msg-${++messageIdCounter}`;
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-wrapper ${role}`;
    messageWrapper.setAttribute('data-message-id', id);
    
    const avatar = role === 'user' ? '👤' : '🤖';
    const roleName = role === 'user' ? 'You' : 'NexNote';
    
    messageWrapper.innerHTML = `
        <div class="message-avatar">
            <span>${avatar}</span>
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-role">${roleName}</span>
                <div class="message-actions">
                    <button class="msg-action-btn" onclick="copyMessage(this)" title="Copy message">
                        <span>📋</span>
                    </button>
                </div>
            </div>
            <div class="message-text">${formatMessage(content)}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageWrapper);
    // Only auto-scroll for user messages (when you send), not for bot responses
    if (role === 'user') {
        scrollToBottom();
    }
    updateChatStats();
    
    return messageWrapper;
}

function formatMessage(text) {
    // Enhanced markdown-like formatting
    let formatted = text;
    
    // Code blocks (must come before inline code)
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Lists (unordered)
    formatted = formatted.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Numbered lists
    formatted = formatted.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // Headers
    formatted = formatted.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h3>$1</h3>');
    
    // Line breaks
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'block';
    // Don't auto-scroll to typing indicator - let user stay where they are
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'none';
}

function showSources(sources) {
    if (!sources || sources.length === 0) return;
    
    currentSources = sources;
    
    // Update context stat
    document.getElementById('contextUsed').textContent = 'Yes';
    
    // Create sources button
    const chatMessages = document.getElementById('chatMessages');
    const lastMessage = chatMessages.querySelector('.message-wrapper.assistant:last-of-type .message-content');
    
    if (lastMessage) {
        // Check if button already exists
        if (!lastMessage.querySelector('.sources-btn')) {
            const sourcesBtn = document.createElement('button');
            sourcesBtn.className = 'sources-btn btn btn-outline btn-sm';
            sourcesBtn.innerHTML = `<span>📚</span> View ${sources.length} Source${sources.length > 1 ? 's' : ''}`;
            sourcesBtn.onclick = openSourcesModal;
            
            const btnContainer = document.createElement('div');
            btnContainer.className = 'message-footer';
            btnContainer.appendChild(sourcesBtn);
            
            lastMessage.appendChild(btnContainer);
        }
    }
}

function openSourcesModal() {
    const modal = document.getElementById('sourcesModal');
    const content = document.getElementById('sourcesContent');
    
    content.innerHTML = currentSources.map((source, index) => `
        <div class="source-item">
            <div class="source-header">
                <span class="source-number">${index + 1}</span>
                <div class="source-info">
                    <h4 class="source-filename">📄 ${escapeHtml(source.filename)}</h4>
                    <span class="badge badge-info">Relevance: ${(source.score * 100).toFixed(1)}%</span>
                </div>
            </div>
            <div class="source-content">
                <p>${escapeHtml(source.text.substring(0, 300))}${source.text.length > 300 ? '...' : ''}</p>
            </div>
        </div>
    `).join('');
    
    modal.classList.add('active');
}

function closeSourcesModal() {
    const modal = document.getElementById('sourcesModal');
    modal.classList.remove('active');
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('sourcesModal');
    if (e.target === modal) {
        closeSourcesModal();
    }
});

// ==================== FORM HANDLING ====================

document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
    
    // Handle Enter key (send) and Shift+Enter (new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Handle form submission
    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Disable input
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.innerHTML = '<span class="send-icon">⏳</span><span class="send-text">Sending...</span>';
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Show typing indicator (without scrolling)
        showTypingIndicator();
        
        try {
            const response = await fetch('/api/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Hide typing indicator
            hideTypingIndicator();
            
            if (data.error) {
                addMessageToChat('assistant', `❌ **Error:** ${data.error}\n\nPlease make sure Ollama is running and the model is available.`);
                showToast('Failed to get response', 'error');
            } else {
                // Add assistant response and scroll to it
                addMessageToChat('assistant', data.response);
                // Now scroll to show the response
                scrollToBottom();
                
                // Update chat title if changed
                if (data.chat_title) {
                    const titleElement = document.getElementById('chatTitle');
                    if (titleElement) {
                        titleElement.textContent = data.chat_title;
                        document.title = `${data.chat_title} - NexNote AI`;
                    }
                }
                
                // Show sources if available
                if (data.sources && data.sources.length > 0) {
                    showSources(data.sources);
                } else {
                    document.getElementById('contextUsed').textContent = 'No';
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            hideTypingIndicator();
            addMessageToChat('assistant', `❌ **Connection Error**\n\nFailed to get response. Please check:\n\n- Is Ollama running? \`ollama serve\`\n- Is the model available? \`ollama list\`\n- Check the browser console for details`);
            showToast('Connection error - check console', 'error');
        } finally {
            // Re-enable input
            messageInput.disabled = false;
            sendButton.disabled = false;
            sendButton.innerHTML = '<span class="send-icon">📤</span><span class="send-text">Send</span>';
            messageInput.focus();
        }
    });
    
    // Focus input on load
    messageInput.focus();
    
    // Initial scroll to bottom
    scrollToBottom(false);
    
    // Update initial stats
    updateChatStats();
});
