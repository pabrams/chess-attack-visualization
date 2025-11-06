# GitHub Pages Deployment Setup

This project is configured to deploy to GitHub Pages automatically via GitHub Actions.

## Prerequisites

- Your repository must be accessible on GitHub
- You have push access to the repository

## Automatic Deployment (GitHub Actions)

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to GitHub Pages when you push to the `trunk` or `main` branch.

### Initial Setup

1. **Enable GitHub Pages** in your repository settings:
   - Go to: Settings → Pages
   - Under "Build and deployment"
   - Select "Deploy from a branch"
   - Choose the branch as `gh-pages` and `/ (root)` as the directory
   - Click "Save"

2. **Grant Permissions to GitHub Actions**:
   - Go to: Settings → Actions → General
   - Under "Workflow permissions"
   - Select "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests"
   - Click "Save"

3. **Push to trigger deployment**:
   - Make a commit and push to `trunk` or `main` branch
   - GitHub Actions will automatically:
     - Install dependencies
     - Build the project with `GH_PAGES=true` environment variable
     - Deploy to GitHub Pages

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

### Site not updating after push
- Check the "Actions" tab in your GitHub repository
- Look for the "Deploy to GitHub Pages" workflow
- Check if there are any errors in the workflow run

### Assets not loading
- Ensure the base path is correctly set in `vite.config.ts`
- The `GH_PAGES=true` environment variable sets the base to `/monkey-drill/`
- Check that all relative imports use the correct paths

### 404 errors on refresh
- GitHub Pages requires single-page apps to redirect all routes to `index.html`
- This is typically handled by adding a `_redirects` file or using a 404.html redirect
- The current setup should handle this automatically with the vite build

## Configuration Details

- **Base Path**: Configured in `vite.config.ts` - uses `/monkey-drill/` when `GH_PAGES=true`
- **Workflow File**: `.github/workflows/deploy.yml`
- **Node Version**: 20 (configurable in workflow)
- **Package Manager**: pnpm 10.12.4
- **Deployment Branch**: `gh-pages` (created automatically by GitHub Actions)
