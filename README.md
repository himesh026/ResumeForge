# ATS Resume Tailo

AI-powered resume optimization for every job application. Upload your resume, paste a job description, and get a tailored, ATS-optimized LaTeX resume in seconds.

---

## Features

- **Email authentication** — passwordless login with 6-digit verification codes
- **AI resume optimization** — rewrites and keyword-optimizes your resume for each role
- **LaTeX + PDF output** — generates compilable LaTeX, optionally auto-compiles to PDF
- **Multi-LLM support** — Anthropic Claude, Google Gemini, or local Ollama
- **Application dashboard** — track all your applications with download history
- **Fully editable output** — edit the LaTeX directly in the browser before downloading

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Database | SQLite via Prisma |
| Auth | JWT (jose) + httpOnly cookies |
| AI | Anthropic Claude / Google Gemini / Ollama |
| PDF | pdflatex (TeX Live) |
| PDF Parsing | pdf-parse |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-random-32-char-secret"

# AI — pick one (or both)
AI_MODE="cloud"                          # "cloud" or "local"
ANTHROPIC_API_KEY="sk-ant-..."           # Anthropic Claude
GEMINI_API_KEY="AIza..."                 # Google Gemini (fallback)

# Local LLM (if AI_MODE=local)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3"

# Email (optional — code printed to console if not set)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="you@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Run setup

```bash
node scripts/setup.js
```

This will:
- Create `.env` if missing
- Generate Prisma client
- Push SQLite schema
- Check for pdflatex

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## PDF Generation

To enable automatic PDF compilation, install TeX Live:

**Ubuntu / Debian:**
```bash
sudo apt-get install texlive-full
# or minimal install:
sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra
```

**macOS:**
```bash
brew install --cask mactex
```

**Windows:**
Download and install [MiKTeX](https://miktex.org/download).

Without TeX Live, the app still works — you'll get the LaTeX source to compile yourself (e.g. on [Overleaf](https://overleaf.com)).

---

## AI Modes

### Cloud (Anthropic Claude — recommended)
```env
AI_MODE=cloud
ANTHROPIC_API_KEY=sk-ant-...
```
Uses `claude-opus-4-6` by default.

### Cloud (Google Gemini)
```env
AI_MODE=cloud
GEMINI_API_KEY=AIza...
```
Falls back to Gemini if no Anthropic key is set.

### Local (Ollama)
```env
AI_MODE=local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```
Start Ollama: `ollama run llama3`

---

## Project Structure

```
ats-resume-tailor/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── send-code/route.ts    # Send verification email
│   │   │   ├── verify/route.ts       # Verify code → set session
│   │   │   ├── logout/route.ts       # Clear session cookie
│   │   │   └── me/route.ts           # Get current user
│   │   ├── applications/
│   │   │   ├── route.ts              # GET all / POST create
│   │   │   └── [id]/route.ts         # GET one / DELETE
│   │   ├── generate-resume/route.ts  # Main AI pipeline
│   │   └── files/[...path]/route.ts  # Serve PDF / LaTeX
│   ├── dashboard/page.tsx            # Applications dashboard
│   ├── login/page.tsx                # Email auth
│   ├── new-application/page.tsx      # New app form
│   ├── result/[id]/page.tsx          # Generated resume view
│   ├── layout.tsx
│   ├── page.tsx                      # Redirects to /dashboard
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   ├── ApplicationTable.tsx
│   ├── FileUpload.tsx
│   ├── ResumeForm.tsx                # Form + generation flow
│   └── ResultView.tsx                # LaTeX editor + downloads
├── lib/
│   ├── auth.ts                       # JWT sessions, email sending
│   ├── llmClient.ts                  # Anthropic / Gemini / Ollama
│   ├── resumeOptimizer.ts            # AI prompt + response cleanup
│   ├── latexCompiler.ts              # pdflatex wrapper
│   ├── pdfParser.ts                  # pdf-parse wrapper
│   └── prisma.ts                     # Prisma singleton
├── prisma/
│   └── schema.prisma                 # SQLite schema
├── middleware.ts                     # Route auth protection
├── scripts/
│   └── setup.js                      # First-run setup
└── .env.example
```

---

## Database Schema

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  createdAt    DateTime      @default(now())
  applications Application[]
  authTokens   AuthToken[]
}

model AuthToken {
  id        String   @id @default(cuid())
  token     String   @unique      # 6-digit code
  userId    String
  expiresAt DateTime              # 10 minutes
  used      Boolean  @default(false)
}

model Application {
  id                 String   @id @default(cuid())
  userId             String
  companyName        String
  jobRole            String
  jobDescription     String
  resumePdfPath      String?  # uploaded resume
  generatedLatexPath String?  # .tex file path
  generatedPdfPath   String?  # .pdf file path
  latexContent       String?  # full LaTeX source
  createdAt          DateTime @default(now())
}
```

---

## Deployment

### Vercel
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

> **Note:** PDF compilation requires pdflatex, which isn't available on Vercel's serverless runtime. For full PDF support, deploy on a VPS (Railway, Render, DigitalOcean) or run locally.

### Docker
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache texlive-full
WORKDIR /app
COPY . .
RUN npm install && npx prisma generate && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Railway / Render
1. Add a nixpacks.toml to install texlive:
```toml
[phases.setup]
nixPkgs = ["texlive.combined.scheme-full"]
```

---

## Development Notes

- In development, verification codes are printed to the **server console** (no email needed)
- SQLite database is stored at `./dev.db`
- Uploaded files go to `./uploads/<userId>/`
- Generated files go to `./outputs/<userId>/<applicationId>/`

---

## License

MIT
