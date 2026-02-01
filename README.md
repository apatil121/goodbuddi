# GoodBuddi

**Create a great day, every day.**

A calendar platform designed to help people incorporate activities that bring them joy, energy, and fulfillment into their daily lives.

## Features

- 📝 **Smart Scratchpad** - Quick event entry with bullet points and indentation
- 📅 **Portal View** - Daily calendar with event cards and activity tracking  
- 📆 **Plan My Week** - Week view (Monday-Sunday) for planning ahead
- ⏱️ **Activity Timer** - Preset timers with milestone notifications
- 💭 **End Day Reflections** - Daily reflection prompts
- ✨ **Light Up Phrases** - Daily inspirational phrases you customize

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- [Git](https://git-scm.com/) installed
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - GoodBuddi app"

# Add your GitHub repository as remote
# (Create a new repo on GitHub first, then copy the URL)
git remote add origin https://github.com/YOUR_USERNAME/goodbuddi.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Find and import your `goodbuddi` repository
4. Click **"Deploy"**
5. Wait ~2 minutes for deployment
6. Your app is now live! 🎉

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Frontend:** React 18
- **Styling:** CSS-in-JS
- **Audio:** Web Audio API
- **Deployment:** Vercel

## Project Structure

```
goodbuddi/
├── app/
│   ├── globals.css    # Global styles
│   ├── layout.js      # Root layout
│   └── page.js        # Main app component
├── package.json       # Dependencies
├── next.config.js     # Next.js config
└── README.md          # This file
```

## Future Enhancements

- [ ] Supabase authentication
- [ ] Data persistence
- [ ] Google Calendar sync
- [ ] Mobile app (React Native)
- [ ] Playbook database features

## Author

**Ashish Patil** - [@Ashish_Patil](https://twitter.com/Ashish_Patil)

## License

This project is private and proprietary.
