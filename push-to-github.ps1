# Push image-api to GitHub
# Run this script from the image-api directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Push Image API to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the image-api directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Current directory: $PWD" -ForegroundColor Green
Write-Host ""

# Prompt for GitHub username
$username = Read-Host "Enter your GitHub username"

if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "ERROR: Username cannot be empty" -ForegroundColor Red
    exit 1
}

$repoUrl = "https://github.com/$username/anya-image-api.git"

Write-Host ""
Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure you've created the repository on GitHub first!" -ForegroundColor Yellow
Write-Host "Go to: https://github.com/new" -ForegroundColor Yellow
Write-Host "  - Name: anya-image-api" -ForegroundColor Yellow
Write-Host "  - Public repository" -ForegroundColor Yellow
Write-Host "  - Do NOT initialize with README" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Have you created the repository? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Please create the repository first, then run this script again" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/3] Adding remote..." -ForegroundColor Cyan

# Remove existing remote if it exists
git remote remove origin 2>$null

# Add new remote
git remote add origin $repoUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to add remote" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Remote added" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Verifying branch..." -ForegroundColor Cyan
$currentBranch = git branch --show-current

if ($currentBranch -ne "main") {
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout -b main 2>$null
}

Write-Host "[OK] On main branch" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Push failed" -ForegroundColor Red
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Repository exists on GitHub" -ForegroundColor Yellow
    Write-Host "  2. You have push access" -ForegroundColor Yellow
    Write-Host "  3. You're authenticated (git config --global credential.helper)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Repository URL: https://github.com/$username/anya-image-api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Go to https://dashboard.render.com/" -ForegroundColor White
Write-Host "  2. Click 'New +' -> 'Web Service'" -ForegroundColor White
Write-Host "  3. Connect your GitHub repository" -ForegroundColor White
Write-Host "  4. Deploy with default settings" -ForegroundColor White
Write-Host ""
