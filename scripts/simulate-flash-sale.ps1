<#
.SYNOPSIS
  High-Concurrency Flash Sale Stress Test Simulation
.DESCRIPTION
  Simulates multiple concurrent customer requests competing for the exact same seat
  to prove Redisson Fair Lock and Optimistic Lock race-condition elimination.
#>

param (
    [string]$BaseUrl = "http://localhost:8080",
    [int]$EventId = 1,
    [int]$SeatId = 5,
    [int]$ConcurrentRequests = 20
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PULSEPASS: DISTRIBUTED FLASH SALE CONCURRENCY TEST     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl/api/v1/events/$EventId/seats/lock"
Write-Host "Seat ID: $SeatId | Concurrent Workers: $ConcurrentRequests"
Write-Host ""

# 1. Obtain Auth Tokens for concurrent actors
Write-Host "[1/3] Authenticating test clients..." -ForegroundColor Yellow
try {
    $token1 = (Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" -Method Post -Body '{"email":"customer@platform.com","password":"customer123"}' -ContentType "application/json").token
    $token2 = (Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" -Method Post -Body '{"email":"sarah@example.com","password":"password123"}' -ContentType "application/json").token
    Write-Host " Tokens acquired successfully." -ForegroundColor Green
} catch {
    Write-Host " Failed to connect to API Gateway at $BaseUrl. Ensure Docker or Spring Boot is running!" -ForegroundColor Red
    exit 1
}

# 2. Fire concurrent lock requests
Write-Host "`n[2/3] Dispatching $ConcurrentRequests concurrent lock attempts for Seat $SeatId..." -ForegroundColor Yellow

$jobs = @()
$headers1 = @{ "Authorization" = "Bearer $token1"; "Content-Type" = "application/json" }
$headers2 = @{ "Authorization" = "Bearer $token2"; "Content-Type" = "application/json" }
$body = (@{ seatIds = @($SeatId) } | ConvertTo-Json)

for ($i = 1; $i -le $ConcurrentRequests; $i++) {
    $h = if ($i % 2 -eq 0) { $headers1 } else { $headers2 }
    $job = Start-Job -ScriptBlock {
        param($url, $hdr, $b, $id)
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $resp = Invoke-RestMethod -Uri $url -Method Post -Headers $hdr -Body $b -TimeoutSec 10
            $sw.Stop()
            return [PSCustomObject]@{
                WorkerId   = $id
                StatusCode = 200
                ElapsedMs  = $sw.ElapsedMilliseconds
                Status     = "SUCCESS (200 OK)"
                Details    = "BookingId: $($resp.bookingId)"
            }
        } catch {
            $sw.Stop()
            $statusCode = $_.Exception.Response.StatusCode.value__
            return [PSCustomObject]@{
                WorkerId   = $id
                StatusCode = $statusCode
                ElapsedMs  = $sw.ElapsedMilliseconds
                Status     = "CONFLICT ($statusCode)"
                Details    = $_.Exception.Message
            }
        }
    } -ArgumentList "$BaseUrl/api/v1/events/$EventId/seats/lock", $h, $body, $i

    $jobs += $job
}

Write-Host " Waiting for all concurrent requests to resolve..."
$results = $jobs | Receive-Job -Wait

# 3. Analyze results
Write-Host "`n[3/3] Concurrency Test Summary:" -ForegroundColor Yellow
$successCount = ($results | Where-Object { $_.StatusCode -eq 200 }).Count
$conflictCount = ($results | Where-Object { $_.StatusCode -eq 409 }).Count
$otherCount = ($results | Where-Object { $_.StatusCode -ne 200 -and $_.StatusCode -ne 409 }).Count

$results | Format-Table -Property WorkerId, StatusCode, ElapsedMs, Status, Details

Write-Host "----------------------------------------------------------"
Write-Host "Total Requests Dispatched : $ConcurrentRequests"
Write-Host "Successful Locks (200 OK) : $successCount (Expected: Exactly 1)" -ForegroundColor $(if ($successCount -eq 1) { "Green" } else { "Red" })
Write-Host "Fair Conflicts (409)      : $conflictCount (Expected: $($ConcurrentRequests - 1))" -ForegroundColor Green
Write-Host "Errors / Exceptions       : $otherCount" -ForegroundColor $(if ($otherCount -eq 0) { "Green" } else { "Red" })
Write-Host "----------------------------------------------------------"

if ($successCount -eq 1) {
    Write-Host " VERIFICATION PASSED: ZERO DOUBLE-ALLOCATIONS DETECTED." -ForegroundColor Green
    Write-Host "   Redisson distributed lock + JPA @Version perfectly eliminated the race condition."
} else {
    Write-Host " VERIFICATION FAILED: Inconsistent state detected." -ForegroundColor Red
}

$jobs | Remove-Job
