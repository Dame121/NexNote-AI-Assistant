"""Test calendar authentication with full error details"""
from utils.calendar_manager import CalendarManager
import traceback

print("Testing calendar authentication...")
print("-" * 60)

try:
    cm = CalendarManager()
    print("CalendarManager created")
    
    result = cm.authenticate()
    print(f"Authentication result: {result}")
    
    if result:
        print("✅ Authentication successful!")
    else:
        print("❌ Authentication failed")
        
except Exception as e:
    print(f"❌ Error during authentication:")
    traceback.print_exc()
