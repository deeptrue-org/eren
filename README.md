# EREN - AI-Powered SEO Content Generator

## 🚀 Project Overview

EREN is a comprehensive SEO content generation platform built with Next.js full-stack architecture. It automates the entire content creation process from keyword research to publishing, using AI to generate high-quality, SEO-optimized content.

## 🏗️ Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Data Storage**: Local JSON files
- **AI Integration**: OpenAI GPT-4, Google Search APIs
- **Deployment**: Vercel (recommended)

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js App                           │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────┐ │
│  │   UI Pages      │    │   API Routes    │    │  JSON   │ │
│  │   (React/TSX)   │◄──►│   (Server)      │◄──►│ Files   │ │
│  └─────────────────┘    └─────────────────┘    └─────────┘ │
│                                 │                           │
│                                 ▼                           │
│                    ┌─────────────────────┐                  │
│                    │   External APIs     │                  │
│                    │  (OpenAI, Google)   │                  │
│                    └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
eren/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # Main dashboard
│   │   ├── keywords/           # Keyword research
│   │   │   ├── page.tsx        # Seed collection
│   │   │   └── expand/         # Keyword expansion
│   │   ├── content/            # Content creation
│   │   │   ├── briefs/         # Content briefs
│   │   │   ├── outlines/       # Outline creation
│   │   │   ├── drafts/         # Draft writing
│   │   │   └── optimize/       # SEO optimization
│   │   ├── publishing/         # Publishing tools
│   │   ├── api/                # API Routes
│   │   │   ├── keywords/       # Keyword endpoints
│   │   │   ├── content/        # Content endpoints
│   │   │   ├── publishing/     # Publishing endpoints
│   │   │   └── external/       # External API integrations
│   │   └── layout.tsx          # Root layout
│   │
│   ├── components/             # UI Components
│   │   ├── ui/                 # Basic components
│   │   ├── forms/              # Form components
│   │   ├── cards/              # Card components
│   │   └── editors/            # Content editors
│   │
│   ├── lib/                    # Utilities
│   │   ├── data.ts             # JSON file operations
│   │   ├── apis/               # External API clients
│   │   │   ├── openai.ts       # OpenAI integration
│   │   │   ├── google.ts       # Google APIs
│   │   │   └── notion.ts       # Notion API
│   │   ├── services/           # Business logic
│   │   │   ├── keyword-service.ts
│   │   │   ├── content-service.ts
│   │   │   └── seo-service.ts
│   │   └── utils.ts            # Helper functions
│   │
│   ├── types/                  # TypeScript types
│   │   ├── keywords.ts
│   │   ├── content.ts
│   │   └── api.ts
│   │
│   └── hooks/                  # Custom React hooks
│       ├── use-keywords.ts
│       ├── use-content.ts
│       └── use-seo.ts
│
├── data/                       # Local JSON storage
│   ├── projects.json
│   ├── keywords.json
│   ├── content.json
│   └── briefs.json
│
├── public/                     # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## 🎯 Core Features & Workflow

### **1. Keyword Strategy Development**

#### 1.1 **Seed Keyword Collection**

- **Context Data Collection**
  - Input product/service Notion URL or website URL
  - Extract relevant information for keyword research
- **Data Sources**
  - Google Search Console API: Top performing keywords
  - User input keywords with exclude options
- **User Selection**: Finalize 5-10 seed keywords

#### 1.2 **🔥 Enhanced Keyword Expansion & Refinement**

- **Smart Browser Integration**:
  - Connects to your existing Chrome browser with Google Trends open
  - Uses your logged-in Google session for better reliability
  - Significantly reduces CAPTCHA occurrences
- **Related Keyword Generation**: Google Trends, Google Suggest API
- **Enhanced Scraping**: Improved extraction algorithms with multiple fallback methods
- **Refinement**: Remove duplicates and irrelevant keywords, sort by search volume
- **User Selection**: Choose N keywords from top 20-30 suggestions

#### 🚀 **Enhanced Mode Setup**

