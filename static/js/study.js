// Study Tools functionality

let currentQuiz = null;
let currentFlashcards = null;
let currentCard = 0;

// ==================== SUMMARY ====================

async function generateSummary() {
    const fileSelect = document.getElementById('summaryFileSelect');
    const filename = fileSelect.value;
    
    if (!filename) {
        showToast('Please select a file', 'warning');
        return;
    }
    
    const resultDiv = document.getElementById('summaryResult');
    resultDiv.innerHTML = '<div class="loading">Generating summary...</div>';
    
    try {
        const response = await fetch('/api/generate_summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: filename })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="status-item error">❌ ${data.error}</div>`;
        } else {
            resultDiv.innerHTML = `
                <div class="summary-result">
                    <h4 style="margin-bottom: 1rem;">📝 Summary of ${filename}</h4>
                    <div style="line-height: 1.8;">
                        ${formatMessage(data.summary)}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error generating summary:', error);
        resultDiv.innerHTML = '<div class="status-item error">❌ Error generating summary</div>';
    }
}

// ==================== QUIZ ====================

async function generateQuiz() {
    const fileSelect = document.getElementById('quizFileSelect');
    const filename = fileSelect.value;
    const numQuestions = document.getElementById('numQuestions').value;
    
    if (!filename) {
        showToast('Please select a file', 'warning');
        return;
    }
    
    const resultDiv = document.getElementById('quizResult');
    resultDiv.innerHTML = '<div class="loading">Generating quiz...</div>';
    
    try {
        const response = await fetch('/api/generate_quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                filename: filename,
                num_questions: parseInt(numQuestions)
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="status-item error">❌ ${data.error}</div>`;
        } else {
            currentQuiz = {
                questions: data.questions,
                answers: {},
                filename: filename
            };
            displayQuiz();
        }
    } catch (error) {
        console.error('Error generating quiz:', error);
        resultDiv.innerHTML = '<div class="status-item error">❌ Error generating quiz</div>';
    }
}

