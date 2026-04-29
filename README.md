# Impossible Aces

## PLAY IT HERE: https://callefransson.github.io/impossible-aces/

Impossible Aces is a browser-based card game built with React, TypeScript, and Vite. The goal is simple to understand but tricky to pull off: clear the board until only the four Aces remain in the top row.

This project is designed as a lightweight front-end game that can be run locally during development and deployed as a static site through GitHub Pages, Vercel, or Netlify.

## How To Play

The objective is to finish the game with:

- all four Aces in the top row
- no other cards left in play

### Rules

1. A card can be removed if it is visible and another visible card of the same suit has a higher rank.
2. If there is an empty slot in the top row, you can move the bottommost visible card from any column into that slot.
3. Keep removing or repositioning cards until only the four Aces remain.

### Basic Strategy

- Look for higher-ranked visible cards in the same suit before making a move.
- Use empty top-row spaces carefully, since moving a card can open up new options.
- Try to expose useful cards in deeper stacks instead of only making the first available move.

## Features

- React-based single-page card game
- Mobile-friendly layout
- How-to-play dialog with animated gameplay instructions
- Local play in the browser with no backend required
- Static deployment support

## Tech Stack

- React 18
- TypeScript
- Vite
- Radix UI Themes

## Local Development

### Requirements

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Start The Dev Server

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
```

### Preview The Production Build

```bash
npm run preview
```

## Making The Project Public

The easiest path is:

1. Create a GitHub repository.
2. Push this project to that repository.
3. Choose a host for deployment.

### Recommended Hosting Options

#### Option 1: GitHub Pages

This project includes a GitHub Actions workflow for GitHub Pages deployment.

After pushing to GitHub:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `GitHub Actions`.
4. Push to the `main` branch and GitHub will build and publish the site automatically.

This is a good option if you want the code and hosting to stay inside GitHub.

#### Option 2: Vercel

1. Sign in to Vercel.
2. Import the GitHub repository.
3. Use:
   Build command: `npm run build`
   Output directory: `dist`
4. Deploy.

This is usually the smoothest option.

#### Option 3: Netlify

1. Sign in to Netlify.
2. Import the GitHub repository.
3. Use:
   Build command: `npm run build`
   Publish directory: `dist`
4. Deploy.

## GitHub Setup Commands

After creating an empty repository on GitHub, you can connect this local project with:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git add .
git commit -m "Initial public release"
git push -u origin main
```

If your repository already has `main` as the default branch, that is all you need.

## Public Release Checklist

Before publishing, make sure:

- no secrets or private keys are committed
- the app builds successfully
- the README explains the game clearly
- the repository includes a license

## License

This project is available under the MIT License. See [LICENSE](./LICENSE).
