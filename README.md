# Countryle Helper

A comprehensive helper tool for the [Countryle](https://countryle.com/) geography guessing game.

![Countryle Helper](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

## 🌍 Features

### 📅 Today Page
- View the current daily country answer
- See all country details: population, surface area, temperature, coordinates
- Direct link to Google Maps location
- Game number and date displayed in IST timezone

### 📚 Archive Page
- Browse past daily answers
- Selectable date ranges: 7, 14, 30, 60, or 90 days
- View country name, continent, and hemisphere
- Highlights the most recent entry

### 🧩 Solver Page
- Interactive game solver with autocomplete search
- Get clues comparing your guess to the answer:
  - **Continent**: Correct or Different
  - **Hemisphere**: North/South - Correct or Different
  - **Population**: Equal, More, Less, Little More, Little Less
  - **Surface Area**: Same comparison as population
  - **Temperature**: Equal, Warmer, Colder, Slightly Warmer/Colder
  - **Direction**: Go North/South/East/West
- Color-coded feedback (green = correct, yellow = hint)
- Win celebration when you guess correctly

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Bun (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sujitbhai7710/countryle-helper.git
cd countryle-helper

# Install dependencies
bun install

# Run development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Technical Details

### API Integration
- Decrypts AES-encrypted country IDs from Countryle's API
- Encryption key: `4%w!KpB+?FC<P9W*`
- Fetches daily answers from Countryle's hidden API endpoint

### Timezone Handling
- All dates calculated in IST (Indian Standard Time, UTC+5:30)
- Daily answers update at 12:00 AM IST automatically

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons (inline SVG)
- **Encryption**: CryptoJS for AES decryption

## 📁 Project Structure

```
countryle-helper/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── today/route.ts      # Today's answer API
│   │   │   ├── archive/route.ts    # Archive API
│   │   │   ├── solve/route.ts      # Solver API
│   │   │   └── countries/route.ts  # Countries list API
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Tabs.tsx
│   │   ├── TodayAnswer.tsx
│   │   ├── Archive.tsx
│   │   └── Solver.tsx
│   └── lib/
│       ├── countries.ts            # Country data utilities
│       └── crypto.ts               # AES encryption/decryption
├── countries.json                   # Country database
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🎮 How the Game Works

Countryle is a Wordle-like game where you guess a country each day:
1. Enter a country name
2. Receive clues about how your guess compares to the answer
3. Use the clues to narrow down the correct country
4. Win by guessing the correct country!

This helper tool provides:
- The daily answer (for those who want to know)
- Archive of past answers
- An interactive solver to practice

## ⚠️ Disclaimer

This project is not affiliated with countryle.com. It's an independent helper tool created for educational purposes.

## 📄 License

MIT License - feel free to use and modify as needed.

---

Made with ❤️ for geography enthusiasts
