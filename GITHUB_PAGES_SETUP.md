# GitHub Pages Deployment Setup

This project is configured to deploy to GitHub Pages automatically via GitHub Actions.

## Prerequisites

- Your repository must be accessible on GitHub
- You have push access to the repository

## Automatic Deployment (GitHub Actions)

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to GitHub Pages when you push to the `trunk` or `main` branch.

### Initial Setup (REQUIRED)

Follow these steps exactly to enable GitHub Pages:

1. **Enable GitHub Pages** in your repository settings:
   - Go to: https://github.com/pabrams/monkey-drill/settings/pages
   - Under "Build and deployment" section
   - Select the source:
     - Choose "Deploy from a branch"
     - Select branch: `gh-pages` (will be auto-created by Actions)
     - Select folder: `/ (root)`
   - Click "Save"

2. **Push to trigger deployment**:
   - Make a commit and push to `trunk` branch:
     ```bash
     git add .
     git commit -m "Enable GitHub Pages deployment"
     git push origin trunk
     ```
   - GitHub Actions will automatically:
     - Build the project with proper base path configuration
     - Deploy the `dist` folder to the `gh-pages` branch
     - GitHub Pages will serve from: `https://pabrams.github.io/monkey-drill/`
     - Site should be live within 1-2 minutes

### Accessing Your Deployed Site

Once deployed, your site will be available at:
```
https://<your-username>.github.io/monkey-drill/
```

## Local Testing

To test the GitHub Pages build locally:

```bash
# Build with GitHub Pages configuration
pnpm run build:gh-pages

# Preview the build
pnpm run preview
```

This will build the app with the correct base path (`/monkey-drill/`) that GitHub Pages requires.

## Manual Deployment (Optional)

If you need to manually deploy without GitHub Actions, you can:

1. Build the project:
   ```bash
   pnpm run build:gh-pages
   ```

2. Push the `dist` folder to the `gh-pages` branch on GitHub (using a tool like `gh-pages` package)

## Troubleshooting

### Deployment Failed Error (404)
**Error Message**: "Failed to create deployment (status: 404)"

**Solution**: GitHub Pages is not enabled yet. Follow these steps:
1. Go to: https://github.com/pabrams/monkey-drill/settings/pages
2. Under "Build and deployment"
3. Select source: "Deploy from a branch"
4. Choose branch: `gh-pages` and folder: `/ (root)`
5. Click "Save"
6. The workflow will automatically create the `gh-pages` branch on the next push
7. Re-run the failed workflow from the Actions tab

### Site not updating after push
- Check the "Actions" tab: https://github.com/pabrams/monkey-drill/actions
- Click the "Deploy to GitHub Pages" workflow
- Check the build and deploy steps for errors
- If "build" succeeded but "deploy" failed, GitHub Pages is likely not enabled (see above)

### Assets not loading (blank page, console errors like 404)
- Verify the base path is correct in `vite.config.ts`
- The build should output assets with `/monkey-drill/` prefix
- Check the browser console for 404 errors
- Verify the site is serving from `https://<username>.github.io/monkey-drill/` (not just `/`)

### 404 errors on page refresh
- This is expected behavior for single-page apps on GitHub Pages
- Routes like `/puzzle/123` will 404 on direct access
- Solution: Users should navigate through the app normally from the home page
- To fix: Configure `_redirects` or 404.html redirect (advanced)

### Pages are showing old content
- GitHub Pages CDN may have cached old files
- Clear your browser cache (Ctrl+Shift+Delete on Windows/Linux, Cmd+Shift+Delete on Mac)
- Try accessing the site in an incognito/private window
- Wait 5-10 minutes for CDN to update

### Repository is private
- GitHub Pages is only available on public repositories (for free)
- Make your repository public in Settings → Danger Zone → Change repository visibility

## Configuration Details

- **Base Path**: Configured in `vite.config.ts` - uses `/monkey-drill/` when `GH_PAGES=true`
- **Workflow File**: `.github/workflows/deploy.yml`
- **Node Version**: 20 (configurable in workflow)
- **Package Manager**: pnpm 10.12.4
- **Deployment Branch**: `gh-pages` (created automatically by GitHub Actions)
