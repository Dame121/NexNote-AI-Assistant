// Main JavaScript for NexNote Flask Application
// Handles sidebar interactions, file uploads, and common functionality

// ==================== SIDEBAR TOGGLE ====================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    
    // Save preference to localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    
    // Update toggle button icon
    const icon = toggleBtn.querySelector('.toggle-icon');
    icon.textContent = isCollapsed ? '☰' : '✕';
}

// Initialize sidebar state from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.getElementById('sidebarToggle');
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.toggle-icon');
            icon.textContent = '☰';
        }
    }
});

// ==================== UTILITY FUNCTIONS ====================

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }
}

// ==================== CHAT HISTORY ====================

function loadChatHistory() {
    fetch('/api/get_chats')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('chatHistoryContainer');
            const loading = document.getElementById('chatHistoryLoading');
            
            if (loading) loading.remove();
            
            if (data.chats && data.chats.length > 0) {
                container.innerHTML = `
                    <div class="chat-list">
                        ${data.chats.map(chat => `
                            <div class="chat-item">
                                <button class="chat-btn" onclick="loadChat('${chat.id}')">
                                    💬 ${chat.title}
                                </button>
                                <button class="delete-btn" onclick="deleteChat('${chat.id}')" title="Delete">
                                    🗑️
                                </button>
                                <small class="chat-meta">
                                    ${new Date(chat.timestamp).toLocaleDateString()} • ${chat.message_count} msgs
                                </small>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = '<p class="text-muted">💭 No chat history yet</p>';
            }
        })
        .catch(error => {
            console.error('Error loading chat history:', error);
            const container = document.getElementById('chatHistoryContainer');
            container.innerHTML = '<p class="text-muted">Error loading chats</p>';
        });
}

function startNewChat() {
    fetch('/api/new_chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/chat';
        }
    })
    .catch(error => {
        console.error('Error starting new chat:', error);
        showToast('Error starting new chat', 'error');
    });
}

function loadChat(chatId) {
    fetch(`/api/load_chat/${chatId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/chat';
            }
        })
        .catch(error => {
            console.error('Error loading chat:', error);
            showToast('Error loading chat', 'error');
        });
}

function deleteChat(chatId) {
    if (!confirm('Are you sure you want to delete this chat?')) {
        return;
    }
    
    fetch(`/api/delete_chat/${chatId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Chat deleted', 'success');
            loadChatHistory();
        } else {
            showToast('Error deleting chat', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting chat:', error);
        showToast('Error deleting chat', 'error');
    });
}

// ==================== FILE UPLOAD ====================

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const files = this.files;
            const label = document.querySelector('.file-label .label-text');
            const selectedFilesDiv = document.getElementById('selectedFiles');
            
            if (files.length > 0) {
                label.textContent = `${files.length} file(s) selected`;
                
                // Show selected files
                selectedFilesDiv.style.display = 'block';
                selectedFilesDiv.innerHTML = Array.from(files).map(file => {
                    const sizeInKB = (file.size / 1024).toFixed(2);
                    return `
                        <div class="selected-file-item">
                            <span class="selected-file-name">📄 ${file.name}</span>
                            <span class="selected-file-size">${sizeInKB} KB</span>
                        </div>
                    `;
                }).join('');
                
                // Auto-process files
                processFiles(files);
            } else {
                label.textContent = 'Choose Files';
                selectedFilesDiv.style.display = 'none';
            }
        });
    }
    
    function processFiles(files) {
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files[]', file);
        });
        
        const statusDiv = document.getElementById('uploadStatus');
        
        // Show upload progress
        statusDiv.innerHTML = `
            <div class="upload-progress">
                <div>📤 Processing ${files.length} file(s)...</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
                <div class="progress-text" id="progressText">Uploading...</div>
            </div>
        `;
        
        // Simulate progress (since fetch doesn't support progress tracking easily)
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressBar.style.width = progress + '%';
                progressText.textContent = `Processing... ${progress}%`;
            }
        }, 200);
        
        fetch('/api/upload_files', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            
            if (data.success) {
                statusDiv.innerHTML = `<div class="status-item success">✅ ${data.uploaded_count} file(s) processed successfully!</div>`;
                showToast(`${data.uploaded_count} file(s) uploaded successfully!`, 'success');
                
                // Immediately refresh knowledge base
                loadKnowledgeBase();
                
                // Reset form after a delay
                setTimeout(() => {
                    uploadForm.reset();
                    document.querySelector('.file-label .label-text').textContent = 'Choose Files';
                    document.getElementById('selectedFiles').style.display = 'none';
                    statusDiv.innerHTML = '';
                }, 3000);
            } else {
                statusDiv.innerHTML = `<div class="status-item error">❌ ${data.error}</div>`;
                showToast('Upload failed: ' + data.error, 'error');
            }
        })
        .catch(error => {
            clearInterval(progressInterval);
            console.error('Error uploading files:', error);
            statusDiv.innerHTML = '<div class="status-item error">❌ Error uploading files</div>';
            showToast('Error uploading files', 'error');
        });
    }
    
    // Load initial data
    loadChatHistory();
    loadKnowledgeBase();
});

