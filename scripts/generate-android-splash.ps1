# Regenerate native splash resources from the checked-in master (Windows).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repositoryPath = Split-Path -Parent $PSScriptRoot
$masterPath = Join-Path $repositoryPath 'assets/branding/issen-splash-v1.png'
$resourcePath = Join-Path $repositoryPath 'android/app/src/main/res'
$sizes = [ordered]@{
    'drawable' = @(480, 320)
    'drawable-land-mdpi' = @(480, 320)
    'drawable-land-hdpi' = @(800, 480)
    'drawable-land-xhdpi' = @(1280, 720)
    'drawable-land-xxhdpi' = @(1600, 960)
    'drawable-land-xxxhdpi' = @(1920, 1280)
    'drawable-port-mdpi' = @(320, 480)
    'drawable-port-hdpi' = @(480, 800)
    'drawable-port-xhdpi' = @(720, 1280)
    'drawable-port-xxhdpi' = @(960, 1600)
    'drawable-port-xxxhdpi' = @(1280, 1920)
}

$masterImage = [System.Drawing.Image]::FromFile($masterPath)
try {
    foreach ($entry in $sizes.GetEnumerator()) {
        $width, $height = $entry.Value
        $bitmap = [System.Drawing.Bitmap]::new($width, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#1a1917'))
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $scale = [Math]::Min($width / $masterImage.Width, $height / $masterImage.Height)
            $drawWidth = [int][Math]::Round($masterImage.Width * $scale)
            $drawHeight = [int][Math]::Round($masterImage.Height * $scale)
            $destination = [System.Drawing.Rectangle]::new(
                [int](($width - $drawWidth) / 2), [int](($height - $drawHeight) / 2),
                $drawWidth, $drawHeight
            )
            $graphics.DrawImage($masterImage, $destination)
            $outputPath = Join-Path $resourcePath "$($entry.Key)/splash.png"
            $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Output "$($entry.Key): ${width}x${height}"
        } finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
} finally {
    $masterImage.Dispose()
}
