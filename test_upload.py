"""
Test script to diagnose file upload issue
"""
import os
from dotenv import load_dotenv
load_dotenv()

from utils.pinecone_handler import initialize_pinecone, extract_text_from_file, get_embedding
from pinecone import Pinecone

# Test Pinecone connection
print("=" * 60)
print("TESTING PINECONE CONNECTION")
print("=" * 60)

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME", "nexnote-notes")

print(f"API Key: {api_key[:20]}..." if api_key else "❌ API Key not found")
print(f"Index Name: {index_name}")
print()

# Test initialize_pinecone
print("Initializing Pinecone...")
try:
    index = initialize_pinecone(api_key, index_name)
    if index:
        print(f"✅ Successfully initialized index: {index_name}")
        
        # Check index stats
        stats = index.describe_index_stats()
        print(f"   Total vectors: {stats.get('total_vector_count', 0)}")
        print(f"   Dimension: {stats.get('dimension', 'unknown')}")
    else:
        print("❌ Failed to initialize index")
except Exception as e:
    print(f"❌ Error initializing Pinecone: {str(e)}")
    import traceback
    traceback.print_exc()

print()

# Test embedding generation
print("=" * 60)
print("TESTING EMBEDDING GENERATION")
print("=" * 60)

try:
    test_text = "This is a test document for embedding generation."
    print(f"Test text: {test_text}")
    
    embedding = get_embedding(test_text)
    if embedding:
        print(f"✅ Embedding generated successfully")
        print(f"   Dimension: {len(embedding)}")
        print(f"   First 5 values: {embedding[:5]}")
    else:
        print("❌ Failed to generate embedding")
except Exception as e:
    print(f"❌ Error generating embedding: {str(e)}")
    import traceback
    traceback.print_exc()

print()

# Test file reading (create a dummy test file)
print("=" * 60)
print("TESTING FILE PROCESSING")
print("=" * 60)

# Create a test file
test_file_path = "test_upload.txt"
with open(test_file_path, "w") as f:
    f.write("This is a test document.\nIt has multiple lines.\nFor testing file upload.")

print(f"Created test file: {test_file_path}")

# Simulate file object
class FileObject:
    def __init__(self, path):
        self.filepath = path
        self.filename = os.path.basename(path)
        self._content = None
    
    def read(self):
        if self._content is None:
            with open(self.filepath, 'rb') as f:
                self._content = f.read()
        return self._content
    
    def seek(self, pos):
        self._content = None

try:
    file_obj = FileObject(test_file_path)
    text = extract_text_from_file(file_obj)
    
    if text:
        print(f"✅ Text extracted successfully")
        print(f"   Length: {len(text)} characters")
        print(f"   Content: {text[:100]}...")
    else:
        print("❌ Failed to extract text")
except Exception as e:
    print(f"❌ Error extracting text: {str(e)}")
    import traceback
    traceback.print_exc()

# Cleanup
if os.path.exists(test_file_path):
    os.remove(test_file_path)
    print(f"Cleaned up test file")

print()
print("=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)
