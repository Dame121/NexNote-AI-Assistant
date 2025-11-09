# 📅 Google Calendar Setup Guide

## Quick Setup Instructions

Follow these steps to enable Google Calendar integration in NexNote:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select an existing project
3. Give your project a name (e.g., "NexNote Calendar")
4. Click **"Create"**

### 2. Enable Google Calendar API

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Calendar API"**
3. Click on it and press **"Enable"**

### 3. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - Choose **"External"** user type
   - Fill in required fields (App name, User support email, Developer email)
   - Add scopes: `https://www.googleapis.com/auth/calendar`
   - Add yourself as a test user
   - Click **"Save and Continue"**

4. Create OAuth Client ID:
   - Application type: **"Desktop app"**
   - Name: **"NexNote Desktop"**
   - Click **"Create"**

5. Download the credentials:
   - Click the **download** icon (⬇️) next to your newly created OAuth client
   - Save the file as `credentials.json`

### 4. Install Credentials File

1. Copy the downloaded `credentials.json` file
2. Paste it in your NexNote directory: `D:\Flask App Backup\credentials.json`

### 5. Authenticate

1. Start your Flask app if it's not running
2. Go to the Calendar page in NexNote
3. Click **"Connect Google Calendar"**
4. A browser window will open asking you to:
   - Choose your Google account
   - Grant calendar permissions
   - Approve the authorization

5. After approval, you'll be redirected back
6. The calendar will be connected! 🎉

## 🔒 Security Notes

- Keep `credentials.json` private - never share it or commit it to git
- The `.gitignore` file is already configured to exclude it
- After first authentication, a `calendar_token.pickle` file will be created
- This token file is also excluded from git

## ✨ Features Available After Setup

- ✅ Natural language event creation ("Schedule OS Revision tomorrow at 8 PM")
- ✅ Form-based event creation
- ✅ View upcoming events
- ✅ Delete events
- ✅ Smart reminders
- ✅ Study session templates
- ✅ Quick scheduling

## 🛠️ Troubleshooting

### "credentials.json not found"
- Make sure the file is in the root directory: `D:\Flask App Backup\`
- File name must be exactly `credentials.json` (case-sensitive on some systems)

### "Authentication failed"
- Check that Google Calendar API is enabled in your project
- Make sure you added yourself as a test user in OAuth consent screen
- Try deleting `calendar_token.pickle` and re-authenticating

### "Quota exceeded" errors
- Google Calendar API has usage limits
- For personal use, these limits are very high and shouldn't be an issue
- Check your quota in Google Cloud Console under "APIs & Services" > "Dashboard"

## 📚 Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)

---

**Need help?** Check the NexNote documentation or create an issue on GitHub.
