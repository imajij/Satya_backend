# Article Verification Data Issues - Analysis & Fixes

## Issues Found

### 1. **Missing Schema Fields** ❌
**Problem:** The `Article.js` schema was missing critical fields that the pipeline returns:
- `claims` - extracted claims from article
- `fact_check_results` - fact-check results from Google Fact Check API
- `bias_analysis` - detailed bias analysis with sentence-level scores
- `mbfc_publisher_match` - Media Bias/Fact Check publisher match data

**Impact:** These fields were being sent to MongoDB but **silently ignored** because Mongoose strict mode drops fields not in the schema.

**Fix:** Added all missing fields to the schema as `Mixed` type arrays/objects:
```javascript
claims: {
  type: [mongoose.Schema.Types.Mixed],
  default: []
},
fact_check_results: {
  type: [mongoose.Schema.Types.Mixed],
  default: []
},
bias_analysis: {
  type: mongoose.Schema.Types.Mixed,
  default: {}
},
mbfc_publisher_match: {
  type: mongoose.Schema.Types.Mixed,
  default: null
}
```

### 2. **Bias Score Logic Bug** ❌
**Problem:** In `verify.ts`, the bias mapping had a falsy check bug:
```typescript
bias: processed.articleBiasScore ? (... logic ...) : 'neutral'
```

When `articleBiasScore` is `0` (neutral bias), JavaScript treats it as falsy, so it defaulted to `'neutral'` **without actually checking if it's a number**.

**Impact:** 
- `articleBiasScore: 0` → bias set to 'neutral' ✅ (correct by accident)
- `articleBiasScore: undefined` → bias set to 'neutral' ✅ (correct)
- But the logic was semantically wrong

**Fix:** Changed to proper type check:
```typescript
bias: typeof processed.articleBiasScore === 'number' 
  ? (processed.articleBiasScore > 0 ? 'right' : processed.articleBiasScore < 0 ? 'left' : 'neutral')
  : 'neutral'
```

## Pipeline Data Structure

The pipeline returns this structure via `/api/status/:jobId`:

```json
{
  "status": "finished",
  "result": {
    "articleId": "uuid",
    "publisher": "indiatoday.in",
    "title": "...",
    "content": "...",
    "url": "...",
    "mbfc_publisher_match": {
      "name": "India Today",
      "domain": "http://indiatoday.intoday.in/",
      "mbfc_bias_score": 0,
      "mbfc_factuality_score": 0.8,
      "matchScore": 1
    },
    "claims": [],
    "factcheck_results": [],
    "falseClaimRatio": 0,
    "biasAnalysis": {
      "biasMagnitude": 0,
      "biasDirection": null,
      "sentence_level_scores": [
        {
          "sentence": "...",
          "biased": false,
          "modelScore": 0
        }
      ]
    },
    "articleBiasScore": 0,
    "credibilityScore": 0.8,
    "classification": "unverified",
    "processingStatus": "success",
    "processedAt": "2025-10-29T00:32:04.957Z"
  }
}
```

## Field Mappings (Pipeline → Database)

| Pipeline Field | Database Field | Transformation |
|----------------|----------------|----------------|
| `credibilityScore` | `factual` | `Math.round(score * 100)` → 0.8 becomes 80 |
| `articleBiasScore` | `bias` | `> 0 → 'right'`, `< 0 → 'left'`, `0 → 'neutral'` |
| `classification` | `classification` | Direct (verified/unverified/false/misleading) |
| `claims` | `claims` | Direct array |
| `factcheck_results` | `fact_check_results` | Direct array |
| `biasAnalysis` | `bias_analysis` | Direct object |
| `mbfc_publisher_match` | `mbfc_publisher_match` | Direct object |

## Testing

To test the fixes:

1. **Restart the backend** (to load updated schema and verify.ts):
   ```bash
   # In terminal 2
   cd Satya_backend
   npm run dev
   ```

2. **Run the test script**:
   ```bash
   node test-verify.js
   ```

3. **Or manually test via frontend**:
   - Go to `/verify` page
   - Paste URL: `https://www.indiatoday.in/elections/assembly/story/mahagathbandhan-bihar-poll-manifesto-tejashwi-pran-jobs-women-benefit-pension-crop-msp-waqf-law-toddy-2809724-2025-10-28`
   - Click verify
   - Check that all fields are populated

## Expected Results

After the fix, articles should have:
- ✅ **classification**: From pipeline (verified/unverified/misleading/false)
- ✅ **factual**: 0-100 score (e.g., 80 for credibilityScore 0.8)
- ✅ **bias**: left/right/neutral based on articleBiasScore
- ✅ **claims**: Array of extracted claims (if any)
- ✅ **fact_check_results**: Array of fact-check matches (if any)
- ✅ **bias_analysis**: Full bias analysis with sentence scores
- ✅ **mbfc_publisher_match**: Publisher match data with factuality/bias scores

## Notes

- The pipeline may return empty arrays for `claims` and `factcheck_results` if none are found
- `classification` might still be "unverified" if the pipeline's scoring doesn't meet thresholds
- The `mbfc_publisher_match` provides valuable publisher-level factuality/bias data even when article-level fact-checks aren't available
