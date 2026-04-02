# ⚡ FINFLEX: Financial Revolution
### *Master Your Money, Flex Your Discipline.*

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB%2FAuth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

---

</div>

**FinFlex** is a high-performance, AI-powered personal finance suite built for the provocateur. It strips away boring banking jargon and replaces it with raw power, visual clarity, and real-time financial insights.

## 🏗️ System Architecture

FinFlex leverages a modern, distributed architecture to provide real-time expense tracking across multiple platforms.

```mermaid
graph TD
    User((User))
    
    subgraph "Frontend Layer"
        Web[React 19 SPA]
        Tailwind[Tailwind CSS 4 - Neobrutalism]
        Motion[Framer Motion - 60fps Anims]
    end
    
    subgraph "Backend Layer (Supabase)"
        Auth[Supabase Auth]
        DB[(PostgreSQL DB)]
    end
    
    subgraph "AI & Bot Layer"
        Gemini[Google Gemini AI]
        Bot[Telegram Bot API - Clawbot]
        Srv[Express Integration Server]
    end

    User <--> Web
    Web <--> Auth
    Web <--> DB
    Web <--> Gemini
    User <--> Bot
    Bot <--> Srv
    Srv <--> DB
```

---

## 🚀 Key Features

### 📊 Tactical Dashboard
Real-time financial status, spending velocity, and income tracking.
- **Flex-O-Meter**: Dynamic tracking of your financial goals.
- **Transaction History**: Instant categorization of every rupee spent.

### 🤖 Clawbot (AI Agent)
Integrated financial intelligence via **Telegram**.
- **Log Expenses via Chat**: Send "50 for coffee" to the bot; it logs it to your dashboard instantly.
- **AI Financial Advice**: Get personalized insights powered by **Google Gemini**.

### 🛠️ Elite Toolset
A comprehensive suite of specialized financial calculators:
- **FIRE Calculator**: Plan your early retirement with high-precision projections.
- **Tax Estimator**: Dynamic calculation of annual tax liabilities.
- **EMI & Compound Interest**: High-fidelity wealth growth projections.
- **Punishment Contract**: A self-discipline engine for high-risk financial savers.

---

## 🛠️ Tech Stack

- **Core**: React 19, Vite 6, TypeScript 5.
- **UI Architecture**: Tailwind CSS 4, Framer Motion, Lucide Icons.
- **Data Persistence**: Supabase (PostgreSQL), Edge Functions.
- **Intelligence**: Google Gemini API, Custom Express Integration Server.
- **Mobile Access**: Telegram Bot API for remote expense logging.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project
- Google AI Studio API Key
- Telegram Bot Token

### 1. Environment Configuration
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 2. Installation & Execution
```bash
# Install dependencies
npm install

# Run the project (Dev mode + Server)
npm run dev
```

---

## 📦 Deployment

The project is optimized for deployment on platforms like **Render**, **Vercel**, or **Netlify**.

```bash
# Build for production
npm run build

# Preview build
npm run preview
```

---

<div align="center">
  <p>Made with ❤️ in India for the Financial Revolution.</p>
  <p>© 2024 Finflex. No-line finance for the provocateur.</p>
</div>
