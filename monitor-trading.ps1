# Save this as simple-monitor.ps1

function Show-Header {
    param ([string]$Title)
    Write-Host "`n====== $Title ======`n" -ForegroundColor Cyan
}

function Show-Trading {
    Clear-Host
    
    Write-Host "ALADDIN AI TRADER MONITOR - $(Get-Date)" -ForegroundColor Cyan
    Write-Host "-------------------------------------------" -ForegroundColor Cyan
    
    # Check container status
    Show-Header "CONTAINER STATUS"
    docker compose ps
    
    # Show trading logs
    Show-Header "SWING TRADING LOGS (LAST 5 LINES)"
    docker logs --tail 5 executor_swing
    
    Show-Header "OPTIONS TRADING LOGS (LAST 5 LINES)"
    docker logs --tail 5 executor_options
    
    Show-Header "DAY TRADING LOGS (LAST 5 LINES)"
    docker logs --tail 5 executor_day
    
    # Display commands
    Show-Header "USEFUL COMMANDS"
    Write-Host "docker compose logs -f executor_swing    # Live swing trading logs" -ForegroundColor Yellow
    Write-Host "docker compose logs -f executor_options  # Live options trading logs" -ForegroundColor Yellow
    Write-Host "docker compose logs -f executor_day      # Live day trading logs" -ForegroundColor Yellow
    Write-Host "docker compose restart [service_name]    # Restart a service" -ForegroundColor Yellow
    Write-Host ".\simple-monitor.ps1                     # Run this monitor again" -ForegroundColor Yellow
    
    Write-Host "`nPress Enter to refresh... Ctrl+C to exit" -ForegroundColor Gray
    Read-Host | Out-Null
}

# Main loop
try {
    while ($true) {
        Show-Trading
    }
} catch {
    Write-Host "Monitoring stopped." -ForegroundColor Yellow
}