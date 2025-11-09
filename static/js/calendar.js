// Calendar functionality for NexNote Flask Application

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    // Handle multi-line messages
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${formattedMessage}</span>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after duration (longer for multi-line messages)
    const duration = message.includes('\n') ? 5000 : 3000;
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    initializeTabs();
    
    // Set default date and time for form
    setDefaultDateTime();
    
    // Event form submission
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Load events on upcoming tab click
    const upcomingTab = document.querySelector('[data-tab="upcoming"]');
    if (upcomingTab) {
        upcomingTab.addEventListener('click', function() {
            setTimeout(loadUpcomingEvents, 100);
        });
    }
});

// ==================== TAB FUNCTIONALITY ====================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn-modern');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn-modern').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content-modern').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}-tab`);
    
    if (selectedButton) selectedButton.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

// ==================== UTILITY FUNCTIONS ====================

function fillExample(text) {
    const input = document.getElementById('naturalLanguageInput');
    if (input) {
        input.value = text;
        input.focus();
    }
}

function setDefaultDateTime() {
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventTime');
    
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    if (timeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
}

// ==================== AUTHENTICATION ====================

async function authenticateCalendar() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Connecting...';
    
    try {
        const response = await fetch('/api/calendar/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Successfully connected to Google Calendar!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            const errorMsg = data.error || 'Authentication failed';
            if (errorMsg.includes('credentials') || errorMsg.includes('credentials.json')) {
                showToast('❌ credentials.json not found!\n\nPlease:\n1. Create Google Cloud Project\n2. Enable Calendar API\n3. Download credentials.json\n4. Place it in: D:\\Flask App Backup\\', 'error');
            } else {
                showToast(`❌ Authentication failed: ${errorMsg}`, 'error');
            }
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showToast('❌ Connection error. Make sure Flask server is running.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ==================== INPUT METHOD TOGGLE ====================

function toggleInputMethod() {
    const naturalInput = document.getElementById('naturalInput');
    const formInput = document.getElementById('formInput');
    const selectedMethod = document.querySelector('input[name="inputMethod"]:checked').value;
    
    if (selectedMethod === 'natural') {
        naturalInput.style.display = 'block';
        formInput.style.display = 'none';
    } else {
        naturalInput.style.display = 'none';
        formInput.style.display = 'block';
    }
}

// ==================== CREATE EVENT ====================

async function createEventFromText() {
    const input = document.getElementById('naturalLanguageInput');
    const text = input.value.trim();
    
    if (!text) {
        showToast('⚠️ Please enter what you want to schedule', 'warning');
        return;
    }
    
    // Show loading toast
    showToast('⏳ Creating your event...', 'info');
    
    try {
        const response = await fetch('/api/calendar/create_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ natural_language: text })
        });
        
        const data = await response.json();
        
        if (response.status === 401 && data.needs_auth) {
            // Need authentication
            showToast('🔐 Please authenticate first!\n\nClick "Connect Google Calendar" to set up calendar access.', 'warning');
            return;
        }
        
        if (data.success) {
            // Format the event time nicely
            const eventDate = new Date(data.event.start);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            showToast(`🎉 Event created successfully!\n📅 ${data.event.title}\n🕐 ${formattedDate}`, 'success');
            input.value = '';
            
            // Switch to upcoming events tab to show the new event
            switchTab('upcoming');
            loadUpcomingEvents();
        } else {
            showToast(`❌ ${data.error || 'Failed to create event'}`, 'error');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showToast('❌ Error creating event. Please try again.', 'error');
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    const eventForm = document.getElementById('eventForm');
    
    if (eventForm) {
        eventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleFormSubmit(e);
        });
    }
    
    // Set default date to today and time to current hour
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventTime');
    
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    if (timeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const duration = document.getElementById('eventDuration').value;
    const description = document.getElementById('eventDescription').value;
    const reminder = document.getElementById('eventReminder').value;
    
    // Show loading toast
    showToast('⏳ Creating your event...', 'info');
    
    try {
        const response = await fetch('/api/calendar/create_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                date,
                time,
                duration: parseInt(duration),
                description,
                reminder: parseInt(reminder)
            })
        });
        
        const data = await response.json();
        
        if (response.status === 401 && data.needs_auth) {
            // Need authentication
            showToast('🔐 Please authenticate first!\n\nClick "Connect Google Calendar" to set up calendar access.', 'warning');
            return;
        }
        
        if (data.success) {
            // Format the event time nicely
            const eventDate = new Date(data.event.start);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            showToast(`🎉 Event created successfully!\n📅 ${title}\n🕐 ${formattedDate}\n⏱️ Duration: ${duration} minutes\n🔔 Reminder: ${reminder} min before`, 'success');
            document.getElementById('eventForm').reset();
            setDefaultDateTime();
            
            // Switch to upcoming events tab
            switchTab('upcoming');
            loadUpcomingEvents();
        } else {
            showToast(`❌ ${data.error || 'Failed to create event'}`, 'error');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showToast('❌ Error creating event. Please try again.', 'error');
    }
}

// ==================== UPCOMING EVENTS ====================

async function loadUpcomingEvents() {
    const eventsDiv = document.getElementById('upcomingEvents');
    const maxEvents = document.getElementById('maxEvents').value;
    
    eventsDiv.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading events...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/calendar/get_events?max_results=${maxEvents}`);
        const data = await response.json();
        
        if (response.status === 401 && data.needs_auth) {
            eventsDiv.innerHTML = `
                <div class="loading-state">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🔐</div>
                    <h3>Authentication Required</h3>
                    <p>Please authenticate with Google Calendar first</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Go to Authentication
                    </button>
                </div>
            `;
            return;
        }
        
        if (data.error) {
            eventsDiv.innerHTML = `<div class="status-item error">❌ ${data.error}</div>`;
            return;
        }
        
        if (!data.events || data.events.length === 0) {
            eventsDiv.innerHTML = `
                <div class="loading-state">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
                    <p>No upcoming events scheduled</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        data.events.forEach(event => {
            const startDate = new Date(event.start);
            const formattedDate = startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div class="event-item-modern">
                    <div class="event-header-modern">
                        <div class="event-info">
                            <h4 class="event-title-modern">${event.summary || 'No title'}</h4>
                            <p class="event-time-modern">
                                <span>📅</span> ${formattedDate}
                            </p>
                            ${event.description ? `<p class="event-desc">${event.description}</p>` : ''}
                        </div>
                        <div class="event-actions">
                            ${event.htmlLink ? `
                                <a href="${event.htmlLink}" target="_blank" class="btn btn-outline btn-event-action">
                                    🔗 Open
                                </a>
                            ` : ''}
                            <button class="btn btn-danger btn-event-action" onclick="deleteEvent('${event.id}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        eventsDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading events:', error);
        eventsDiv.innerHTML = '<div class="status-item error">❌ Error loading events</div>';
    }
}

async function deleteEvent(eventId) {
    if (!confirm('⚠️ Are you sure you want to delete this event?')) {
        return;
    }
    
    // Show loading toast
    showToast('⏳ Deleting event...', 'info');
    
    try {
        const response = await fetch(`/api/calendar/delete_event/${eventId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('🗑️ Event deleted successfully!', 'success');
            loadUpcomingEvents();
        } else {
            showToast('❌ Failed to delete event', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('❌ Error deleting event', 'error');
    }
}

// ==================== STUDY PLANNER ====================

async function scheduleTemplate(type) {
    let title, hour, description;
    
    switch (type) {
        case 'morning':
            title = 'Morning Study Session';
            hour = 6;
            description = 'Deep focus morning study';
            break;
        case 'afternoon':
            title = 'Afternoon Revision';
            hour = 14;
            description = 'Review and practice';
            break;
        case 'evening':
            title = 'Evening Practice Session';
            hour = 20;
            description = 'Problem solving and practice';
            break;
    }
    
    // Get tomorrow's date at the specified hour
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, 0, 0, 0);
    
    const date = tomorrow.toISOString().split('T')[0];
    const time = `${String(hour).padStart(2, '0')}:00`;
    
    // Show loading toast
    showToast('⏳ Scheduling your study session...', 'info');
    
    try {
        const response = await fetch('/api/calendar/create_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                date,
                time,
                duration: 120,
                description,
                reminder: 30
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const formattedDate = tomorrow.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            showToast(`🎉 Study session scheduled!\n📚 ${title}\n📅 Tomorrow, ${formattedDate} at ${hour === 6 ? '6:00 AM' : hour === 14 ? '2:00 PM' : '8:00 PM'}\n⏱️ Duration: 2 hours`, 'success');
            
            // Switch to upcoming events tab
            switchTab('upcoming');
            loadUpcomingEvents();
        } else {
            showToast(`❌ Failed to schedule: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error scheduling template:', error);
        showToast('❌ Error scheduling event. Please try again.', 'error');
    }
}

async function quickSchedule() {
    const subjectInput = document.getElementById('subjectInput');
    const subject = subjectInput.value.trim();
    
    if (!subject) {
        showToast('⚠️ Please enter a subject name', 'warning');
        return;
    }
    
    // Get tomorrow at 8 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    
    const date = tomorrow.toISOString().split('T')[0];
    const time = '20:00';
    
    // Show loading toast
    showToast('⏳ Scheduling your study session...', 'info');
    
    try {
        const response = await fetch('/api/calendar/create_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: `${subject} Revision`,
                date,
                time,
                duration: 60,
                description: `Study session for ${subject}`,
                reminder: 30
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const formattedDate = tomorrow.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            showToast(`🎉 Study session scheduled!\n📚 ${subject} Revision\n📅 Tomorrow, ${formattedDate} at 8:00 PM\n⏱️ Duration: 1 hour\n🔔 Reminder: 30 min before`, 'success');
            subjectInput.value = '';
            
            // Switch to upcoming events tab
            switchTab('upcoming');
            loadUpcomingEvents();
        } else {
            showToast(`❌ Failed to schedule: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error scheduling event:', error);
        showToast('❌ Error scheduling event. Please try again.', 'error');
    }
}

// ==================== INITIALIZATION ====================

// Load upcoming events when switching to that tab
document.addEventListener('DOMContentLoaded', function() {
    const upcomingTab = document.querySelector('[data-tab="upcoming"]');
    if (upcomingTab) {
        upcomingTab.addEventListener('click', function() {
            setTimeout(loadUpcomingEvents, 100);
        });
    }
});
