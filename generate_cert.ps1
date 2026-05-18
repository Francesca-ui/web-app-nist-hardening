.\vault.exe write -address="http://127.0.0.1:8200" -format=json pki/issue/mongo-role common_name="mongo" ttl="24h" > cert.json

$json = Get-Content cert.json | ConvertFrom-Json

if ($null -eq $json.data) {
    Write-Host "ERRORE CRITICO: Vault non ha restituito dati validi." -ForegroundColor Red
    Write-Host "Contenuto del file cert.json:"
    Get-Content cert.json
    exit
}

$certContent = $json.data.private_key + "`n" + $json.data.certificate + "`n" + $json.data.issuing_ca

$outputFile = "./mongodb-certs/mongodb.pem"
Set-Content -Path $outputFile -Value $certContent -NoNewline

Write-Host "Certificato generato con successo: $outputFile" -ForegroundColor Green