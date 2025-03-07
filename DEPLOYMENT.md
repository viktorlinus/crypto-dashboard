# Deployment Guide

This guide will walk you through the steps to deploy the Crypto Dashboard to both GitHub and Netlify.

## GitHub Deployment

1. Create a new GitHub repository
2. Initialize your local repository and push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/crypto-dashboard.git
git push -u origin main
```

## Netlify Deployment

### Option 1: Deploy via GitHub

1. Create a Netlify account if you don't have one: [https://app.netlify.com/signup](https://app.netlify.com/signup)
2. Click on "New site from Git"
3. Select GitHub as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your crypto-dashboard repository
6. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
7. Set environment variables:
   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
8. Click "Deploy site"

### Option 2: Manual Deployment

1. Build your project locally:

```bash
npm run build
```

2. Install Netlify CLI:

```bash
npm install -g netlify-cli
```

3. Login to Netlify:

```bash
netlify login
```

4. Initialize Netlify in your project:

```bash
netlify init
```

5. Follow the prompts to configure your site
6. Deploy:

```bash
netlify deploy --prod
```

## Setting Up Continuous Deployment

1. In your Netlify site dashboard, go to "Site settings" > "Build & deploy" > "Continuous deployment"
2. Ensure that "Deploy on push" is enabled
3. You can set up deploy preview settings here as well

## Environment Variables

Make sure to set these environment variables in Netlify:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

You can set them in the Netlify UI under "Site settings" > "Environment variables".

## Custom Domain (Optional)

1. In your Netlify site dashboard, go to "Site settings" > "Domain management"
2. Click on "Add custom domain"
3. Follow the instructions to configure your domain

## Troubleshooting

If you encounter any issues with your deployment:

1. Check the deployment logs in Netlify
2. Make sure all environment variables are set correctly
3. Verify that your Next.js API routes are working properly
4. Try a clean build locally (`npm run build`) to see if errors occur

For API route issues, you might need to adjust your Next.js configuration or add function redirects in the netlify.toml file.
