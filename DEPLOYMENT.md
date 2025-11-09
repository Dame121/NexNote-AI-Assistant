# 🚀 Deployment Guide

This guide covers various deployment options for NexNote.

## 📋 Prerequisites

Before deploying, ensure:
- ✅ Ollama is installed on the target server
- ✅ Required models are downloaded
- ✅ Pinecone account is set up
- ✅ Environment variables are configured

## 🖥️ Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nexnote.git
cd nexnote

# Run setup (Windows)
.\setup.ps1

# Or manual setup
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start the app
python app.py
```

## 🌐 Production Deployment

### Option 1: Traditional Server (Ubuntu/Debian)

```bash
# Install system dependencies
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx

# Clone and setup
git clone https://github.com/YOUR_USERNAME/nexnote.git
cd nexnote
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull deepseek-r1:1.5b
ollama pull nomic-embed-text

# Configure environment
cp .env.example .env
nano .env  # Add your keys

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Option 2: Docker (Coming Soon)

```dockerfile
# Dockerfile example
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

ENV FLASK_APP=app.py
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Option 3: Cloud Platform

#### Heroku
```bash
# Install Heroku CLI
# Create Procfile
echo "web: gunicorn app:app" > Procfile

# Deploy
heroku create nexnote-app
heroku config:set PINECONE_API_KEY=your_key
heroku config:set SECRET_KEY=your_secret
git push heroku main
```

#### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

#### Render
1. Create new Web Service
2. Connect repository
3. Set environment variables
4. Deploy

## ⚙️ Production Configuration

### Gunicorn Configuration (`gunicorn.conf.py`)

```python
# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = "access.log"
errorlog = "error.log"
loglevel = "info"
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Systemd Service (`/etc/systemd/system/nexnote.service`)

```ini
[Unit]
Description=NexNote Flask App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/nexnote
Environment="PATH=/var/www/nexnote/venv/bin"
ExecStart=/var/www/nexnote/venv/bin/gunicorn -c gunicorn.conf.py app:app

[Install]
WantedBy=multi-user.target
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Use strong SECRET_KEY (not the example one!)
- [ ] Set `FLASK_ENV=production`
- [ ] Disable Flask debug mode
- [ ] Use HTTPS (SSL/TLS)
- [ ] Restrict CORS if needed
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Implement rate limiting
- [ ] Use secure session cookies
- [ ] Never commit `.env` or `credentials.json`

### Environment Variables

```env
# Production settings
FLASK_ENV=production
SECRET_KEY=<generate-strong-random-key>
PINECONE_API_KEY=<your-key>
PINECONE_INDEX_NAME=nexnote-notes
CHAT_MODEL=deepseek-r1:1.5b
EMBEDDING_MODEL=nomic-embed-text
ENABLE_CALENDAR=false
```

## 📊 Monitoring

### Health Check Endpoint

Add to `app.py`:
```python
@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200
```

### Logging

```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

## 🔄 Updates & Maintenance

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pip install -r requirements.txt --upgrade

# Restart service
sudo systemctl restart nexnote
```

## 💡 Performance Tips

1. **Use Gunicorn workers**: Match number of CPU cores
2. **Enable caching**: Use Redis or Memcached
3. **Optimize Ollama**: Run on GPU if available
4. **Use CDN**: For static assets
5. **Database pooling**: If adding a database later
6. **Load balancing**: For high traffic

## 🆘 Troubleshooting Deployment

### Issue: Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

### Issue: Permission Denied
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/nexnote
sudo chmod -R 755 /var/www/nexnote
```

### Issue: Ollama Not Found
```bash
# Check Ollama is running
systemctl status ollama
# Start Ollama
systemctl start ollama
```

---

For more help, see [CONTRIBUTING.md](CONTRIBUTING.md) or create an issue.
