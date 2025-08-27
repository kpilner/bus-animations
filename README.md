# Bus Animations

A modern web app for animating a bus traveling through California's Southern Coastal Region.

## Features
- Animated SVG bus driving along the Southern Coastal Region
- Facts about the region
- Beautiful, responsive UI

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment (Netlify)

This project uses Vite. The build output is in `dist/`.

- Build command: `npm run build`
- Publish directory: `dist`

### Option A: Git-based deploy
1. Push this repo to GitHub.
2. In Netlify: New site from Git → choose the repo.
3. Set build command and publish dir as above.
4. Deploy and share the generated URL.

### Option B: Netlify CLI
```bash
npm install
npm run build
npm install -g netlify-cli
netlify login
netlify init    # Create & configure a new site
netlify deploy --prod --dir dist
```

### Assets
- The default background map is `public/map.svg`. Replace it or update `src/App.jsx` `url` state if you host a different image.

---

Enjoy animating buses and learning about California!
