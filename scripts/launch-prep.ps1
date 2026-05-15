# SERVLO launch-prep — runs all outstanding pre-launch fixes in one go.
# Run from project root: .\scripts\launch-prep.ps1

$ErrorActionPreference = "Continue"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "SERVLO LAUNCH PREP" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# ─────────────────────────────────────────────────────────────────────────
# 1. Restore proper coloured Servlo S-mark product logos
# ─────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[1/3] Restoring coloured product logos..." -ForegroundColor Yellow

$publicDir = Join-Path $PSScriptRoot "..\public"
$logoSource = "$env:USERPROFILE\Downloads\logos_no_bg_fixed"

$logoMap = @{
  "1_logo academy .png"   = "academy.png"
  "2_logo leads.png"      = "leads.png"
  "3_logo finance.png"    = "finance.png"
  "4_logo hire.png"       = "hire.png"
  "5_logo core.png"       = "core.png"
  "6_logo pay.png"        = "pay.png"
  "7_logo fleet.png"      = "fleet.png"
  "8_logo answer.png"     = "answer.png"
  "9_logo grow.png"       = "grow.png"
  "10_logo insurance.png" = "insurance.png"
  "11_logo safe.png"      = "safe.png"
  "12_logo books.png"     = "books.png"
  "13_logo connect.png"   = "connect.png"
}

$copied = 0
$missing = 0
foreach ($k in $logoMap.Keys) {
  $from = Join-Path $logoSource $k
  $to   = Join-Path $publicDir $logoMap[$k]
  if (Test-Path $from) {
    Copy-Item -LiteralPath $from -Destination $to -Force
    $copied++
  } else {
    Write-Host "  MISSING: $k" -ForegroundColor Red
    $missing++
  }
}
Write-Host "  Restored $copied logos ($missing missing)" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────
# 2. Strip em dashes from customer-facing pages
# ─────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/3] Stripping em dashes from customer-facing copy..." -ForegroundColor Yellow

$root = Join-Path $PSScriptRoot ".."
$targets = @(
  "src\app\page.tsx",
  "src\components\auth\signup-form.tsx",
  "src\components\auth\login-experience.tsx",
  "src\components\site-header.tsx",
  "src\components\landing\landing-faq.tsx",
  "src\components\landing\landing-pricing.tsx",
  "src\components\landing\landing-nav.tsx",
  "src\components\landing-pricing.tsx",
  "src\components\landing-header.tsx",
  "src\components\landing-scroll-reveal.tsx",
  "src\components\landing-industry-tiles.tsx",
  "src\components\landing-industry-deep-sections.tsx",
  "src\app\terms\page.tsx",
  "src\app\privacy\page.tsx",
  "src\app\refund\page.tsx",
  "src\app\guarantee\page.tsx",
  "src\app\contact\page.tsx",
  "src\app\status\page.tsx",
  "src\app\founders\page.tsx",
  "src\app\compare\page.tsx",
  "src\app\compare\servicem8\page.tsx",
  "src\app\compare\tradify\page.tsx",
  "src\app\migrate\from-jobber\page.tsx",
  "src\app\migrate\from-servicem8\page.tsx",
  "src\app\migrate\from-simpro\page.tsx",
  "src\app\migrate\from-tradify\page.tsx",
  "src\app\docs\page.tsx",
  "src\app\docs\layout.tsx",
  "src\app\auth\forgot-password\page.tsx",
  "src\app\auth\reset-password\page.tsx",
  "src\app\auth\signup\page.tsx",
  "src\app\onboarding\complete-profile\page.tsx",
  "src\app\offline\page.tsx",
  "src\app\track\[token]\page.tsx",
  "src\app\portal\[token]\page.tsx",
  "src\app\q\[token]\page.tsx",
  "src\app\refer\[code]\page.tsx",
  "src\app\ref\[code]\page.tsx",
  "src\app\book\[businessSlug]\page.tsx",
  "src\app\book\[businessSlug]\booking-form-client.tsx",
  "src\app\invite\[token]\page.tsx",
  "src\app\invite\[token]\invite-accept-client.tsx",
  "src\lib\email.ts",
  "src\lib\email-templates.ts"
)

$em = [char]0x2014
$touched = 0
foreach ($t in $targets) {
  $path = Join-Path $root $t
  if (Test-Path $path) {
    $content = [System.IO.File]::ReadAllText($path)
    if ($content.Contains($em)) {
      # em dash with surrounding spaces -> period (sentence break)
      $new = $content -replace "\s+$em\s+", ". "
      # em dash without surrounding spaces (e.g. "word-word") -> hyphen
      $new = $new -replace "$em", "-"
      # collapse accidental double-spaces
      $new = $new -replace "  +", " "
      # period followed by lowercase looks weird after splitting -> uppercase first letter
      $new = [regex]::Replace($new, '(\. )([a-z])', { param($m) $m.Groups[1].Value + $m.Groups[2].Value.ToUpper() })
      [System.IO.File]::WriteAllText($path, $new, [System.Text.UTF8Encoding]::new($false))
      $touched++
      Write-Host "  Cleaned: $t" -ForegroundColor Green
    }
  }
}
Write-Host "  $touched files cleaned" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────
# 3. Commit + push
# ─────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Committing + pushing..." -ForegroundColor Yellow

Set-Location $root
git add -A
git commit -m "feat(launch-prep): restore coloured product logos, strip em dashes from customer-facing copy"
git push

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "DONE. Vercel will deploy in ~60s." -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After deploy, verify on the live site:" -ForegroundColor White
Write-Host "  1. Homepage product cards show coloured S-mark logos"
Write-Host "  2. No em dashes in body copy"
Write-Host "  3. Sign up a fresh test account end-to-end"
Write-Host ""
Write-Host "Then fix the card-loading bug (Stripe key in Vercel env vars)."
