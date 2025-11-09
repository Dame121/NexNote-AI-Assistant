"""
Pinecone vector database handler
Handles file processing, embedding generation, and knowledge base operations
"""

import ollama
from pinecone import Pinecone, ServerlessSpec
import PyPDF2
import docx
from typing import List, Dict
import hashlib


def initialize_pinecone(api_key: str, index_name: str):
    """Initialize Pinecone vector database"""
    try:
        pc = Pinecone(api_key=api_key)
        
        # Check if index exists
        existing_indexes = [index.name for index in pc.list_indexes()]
        
        if index_name in existing_indexes:
            # Check if existing index has correct dimension
            index_info = pc.describe_index(index_name)
            if index_info.dimension != 768:
                print(f"Index '{index_name}' has dimension {index_info.dimension}, but we need 768. Deleting and recreating...")
                pc.delete_index(index_name)
                existing_indexes.remove(index_name)
        
        if index_name not in existing_indexes:
            pc.create_index(
                name=index_name,
                dimension=768,  # Dimension for nomic-embed-text embeddings
                metric='cosine',
                spec=ServerlessSpec(
                    cloud='aws',
                    region='us-east-1'
                )
            )
            print(f"Created new index: {index_name} with dimension 768")
        
        index = pc.Index(index_name)
        return index
    except Exception as e:
        print(f"Error initializing Pinecone: {str(e)}")
        return None


def extract_text_from_file(file) -> str:
    """Extract text from different file types"""
    file_type = file.filename.split('.')[-1].lower()
    
    try:
        if file_type == 'txt' or file_type == 'md':
            content = file.read()
            file.seek(0)  # Reset file pointer
            return content.decode('utf-8')
        
        elif file_type == 'pdf':
            # PyPDF2 needs a file-like object with seek capability
            from io import BytesIO
            file.seek(0)  # Reset file pointer
            pdf_file = BytesIO(file.read())
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            file.seek(0)  # Reset file pointer for future use
            return text
        
        elif file_type == 'docx':
            from io import BytesIO
            file.seek(0)  # Reset file pointer
            docx_file = BytesIO(file.read())
            doc = docx.Document(docx_file)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            file.seek(0)  # Reset file pointer for future use
            return text
        
        else:
            return ""
    except Exception as e:
        print(f"Error reading {file.filename}: {str(e)}")
        return ""


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into chunks for embedding"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    
    return chunks


def get_embedding(text: str, model: str = "nomic-embed-text") -> List[float]:
    """Generate embeddings using Ollama"""
    try:
        response = ollama.embeddings(
            model=model,
            prompt=text
        )
        return response['embedding']
    except Exception as e:
        print(f"Error generating embedding: {str(e)}")
        return None


def process_uploaded_files(files, api_key: str, index_name: str):
    """Process and store uploaded files in Pinecone"""
    index = initialize_pinecone(api_key, index_name)
    
    if not index:
        return False
    
    for file in files:
        file_hash = hashlib.md5(file.filename.encode()).hexdigest()
        
        # Extract text
        text = extract_text_from_file(file)
        
        if not text:
            continue
        
        # Chunk text
        chunks = chunk_text(text)
        
        # Generate embeddings and store in Pinecone
        vectors = []
        for chunk_idx, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            
            if embedding:
                vector_id = f"{file_hash}_{chunk_idx}"
                vectors.append({
                    'id': vector_id,
                    'values': embedding,
                    'metadata': {
                        'filename': file.filename,
                        'chunk_index': chunk_idx,
                        'text': chunk
                    }
                })
        
        # Upsert to Pinecone in batches
        if vectors:
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                index.upsert(vectors=batch)
    
    return True


def search_knowledge_base(query: str, api_key: str, index_name: str, top_k: int = 3) -> List[Dict]:
    """Search the vector database for relevant information"""
    try:
        pc = Pinecone(api_key=api_key)
        index = pc.Index(index_name)
        
        # Generate query embedding
        query_embedding = get_embedding(query)
        
        if not query_embedding:
            return []
        
        # Search Pinecone
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        return results['matches']
    except Exception as e:
        print(f"Error searching knowledge base: {str(e)}")
        return []


def get_uploaded_files(api_key: str, index_name: str) -> Dict[str, int]:
    """Get list of all uploaded files and their chunk counts from Pinecone"""
    try:
        pc = Pinecone(api_key=api_key)
        
        # Check if index exists
        existing_indexes = [index.name for index in pc.list_indexes()]
        if index_name not in existing_indexes:
            return {}
        
        index = pc.Index(index_name)
        
        # Get index stats
        stats = index.describe_index_stats()
        total_vectors = stats.get('total_vector_count', 0)
        
        if total_vectors == 0:
            return {}
        
        # Query with a dummy vector to get all files
        dummy_embedding = [0.0] * 768
        results = index.query(
            vector=dummy_embedding,
            top_k=min(1000, total_vectors),
            include_metadata=True
        )
        
        # Count chunks per file
        file_chunks = {}
        for match in results.get('matches', []):
            filename = match.get('metadata', {}).get('filename', 'Unknown')
            file_chunks[filename] = file_chunks.get(filename, 0) + 1
        
        return file_chunks
    except Exception as e:
        print(f"Error getting uploaded files: {str(e)}")
        return {}


def clear_knowledge_base(api_key: str, index_name: str):
    """Clear all vectors from the Pinecone index"""
    try:
        pc = Pinecone(api_key=api_key)
        
        # Delete and recreate the index
        pc.delete_index(index_name)
        print(f"Deleted index: {index_name}")
        
        # Recreate the index
        pc.create_index(
            name=index_name,
            dimension=768,
            metric='cosine',
            spec=ServerlessSpec(
                cloud='aws',
                region='us-east-1'
            )
        )
        
        print(f"Knowledge base cleared! Created fresh index: {index_name}")
        return True
    except Exception as e:
        print(f"Error clearing knowledge base: {str(e)}")
        return False
