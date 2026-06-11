param([string]$Root)
Get-ChildItem $Root -Recurse -File -Include *.ts,*.tsx,*.js,*.json,*.wxml,*.wxss -Exclude node_modules,*.pid,*.bak,*.log -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  Select-Object FullName, Length |
  Sort-Object FullName
