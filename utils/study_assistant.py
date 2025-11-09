"""
Study Assistant Module
Advanced features for studying with uploaded notes
"""

import ollama
from typing import List, Dict, Optional
import json
from datetime import datetime
from pathlib import Path

# Study progress tracking directory
STUDY_PROGRESS_DIR = Path("study_progress")
STUDY_PROGRESS_DIR.mkdir(exist_ok=True)


def generate_summary(text: str, model: str = "deepseek-r1:1.5b") -> str:
    """Generate a concise summary of the given text"""
    try:
        prompt = f"""Summarize the following notes in a clear, concise way. 
Focus on the main points, key concepts, and important details.
Keep it brief but informative (3-5 bullet points).

Notes:
{text[:3000]}  

Summary:"""
        
        response = ollama.chat(
            model=model,
            messages=[{'role': 'user', 'content': prompt}]
        )
        
        return response['message']['content']
    except Exception as e:
        return f"Error generating summary: {str(e)}"


def generate_quiz(text: str, num_questions: int = 5, model: str = "deepseek-r1:1.5b") -> List[Dict]:
    """Generate quiz questions from the text"""
    try:
        prompt = f"""Based on the following notes, create {num_questions} multiple-choice questions to test understanding.

For each question:
- Make it specific and clear
- Provide 4 options (A, B, C, D)
- Mark the correct answer
- Add a brief explanation

Format as JSON array:
[{{"question": "...", "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}}, "correct": "A", "explanation": "..."}}]

Notes:
{text[:3000]}

Quiz:"""
        
        response = ollama.chat(
            model=model,
            messages=[{'role': 'user', 'content': prompt}]
        )
        
        # Try to parse JSON response
        content = response['message']['content']
        
        # Extract JSON from response
        start = content.find('[')
        end = content.rfind(']') + 1
        if start != -1 and end > start:
            json_str = content[start:end]
            questions = json.loads(json_str)
            return questions
        else:
            return [{
                "question": "What are the main topics covered in these notes?",
                "options": {
                    "A": "Please review the notes",
                    "B": "Unable to generate quiz",
                    "C": "Try again",
                    "D": "All of the above"
                },
                "correct": "A",
                "explanation": "Quiz generation encountered an error. Please try with shorter text."
            }]
            
    except Exception as e:
        return [{
            "question": f"Error: {str(e)}",
            "options": {"A": "Error", "B": "Error", "C": "Error", "D": "Error"},
            "correct": "A",
            "explanation": "An error occurred while generating the quiz."
        }]


def extract_key_concepts(text: str, model: str = "deepseek-r1:1.5b") -> Dict:
    """Extract key concepts, terms, and topics from text"""
    try:
        prompt = f"""Analyze the following notes and extract:
1. Main Topics (3-5 major subjects covered)
2. Key Terms (important vocabulary or concepts)
3. Important Points (critical information to remember)

Format as JSON:
{{"topics": ["topic1", "topic2", ...], "terms": ["term1", "term2", ...], "points": ["point1", "point2", ...]}}

Notes:
{text[:3000]}

Analysis:"""
        
        response = ollama.chat(
            model=model,
            messages=[{'role': 'user', 'content': prompt}]
        )
        
        content = response['message']['content']
        
        # Extract JSON
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            json_str = content[start:end]
            concepts = json.loads(json_str)
            return concepts
        else:
            return {
                "topics": ["Unable to extract topics"],
                "terms": ["Try again with different notes"],
                "points": ["Processing error occurred"]
            }
            
    except Exception as e:
        return {
            "topics": [f"Error: {str(e)}"],
            "terms": ["Please try again"],
            "points": ["An error occurred"]
        }


def generate_flashcards(text: str, num_cards: int = 10, model: str = "deepseek-r1:1.5b") -> List[Dict]:
    """Generate flashcards from the text"""
    try:
        prompt = f"""Create {num_cards} flashcards from the following notes.

Each flashcard should have:
- Front: A question or term
- Back: The answer or definition

Format as JSON array:
[{{"front": "What is...?", "back": "The answer is..."}}]

Notes:
{text[:3000]}

Flashcards:"""
        
        response = ollama.chat(
            model=model,
            messages=[{'role': 'user', 'content': prompt}]
        )
        
        content = response['message']['content']
        
        # Extract JSON
        start = content.find('[')
        end = content.rfind(']') + 1
        if start != -1 and end > start:
            json_str = content[start:end]
            flashcards = json.loads(json_str)
            return flashcards
        else:
            return [{
                "front": "Error generating flashcards",
                "back": "Please try again with different notes"
            }]
            
    except Exception as e:
        return [{
            "front": f"Error: {str(e)}",
            "back": "An error occurred while generating flashcards"
        }]


def mark_notes_studied(filename: str, score: Optional[int] = None):
    """Mark notes as studied and save progress"""
    try:
        progress_file = STUDY_PROGRESS_DIR / "study_log.json"
        
        # Load existing progress
        if progress_file.exists():
            with open(progress_file, 'r') as f:
                progress = json.load(f)
        else:
            progress = {}
        
        # Update progress
        if filename not in progress:
            progress[filename] = {
                "first_studied": datetime.now().isoformat(),
                "sessions": []
            }
        
        progress[filename]["sessions"].append({
            "date": datetime.now().isoformat(),
            "score": score
        })
        progress[filename]["last_studied"] = datetime.now().isoformat()
        
        # Save progress
        with open(progress_file, 'w') as f:
            json.dump(progress, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error saving study progress: {str(e)}")
        return False


def get_study_progress() -> Dict:
    """Get study progress for all notes"""
    try:
        progress_file = STUDY_PROGRESS_DIR / "study_log.json"
        
        if progress_file.exists():
            with open(progress_file, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        return {}
