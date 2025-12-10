# Script de nettoyage - Suppression fichiers de diagnostic
# Créé pour nettoyer le projet avant push GitHub

Write-Output "🧹 NETTOYAGE DU PROJET PADELVAR"
Write-Output "=" * 60

# Backend - Fichiers de test
$testFiles = @(
    "test_api_final.py",
    "test_api_notifications.py",
    "test_highlights.py",
    "test_notifications_complet.py",
    "test_query_direct.py",
    "test_real_flows.py",
    "test_real_request.py"
)

# Backend - Fichiers check
$checkFiles = @(
    "check_all_videos.py",
    "check_and_fix_video_32.py",
    "check_db_path.py",
    "check_ownership.py",
    "check_user.py",
    "check_videos.py",
    "check_video_31.py"
)

# Backend - Fichiers diagnostic
$diagnosticFiles = @(
    "diagnostic_notifications.py",
    "diagnostic_ultra_complet.py"
)

# Backend - Fichiers fix
$fixFiles = @(
    "fix_line_648.py",
    "fix_logger_line.py",
    "fix_notifications_final.py",
    "fix_syntax.py",
    "fix_video_30_url.py",
    "fix_video_31.py",
    "fix_video_34.py"
)

# Backend - Fichiers create
$createFiles = @(
    "create_test_notifications.py"
)

# BACKEND
Write-Output "`n📁 Backend:"
$backendPath = "c:\Users\PC\Desktop\e171abab-6030-4c66-be1d-b73969cd489a-files\padelvar-backend-main"
$totalDeleted = 0

foreach ($file in ($testFiles + $checkFiles + $diagnosticFiles + $fixFiles + $createFiles)) {
    $fullPath = Join-Path $backendPath $file
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Output "  ❌ Supprimé: $file"
        $totalDeleted++
    }
}

# FRONTEND  
Write-Output "`n📁 Frontend:"
$frontendPath = "c:\Users\PC\Desktop\e171abab-6030-4c66-be1d-b73969cd489a-files\padelvar-frontend-main"

# Supprimer PATCH_NOTIFICATIONS_TAB.md
$patchFile = Join-Path $frontendPath "PATCH_NOTIFICATIONS_TAB.md"
if (Test-Path $patchFile) {
    Remove-Item $patchFile -Force
    Write-Output "  ❌ Supprimé: PATCH_NOTIFICATIONS_TAB.md"
    $totalDeleted++
}

# Supprimer PlayerDashboard_backup.jsx si existe
$backupDashboard = Join-Path $frontendPath "src\pages\PlayerDashboard_backup.jsx"
if (Test-Path $backupDashboard) {
    Remove-Item $backupDashboard -Force
    Write-Output "  ❌ Supprimé: PlayerDashboard_backup.jsx"
    $totalDeleted++
}

Write-Output "`n" + ("=" * 60)
Write-Output "✅ NETTOYAGE TERMINÉ: $totalDeleted fichiers supprimés"
Write-Output "`n💡 Fichiers conservés (code production):"
Write-Output "  ✓ src/models/notification.py"
Write-Output "  ✓ src/routes/notifications.py"
Write-Output "  ✓ src/components/player/NotificationBell.jsx"
Write-Output "  ✓ src/components/player/NotificationsTab.jsx"
Write-Output "`n📋 Prochaines étapes:"
Write-Output "  1. git status"
Write-Output "  2. git add ."
Write-Output "  3. git commit -m 'feat: add notification system'"
Write-Output "  4. git push"
