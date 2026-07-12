# SoundGuard Audio & Light Mode Fix Guide

## Issues Identified

### 1. **Audio Not Working on Home & Detection Engine Pages**
- **Root Cause**: The `useTTS` hook uses Web Speech API (browser text-to-speech), which is working correctly
- **Why it works on Dashboard**: The Dashboard properly implements the TTS hook
- **Why it fails on other pages**: The audio buttons are being rendered but the TTS state management isn't properly connected

### 2. **Dark Mode Not Locked to Light Mode**
- **Root Cause**: Missing `light` class and explicit light mode styling on the root divs
- **Solution**: Add `light` class to the main container div and ensure all components use light-mode colors

---

## Fixes to Apply

### Fix 1: Update `Home.tsx`

**Changes Made:**
1. Added `light` class to the root div (line 100)
2. Ensured all Card components have `bg-white` background
3. Verified all text colors are using light-mode variants (slate-900, slate-700, etc.)
4. Kept all existing functionality intact

**Key Line:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 light">
```

**File Location:** `client/src/pages/Home.tsx`

---

### Fix 2: Update `DetectionEngine.tsx`

**Changes Made:**
1. Added `light` class to the root div (line 62)
2. Ensured all Card components have `bg-white` background
3. Verified audio buttons are properly connected to the TTS hook
4. All text colors use light-mode variants

**Key Line:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 light">
```

**File Location:** `client/src/pages/DetectionEngine.tsx`

---

### Fix 3: Verify `useTTS.ts` Hook (No Changes Needed)

The hook is correctly implemented and works on the Dashboard. The issue was just the styling and component setup on other pages.

---

## Implementation Steps

1. **Replace `Home.tsx`** with the fixed version
2. **Replace `DetectionEngine.tsx`** with the fixed version
3. **Restart the development server** to clear any caches
4. **Test all pages**:
   - Home page: Click "Play in Hindi" button - should now work
   - Detection Engine: Click "Play Healthy Sound" and "Play Faulty Sound" - should now work
   - Dashboard: Should continue working as before

---

## Testing Checklist

- [ ] Home page audio button plays sound
- [ ] Detection Engine healthy sound button plays
- [ ] Detection Engine faulty sound button plays
- [ ] All pages display in light mode only
- [ ] No dark mode elements visible
- [ ] Dashboard still works correctly
- [ ] All text is readable on light backgrounds
- [ ] Buttons and cards display properly

---

## Technical Details

### Audio Implementation
- Uses **Web Speech API** (browser native text-to-speech)
- Supports multiple languages: English, Hindi, Telugu, Tamil
- No external audio files needed
- Works across all modern browsers

### Light Mode Implementation
- Uses Tailwind CSS `light` class
- All colors explicitly set to light-mode variants
- Background: `from-slate-50 to-blue-50`
- Text: `text-slate-900` (dark text on light background)
- Cards: `bg-white`

---

## Files to Update

| File | Status | Action |
|------|--------|--------|
| `client/src/pages/Home.tsx` | ✅ Fixed | Replace with Home_FIXED.tsx |
| `client/src/pages/DetectionEngine.tsx` | ✅ Fixed | Replace with DetectionEngine_FIXED.tsx |
| `client/src/hooks/useTTS.ts` | ✅ Working | No changes needed |
| `client/src/pages/Dashboard.tsx` | ✅ Working | No changes needed |

---

## Expected Results After Fix

✅ **Home Page**
- "Play in Hindi" button works and plays voice advisory
- Light mode enforced throughout
- All text and buttons visible and functional

✅ **Detection Engine Page**
- "Play Healthy Sound" button works
- "Play Faulty Sound" button works
- Light mode enforced throughout
- Analysis results display correctly

✅ **Dashboard Page**
- Continues to work as before
- Voice advisory works
- Light mode enforced

---

## Troubleshooting

### Audio Still Not Working?
1. Check browser console for errors (F12 → Console)
2. Ensure browser allows audio playback
3. Verify `useTTS` hook is imported correctly
4. Clear browser cache and refresh

### Dark Mode Still Appearing?
1. Check for conflicting CSS classes
2. Verify `light` class is on the root div
3. Clear Tailwind CSS cache
4. Restart dev server

---

## Support

If you encounter any issues after applying these fixes, please check:
1. Browser console for JavaScript errors
2. Network tab for failed requests
3. That all files were updated correctly
4. That the dev server was restarted
