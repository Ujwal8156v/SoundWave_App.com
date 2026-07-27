# 🎧 SoundWave MusicStream - Master Audio & Instagram Social Hub

[![Live App](https://img.shields.io/badge/Live%20App-https%3A%2F%2Fujwal8156v.github.io%2Fsoundwave--musicstream--app%2F-8b5cf6?style=for-the-badge&logo=github)](https://ujwal8156v.github.io/soundwave-musicstream-app/)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Build-Passing-00f0ff?style=for-the-badge)](https://ujwal8156v.github.io/soundwave-musicstream-app/)

---

## 🌟 Overview

**SoundWave MusicStream** is a state-of-the-art music streaming platform combining **320kbps Lossless Master Audio Playback** with an **Instagram-Style Social Media Infrastructure**.

---

## 🚀 Key Features

### 📸 Instagram Social Media Infrastructure
- **Stories Rail**: Gradient ring indicators with fullscreen story viewer modal.
- **🎬 SoundWave Reels**: Vertical snap-scroll video feed with heart explosion animations (`@keyframes heartPop`).
- **📸 Social Feed**: Post cards, double-tap liking, comment drawers, and bookmark saving.
- **💬 Direct Messages (E2EE)**: Primary & Requests dual tabs, zero-latency optimistic messaging, and Web Crypto API 256-bit AES-GCM End-to-End Encryption.
- **🔑 WhatsApp-Style Safety Keys**: 60-digit security code verification modal for encrypted chat integrity.
- **👤 Unified Instagram Profile (`#profile`)**: 3-column posts grid, Reels tab, Saved tab, Tagged tab, verified stats, and bio editing.

### 🎵 Master Audio Engine
- **High-Fidelity Audio**: 320kbps Master audio streaming with zero-latency background caching.
- **🎛️ Equalizer & Visualizer**: Dynamic canvas spectrum visualizers and 10-band equalizer presets.
- **🥁 BeatVibe AI Drum Synth**: Interactive live drum pads (Kick, Snare, Hi-Hat, Sub) and automated DJ drum loops.

### 🔒 Security & Payment Gateway
- **Email OTP Verification**: Gmail SMTP transporter (`wsound283@gmail.com`) with 0ms instant non-blocking modal transitions and on-screen code banner.
- **🔑 Account Recovery**: Password reset flow via OTP.
- **💳 PayU Gateway Integration**:
  - SoundWave Plus (₹59/mo): `https://u.payu.in/Erl7hKgICCH1`
  - Student Hi-Fi Pass (₹89/3 mos): `https://u.payu.in/YIoRtYtdRxuS`
  - Family Premium VIP (₹179/mo): `https://u.payu.in/rrlLa18bmvEL`

---

## 📁 Project Structure

```
soundwave-musicstream-app/
├── web-frontend/              # Vite Web Application & Design System
│   ├── css/                   # Stylesheets (styles.css, instagram.css, responsive.css)
│   ├── js/                    # Application Modules (app.js, social.js, auth.js, player.js)
│   └── assets/                # Images, Icons, and Media
├── backend/
│   ├── node-service/          # Express REST API (Port 5000) & OTP Gateway
│   └── python-service/        # Invidious & Innertube Streaming Microservices
├── docs/                      # GitHub Pages Production Distribution
├── assets/                    # Production Static Assets
├── index.html                 # Main Entry Point
└── README.md
```

---

## 🌐 Live URLs

- **Web App**: [https://ujwal8156v.github.io/soundwave-musicstream-app/](https://ujwal8156v.github.io/soundwave-musicstream-app/)
- **Social Feed**: [https://ujwal8156v.github.io/soundwave-musicstream-app/#social-feed](https://ujwal8156v.github.io/soundwave-musicstream-app/#social-feed)
- **Reels**: [https://ujwal8156v.github.io/soundwave-musicstream-app/#reels](https://ujwal8156v.github.io/soundwave-musicstream-app/#reels)
- **Direct Messages**: [https://ujwal8156v.github.io/soundwave-musicstream-app/#direct-messages](https://ujwal8156v.github.io/soundwave-musicstream-app/#direct-messages)
- **Profile**: [https://ujwal8156v.github.io/soundwave-musicstream-app/#profile](https://ujwal8156v.github.io/soundwave-musicstream-app/#profile)
- YouTube Data API
- SoundCloud API
- Genius API (Lyrics)

## Getting Started

### Prerequisites
- Node.js v16+
- Python 3.9+
- PostgreSQL 12+
- Redis
- npm/yarn

### Installation

```bash
# Clone repository
git clone https://github.com/Ujwal8156v/soundwave-musicstream-app.git
cd soundwave-musicstream-app

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

### Development

```bash
# Run all services
npm run dev

# Or run individually
npm run dev:web
npm run dev:backend
npm run dev:mobile
```

## Documentation

- [API Documentation](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Setup Guide](./docs/SETUP.md)
- [Contributing](./CONTRIBUTING.md)

## License

MIT - See [LICENSE](./LICENSE) file

## Support

For issues and feature requests, please create an issue on GitHub.

## Contributors

- Ujwal8156v

---

**Made with ❤️ by the Ujwal Kumar Behera**
