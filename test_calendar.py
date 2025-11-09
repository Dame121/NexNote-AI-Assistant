"""
Test script to verify Google Calendar setup
"""

import os
from pathlib import Path
from utils.calendar_manager import CalendarManager, CALENDAR_AVAILABLE

def check_calendar_setup():
    """Check if calendar is properly configured"""
    print("🔍 Checking Google Calendar Setup...\n")
    
    # Check if required packages are installed
    print("1. Checking required packages...")
    if CALENDAR_AVAILABLE:
        print("   ✅ Google Calendar packages installed")
    else:
        print("   ❌ Google Calendar packages NOT installed")
        print("      Run: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        return False
    
    # Check if credentials.json exists
    print("\n2. Checking credentials.json...")
    credentials_path = Path(__file__).parent / 'credentials.json'
    
    if credentials_path.exists():
        print(f"   ✅ credentials.json found at: {credentials_path}")
    else:
        print(f"   ❌ credentials.json NOT found")
        print(f"      Expected location: {credentials_path}")
        print("      Please follow the setup guide in GOOGLE_CALENDAR_SETUP.md")
        return False
    
    # Check if calendar token exists (indicates previous successful auth)
    print("\n3. Checking authentication token...")
    token_path = Path(__file__).parent / 'calendar_token.pickle'
    
    if token_path.exists():
        print(f"   ✅ Token found - previously authenticated")
    else:
        print(f"   ⚠️  No token found - first-time authentication needed")
        print("      Click 'Connect Google Calendar' in the web interface")
    
    # Try to initialize CalendarManager
    print("\n4. Testing CalendarManager...")
    try:
        cal_mgr = CalendarManager()
        print("   ✅ CalendarManager initialized successfully")
        
        # Try to authenticate (will use existing token if available)
        print("\n5. Testing authentication...")
        if cal_mgr.authenticate():
            print("   ✅ Authentication successful!")
            
            # Try to get events
            print("\n6. Testing API access...")
            events = cal_mgr.get_upcoming_events(max_results=1)
            print(f"   ✅ API access successful! Found {len(events)} upcoming event(s)")
            
            return True
        else:
            print("   ⚠️  Authentication needed")
            print("      Use the web interface to authenticate")
            return True  # Setup is OK, just needs auth
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    return True


if __name__ == '__main__':
    print("=" * 60)
    print("   NexNote Calendar Setup Test")
    print("=" * 60)
    print()
    
    success = check_calendar_setup()
    
    print("\n" + "=" * 60)
    if success:
        print("   ✅ Calendar setup looks good!")
        print("   You can now use the calendar feature in NexNote")
    else:
        print("   ❌ Calendar setup incomplete")
        print("   Please follow GOOGLE_CALENDAR_SETUP.md")
    print("=" * 60)