function displayQuiz() {
    const resultDiv = document.getElementById('quizResult');
    
    let html = '<div class="quiz-container">';
    html += `<h4 style="margin-bottom: 1.5rem;">❓ Quiz (${currentQuiz.questions.length} Questions)</h4>`;
    
    currentQuiz.questions.forEach((q, index) => {
        html += `
            <div class="quiz-question" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--dark-bg); border-radius: 0.5rem;">
                <p style="font-weight: 600; margin-bottom: 1rem;">Q${index + 1}: ${q.question}</p>
                <div class="quiz-options">
                    ${Object.entries(q.options).map(([key, value]) => `
                        <label style="display: block; margin: 0.5rem 0; padding: 0.75rem; background: var(--card-bg); border-radius: 0.5rem; cursor: pointer;">
                            <input type="radio" name="q${index}" value="${key}" onchange="saveAnswer(${index}, '${key}')">
                            <strong>${key}:</strong> ${value}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    html += '<button class="btn btn-primary" onclick="submitQuiz()">Submit Quiz</button>';
    html += '</div>';
    
    resultDiv.innerHTML = html;
}

function saveAnswer(questionIndex, answer) {
    currentQuiz.answers[questionIndex] = answer;
}

async function submitQuiz() {
    const resultDiv = document.getElementById('quizResult');
    resultDiv.innerHTML = '<div class="loading">Grading quiz...</div>';
    
    try {
        const response = await fetch('/api/submit_quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                questions: currentQuiz.questions,
                answers: currentQuiz.answers,
                filename: currentQuiz.filename
            })
        });
        
        const data = await response.json();
        
        let html = '<div class="quiz-results">';
        html += `<h3 style="margin-bottom: 1rem;">🎯 Quiz Results</h3>`;
        html += `<div class="score-box" style="padding: 2rem; background: var(--primary-color); border-radius: 1rem; text-align: center; margin-bottom: 2rem;">`;
        html += `<h2 style="font-size: 3rem; margin-bottom: 0.5rem;">${data.score}%</h2>`;
        html += `<p style="font-size: 1.2rem;">${data.correct} out of ${data.total} correct</p>`;
        html += `</div>`;
        
        // Show detailed results
        html += '<h4 style="margin-bottom: 1rem;">📋 Detailed Results</h4>';
        currentQuiz.questions.forEach((q, index) => {
            const userAnswer = currentQuiz.answers[index];
            const correct = userAnswer === q.correct;
            
            html += `
                <div class="question-result" style="margin-bottom: 1.5rem; padding: 1rem; background: var(--dark-bg); border-radius: 0.5rem; border-left: 4px solid ${correct ? 'var(--success-color)' : 'var(--danger-color)'};">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">
                        ${correct ? '✅' : '❌'} Q${index + 1}: ${q.question}
                    </p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                        Your answer: <strong>${userAnswer ? q.options[userAnswer] : 'Not answered'}</strong>
                    </p>
                    ${!correct ? `<p style="color: var(--success-color); font-size: 0.9rem;">Correct answer: <strong>${q.options[q.correct]}</strong></p>` : ''}
                    ${q.explanation ? `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;"><em>${q.explanation}</em></p>` : ''}
                </div>
            `;
        });
        
        html += '<button class="btn btn-secondary" onclick="generateQuiz()">Take Another Quiz</button>';
        html += '</div>';
        
        resultDiv.innerHTML = html;
        showToast(`Quiz completed! Score: ${data.score}%`, 'success');
    } catch (error) {
        console.error('Error submitting quiz:', error);
        resultDiv.innerHTML = '<div class="status-item error">❌ Error submitting quiz</div>';
    }
}

// ==================== CONCEPTS ====================

async function extractConcepts() {
    const fileSelect = document.getElementById('conceptsFileSelect');
    const filename = fileSelect.value;
    
    if (!filename) {
        showToast('Please select a file', 'warning');
        return;
    }
    
    const resultDiv = document.getElementById('conceptsResult');
    resultDiv.innerHTML = '<div class="loading">Extracting concepts...</div>';
    
    try {
        const response = await fetch('/api/extract_concepts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: filename })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="status-item error">❌ ${data.error}</div>`;
        } else {
            const concepts = data.concepts;
            resultDiv.innerHTML = `
                <div class="concepts-result">
                    <h4 style="margin-bottom: 1.5rem;">🎯 Key Concepts from ${filename}</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                        <div class="concept-box" style="padding: 1.5rem; background: var(--dark-bg); border-radius: 0.75rem;">
                            <h5 style="margin-bottom: 1rem; color: var(--primary-color);">📌 Main Topics</h5>
                            <ul style="list-style-position: inside; color: var(--text-secondary);">
                                ${concepts.topics.map(t => `<li>${t}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="concept-box" style="padding: 1.5rem; background: var(--dark-bg); border-radius: 0.75rem;">
                            <h5 style="margin-bottom: 1rem; color: var(--secondary-color);">📖 Key Terms</h5>
                            <ul style="list-style-position: inside; color: var(--text-secondary);">
                                ${concepts.terms.map(t => `<li>${t}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="concept-box" style="padding: 1.5rem; background: var(--dark-bg); border-radius: 0.75rem;">
                            <h5 style="margin-bottom: 1rem; color: var(--info-color);">⭐ Important Points</h5>
                            <ul style="list-style-position: inside; color: var(--text-secondary);">
                                ${concepts.points.map(p => `<li>${p}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error extracting concepts:', error);
        resultDiv.innerHTML = '<div class="status-item error">❌ Error extracting concepts</div>';
    }
}

// ==================== FLASHCARDS ====================

async function generateFlashcards() {
    const fileSelect = document.getElementById('flashcardsFileSelect');
    const filename = fileSelect.value;
    const numCards = document.getElementById('numCards').value;
    
    if (!filename) {
        showToast('Please select a file', 'warning');
        return;
    }
    
    const resultDiv = document.getElementById('flashcardsResult');
    resultDiv.innerHTML = '<div class="loading">Generating flashcards...</div>';
    
    try {
        const response = await fetch('/api/generate_flashcards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: filename,
                num_cards: parseInt(numCards)
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="status-item error">❌ ${data.error}</div>`;
        } else {
            currentFlashcards = data.flashcards;
            currentCard = 0;
            displayFlashcard();
        }
    } catch (error) {
        console.error('Error generating flashcards:', error);
        resultDiv.innerHTML = '<div class="status-item error">❌ Error generating flashcards</div>';
    }
}

function displayFlashcard() {
    const resultDiv = document.getElementById('flashcardsResult');
    const card = currentFlashcards[currentCard];
    
    let html = `
        <div class="flashcard-container">
            <p style="text-align: center; margin-bottom: 1rem; color: var(--text-secondary);">
                Card ${currentCard + 1} of ${currentFlashcards.length}
            </p>
            <div class="flashcard" id="flashcard" style="background: var(--primary-color); padding: 3rem 2rem; border-radius: 1rem; min-height: 200px; display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; margin-bottom: 1.5rem;" onclick="flipCard()">
                <div class="card-front" id="cardFront">
                    <h3>${card.front}</h3>
                </div>
                <div class="card-back" id="cardBack" style="display: none;">
                    <p style="font-size: 1.1rem;">${card.back}</p>
                </div>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn btn-outline" onclick="previousCard()" ${currentCard === 0 ? 'disabled' : ''}>
                    ⬅️ Previous
                </button>
                <button class="btn btn-secondary" onclick="flipCard()">
                    🔄 Flip Card
                </button>
                <button class="btn btn-outline" onclick="nextCard()" ${currentCard === currentFlashcards.length - 1 ? 'disabled' : ''}>
                    Next ➡️
                </button>
            </div>
        </div>
    `;
    
    resultDiv.innerHTML = html;
}

function flipCard() {
    const cardFront = document.getElementById('cardFront');
    const cardBack = document.getElementById('cardBack');
    
    if (cardFront.style.display !== 'none') {
        cardFront.style.display = 'none';
        cardBack.style.display = 'block';
    } else {
        cardFront.style.display = 'block';
        cardBack.style.display = 'none';
    }
}

function previousCard() {
    if (currentCard > 0) {
        currentCard--;
        displayFlashcard();
    }
}

function nextCard() {
    if (currentCard < currentFlashcards.length - 1) {
        currentCard++;
        displayFlashcard();
    }
}

// ==================== PROGRESS ====================

async function loadStudyProgress() {
    const resultDiv = document.getElementById('progressResult');
    resultDiv.innerHTML = '<div class="loading">Loading progress...</div>';
    
    try {
        const response = await fetch('/api/get_study_progress');
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="status-item error">❌ ${data.error}</div>`;
        } else {
            const progress = data.progress;
            
            if (Object.keys(progress).length === 0) {
                resultDiv.innerHTML = '<p class="text-muted">📊 No study progress yet. Take some quizzes to start tracking!</p>';
                return;
            }
            
            let html = '<div class="progress-list">';
            
            for (const [filename, data] of Object.entries(progress)) {
                const sessions = data.sessions || [];
                const scoredSessions = sessions.filter(s => s.score !== null && s.score !== undefined);
                const avgScore = scoredSessions.length > 0 
                    ? scoredSessions.reduce((sum, s) => sum + s.score, 0) / scoredSessions.length 
                    : 0;
                
                html += `
                    <details class="progress-item" style="margin-bottom: 1rem; background: var(--dark-bg); border-radius: 0.5rem; padding: 1rem;">
                        <summary style="cursor: pointer; font-weight: 600;">
                            📄 ${filename}
                        </summary>
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                            <p><strong>Total Sessions:</strong> ${sessions.length}</p>
                            ${scoredSessions.length > 0 ? `<p><strong>Average Score:</strong> ${avgScore.toFixed(0)}%</p>` : ''}
                            <p><strong>First Studied:</strong> ${new Date(data.first_studied).toLocaleDateString()}</p>
                            <p><strong>Last Studied:</strong> ${new Date(data.last_studied).toLocaleDateString()}</p>
                            
                            ${scoredSessions.length > 0 ? `
                                <div style="margin-top: 1rem;">
                                    <strong>Recent Scores:</strong>
                                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                                        ${scoredSessions.slice(-5).map(s => `
                                            <span class="badge ${s.score >= 70 ? 'badge-success' : 'badge-secondary'}">${s.score}%</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </details>
                `;
            }
            
            html += '</div>';
            resultDiv.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        resultDiv.innerHTML = '<div class="status-item error">❌ Error loading progress</div>';
    }
}

// Helper function for message formatting (same as in chat.js)
function formatMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}