**Option 1: Quick Setup (Recommended)**

1. Open Google Trends in your browser
2. Stay logged in to your Google account
3. Keep the tab open and start keyword expansion

**Option 2: Advanced Setup (Maximum Performance)**

1. Close all Chrome windows
2. Start Chrome with debugging:

   ```bash
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

   # Windows
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   ```

3. Open Google Trends and log in

**Benefits:**

- Uses existing logged-in Google session
- Significantly reduces CAPTCHA occurrences
- Faster keyword extraction
- Better success rates for large keyword lists
- Real-time monitoring capability

---

### **2. Target Audience & Intent Analysis**

#### 2.1 **Input**

- Finalized keyword list
- (Optional) Persona summary

#### 2.2 **SERP Analysis & Context Collection**

- Custom Search API to collect top 5 pages metadata (title/snippet/domain)
- Page type classification (How-to, Comparison, Case Study, etc.)
- Keyword tag extraction

#### 2.3 **AI-Powered Content Brief Generation**

- **Input**: Keywords, (optional) personas
- **Output Format**: 3-5 suggestions per keyword

```
**Keyword: live face swap**

1. **Target**: YouTube Creators
   **Intent**: How-to Search
   **Topic**: "How to Set Up Real-time Face Swap on Instagram Live"

2. **Target**: Social Media Marketers
   **Intent**: Comparison
   **Topic**: "OBS vs Streamlabs: Real-time Face Swap Feature Comparison"

3. **Target**: Online Education Instructors
   **Intent**: Troubleshooting
   **Topic**: "Solving Screen Lag Issues During Live Face Swapping"
```

#### 2.4 **Brief Review & Selection**

- Card/table view for brief listings
- Select briefs to proceed to next stage

#### 2.5 **Feedback Integration**

- Add comments to selected briefs
- AI incorporates feedback for final outline generation

---

### **3. Outline & Draft Creation**

#### 3.1 **Automatic Outline Generation**

- H1-H3 hierarchical structure
- Keyword allocation and word count estimation per section

#### 3.2 **Draft Writing**

- Auto-generated introduction → body sections → conclusion with CTAs
- Internal notes like "Insert infographic here" included

---

### **4. Automatic Optimization & Validation**

#### 4.1 **SEO Checks**

- Keyword density analysis
- Title & meta description length recommendations
- Image alt tag suggestions

#### 4.2 **Fact Checking & Citations**

- Verify key statistics and examples with search tools
- Auto-insert credible external links

#### 4.3 **Readability & Grammar Check**

- Sentence length optimization
- Passive voice and awkward expression corrections
- Tone adjustment (friendly/professional) options

---

### **5. User Review & Feedback Loop**

- Chat-based iterative editing
- Final approval process

---

### **6. Publishing**

#### 6.1 **Publishing Automation**

- Notion API integration
- Markdown/HTML export to CMS

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- OpenAI API Key
- Google Custom Search API Key
- Google Search Console API Key

### Quick Start

1. **Clone and Setup**

```bash
git clone <repository-url>
cd eren
cp .env.example .env
# Edit .env with your API keys
```

2. **Install Dependencies**

```bash
npm install
```

3. **Run Development Server**

```bash
npm run dev
```

4. **Access the App**

- Application: http://localhost:3000
- API: http://localhost:3000/api

### Environment Variables

```env
# API Keys
OPENAI_API_KEY="your-openai-key"
GOOGLE_API_KEY="your-google-key"
GOOGLE_CSE_ID="your-custom-search-engine-id"
GOOGLE_SEARCH_CONSOLE_API_KEY="your-gsc-key"

# Optional
NOTION_TOKEN="your-notion-token"
```

## 🔄 API Endpoints

### Keywords

- `POST /api/keywords/seed` - Collect seed keywords
- `POST /api/keywords/expand` - Expand keywords
- `POST /api/keywords/strategy` - Finalize keyword strategy

### Content

