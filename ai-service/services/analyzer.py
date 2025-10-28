from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import spacy
from langdetect import detect
from typing import Dict, List, Any
import torch

class TextAnalyzer:
    def __init__(self):
        # Load multilingual models
        self.sentiment_analyzer = pipeline("sentiment-analysis", 
                                          model="cardiffnlp/twitter-xlm-roberta-base-sentiment")
        
        # Bias detection (simplified - would use fine-tuned model in production)
        self.bias_model = pipeline("text-classification", 
                                   model="valurank/distilroberta-bias")
        
        # NER for multiple languages
        self.nlp_en = spacy.load("en_core_web_sm")
        
        # For Indian languages - would use ai4bharat models
        try:
            self.nlp_multilingual = spacy.load("xx_ent_wiki_sm")
        except:
            self.nlp_multilingual = self.nlp_en
    
    def analyze(self, text: str, language: str = "en") -> Dict[str, Any]:
        """Perform comprehensive text analysis."""
        
        # Detect language if not provided
        if not language or language == "auto":
            try:
                language = detect(text)
            except:
                language = "en"
        
        # Sentiment analysis
        sentiment_result = self.sentiment_analyzer(text[:512])[0]
        sentiment = {
            "polarity": sentiment_result["score"] if sentiment_result["label"] == "positive" else -sentiment_result["score"],
            "label": sentiment_result["label"]
        }
        
        # Bias detection
        bias_result = self.bias_model(text[:512])[0]
        bias_score = bias_result["score"] if bias_result["label"] == "BIASED" else 0.0
        
        # Sensationalism detection (keyword-based + capitalization)
        sensationalism_score = self._detect_sensationalism(text)
        
        # Factuality estimation (based on hedging, certainty markers)
        factuality_score = self._estimate_factuality(text)
        
        return {
            "sentiment": sentiment,
            "bias_score": bias_score,
            "sensationalism_score": sensationalism_score,
            "factuality_score": factuality_score,
            "toxicity_score": 0.0  # Would integrate Perspective API or Detoxify
        }
    
    def extract_entities(self, text: str, language: str = "en") -> List[Dict[str, Any]]:
        """Extract named entities."""
        nlp = self.nlp_en if language == "en" else self.nlp_multilingual
        doc = nlp(text)
        
        entities = []
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "type": ent.label_,
                "span": [ent.start_char, ent.end_char]
            })
        
        return entities
    
    def _detect_sensationalism(self, text: str) -> float:
        """Detect sensationalism based on linguistic patterns."""
        sensational_words = [
            "shocking", "unbelievable", "breaking", "urgent", "must see",
            "you won't believe", "exclusive", "revealed", "exposed", "scandal"
        ]
        
        text_lower = text.lower()
        score = 0.0
        
        # Check for sensational keywords
        for word in sensational_words:
            if word in text_lower:
                score += 0.1
        
        # Check for excessive capitalization
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        if caps_ratio > 0.3:
            score += 0.2
        
        # Check for excessive punctuation
        exclamation_count = text.count("!")
        if exclamation_count > 2:
            score += 0.15
        
        return min(score, 1.0)
    
    def _estimate_factuality(self, text: str) -> float:
        """Estimate factuality based on linguistic markers."""
        # Hedging words reduce certainty
        hedging_words = ["maybe", "possibly", "might", "could", "allegedly", "reportedly"]
        
        # Certainty markers increase factuality
        certainty_words = ["confirmed", "verified", "documented", "official", "according to"]
        
        text_lower = text.lower()
        
        certainty_count = sum(1 for word in certainty_words if word in text_lower)
        hedging_count = sum(1 for word in hedging_words if word in text_lower)
        
        # Base factuality
        factuality = 0.5
        
        # Adjust based on markers
        factuality += certainty_count * 0.1
        factuality -= hedging_count * 0.1
        
        return max(0.0, min(1.0, factuality))
