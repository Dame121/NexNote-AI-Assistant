"""
Google Calendar Integration Module
Handles calendar events, reminders, and study schedules
"""

import os
import pickle
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List
import re
import pytz
from tzlocal import get_localzone

# Google Calendar imports
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from dateutil import parser as date_parser
    CALENDAR_AVAILABLE = True
except ImportError:
    CALENDAR_AVAILABLE = False

# If modifying these scopes, delete the token.pickle file.
SCOPES = ['https://www.googleapis.com/auth/calendar']

# Get the project root directory (parent of flask_app)
PROJECT_ROOT = Path(__file__).parent.parent.parent
TOKEN_PATH = PROJECT_ROOT / "calendar_token.pickle"
CREDENTIALS_PATH = PROJECT_ROOT / "credentials.json"

# Get local timezone
try:
    LOCAL_TIMEZONE = str(get_localzone())
except Exception:
    # Fallback to UTC if timezone detection fails
    LOCAL_TIMEZONE = 'UTC'


class CalendarManager:
    """Manages Google Calendar integration"""
    
    def __init__(self):
        self.service = None
        self.authenticated = False
        
    def authenticate(self) -> bool:
        """Authenticate with Google Calendar"""
        if not CALENDAR_AVAILABLE:
            return False
            
        try:
            creds = None
            
            # The file token.pickle stores the user's access and refresh tokens
            if TOKEN_PATH.exists():
                with open(TOKEN_PATH, 'rb') as token:
                    creds = pickle.load(token)
            
            # If there are no (valid) credentials available, let the user log in.
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not CREDENTIALS_PATH.exists():
                        return False
                    
                    flow = InstalledAppFlow.from_client_secrets_file(
                        str(CREDENTIALS_PATH), 
                        SCOPES,
                        redirect_uri='http://localhost'
                    )
                    
                    creds = flow.run_local_server(
                        port=8080,
                        access_type='offline',
                        prompt='consent'
                    )
                
                # Save the credentials for the next run
                with open(TOKEN_PATH, 'wb') as token:
                    pickle.dump(creds, token)
            
            self.service = build('calendar', 'v3', credentials=creds)
            self.authenticated = True
            return True
            
        except Exception as e:
            print(f"Calendar authentication failed: {str(e)}")
            return False
    
    def create_event(self, 
                    title: str, 
                    start_time: datetime, 
                    duration_minutes: int = 60,
                    description: str = "",
                    reminder_minutes: int = 30) -> Optional[Dict]:
        """Create a calendar event"""
        if not self.authenticated or not self.service:
            # Try to authenticate
            if not self.authenticate():
                return None
        
        try:
            # Ensure start_time is timezone-aware
            if start_time.tzinfo is None:
                # If naive datetime, assume it's in local timezone
                local_tz = pytz.timezone(LOCAL_TIMEZONE)
                start_time = local_tz.localize(start_time)
            
            end_time = start_time + timedelta(minutes=duration_minutes)
            
            event = {
                'summary': title,
                'description': description,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': LOCAL_TIMEZONE,
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': LOCAL_TIMEZONE,
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': reminder_minutes},
                        {'method': 'email', 'minutes': reminder_minutes},
                    ],
                },
            }
            
            created_event = self.service.events().insert(
                calendarId='primary', 
                body=event
            ).execute()
            
            return created_event
            
        except Exception as e:
            print(f"Failed to create event: {str(e)}")
            return None
    
    def get_upcoming_events(self, max_results: int = 10) -> List[Dict]:
        """Get upcoming calendar events"""
        if not self.authenticated or not self.service:
            if not self.authenticate():
                return []
        
        try:
            now = datetime.utcnow().isoformat() + 'Z'
            
            events_result = self.service.events().list(
                calendarId='primary',
                timeMin=now,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            return events_result.get('items', [])
            
        except Exception as e:
            print(f"Failed to get events: {str(e)}")
            return []
    
    def delete_event(self, event_id: str) -> bool:
        """Delete a calendar event"""
        if not self.authenticated or not self.service:
            if not self.authenticate():
                return False
        
        try:
            self.service.events().delete(
                calendarId='primary',
                eventId=event_id
            ).execute()
            return True
            
        except Exception as e:
            print(f"Failed to delete event: {str(e)}")
            return False


def parse_schedule_request(text: str) -> Optional[Dict]:
    """Parse natural language schedule request"""
    if not CALENDAR_AVAILABLE:
        return None
        
    text_lower = text.lower()
    
    result = {
        'title': '',
        'datetime': None,
        'duration': 60,
        'reminder': 30
    }
    
    # Extract title
    title_patterns = [
        r'schedule\s+(.+?)\s+(?:tomorrow|today|on|at)',
        r'add\s+(.+?)\s+(?:tomorrow|today|on|at)',
        r'remind me (?:to\s+)?(.+?)\s+(?:tomorrow|today|on|at)',
        r'create event\s+(.+?)\s+(?:tomorrow|today|on|at)',
    ]
    
    for pattern in title_patterns:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            result['title'] = match.group(1).strip().title()
            break
    
    if not result['title']:
        result['title'] = text.split(' at ')[0].split(' on ')[0].strip().title()
    
    # Parse datetime
    try:
        base_text = text_lower
        if 'tomorrow' in text_lower:
            tomorrow = datetime.now() + timedelta(days=1)
            base_text = text_lower.replace('tomorrow', tomorrow.strftime('%Y-%m-%d'))
        elif 'today' in text_lower:
            today = datetime.now()
            base_text = text_lower.replace('today', today.strftime('%Y-%m-%d'))
        
        parsed_dt = date_parser.parse(base_text, fuzzy=True)
        
        # Check for time
        time_patterns = [
            r'(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)',
            r'at\s+(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)?',
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2)) if match.group(2) else 0
                am_pm = match.group(3).lower() if match.group(3) else None
                
                if am_pm == 'pm' and hour < 12:
                    hour += 12
                elif am_pm == 'am' and hour == 12:
                    hour = 0
                
                parsed_dt = parsed_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
                break
        
        result['datetime'] = parsed_dt
        
    except Exception as e:
        result['datetime'] = None
    
    # Extract duration
    duration_match = re.search(r'(\d+)\s*(?:hour|hr|h)', text_lower)
    if duration_match:
        result['duration'] = int(duration_match.group(1)) * 60
    
    # Extract reminder
    reminder_match = re.search(r'remind\s+(?:me\s+)?(\d+)\s*(?:min|minute)', text_lower)
    if reminder_match:
        result['reminder'] = int(reminder_match.group(1))
    
    return result if result['datetime'] else None


def format_event_display(event: Dict) -> str:
    """Format event for display"""
    try:
        start = event['start'].get('dateTime', event['start'].get('date'))
        summary = event.get('summary', 'No title')
        
        if 'T' in start:
            dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
            formatted_time = dt.strftime('%b %d, %Y at %I:%M %p')
        else:
            dt = datetime.fromisoformat(start)
            formatted_time = dt.strftime('%b %d, %Y (All day)')
        
        return f"{summary} - {formatted_time}"
    except:
        return "Event (parsing error)"
