from transformers import pipeline
import re

class ClaimExtractor:
    def __init__(self):
        # Summarization for claim extraction
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    
    def extract_claim(self, text: str, language: str = "en") -> str:
        """Extract the main claim from text."""
        # Simple heuristic: first sentence or summarization
        sentences = re.split(r'[.!?]+', text)
        
        if len(sentences) > 0 and len(sentences[0]) > 10:
            claim = sentences[0].strip()
        else:
            claim = text[:200]
        
        # For longer texts, use summarization
        if len(text) > 300:
            try:
                summary = self.summarizer(text[:1024], max_length=60, min_length=20)[0]
                claim = summary["summary_text"]
            except:
                pass
        
        return claim
    
    def paraphrase_claim(self, claim: str, language: str = "en") -> str:
        """Generate paraphrase of claim for better matching."""
        # Simplified paraphrasing - would use T5 or similar model
        paraphrase = claim.replace("is", "appears to be")
        paraphrase = paraphrase.replace("has", "reportedly has")
        
        return paraphrase
