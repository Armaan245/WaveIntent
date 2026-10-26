# WaveIntent ⚡

> **Zero UI Voice-Activated Crypto Transfer on the Sepolia (Sephio) Testnet with Evil Dark Cards, Frosted Glass Loader, and Disney Particle Transition.**

---

## 🌟 Features Overview

- **Zero UI Experience**: Invisible interface until spoken. Includes a breathing voice aura, live audio waveform equalizer bars, and real-time speech-to-text feedback.
- **Evil Dark Cards**: Cyberpunk pitch-black obsidian cards (`#0A0C10`), monospace data readouts, micro-glow borders, and sinister hexadecimal aesthetics.
- **Pulsing Background**: Dynamic ambient mesh gradient that pulsates with fluid rhythm and reacts to user interaction.
- **Mint Green Phrase Button**: Electric mint green (`#00FFA3`) tactile audio button with concentric pulse rings and microphone icon.
- **Solid White Execute Button**: High-contrast, stark solid white (`#FFFFFF`) button with Disney sparkle icons and light-sweep reflection.
- **Disney Transition**: Full-screen canvas particle explosion with fairy stardust, swirling arcs, and real-time Web Audio API synthesized arpeggio chimes (no external audio files needed).
- **Frosted Glass Loader**: High-blur acrylic modal (`backdrop-filter: blur(28px)`) featuring a multi-ring spinner, 4-stage testnet step progressor, and a block explorer receipt.
- **MetaMask Connection Flag**: Configurable toggle (`CONFIG.FLAG_ENABLE_METAMASK: true`) with interactive UI switch, supporting both real MetaMask Sepolia transactions (`0xaa36a7`) and high-fidelity testnet sandbox simulation.
- **Spoken Intent Extraction API**: Express backend endpoint `POST /api/extract-intent` that extracts amount, token, network, and recipient address from natural speech.
- **Chrome Extension Ready**: Manifest V3 compliant (`manifest.json`), can be loaded directly as a Chrome Extension new tab override or browser action.

---

## 🚀 Quick Start

### 1. Install & Run Locally

```bash
# Clone / navigate to project
cd d:/WaveIntent

# Dependencies are already installed
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Install as a Chrome Extension Tab

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `d:\WaveIntent` directory.
5. Open a new tab in Chrome to see **WebIntent** take over with zero UI voice controls!

---

## 🔌 API Route: `POST /api/extract-intent`

Extracts transaction parameters from spoken English text.

### Request:
```bash
POST /api/extract-intent
Content-Type: application/json

{
  "transcript": "Send 0.05 Sepolia ETH to 0x71C66332e9a37793d5d44322840515c325672325"
}
```

### Response:
```json
{
  "success": true,
  "rawTranscript": "Send 0.05 Sepolia ETH to 0x71C66332e9a37793d5d44322840515c325672325",
  "extracted": {
    "amount": 0.05,
    "currency": "Sepolia ETH",
    "symbol": "ETH",
    "network": "Sepolia Testnet (11155111)",
    "chainId": 11155111,
    "chainHex": "0xaa36a7",
    "recipient": "0x71C66332e9a37793d5d44322840515c325672325",
    "recipientLabel": "0x71C6...2325",
    "gasEstimateGwei": "1.5",
    "estimatedValueUsd": "160.00"
  },
  "confidence": 0.99,
  "timestamp": "2026-10-26T12:38:13.683Z"
}
```

---

## 🚩 MetaMask Wallet Connection Flag

The MetaMask wallet flag is defined in `js/config.js`:

```javascript
const CONFIG = {
  // Set to true for live MetaMask connection on Sepolia (0xaa36a7)
  // Set to false for sandbox testnet simulation
  FLAG_ENABLE_METAMASK: true,
  ...
};
```

You can toggle it in the top navigation bar or the Evil Dark Card toggle switch in real time.

---

## 🎨 Design System Palette

| Element | Color / Value |
|---|---|
| Background Window | `#06070A` to `#030406` |
| Evil Cards | `#0A0C10` (Surface: `#0E1117`) |
| Mint Green Phrase Button | `#00FFA3` / `#05FFA1` |
| Solid White Execute Button | `#FFFFFF` (Text: `#080A0E`) |
| Disney Particle Stars | `#FFDF00`, `#00FFA3`, `#FFFFFF`, `#67E8F9` |
| Frosted Glass Modal | `rgba(14, 18, 25, 0.65)` with `blur(40px)` |
