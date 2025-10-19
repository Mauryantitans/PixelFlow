# 🔍 Pre-Deployment Preparation Script
# Run this before deploying to verify everything is ready

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PixelFlow Deployment Preparation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$projectRoot = "C:\Users\moury\OneDrive\Documents\GitHub\PixelFlow"
$allGood = $true

# Function to check if file exists
function Test-FileExists {
    param($path, $description)
    if (Test-Path $path) {
        Write-Host "✅ $description exists" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $description missing!" -ForegroundColor Red
        return $false
    }
}

# Function to check if folder is empty
function Test-FolderEmpty {
    param($path, $description)
    if ((Test-Path $path) -and (Get-ChildItem $path -Force | Measure-Object).Count -eq 0) {
        Write-Host "⚠️  $description is empty (normal for new deployment)" -ForegroundColor Yellow
        return $true
    } elseif (Test-Path $path) {
        $count = (Get-ChildItem $path -Force | Measure-Object).Count
        Write-Host "ℹ️  $description contains $count items" -ForegroundColor Cyan
        return $true
    } else {
        Write-Host "❌ $description doesn't exist!" -ForegroundColor Red
        return $false
    }
}

Write-Host "Checking project structure..." -ForegroundColor Yellow
Write-Host ""

# Check critical files
$allGood = (Test-FileExists "$projectRoot\backend\requirements.txt" "Backend requirements.txt") -and $allGood
$allGood = (Test-FileExists "$projectRoot\backend\app\main.py" "Backend main.py") -and $allGood
$allGood = (Test-FileExists "$projectRoot\backend\.env.example" "Backend .env.example") -and $allGood
$allGood = (Test-FileExists "$projectRoot\frontend\package.json" "Frontend package.json") -and $allGood
$allGood = (Test-FileExists "$projectRoot\.gitignore" ".gitignore") -and $allGood

Write-Host ""

# Check deployment files
Write-Host "Checking deployment configuration..." -ForegroundColor Yellow
Write-Host ""

$allGood = (Test-FileExists "$projectRoot\deployment\vercel.json" "Vercel config") -and $allGood
$allGood = (Test-FileExists "$projectRoot\deployment\render.yaml" "Render config") -and $allGood
$allGood = (Test-FileExists "$projectRoot\deployment\QUICK_START.md" "Quick Start guide") -and $allGood

Write-Host ""

# Check folders
Write-Host "Checking directory structure..." -ForegroundColor Yellow
Write-Host ""

$allGood = (Test-FolderEmpty "$projectRoot\backend\uploads" "Backend uploads folder") -and $allGood
$allGood = (Test-FolderEmpty "$projectRoot\backend\processed" "Backend processed folder") -and $allGood

Write-Host ""

# Check for .env file (should NOT be committed)
Write-Host "Checking security..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "$projectRoot\backend\.env") {
    Write-Host "⚠️  .env file exists (good for local dev, but ensure it's in .gitignore)" -ForegroundColor Yellow
} else {
    Write-Host "✅ No .env file found (will use environment variables in production)" -ForegroundColor Green
}

Write-Host ""

# Check Git status
Write-Host "Checking Git repository..." -ForegroundColor Yellow
Write-Host ""

