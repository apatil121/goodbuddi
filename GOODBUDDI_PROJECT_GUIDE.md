# GoodBuddi Project Guide

> **Last Updated:** February 1, 2026  
> **Version:** 1.1.0  
> **Status:** ✅ Deployed with Supabase Authentication

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Setup](#current-setup)
3. [File Structure](#file-structure)
4. [Supabase Integration](#supabase-integration)
5. [How Each Component Works](#how-each-component-works)
6. [Making Changes](#making-changes)
7. [Deploying Updates](#deploying-updates)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)
10. [Future Enhancements](#future-enhancements)
11. [Version History](#version-history)

---

## Project Overview

**GoodBuddi** is a calendar platform designed to help people create a great day by incorporating activities that bring joy, energy, and fulfillment.

### Core Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Real user signup/login via Supabase |
| **Billboard** | Displays daily "Light Up Phrase" from user's customized list |
| **Portal** | Today's view showing event cards with activity tracking |
| **Scratchpad** | Smart text editor for quickly adding events with bullet syntax |
| **Plan My Week** | Week view (Monday-Sunday) for planning ahead |
| **Activity Timer** | Preset timers (5min-2hrs) with milestone tones and completion melody |
| **End Day Reflections** | Simple prompt: "What was exciting about your day?" |
| **Navigation Menu (A)** | Access to Portal, Profile, Light Up Phrases, Attention Center, Discovery Zone |

---

## Current Setup

### Hosting & Deployment

| Service | URL | Purpose |
|---------|-----|---------|
| **GitHub** | `github.com/apatil121/goodbuddi` | Source code repository |
| **Vercel** | `goodbuddi.vercel.app` | Live deployment (auto-deploys from GitHub) |
| **Supabase** | `supabase.com/dashboard/project/achtipgmdltbgtzmmfkd` | Authentication & Database |

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.1.0 | React framework with App Router |
| **React** | 18.x | UI library |
| **Supabase** | 2.39.0 | Authentication & PostgreSQL database |
| **CSS-in-JS** | - | Styles embedded in page.js |
| **Web Audio API** | - | Timer sounds and completion melodies |

### How Auto-Deploy Works

```
You push to GitHub → Vercel detects change → Builds automatically → Live in ~2 minutes
```

No manual deployment needed! Just push code to GitHub.

---

## File Structure

```
goodbuddi/
├── app/                    # Next.js App Router directory
│   ├── globals.css         # Global CSS reset (minimal)
│   ├── layout.js           # Root HTML layout, metadata
│   └── page.js             # ⭐ MAIN APP FILE (~2,800 lines)
├── package.json            # Dependencies and scripts
├── next.config.js          # Next.js configuration
├── .gitignore              # Files Git should ignore
└── README.md               # Basic project info
```

### File Details

#### `app/page.js` - The Main Application ⭐

This is where 99% of the app lives. It contains:

| Section | Lines (approx) | Description |
|---------|----------------|-------------|
| Supabase Setup | 1-10 | Import and initialize Supabase client |
| Audio Functions | 12-50 | Timer tones, milestone sounds, completion melody |
| Date Utilities | 52-75 | Date formatting, week calculations |
| Event Parser | 77-140 | Converts scratchpad text to structured events |
| **Components** | 142-1130 | All React components (see below) |
| **Main App** | 1130-1450 | State management, event handlers, session check |
| **Styles** | 1450-2800 | All CSS styles |

#### `package.json` - Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18"
  }
}
```

---

## Supabase Integration

### Overview

Supabase provides:
- **Authentication** - Email/password signup and login
- **Database** - PostgreSQL for storing user data
- **Row Level Security** - Users can only access their own data

### Supabase Project Details

| Setting | Value |
|---------|-------|
| **Project Name** | goodbuddi |
| **Project ID** | achtipgmdltbgtzmmfkd |
| **Region** | (your selected region) |
| **Dashboard URL** | `supabase.com/dashboard/project/achtipgmdltbgtzmmfkd` |

### Environment Variables (in Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for client-side auth |

**To view/edit:** Vercel Dashboard → goodbuddi → Settings → Environment Variables

### Database Tables

```sql
-- 1. profiles - Extends Supabase auth users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  first_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- 2. phrases - User's Light Up Phrases
CREATE TABLE phrases (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  phrase TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ
);

-- 3. calendar_days - Daily scratchpad & events
CREATE TABLE calendar_days (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date_key TEXT,  -- Format: YYYY-MM-DD
  scratchpad_text TEXT,
  events JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- 4. user_settings - User preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  selected_phrase_index INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- 5. reflections - End of day reflections
CREATE TABLE reflections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date_key TEXT,
  excitement TEXT,
  created_at TIMESTAMPTZ
);
```

### Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- **SELECT** their own data
- **INSERT** their own data
- **UPDATE** their own data
- **DELETE** their own data

### Authentication Flow

```
1. User visits app
   ↓
2. supabase.auth.getSession() checks for existing session
   ↓
3a. If session exists → Auto-login, show main app
3b. If no session → Show login/signup screen
   ↓
4. User signs up/in via supabase.auth.signUp() or signInWithPassword()
   ↓
5. On signup, trigger creates profile in profiles table
   ↓
6. onAuthStateChange() listener updates app state
   ↓
7. User logged in, can use app
```

### Key Code Sections

**Supabase Initialization (top of page.js):**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
```

**Session Check (in GoodBuddi component):**
```javascript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      setUserId(session.user.id);
      setUserName(session.user.email.split('@')[0]);
      setIsLoggedIn(true);
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      setUserId(session.user.id);
      setUserName(session.user.email.split('@')[0]);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setUserId(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

**Sign Up:**
```javascript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { first_name: firstName }
  }
});
```

**Sign In:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**Sign Out:**
```javascript
await supabase.auth.signOut();
```

### Supabase Dashboard Quick Links

| Section | Purpose |
|---------|---------|
| **Authentication → Users** | View all registered users |
| **Authentication → URL Configuration** | Set redirect URLs |
| **Table Editor** | View/edit database tables |
| **SQL Editor** | Run SQL queries |
| **API** | Get API keys |

---

## How Each Component Works

### 1. AuthScreen (Login/Signup)

**Location:** Lines ~1014-1130 in `page.js`

**What it does:**
- Handles user registration and login
- Shows error messages for invalid credentials
- Disables button while loading
- Requires minimum 6-character password

**State variables:**
- `isLogin` - Toggle between Sign In / Sign Up
- `email`, `password`, `firstName` - Form fields
- `loading` - Disable form while submitting
- `error` - Display error messages

---

### 2. Billboard (Light Up Phrases)

**Location:** Lines ~142-185 in `page.js`

**What it does:**
- Displays one inspirational phrase at the top
- User can customize up to 10 phrases in Profile
- Auto-selects random phrase daily OR user picks one

**State variables:**
- `lightUpPhrases` - Array of user's phrases
- `selectedPhraseIndex` - Which phrase is selected (null = random)
- `dailyPhrase` - Currently displayed phrase

---

### 3. Navigation Menu (A Button)

**Location:** Lines ~187-220 in `page.js`

**Menu items:**
1. Today's Portal
2. Profile
3. 5 Light Up Phrases
4. Attention Center
5. Discovery Zone

---

### 4. Profile Modal (Phrase Management)

**Location:** Lines ~222-290 in `page.js`

**Features:**
- Add/edit/remove phrases (max 10)
- Select which phrase to show daily
- Radio button for "always show this one"

---

### 5. Portal (Today's View)

**Location:** Lines ~340-390 in `page.js`

**What it shows:**
- Current day and date
- Current time (updates every minute)
- Event cards from scratchpad
- "End Day" button

**Event Card Types:**
- 🟠 Orange = Timed event (has @time)
- 🟣 Purple = Flexible event (no time)
- ⚫ Gray = Maybe event (starts with "maybe:")

---

### 6. Scratchpad (Smart Editor)

**Location:** Lines ~460-590 in `page.js`

**Syntax:**
```
- Event Name @2pm *1.5 hours
  - Activity 1
    - Sub-detail
  - Activity 2
- maybe: Optional Event
```

**Key behaviors:**
- `-` key creates bullet point (•)
- `Tab` indents (max 3 levels)
- `Shift+Tab` outdents
- `Enter` continues bullet at same level
- Empty bullet + Enter = outdent or remove

---

### 7. Activity Viewer Modal

**Location:** Lines ~390-460 in `page.js`

**Features:**
- Shows current activity with navigation dots
- Timer dropdown (5, 10, 15, 30, 45, 60, 90, 120 min)
- Progress bar (green → orange → red)
- Audio tones at 50%, 75%, 90% complete
- Completion melody when done

---

### 8. Week View (Plan My Week)

**Location:** Lines ~610-760 in `page.js`

**Layout:**
- Monday-Wednesday (row 1)
- Thursday-Friday (row 2)
- Saturday-Sunday (row 3)

**Features:**
- Week starts on Monday
- Navigate between weeks
- Click day to edit in side scratchpad
- Shows event preview (up to 3 titles)

---

### 9. End Day Modal

**Location:** Lines ~290-340 in `page.js`

**What it shows:**
- List of completed activities
- Single question: "What was exciting about your day?"
- Save & Close button

---

## Making Changes

### Local Development Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/apatil121/goodbuddi.git
   cd goodbuddi
   ```

2. **Create `.env.local` file:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://achtipgmdltbgtzmmfkd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run locally:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   Go to `http://localhost:3000`

### Editing the Code

**Option A: Edit on GitHub directly**
1. Go to `github.com/apatil121/goodbuddi`
2. Navigate to `app/page.js`
3. Click pencil icon (Edit)
4. Make changes
5. Commit → Auto-deploys to Vercel

**Option B: Edit locally (recommended for big changes)**
1. Clone repo (see above)
2. Edit files in your code editor (VS Code recommended)
3. Test locally with `npm run dev`
4. Push to GitHub when ready

### Finding What to Edit

| Want to change... | Look for... |
|-------------------|-------------|
| Colors | Search for hex codes like `#333`, `#ff9800` |
| Supabase calls | Search for `supabase.` |
| Authentication | Search for `supabase.auth` |
| A specific component | Search for the component name like `AuthScreen`, `Billboard` |
| Timer presets | Search for `timerPresets` |
| Default phrases | Search for `lightUpPhrases` in useState |

---

## Deploying Updates

### Method 1: GitHub Web Interface (Small Changes)

1. Go to your file on GitHub
2. Click Edit (pencil icon)
3. Make changes
4. Scroll down, add commit message
5. Click "Commit changes"
6. ✅ Vercel auto-deploys in ~2 minutes

### Method 2: Git Push (Bigger Changes)

```bash
# After making local changes
git add .
git commit -m "Description of changes"
git push
```

Vercel auto-deploys when it sees the push.

### Method 3: Upload New Files (Major Updates)

1. Go to GitHub repo
2. Click "Add file" → "Upload files"
3. Drag updated files
4. Commit
5. Vercel auto-deploys

---

## Common Tasks

### Add a New User Manually (in Supabase)

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. User can now log in

### View Registered Users

1. Go to Supabase Dashboard → Authentication → Users
2. See list of all users with signup date

### Check Environment Variables

1. Vercel Dashboard → goodbuddi → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist

### Reset a User's Password

1. Supabase Dashboard → Authentication → Users
2. Find user → Click three dots → "Send password recovery"

### Add Database Persistence for Calendar Data

(Future enhancement - currently data is stored in browser state only)

```javascript
// Save to Supabase
const saveCalendarDay = async (dateKey, scratchpadText, events) => {
  const { error } = await supabase
    .from('calendar_days')
    .upsert({
      user_id: userId,
      date_key: dateKey,
      scratchpad_text: scratchpadText,
      events: events,
      updated_at: new Date().toISOString()
    });
  if (error) console.error('Save error:', error);
};

// Load from Supabase
const loadCalendarDay = async (dateKey) => {
  const { data, error } = await supabase
    .from('calendar_days')
    .select('*')
    .eq('user_id', userId)
    .eq('date_key', dateKey)
    .single();
  return data;
};
```

---

## Troubleshooting

### "Invalid login credentials" Error

- Check email is correct
- Password must be at least 6 characters
- User must have signed up first

### Build Fails on Vercel

**Check for:**
- Missing closing brackets `}` or `)`
- Unclosed strings or template literals
- Import errors

**How to debug:**
1. Go to Vercel dashboard
2. Click on the failed deployment
3. Click "View Build Logs"
4. Look for the error message

### App Shows Blank Page

**Common causes:**
- JavaScript error (check browser console: Right-click → Inspect → Console)
- Missing `'use client';` at top of page.js
- Supabase environment variables not set

### Authentication Not Working

1. Check Vercel environment variables are set correctly
2. Check Supabase URL Configuration has correct redirect URL
3. Check browser console for errors

### "Email not confirmed" Error

By default, Supabase requires email confirmation. To disable:
1. Supabase Dashboard → Authentication → Providers
2. Click Email → Disable "Confirm email"

---

## Future Enhancements

### Planned Features
- [ ] Database persistence for calendar data
- [ ] Database persistence for phrases
- [ ] Database persistence for reflections
- [ ] Google Calendar sync
- [ ] Mobile app (React Native)
- [ ] Playbook database features
- [ ] Attention Center functionality
- [ ] Discovery Zone content
- [ ] Password reset flow
- [ ] Email confirmation flow

### Next Steps for Data Persistence

1. Add save/load functions for each data type
2. Call save on user actions (Set for Today, Save Phrases, etc.)
3. Call load on app startup and date changes
4. Add loading states while fetching data

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Feb 1, 2026 | Initial deployment with all core features |
| 1.1.0 | Feb 1, 2026 | Added Supabase authentication |

### Version 1.1.0 Changes
- ✅ Added Supabase client initialization
- ✅ Real email/password authentication
- ✅ Session persistence (stay logged in)
- ✅ Auto-login on return visit
- ✅ Sign out functionality
- ✅ Error handling for auth
- ✅ Loading states during auth
- ✅ Created database tables (profiles, phrases, calendar_days, user_settings, reflections)
- ✅ Row Level Security policies

### Version 1.0.0 Features
- ✅ Billboard with Light Up Phrases
- ✅ Phrase management in Profile (up to 10)
- ✅ Smart Scratchpad with bullet syntax
- ✅ Portal view with event cards
- ✅ Activity Viewer with compact timer
- ✅ Timer presets dropdown (5-120 min)
- ✅ Audio milestone tones and completion melody
- ✅ Week view (Monday-Sunday)
- ✅ End Day reflections
- ✅ Navigation menu (A button)
- ✅ Responsive design

---

## Quick Reference

### URLs
- **Live App:** https://goodbuddi.vercel.app
- **GitHub Repo:** https://github.com/apatil121/goodbuddi
- **Vercel Dashboard:** https://vercel.com/apatil121s-projects/goodbuddi
- **Supabase Dashboard:** https://supabase.com/dashboard/project/achtipgmdltbgtzmmfkd

### Key Files
- **Main App:** `app/page.js`
- **Layout:** `app/layout.js`
- **Dependencies:** `package.json`

### Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Commands
```bash
npm install    # Install dependencies
npm run dev    # Run locally
npm run build  # Build for production
```

### Deployment
Push to GitHub → Vercel auto-deploys → Live in ~2 minutes

---

*This document should be updated whenever significant changes are made to the project structure, features, or deployment process.*
