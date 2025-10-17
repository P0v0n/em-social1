# Quick Test Guide: Word Cloud Component

## 🚀 Quick Start (5 minutes)

### Step 1: Start the Server
```bash
npm run dev
```
Wait for: `✓ Ready on http://localhost:3000`

### Step 2: Open Test Page
Navigate to: **http://localhost:3000/test-wordcloud**

### Step 3: Verify Visual Tests

#### ✅ Test 1: Normal Word Cloud
- **Look for:** Colorful word cloud with words like "cricket", "match", "player"
- **Expected:** Words in different sizes (bigger = more frequent)
- **Hover Test:** Hover over any word → tooltip should show "word: count"
- **Pass if:** Word cloud renders with colors and proper sizing

#### ✅ Test 2: Empty Data Handler
- **Look for:** Gray text message
- **Expected:** "No keyword data available for word cloud"
- **Pass if:** No errors in console, message displayed

#### ✅ Test 3: MongoDB Format Support
- **Look for:** Small word cloud with 5 words
- **Expected:** Renders correctly despite MongoDB `$numberInt` format
- **Pass if:** Word cloud displays without errors

#### ✅ Test 4: Null Data Handler
- **Look for:** Gray text message (same as Test 2)
- **Expected:** "No keyword data available for word cloud"
- **Pass if:** No errors in console, graceful fallback

### Step 4: Check Browser Console
Press `F12` → Go to Console tab

**❌ FAIL if you see:**
- Red error messages
- "Cannot read property..." errors
- React rendering errors

**✅ PASS if you see:**
- No errors
- Only info/warning messages (acceptable)
- React DevTools messages (acceptable)

---

## 🔧 Full Integration Test (15 minutes)

### Prerequisites
- MongoDB running
- X API Bearer Token configured
- YouTube API Key configured
- Gemini API Key configured

### Step 1: Fetch Social Media Data
1. Go to **http://localhost:3000/dashboard**
2. Login if required
3. Enter keyword: **"cricket"** (or any trending topic)
4. Select **X (Twitter)** and/or **YouTube**
5. Click **"Fetch Data"** button
6. Wait for success message

### Step 2: Analyze Data
1. Click on the collection name **"cricket"** in the list
2. Click **"Analyse"** button
3. Wait for analysis to complete (may take 30-60 seconds)
4. Look for success message

### Step 3: View Word Cloud in Reports
1. Click **"View Reports"** button
2. Scroll down to find section: **"☁️ Keyword Word Cloud"**
3. Verify word cloud displays with actual keywords from your data

**✅ PASS if:**
- Word cloud renders with relevant keywords
- Tooltips work on hover
- Keywords match the fetched content theme
- No console errors

**❌ FAIL if:**
- "No keyword data available" message (means analysis didn't generate keywordFrequency)
- Console errors
- Word cloud doesn't render

---

## 🐛 Common Issues & Solutions

### Issue 1: Dependencies Not Found
**Error:** `Cannot find module 'react-wordcloud'`

**Solution:**
```bash
npm install react-wordcloud d3-cloud --legacy-peer-deps
```

### Issue 2: React Version Warning
**Warning:** `React version mismatch` in console

**Solution:** 
- This is expected (React 19 vs React 16 library)
- Monitor for actual errors, warnings are acceptable
- Component should still work

### Issue 3: Word Cloud Not Showing in Reports
**Problem:** Test page works, but reports page shows "No keyword data available"

**Possible Causes:**
1. **Analysis not run:** Click "Analyse" button first
2. **Gemini didn't return keywordFrequency:** Check API logs
3. **Data format issue:** Check MongoDB collection structure

**Debug Steps:**
1. Open browser DevTools → Network tab
2. Go to reports page
3. Find API call: `/api/collections/[keyword]/analysis`
4. Check response → Look for `analysis[0].keywordFrequency` field
5. If missing, re-run analysis

### Issue 4: npm Vulnerabilities Warning
**Warning:** `9 vulnerabilities (1 moderate, 7 high, 1 critical)`

**Note:** 
- Known issue with older dependencies
- Related to `react-wordcloud` requiring older packages
- Safe for development/testing
- Consider alternative library for production

---

## 📊 Component Configuration

Current settings in `WordCloud.jsx`:

| Setting | Value | Description |
|---------|-------|-------------|
| Max Words | 100 | Top 100 keywords shown |
| Font Size | 16-80px | Size range |
| Rotations | 2 | Number of rotation angles |
| Angles | -90°, 0° | Word rotation options |
| Colors | 7 | Theme colors (green, blue, purple, amber, red, pink, cyan) |
| Transition | 1000ms | Animation duration |
| Spiral | archimedean | Layout algorithm |

---

## 📝 Test Checklist

### Visual Tests
- [ ] Test page loads without errors
- [ ] Test 1: Normal word cloud renders
- [ ] Test 2: Empty data shows message
- [ ] Test 3: MongoDB format works
- [ ] Test 4: Null data shows message
- [ ] All tooltips work on hover
- [ ] Colors are varied and visible
- [ ] Words sized by frequency

### Integration Tests
- [ ] Can fetch data from social media
- [ ] Can run analysis successfully
- [ ] Word cloud appears in reports
- [ ] Keywords are relevant to topic
- [ ] No console errors throughout flow

### Cross-Browser Tests
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile responsive

### Performance
- [ ] Page loads in < 3 seconds
- [ ] Word cloud renders in < 2 seconds
- [ ] No lag when hovering over words
- [ ] No memory leaks (check DevTools)

---

## 🎯 Expected Results Summary

**Test Page:** All 4 tests should pass with proper visual rendering or graceful fallback messages.

**Integration:** Word cloud should display actual keywords from analyzed social media data with proper sizing and colors.

**Browser Console:** No red error messages (warnings are acceptable).

**User Experience:** Smooth rendering, interactive tooltips, professional appearance.

---

## 📞 Need Help?

If tests fail:
1. Check `WORDCLOUD_TEST_REPORT.md` for detailed troubleshooting
2. Review `CHANGELOG.md` for recent changes
3. Verify all environment variables are set
4. Check MongoDB connection
5. Review browser console for specific errors

---

**Test Duration:** 5-20 minutes  
**Last Updated:** 2025-10-10  
**Status:** Ready for Testing ✅