// ==================== KNOWLEDGE BASE ====================

function loadKnowledgeBase() {
    fetch('/api/get_uploaded_files')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('knowledgeBase');
            
            if (data.files && Object.keys(data.files).length > 0) {
                const fileCount = Object.keys(data.files).length;
                const totalChunks = Object.values(data.files).reduce((sum, chunks) => sum + chunks, 0);
                
                container.innerHTML = `
                    <div class="kb-summary">
                        <div class="kb-info">
                            <div class="kb-count">${fileCount}</div>
                            <div class="kb-label">Files • ${totalChunks} Chunks</div>
                        </div>
                        <div class="kb-icon">📚</div>
                    </div>
                    <details class="file-list">
                        <summary>
                            <span>📄 View All Files</span>
                            <span class="expand-icon">▼</span>
                        </summary>
                        <div class="files">
                            ${Object.entries(data.files).map(([filename, chunks]) => `
                                <div class="file-item">
                                    📎 <strong>${filename}</strong>
                                    <span class="file-chunks">${chunks} chunks</span>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                `;
            } else {
                container.innerHTML = `
                    <div class="kb-summary" style="flex-direction: column; align-items: center; text-align: center; padding: 1.5rem;">
                        <div class="kb-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">📭</div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">No files uploaded yet</div>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading knowledge base:', error);
            const container = document.getElementById('knowledgeBase');
            container.innerHTML = '<p class="text-muted">Error loading files</p>';
        });
}

// ==================== MANAGEMENT ====================

function clearConversation() {
    if (!confirm('Are you sure you want to clear the current conversation?')) {
        return;
    }
    
    fetch('/api/new_chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Conversation cleared', 'success');
            window.location.href = '/chat';
        }
    })
    .catch(error => {
        console.error('Error clearing conversation:', error);
        showToast('Error clearing conversation', 'error');
    });
}

function clearKnowledgeBase() {
    if (!confirm('⚠️ This will delete ALL uploaded notes from the database. Are you sure?')) {
        return;
    }
    
    const kbContainer = document.getElementById('knowledgeBase');
    kbContainer.innerHTML = '<div class="loading">Clearing knowledge base...</div>';
    
    fetch('/api/clear_knowledge_base', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Knowledge base cleared successfully', 'success');
            // Immediately refresh to show empty state
            loadKnowledgeBase();
        } else {
            showToast('Error clearing knowledge base', 'error');
            loadKnowledgeBase();
        }
    })
    .catch(error => {
        console.error('Error clearing knowledge base:', error);
        showToast('Error clearing knowledge base', 'error');
        loadKnowledgeBase();
    });
}

// ==================== TABS ====================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Initialize tabs on page load
document.addEventListener('DOMContentLoaded', initializeTabs);
