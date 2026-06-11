Set-Location 'C:\Users\xwhy7\timeslots-v1\server'
Get-ChildItem -File |
  Where-Object { $_.Name -ne 'node_modules' -and $_.Name -notmatch '\.bak$|\.pid$|\.log$' } |
  Format-Table Name, Length -AutoSize
