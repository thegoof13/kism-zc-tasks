#!/bin/bash

# This script initializes a git repo, creates a GitHub repo, and pushes all files
# Requirements: GitHub CLI (gh) must be installed and authenticated

set -e

# --- Directory Safety Check ---
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
CURRENT_DIR=$(pwd)

if [ "$SCRIPT_DIR" != "$CURRENT_DIR" ]; then
  echo "Warning: You are not running this script from inside the project folder!"
  echo "Script location: $SCRIPT_DIR"
  echo "Current directory: $CURRENT_DIR"
  echo "Please cd into the project folder and run the script from there."
  exit 1
fi

# Check for .git in parent directory
PARENT_DIR=$(dirname "$CURRENT_DIR")
if [ -d "$PARENT_DIR/.git" ]; then
  echo "Warning: A .git directory exists in the parent folder ($PARENT_DIR)."
  read -p "Do you want to remove the parent .git directory to avoid confusion? (y/n): " REMOVE_PARENT_GIT
  if [ "$REMOVE_PARENT_GIT" = "y" ] || [ "$REMOVE_PARENT_GIT" = "Y" ]; then
    rm -rf "$PARENT_DIR/.git"
    echo "Removed .git directory from parent folder."
  else
    echo "Parent .git directory left intact. Be careful to avoid confusion!"
  fi
fi

# Check for GitHub CLI
gh_installed=$(command -v gh || true)
if [ -z "$gh_installed" ]; then
  echo "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/ and authenticate with 'gh auth login'."
  exit 1
fi

# Try to auto-detect remote repo
REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
if [ -n "$REMOTE_URL" ]; then
  # Parse user and repo from remote URL
  if [[ "$REMOTE_URL" =~ github.com[:/](.*)/(.*)\.git ]]; then
    GITHUB_USER="${BASH_REMATCH[1]}"
    REPO_NAME="${BASH_REMATCH[2]}"
    echo "Detected remote repo: $GITHUB_USER/$REPO_NAME"
  else
    echo "Could not parse GitHub user/repo from remote URL."
    read -p "Enter your GitHub username: " GITHUB_USER
    read -p "Enter the new repository name: " REPO_NAME
  fi
else
  # No remote set, prompt for details
  GITHUB_USER=$(gh api user --jq .login 2>/dev/null || true)
  if [ -z "$GITHUB_USER" ]; then
    read -p "Enter your GitHub username: " GITHUB_USER
  else
    echo "Detected GitHub username: $GITHUB_USER"
  fi
  read -p "Enter the new repository name: " REPO_NAME
fi

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
git commit -m "Initial commit"

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

# Compare local and remote root contents
REMOTE_ROOT=$(git ls-tree --name-only origin/main 2>/dev/null | sort | tr '\n' ' ')
LOCAL_ROOT=$(git ls-tree --name-only HEAD | sort | tr '\n' ' ')

if [ "$REMOTE_ROOT" != "$LOCAL_ROOT" ]; then
  echo "Warning: Remote and local folder structures do not match."
  echo "Remote root: $REMOTE_ROOT"
  echo "Local root: $LOCAL_ROOT"
  read -p "Do you want to force the remote to match your current local folder contents? This will overwrite the remote history. (y/n): " REBASE_CONFIRM
  if [ "$REBASE_CONFIRM" = "y" ] || [ "$REBASE_CONFIRM" = "Y" ]; then
    git push --force origin main
    echo "Remote repository has been reset to match your local folder contents."
  else
    echo "No changes made to remote repository. Exiting."
    exit 1
  fi
else
  git push -u origin main
fi

echo "All done! Your project is now on GitHub: https://github.com/$GITHUB_USER/$REPO_NAME"
