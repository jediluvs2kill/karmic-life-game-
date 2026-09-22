$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$gameRoot = Split-Path -Parent $PSScriptRoot
$gameBitmap = New-Object System.Drawing.Bitmap(256,256)
$gameGraphics = [System.Drawing.Graphics]::FromImage($gameBitmap)
$gameGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gameGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#09283e'))
function GamePolygon($color,$coords) {
  $gameBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
  $gamePoints = @();for($i=0;$i -lt $coords.Length;$i+=2){$gamePoints += New-Object System.Drawing.Point($coords[$i],$coords[$i+1])}
  $gameGraphics.FillPolygon($gameBrush,[System.Drawing.Point[]]$gamePoints);$gameBrush.Dispose()
}
$gameGlow = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#ffd582'))
$gameGraphics.FillEllipse($gameGlow,169,24,49,49)
GamePolygon '#51d3c0' @(22,150,128,107,235,149,130,200)
GamePolygon '#557165' @(22,157,130,200,130,235,42,196)
GamePolygon '#344e51' @(130,200,235,155,215,205,130,235)
GamePolygon '#82b86b' @(37,147,128,112,220,148,130,189)
GamePolygon '#dfe9d8' @(81,102,129,82,177,101,177,161,130,182,81,160)
GamePolygon '#93bfb9' @(129,105,177,86,177,161,130,182)
GamePolygon '#ffd582' @(74,88,129,63,185,87,129,111)
GamePolygon '#ddb56e' @(74,88,129,111,129,126,74,103)
GamePolygon '#ae8647' @(129,111,185,87,185,102,129,126)
$gameFont = New-Object System.Drawing.Font('Consolas',39,[System.Drawing.FontStyle]::Bold)
$gameInk = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#123d53'))
$gameGraphics.DrawString('K',$gameFont,$gameInk,89,118)
GamePolygon '#b2e6bd' @(41,108,50,81,59,107,50,116)
GamePolygon '#b2e6bd' @(192,127,205,93,219,126,205,139)
$gameGraphics.Dispose();$gameGlow.Dispose();$gameFont.Dispose();$gameInk.Dispose()
$gameMemory = New-Object System.IO.MemoryStream
$gameBitmap.Save($gameMemory,[System.Drawing.Imaging.ImageFormat]::Png)
$gamePng = $gameMemory.ToArray();$gameBitmap.Dispose();$gameMemory.Dispose()
[System.IO.File]::WriteAllBytes((Join-Path $gameRoot 'public\karmic-icon.png'),$gamePng)
$gameStream = [System.IO.File]::Create((Join-Path $gameRoot 'public\karmic.ico'))
$gameWriter = New-Object System.IO.BinaryWriter($gameStream)
$gameWriter.Write([uint16]0);$gameWriter.Write([uint16]1);$gameWriter.Write([uint16]1)
$gameWriter.Write([byte]0);$gameWriter.Write([byte]0);$gameWriter.Write([byte]0);$gameWriter.Write([byte]0)
$gameWriter.Write([uint16]1);$gameWriter.Write([uint16]32);$gameWriter.Write([uint32]$gamePng.Length);$gameWriter.Write([uint32]22);$gameWriter.Write($gamePng)
$gameWriter.Dispose();$gameStream.Dispose()
Write-Output 'Created public/karmic.ico and public/karmic-icon.png'
