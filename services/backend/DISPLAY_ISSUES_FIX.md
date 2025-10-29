# Display Issues Fix - Bias, Credibility, and Publisher Scores

## Problems Identified

### 1. **All Articles Show "Unverified"** ❌
**Root Cause**: Articles in MongoDB have `classification: "unverified"` because they were either:
- Created before the pipeline polling fix
- Saved with empty/default values when pipeline wasn't running
- Old articles from news scraper with different schema

**Fix**: Need to re-verify articles OR clear old data

### 2. **Credibility Score Shows 0% or Wrong Values** ❌
**Root Cause**: `userService.js` was mapping `backendArticle.factual` which is `undefined` for old articles:
```javascript
credibilityScore: Math.round(backendArticle.factual || 0)  // ❌ Gives 0 when undefined
```

**Fix Applied**: Updated to fallback to publisher reputation:
```javascript
const credibilityScore = typeof backendArticle.factual === 'number' 
  ? Math.round(backendArticle.factual) 
  : sourceReputation; // ✅ Use publisher score as fallback
```

### 3. **All Publishers Show "50 Fair"** ❌
**Root Cause**: `userService.js` was looking for wrong field name:
```javascript
sourceReputation: backendArticle.mbfc_publisher_match?.factual || 50  // ❌ Wrong field
```

The pipeline returns `mbfc_factuality_score` (0-1 scale), not `factual`:
```json
{
  "mbfc_publisher_match": {
    "name": "India Today",
    "mbfc_factuality_score": 0.8,  // ← This field
    "mbfc_bias_score": 0
  }
}
```

**Fix Applied**: Check both possible field names and convert scale:
```javascript
let sourceReputation = 50;
if (backendArticle.mbfc_publisher_match) {
  // Pipeline returns mbfc_factuality_score (0-1 scale)
  if (typeof backendArticle.mbfc_publisher_match.mbfc_factuality_score === 'number') {
    sourceReputation = Math.round(backendArticle.mbfc_publisher_match.mbfc_factuality_score * 100);
  }
  // Feed route attaches Source model which has factual (0-100 scale)
  else if (typeof backendArticle.mbfc_publisher_match.factual === 'number') {
    sourceReputation = backendArticle.mbfc_publisher_match.factual;
  }
}
```

### 4. **Bias Always Shows 40% or "Neutral"** ❌
**Root Cause**: Articles have `bias: "neutral"` because:
- Old articles defaulted to neutral
- Pipeline returns `articleBiasScore: 0` which correctly maps to neutral
- The biasScoreMap only has limited options

**Status**: This is actually CORRECT behavior for neutral articles. New verified articles will show proper bias if detected.

## Data Flow

### Pipeline Processing:
```
Article URL → Pipeline → Process → Returns:
{
  credibilityScore: 0.8,           // 0-1 scale
  articleBiasScore: 0,             // -1 to +1 scale
  classification: "unverified",    // or verified/misleading/fake
  mbfc_publisher_match: {
    mbfc_factuality_score: 0.8,    // 0-1 scale
    mbfc_bias_score: 0             // -1 to +1 scale
  }
}
```

### Backend Mapping (verify.ts):
```javascript
{
  factual: Math.round(credibilityScore * 100),           // → 80
  bias: 'neutral' | 'left' | 'right',
  classification: 'verified' | 'unverified' | 'misleading' | 'fake',
  mbfc_publisher_match: { ... }  // Stored as-is
}
```

### Frontend Display (userService.js):
```javascript
{
  credibilityScore: 80,              // 0-100 for article
  sourceReputation: 80,              // 0-100 for publisher
  verdict: "Unverified",            // Mapped from classification
  bias: "Neutral",                  // Capitalized
  biasScore: 0                      // -80 to +80 for meter
}
```

## Steps to Fix

### ✅ Step 1: Frontend Fix (DONE)
Updated `userService.js` to:
- Correctly read `mbfc_factuality_score` from pipeline data
- Convert 0-1 scale to 0-100 scale
- Fallback to publisher reputation when article score missing
- Handle both pipeline format and feed format

### ⏳ Step 2: Backend Restart (REQUIRED)
The backend needs to be restarted to load the updated Article schema:

```bash
# In backend terminal (terminal 2)
# Press Ctrl+C, then:
cd Satya_backend
npm run dev
```

### ⏳ Step 3: Clear Old Data (RECOMMENDED)
Old articles have wrong/missing data. Two options:

**Option A: Drop all articles and re-populate**
```bash
cd Satya_backend
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://satya:7WhUBPmXdJ1L24Mb@satya0.1wzg9zg.mongodb.net/?appName=satya0').then(async () => {
  const Article = require('./src/models/Article.js').default;
  await Article.deleteMany({});
  console.log('All articles deleted');
  process.exit(0);
});
"
```

**Option B: Keep articles but understand they show old data**
- Just verify new articles going forward
- Old articles will show default values (50 Fair, Neutral, Unverified)

### Step 4: Test with Fresh Article
Try verifying this BBC article:
```
https://www.bbc.com/news/articles/clyld9w0283o
```

Expected results:
- BBC should match in MBFC database
- Should get publisher factuality score (BBC is typically 80-85)
- Article should be processed with credibilityScore
- Should show proper credibility and reputation on cards

## Verification

After fixes, check:
1. **NewsCard** should show:
   - Correct publisher reputation (not always 50)
   - Proper credibility badge (based on article + publisher)
   - Accurate bias meter (based on articleBiasScore)

2. **ArticleDetailsPage** should show:
   - Source reputation from MBFC
   - Classification from pipeline
   - Fact-check results if available
   - Claims if extracted

## Current Article Schema Fields

```javascript
{
  headline: String,
  publisher: String,
  url: String (unique),
  content: String,
  classification: 'verified' | 'unverified' | 'misleading' | 'fake',
  factual: Number (0-100),        // Article credibility
  bias: 'left' | 'right' | 'neutral',
  claims: Array,                  // Extracted claims
  fact_check_results: Array,      // Google Fact Check results
  bias_analysis: Object,          // Sentence-level analysis
  mbfc_publisher_match: Object    // MBFC publisher data
}
```

## Notes

- The frontend fix is applied but **won't show improvements until backend restarts**
- Old articles in database will continue showing wrong data until re-verified
- New articles will immediately show correct scores
- Publisher reputation comes from MBFC data (0.8 → 80/100)
- Article credibility comes from pipeline analysis
