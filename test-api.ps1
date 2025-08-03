$headers = @{"Content-Type" = "application/json"}
$body = ConvertTo-Json @{username = "admin123"; password = "admin123"}
Try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "Response Status Code: $($response.StatusCode)"
    Write-Host "Response Content: $($response.Content)"
} Catch {
    Write-Host "Error Status Code: $($_.Exception.Response.StatusCode.Value__)"
    Write-Host "Error Message: $($_.Exception.Message)"
    Write-Host "Error Details: $($_.ErrorDetails.Message)"
}