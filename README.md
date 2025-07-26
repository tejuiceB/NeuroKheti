# NeuroKheti Frontend

This is the frontend application for NeuroKheti - an AI-powered agricultural assistant built with Next.js 15.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project
- Gemini API key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your API keys:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

## 🛠️ Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase** - Authentication & Database
- **Gemini AI** - Image analysis & chat
- **Web Speech API** - Voice features
- **Vercel** - Deployment platform

## 📱 Features

### ✅ Implemented
- Crop disease diagnosis with camera
- Multi-language voice assistant (Vaani)
- User authentication
- Responsive design for mobile/desktop
- Real-time AI chat capabilities
- Crop Lifecycle Navigator
- ROI Calculator

### 🚧 In Progress  
- Market price analysis
- Government scheme navigation
- Advanced voice features
- Offline capabilities

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### API Routes

- `/api/analyze-crop` - Crop image analysis
- `/api/vaani-chat` - Voice assistant chat
- `/api/translate-results` - Multi-language translation
- `/api/speech-to-text` - Voice recognition (future)
- `/api/text-to-speech` - Voice synthesis (future)

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional - Development
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

### Manual Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## 🌍 Internationalization

The app supports 12+ Indian languages:

- Hindi (हिंदी)
- Kannada (ಕನ್ನಡ) 
- Telugu (తెలుగు)
- Tamil (தமிழ்)
- Malayalam (മലയാളം)
- Marathi (मराठी)
- Gujarati (ગુજરાતી)
- Punjabi (ਪੰਜਾਬੀ)
- Bengali (বাংলা)
- Odia (ଓଡ଼ିଆ)
- Assamese (অসমীয়া)
- English

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Manual Testing Checklist

**Authentication:**
- [ ] User registration
- [ ] User login/logout
- [ ] Protected routes

**Crop Diagnosis:**
- [ ] Image upload
- [ ] Camera capture
- [ ] AI analysis
- [ ] Multi-language results

Built with ❤️ for farmers worldwide using cutting-edge AI technology.