try {
    Set-Location $projectRoot
    
    # Check if it's a git repo
    $gitCheck = git rev-parse --git-dir 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git repository initialized" -ForegroundColor Green
        
        # Check remote
        $remote = git remote get-url origin 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Git remote configured: $remote" -ForegroundColor Green
            
            # Check for uncommitted changes
            $status = git status --porcelain
            if ($status) {
                Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
                git status --short
                Write-Host "`n   Run these commands before deploying:" -ForegroundColor Cyan
                Write-Host "   git add ." -ForegroundColor White
                Write-Host "   git commit -m 'Prepare for deployment'" -ForegroundColor White
                Write-Host "   git push origin main`n" -ForegroundColor White
                $allGood = $false
            } else {
                Write-Host "✅ No uncommitted changes" -ForegroundColor Green
                
                # Check if pushed
                $unpushed = git log origin/main..HEAD 2>&1
                if ($LASTEXITCODE -eq 0 -and $unpushed) {
                    Write-Host "⚠️  You have unpushed commits" -ForegroundColor Yellow
                    Write-Host "   Run: git push origin main`n" -ForegroundColor White
                    $allGood = $false
                } else {
                    Write-Host "✅ All changes pushed to remote" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "❌ No Git remote configured!" -ForegroundColor Red
            Write-Host "   Add remote: git remote add origin <your-repo-url>`n" -ForegroundColor White
            $allGood = $false
        }
    } else {
        Write-Host "❌ Not a Git repository!" -ForegroundColor Red
        Write-Host "   Initialize: git init`n" -ForegroundColor White
        $allGood = $false
    }
} catch {
    Write-Host "❌ Error checking Git status: $_" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Generate SECRET_KEY
Write-Host "Generating production SECRET_KEY..." -ForegroundColor Yellow
Write-Host ""

try {
    $secretKey = python -c "import secrets; print(secrets.token_urlsafe(32))"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SECRET_KEY generated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "   Copy this SECRET_KEY for production deployment:" -ForegroundColor Cyan
        Write-Host "   $secretKey" -ForegroundColor White
        Write-Host ""
        Write-Host "   Add this to Render environment variables!" -ForegroundColor Yellow
        Write-Host ""
    } else {
        throw "Python command failed"
    }
} catch {
    Write-Host "❌ Could not generate SECRET_KEY (Python may not be in PATH)" -ForegroundColor Red
    Write-Host "   Generate manually with: python -c ""import secrets; print(secrets.token_urlsafe(32))""" -ForegroundColor White
    Write-Host ""
}

# Copy vercel.json if not already in frontend
Write-Host "Preparing frontend for deployment..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "$projectRoot\deployment\vercel.json") {
    if (-not (Test-Path "$projectRoot\frontend\vercel.json")) {
        try {
            Copy-Item "$projectRoot\deployment\vercel.json" "$projectRoot\frontend\vercel.json"
            Write-Host "✅ Copied vercel.json to frontend folder" -ForegroundColor Green
            Write-Host "   Remember to commit this file!" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Failed to copy vercel.json: $_" -ForegroundColor Red
            $allGood = $false
        }
    } else {
        Write-Host "✅ vercel.json already in frontend folder" -ForegroundColor Green
    }
} else {
    Write-Host "❌ deployment\vercel.json not found!" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check if frontend dependencies are installed
Write-Host "Checking frontend dependencies..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "$projectRoot\frontend\node_modules") {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   This is OK - Vercel will install them during deployment" -ForegroundColor Cyan
}

Write-Host ""

# Check backend dependencies
Write-Host "Checking backend environment..." -ForegroundColor Yellow
Write-Host ""

Set-Location "$projectRoot\backend"
$pythonCheck = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python available: $pythonCheck" -ForegroundColor Green
} else {
    Write-Host "⚠️  Python not found in PATH" -ForegroundColor Yellow
    Write-Host "   This is OK for deployment, but needed for local testing" -ForegroundColor Cyan
}

Write-Host ""

# Final summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           Preparation Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "🎉 All checks passed! You're ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open DEPLOY_NOW.md for deployment instructions" -ForegroundColor White
    Write-Host "2. Follow the step-by-step guide" -ForegroundColor White
    Write-Host "3. Deploy to Vercel and Render" -ForegroundColor White
    Write-Host ""
    Write-Host "Estimated deployment time: 45-60 minutes" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some issues found - please fix them before deploying" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Review the messages above and:" -ForegroundColor White
    Write-Host "- Commit and push any changes" -ForegroundColor White
    Write-Host "- Ensure all required files exist" -ForegroundColor White
    Write-Host "- Fix any Git issues" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================`n" -ForegroundColor Cyan

# Return to project root
Set-Location $projectRoot
