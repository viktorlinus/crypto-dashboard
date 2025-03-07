#!/bin/bash

# This script initializes the Git repository and pushes it to GitHub
# You should run this script after creating a new repository on GitHub

# Ask for GitHub username and repository name
echo "Enter your GitHub username:"
read username

echo "Enter your repository name (default: crypto-dashboard):"
read reponame
reponame=${reponame:-crypto-dashboard}

# Initialize Git repository
git init

# Add all files to the repository, except those in .gitignore
git add .

# Make the initial commit
git commit -m "Initial commit"

# Create main branch (if not already on main)
git branch -M main

# Add GitHub remote
git remote add origin https://github.com/$username/$reponame.git

# Push to GitHub
git push -u origin main

echo ""
echo "Repository pushed to GitHub at: https://github.com/$username/$reponame"
echo "Next steps:"
echo "1. Visit your GitHub repository link above"
echo "2. Follow the Netlify deployment instructions in DEPLOYMENT.md"
