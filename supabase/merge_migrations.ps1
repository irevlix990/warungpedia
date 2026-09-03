# Merge migrations in correct dependency order
$migrations = @(
    "002_auth_profiles.sql",   # Creates: settings, profiles, addresses, functions
    "001_extensions.sql",      # Creates: set_updated_at(), app_setting() (needs settings)
    "003_catalog.sql",         # Creates: categories
    "004_stores.sql",          # Creates: stores
    "005_products.sql",        # Creates: products
    "006_cart_checkout.sql",   # Creates: carts, cart_items, orders, order_items
    "007_financial.sql",       # Creates: wallets, payments, ledger, earnings, withdrawals
    "008_shipping_returns.sql",# Creates: shipments, returns, disputes
    "009_communication.sql",   # Creates: notifications, conversations, messages
    "010_promotions.sql",      # Creates: vouchers, flash_sales
    "011_social.sql",          # Creates: reviews, wishlists, follows, views
    "012_admin.sql",           # Creates: admin functions
    "013_analytics.sql"        # Creates: analytics functions
)

$basePath = "supabase\migrations"
$outputFile = "supabase\complete_migration.sql"

# Start fresh
Set-Content -Path $outputFile -Value "-- ============================================================`n-- Warungpedia COMPLETE MIGRATION (ordered for single-run)`n-- Run this in Supabase SQL Editor to set up the full schema.`n-- ============================================================`n"

foreach ($file in $migrations) {
    $fullPath = Join-Path $basePath $file
    $separator = "`n-- ============================================================`n-- END OF MIGRATION: $file`n-- ============================================================`n"
    Add-Content -Path $outputFile -Value (Get-Content $fullPath -Raw)
    Add-Content -Path $outputFile -Value $separator
}

Write-Host "Done! Merged $($migrations.Count) migrations into $outputFile"
