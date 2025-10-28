# Quick Start Guide - LocoBuzz Frontend

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd emsocial
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Open Your Browser
Navigate to: **http://localhost:3000**

---

## 📱 Available Pages

### Social Inbox
**URL**: `/inbox`

Features:
- View all social media mentions
- Filter by brand (All, Vantara, Twinkle Khanna)
- Filter by date range
- Advanced filters (user characteristics, location, keywords)
- Category mapping
- Engagement metrics
- Make mentions actionable

**Try it**: Click on "Inbox" in the sidebar → Filter by brand → Click filters icon → Explore mentions

---

### Analytics Dashboard
**URL**: `/analytics`

Features:
- Overview metrics (Positive, Neutral, Negative, Unique Users)
- Mentions trend chart with engagement
- Sentiment distribution pie chart
- Real-time data visualization
- Filter by brand and date range

**Try it**: Click on "Analytics" in the sidebar → Change brand → View charts and metrics

---

### Keywords Configuration
**URL**: `/keywords`

Features:
- View all keyword groups
- Real-time vs Historic configuration
- Channel selection (Twitter, Facebook, Instagram, etc.)
- Query builder (AND/OR/NOT keywords)
- Status tracking

**Try it**: Click on "Listening Settings" → "Keywords Configuration" → Click info icon on any keyword

---

## 🌓 Dark Mode

Toggle dark mode using the **moon/sun icon** in the top navbar (top-right corner).

---

## 📱 Responsive Design

Test responsive behavior by:
1. Resizing your browser window
2. Opening DevTools (F12) and using device emulation
3. The sidebar automatically collapses on mobile

---

## 🎨 UI Components

### ShadCN UI Components Used:
- **Buttons**: Primary, Outline, Ghost variants
- **Cards**: Container with padding and shadow
- **Inputs**: Text inputs with styling
- **Checkboxes**: Styled form controls

### Icons:
- Using **Lucide React** icons throughout
- Examples: Inbox, BarChart3, Search, Filter, Calendar, etc.

### Charts:
- **Recharts** library for data visualization
- Line charts, Area charts, Pie charts

---

## 🔧 Customization

### Change Colors

Edit Tailwind classes in components:

```jsx
// Primary color (currently blue)
className="bg-blue-600 hover:bg-blue-700"

// Change to purple
className="bg-purple-600 hover:bg-purple-700"
```

### Add New Navigation Item

Edit `src/components/layout/DashboardLayout.jsx`:

```jsx
const navigationItems = [
  // ... existing items
  {
    title: 'Your New Page',
    icon: YourIcon,
    href: '/your-page',
    active: pathname === '/your-page'
  },
];
```

### Modify Mock Data

Edit `src/data/mockData.js` to change:
- Mention count
- Analytics metrics
- Keywords list
- Brands and categories

---

## 🛠️ Development Tips

### Hot Reload
Changes are automatically reflected in the browser. No need to restart the server.

### Component Inspection
1. Open React DevTools
2. Inspect component props and state
3. Debug rendering issues

### Console Logging
Add debug logs:
```jsx
console.log('Current state:', state);
```

### Clear Cache
If something breaks:
```bash
rm -rf .next
npm run dev
```

---

## 📚 Next Steps

1. **Connect to API**: See `FRONTEND_README.md` → API Integration
2. **Add Authentication**: Implement login/logout flow
3. **Add More Pages**: Reports, Publish, Campaign, etc.
4. **Customize Styling**: Adjust colors, spacing, typography
5. **Add Real Data**: Replace mock data with API calls

---

## 🐛 Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Styles Not Working
```bash
# Check if Tailwind is imported
# File: src/app/globals.css should have:
@import "tailwindcss";
```

---

## 📞 Need Help?

1. Check `FRONTEND_README.md` for detailed documentation
2. Check `FRONTEND_CHANGELOG.md` for recent changes
3. Review component files for usage examples
4. Check console for error messages

---

## ✅ Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser open at `localhost:3000`
- [ ] Explored `/inbox` page
- [ ] Explored `/analytics` page
- [ ] Explored `/keywords` page
- [ ] Tested dark mode toggle
- [ ] Tested responsive behavior
- [ ] Reviewed mock data structure

---

**Happy Coding! 🎉**

For detailed documentation, see **FRONTEND_README.md**

