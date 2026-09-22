$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $PSScriptRoot
$gameShell = New-Object -ComObject WScript.Shell
$gameDesktop = [Environment]::GetFolderPath('Desktop')
$gameStartup = [Environment]::GetFolderPath('Startup')
foreach ($gameEntry in @(@{Folder=$gameDesktop;Name='Karmic Life Public';Args=''},@{Folder=$gameStartup;Name='Karmic Life Public Sync';Args=' --background'})) {
  $gameLink = $gameShell.CreateShortcut((Join-Path $gameEntry.Folder ($gameEntry.Name+'.lnk')))
  $gameLink.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
  $gameLink.Arguments = '"'+(Join-Path $gameRoot 'scripts\launch.vbs')+'"'+$gameEntry.Args
  $gameLink.WorkingDirectory = $gameRoot
  $gameLink.IconLocation = (Join-Path $gameRoot 'public\karmic.ico')+',0'
  $gameLink.Description = 'Your public civilization. Contributions synchronize to public GitHub.'
  $gameLink.WindowStyle = 7
  $gameLink.Save()
  Write-Output (Join-Path $gameEntry.Folder ($gameEntry.Name+'.lnk'))
}
