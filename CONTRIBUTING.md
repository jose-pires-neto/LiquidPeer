# Contributing to LiquidPeer 💧

First off, thank you for considering contributing to LiquidPeer! It’s people like you who make the open-source community such an amazing and innovative space.

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🚀 How to Get Started

### 1. Fork and Clone
Fork the repository on GitHub, then clone your fork locally:
```bash
git clone https://github.com/jose-pires-neto/LiquidPeer.git
cd LiquidPeer
```

### 2. Install Dependencies
Make sure you have [Node.js](https://nodejs.org/) installed (LTS version recommended). Install the project dependencies:
```bash
npm install
```

### 3. Local Development
Launch the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. Since LiquidPeer operates over WebRTC, you can test connections locally by opening two separate browser windows (or tabs) or connecting another device on the same local network.

---

## 🎨 Design & Styling Guidelines

LiquidPeer utilizes a highly custom design system to achieve its signature **Frutiger Aero (Dark Mode)** and **Liquid Glass** aesthetic. Please follow these principles when modifying or adding UI components:

### 1. Liquid Glass & Skeuomorphism
* **Backgrounds**: Use glassmorphism combinations (blurred overlays with thin borders and reflective gradients). Combine `backdrop-blur-md` with semi-transparent borders.
* **Colors**: Avoid standard bright backgrounds. The application is tuned to a dark-mode palette consisting of deep blues, dark teals, and emerald glow effects (`#10b981` / `#059669`).
* **Animations**: All liquid effects (oscillating waves, bubble physics, flowing speed lines) are controlled via CSS custom animations or lightweight canvas triggers. Keep them performant and GPU-accelerated.

### 2. Icon Constraints (Lucide React)
* **Brand/Social Icons**: Our current `lucide-react` dependency version does not include popular brand icons (like `Github` or `Discord`).
* **Do NOT** install extra dependency packages for brand icons. Instead, follow the established project pattern: create or use an **inline SVG component** (e.g., look at how the GitHub icon is defined in `src/App.tsx`).

### 3. Responsive & Semantic HTML
* Ensure that all interactive elements are keyboard-accessible (support focus rings and enter-key triggering).
* Keep mobile responsiveness (using Tailwind's responsive prefixes) as a P0 requirement. Most users will share files from their phones!

---

## 🛠️ Code Standards & Quality Checklist

To maintain a clean, stable codebase, please verify your changes against these standards:

### 1. Type Safety
This project is built using TypeScript. Ensure there are no type errors or explicit `any` types unless absolutely necessary.

### 2. Build Verification
Before committing and opening a Pull Request, you **must** run the production compiler check to ensure everything bundles without errors:
```bash
npm run build
```
Any compiler or linter errors will cause the build to fail. Please resolve all of them before submitting your PR.

---

## 📬 Submitting a Pull Request

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add support for drag-and-drop folder uploads"
   ```
3. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
4. **Open a Pull Request** against our `main` (or designated active development) branch. Describe your changes, specify what tests you ran, and include screenshots or GIFs for any UI changes.

---

Thank you for helping us make **LiquidPeer** the most beautiful and fluid P2P file sharing app on the web! 🌊
