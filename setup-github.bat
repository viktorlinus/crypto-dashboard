@echo off
REM This script initializes the Git repository and pushes it to GitHub
REM You should run this script after creating a new repository on GitHub

REM Ask for GitHub username and repository name
set /p username=Enter your GitHub username: 

set /p reponame=Enter your repository name (default: crypto-dashboard): 
if "%reponame%"=="" set reponame=crypto-dashboard

REM Initialize Git repository
git init

REM Add all files to the repository, except those in .gitignore
git add .

REM Make the initial commit
git commit -m "Initial commit"

REM Create main branch (if not already on main)
git branch -M main

REM Add GitHub remote
git remote add origin https://github.com/%username%/%reponame%.git

REM Push to GitHub
git push -u origin main

echo.
echo Repository pushed to GitHub at: https://github.com/%username%/%reponame%
echo Next steps:
echo 1. Visit your GitHub repository link above
echo 2. Follow the Netlify deployment instructions in DEPLOYMENT.md
pause