- `POST /api/content/briefs` - Generate content briefs
- `POST /api/content/outlines` - Generate content outlines
- `POST /api/content/drafts` - Generate content drafts
- `POST /api/content/optimize` - SEO optimization

### Publishing

- `POST /api/publishing/notion` - Publish to Notion
- `POST /api/publishing/export` - Export as Markdown/HTML

### External APIs

- `POST /api/external/google/search` - Google Search integration
- `POST /api/external/openai/generate` - OpenAI content generation
- `POST /api/external/notion/create` - Notion page creation

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

## 📝 Usage Flow

1. **Keyword Research**: Input product context → collect seed keywords → expand keywords
2. **Content Planning**: Generate content briefs → select target audiences and intents
3. **Content Creation**: Generate outlines → create drafts → optimize for SEO
4. **Review & Edit**: Use chat interface for iterative improvements
5. **Publishing**: Export to Notion or download as Markdown/HTML

## 🎨 Key Features

- **AI-Powered Workflow**: Complete automation from keywords to content
- **SERP Analysis**: Real-time competitor analysis
- **SEO Optimization**: Built-in SEO validation and recommendations
- **Interactive Feedback**: Chat-based content refinement
- **Multi-format Export**: Notion, Markdown, HTML support
- **Context-Aware**: URL-based context extraction
- **Persona-Driven**: Target audience-specific content generation

## 🛠️ Tech Stack Details

- **Framework**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **API Routes**: Next.js API Routes for server-side logic
- **Data Storage**: Local JSON files for simplicity
- **AI Integration**: OpenAI GPT-4 for content generation
- **Search APIs**: Google Custom Search, Google Trends, Google Search Console
- **UI Components**: Radix UI with Tailwind CSS
- **State Management**: React hooks with SWR for data fetching

## 📚 Development Notes

- Simple Next.js application with API routes
- Local JSON files for data storage (no database setup required)
- Real-time feedback system with chat interface
- Comprehensive SEO analysis and optimization tools
- Easy to set up and run locally

## 🔧 Customization

Easily customizable:

- AI prompts in `src/lib/services/`
- UI components in `src/components/`
- API endpoints in `src/app/api/`
- Data structure in `data/` JSON files
- Content templates and formats

Perfect for content creators, digital marketers, and SEO professionals who need a comprehensive, AI-powered content generation platform!

## 🔑 API Configuration

For enhanced features, configure the following API keys in your `.env.local` file:

### Required for Enhanced Analysis

```bash
# OpenAI API Key (for GPT-4 powered analysis)
OPENAI_API_KEY=your_openai_api_key_here
```

**Get your OpenAI API key**: https://platform.openai.com/api-keys

**Features unlocked**:

- ✅ GPT-4 powered SEO analysis
- ✅ Advanced content optimization
- ✅ Real-time AI chat feedback
- ✅ Intelligent content improvements

### Optional for Real Fact-Checking

```bash
# Bing Search API Key (for real web search verification)
BING_SEARCH_API_KEY=your_bing_search_api_key_here
```

**Get your Bing Search API key**: https://portal.azure.com/ (Cognitive Services > Bing Search)

**Features unlocked**:

- ✅ Real web search fact verification
- ✅ Reliable source checking (Statista, McKinsey, Reuters, etc.)
- ✅ High confidence fact-checking scores

### Already Configured

```bash
# Google APIs (for SERP analysis and content briefs)
GOOGLE_CSE_ID=your_google_custom_search_engine_id
GOOGLE_API_KEY=your_google_api_key
```

### ⚠️ Without API Keys

The system will work with limited functionality:

- Basic pattern-based analysis (instead of GPT-4)
- Simulated fact-checking (instead of real web search)
- Template-based responses (instead of AI chat)

### 🎯 Recommended Setup

For the best experience:

1. **Minimum**: Add `OPENAI_API_KEY` for enhanced analysis
2. **Optimal**: Add both `OPENAI_API_KEY` and `BING_SEARCH_API_KEY` for full features
