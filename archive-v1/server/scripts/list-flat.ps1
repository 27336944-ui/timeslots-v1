param([string]$Root = "prisma")
Get-ChildItem $Root -File | Select-Object FullName, Length
