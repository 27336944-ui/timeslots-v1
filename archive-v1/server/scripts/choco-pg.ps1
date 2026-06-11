# choco install postgresql 18 (uses EDB MSI as internal source)
$ProgressPreference = 'SilentlyContinue'
Write-Host "Running: choco install postgresql -y"
$proc = Start-Process -FilePath "choco" -ArgumentList "install postgresql --version=18.4.0 -y --no-progress --params='/Password:timeslots_dev'" -Verb RunAs -Wait -PassThru -WindowStyle Hidden
Write-Host "ExitCode: $($proc.ExitCode)"
