from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from typing import List, Dict
import pickle
import os

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        self.index = None
        self.sources = []
        self._load_index()
    
    def _load_index(self):
        """Load pre-built FAISS index of fact-checks."""
        index_path = os.getenv("FAISS_INDEX_PATH", "./data/factcheck_index.faiss")
        sources_path = os.getenv("FAISS_SOURCES_PATH", "./data/factcheck_sources.pkl")
        
        if os.path.exists(index_path) and os.path.exists(sources_path):
            self.index = faiss.read_index(index_path)
            with open(sources_path, 'rb') as f:
                self.sources = pickle.load(f)
    
    def find_similar_sources(self, query: str, top_k: int = 5) -> List[Dict]:
        """Find similar fact-checks using embedding search."""
        if self.index is None or len(self.sources) == 0:
            return []
        
        # Encode query
        query_embedding = self.model.encode([query])
        
        # Search
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(self.sources):
                source = self.sources[idx]
                results.append({
                    "source_name": source.get("source", "Unknown"),
                    "url": source.get("url", ""),
                    "confidence": float(1 / (1 + distance))  # Convert distance to confidence
                })
        
        return results
    
    def add_to_index(self, texts: List[str], sources: List[Dict]):
        """Add new fact-checks to the index."""
        embeddings = self.model.encode(texts)
        
        if self.index is None:
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
        
        self.index.add(embeddings.astype('float32'))
        self.sources.extend(sources)
