#!/bin/bash

# This script initializes a git repo, creates a GitHub repo, and pushes all files in the current directory (project folder)
# Requirements: GitHub CLI (gh) must be installed and authenticated

set -e

# Check for GitHub CLI
gh_installed=$(command -v gh || true)
if [ -z "$gh_installed" ]; then
  echo "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/ and authenticate with 'gh auth login'."
  exit 1
fi

# Try to auto-detect GitHub username
GITHUB_USER=$(gh api user --jq .login 2>/dev/null || true)
if [ -z "$GITHUB_USER" ]; then
  read -p "Enter your GitHub username: " GITHUB_USER
else
  echo "Detected GitHub username: $GITHUB_USER"
fi

read -p "Enter the new repository name: " REPO_NAME

dirname=$(basename "$PWD")

# Check git user config
GIT_NAME=$(git config user.name || true)
GIT_EMAIL=$(git config user.email || true)

if [ -z "$GIT_NAME" ]; then
  read -p "Enter your name for git commits: " GIT_COMMIT_NAME
  git config user.name "$GIT_COMMIT_NAME"
fi
if [ -z "$GIT_EMAIL" ]; then
  read -p "Enter your email for git commits: " GIT_COMMIT_EMAIL
  git config user.email "$GIT_COMMIT_EMAIL"
fi

# Initialize git repo if needed
if [ ! -d ".git" ]; then
  git init
fi

git add .
git commit -m "Initial commit" || echo "Nothing to commit."

# Create GitHub repo
if gh repo view "$GITHUB_USER/$REPO_NAME" > /dev/null 2>&1; then
  echo "Repository $GITHUB_USER/$REPO_NAME already exists on GitHub. Skipping creation."
else
  gh repo create "$GITHUB_USER/$REPO_NAME" --public --source=. --remote=origin --push
fi

# Set remote and push
if ! git remote | grep -q origin; then
  git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

git branch -M main || git branch -M master

git push -u origin $(git rev-parse --abbrev-ref HEAD)

echo "All done! Your project is now on GitHub: https://github.com/$GITHUB_USER/$REPO_NAME"
