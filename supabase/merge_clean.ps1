# Merge part1 (foundation) + 003 through 013
$foundation = "supabase\part1_foundation.sql"
$migrations = @(
    "003_catalog.sql",
    "004_stores.sql",
    "005_products.sql",
    "006_cart_checkout.sql",
    "007_financial.sql",
    "008_shipping_returns.sql",
    "009_communication.sql",
    "010_promotions.sql",
    "011_social.sql",
    "012_admin.sql",
    "013_analytics.sql"
)

$basePath = "supabase\migrations"
$outputFile = "supabase\complete_migration.sql"

# Start with foundation
Set-Content -Path $outputFile -Value (Get-Content $foundation -Raw)
Add-Content -Path $outputFile -Value "`n-- ============================================================`n-- END OF FOUNDATION (001 + 002 resolved)`n-- ============================================================`n"

# Append the rest
foreach ($file in $migrations) {
    $fullPath = Join-Path $basePath $file
    $separator = "`n-- ============================================================`n-- END OF MIGRATION: $file`n-- ============================================================`n"
    Add-Content -Path $outputFile -Value (Get-Content $fullPath -Raw)
    Add-Content -Path $outputFile -Value $separator
}

Write-Host "Done! Successfully merged clean complete migration into $outputFile"
