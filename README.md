# LiquidPeer 🫧

### Instant, Secure, Peer-to-Peer File Sharing Directly in Your Browser.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-FF813F?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/josepires.dev)
[![GitHub stars](https://img.shields.io/github/stars/jose-pires-neto/LiquidPeer.svg?style=for-the-badge&label=Stars&color=blue)](https://github.com/jose-pires-neto/LiquidPeer/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**LiquidPeer** is a modern, serverless web application designed for direct, secure peer-to-peer (P2P) file sharing. By leveraging WebRTC protocols, files are transferred directly between devices' browsers without passing through any intermediate storage servers.

Inspired by the simplicity of *AirDrop* and the nostalgic **Frutiger Aero** era, LiquidPeer features a premium **Liquid Glass** interface, combining realistic skeuomorphic glass refractions, organic liquid animations, and physics-driven micro-interactions.

<img width="1693" height="929" alt="ChatGPT Image 27 de mai  de 2026, 10_57_13" src="https://github.com/user-attachments/assets/a22d00a7-40b5-40f2-967d-64993984681e" />

---

## ✨ Features

- 🚀 **Direct P2P File Transfer (WebRTC)**: Fully secure, end-to-end encrypted direct data channels powered by PeerJS. Your files are never uploaded or stored on any server.
- 📸 **Camera QR Code Scanner**: Scan QR codes directly with your device's webcam to connect instantly, eliminating manual room code entry (powered by `html5-qrcode`).
- 🫧 **Iridescent Soap Bubbles**: Slow-drifting, GPU-accelerated background bubbles that rise and pop naturally, paired with a soft organic emerald-teal ambient glow.
- 🌊 **Fluid Physics Animations**:
  - **Flow Tube**: A volumetric 3D glass tube where liquid bubble particles flow in real-time, matching the speed and direction of your file transfers.
  - **Cylinder Progress**: Circular glass vials filled with wavy, oscillating liquid that rises to indicate transfer percentage.
- 📊 **Real-time Transfer Metrics**: Precise MB/s transfer speed calculation and estimated time of arrival (ETA).
- 📝 **Markdown Chat Notes**: Share notes and code blocks instantly through WebRTC data channels, complete with markdown rendering and automatic syntax highlighting.
- ♿ **Responsive, SEO & Accessible**: Semantic HTML structure, screen reader support (`sr-only` labels), keyboard focus control, Open Graph tags, and mobile-first responsiveness.

---

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **P2P Protocol**: [PeerJS](https://peerjs.com/) (WebRTC Data Channels)
- **Camera Scanning**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **Bundler**: [Vite](https://vite.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown & Syntax**: [Prism React Renderer](https://github.com/FormidableLabs/prism-react-renderer) + [React Markdown](https://github.com/remarkjs/react-markdown)

---

## ⚙️ How It Works Under the Hood

1. **Signaling**: The **Host** generates a random 6-character room identifier and initializes the PeerJS client. A lightweight signaling server is used only to exchange WebRTC metadata and help peers locate each other.
2. **Direct Connection**: Once a connection is established (via QR code scan or manual entry on the **Client**), the signaling server is bypassed, and a direct end-to-peer data channel is opened.
3. **File Chunking**: To ensure high reliability, low browser memory consumption, and prevent packet loss, files are fragmented into binary chunks of 16KB before transmission.
4. **Buffer & Reassembly**: The receiver accumulates the binary chunks in a local buffer and reconstructs the file once all chunks arrive, generating a Blob ready for immediate download.

---

## 🚀 Local Development

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone the Repository
```bash
git clone https://github.com/jose-pires-neto/LiquidPeer.git
cd LiquidPeer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. Open multiple tabs or scan the QR Code on another device in the same local network to test!

### 4. Build for Production
```bash
npm run build
```
Static production files will be built in the `dist/` directory.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
