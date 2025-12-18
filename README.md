<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CoinDrop Plinko Game

An interactive Plinko game built with React, TypeScript, and Matter.js physics engine, powered by Google's Gemini AI.

## 🚀 Run Locally

**Prerequisites:** Node.js (v18 or higher)

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd group9
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Add your API key to `.env.local`:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 🌐 Deploy to GitHub Pages

### Setup

1. Go to your GitHub repository settings
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add a secret named `GEMINI_API_KEY` with your Gemini API key

### Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Build and deployment**:
   - Source: **GitHub Actions**

### Deploy

The site will automatically deploy when you push to the `main` branch. The GitHub Actions workflow will:
- Install dependencies
- Build the project
- Deploy to GitHub Pages

Your site will be available at: `https://<your-username>.github.io/<repository-name>/`

## 🛠️ Technologies Used

- React 19
- TypeScript
- Vite
- Matter.js (Physics Engine)
- Google Gemini AI
- Tailwind CSS
- Lucide React (Icons)

## 📝 License

This project was created with AI Studio.
