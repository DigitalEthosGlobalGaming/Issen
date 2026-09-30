# Regenerate launcher resources from the transparent master (Windows).
param([switch]$PlayStoreOnly)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
if (-not ('IssenIconBounds' -as [type])) {
    Add-Type -ReferencedAssemblies @([System.Drawing.Bitmap].Assembly.Location, [System.Drawing.Rectangle].Assembly.Location) -TypeDefinition @'
using System;
using System.Drawing;
public static class IssenIconBounds {
    public static Rectangle Find(Bitmap image) {
        int left = image.Width, top = image.Height, right = -1, bottom = -1;
        for (int y = 0; y < image.Height; y++)
            for (int x = 0; x < image.Width; x++)
                // Ignore faint generation noise when measuring visible artwork.
                if (image.GetPixel(x, y).A > 16) {
                    left = Math.Min(left, x); top = Math.Min(top, y);
                    right = Math.Max(right, x); bottom = Math.Max(bottom, y);
                }
        if (right < 0) throw new InvalidOperationException("Empty icon master");
        return Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
    }
}
'@
}
$repositoryPath = Split-Path -Parent $PSScriptRoot
$resourcePath = Join-Path $repositoryPath 'android/app/src/main/res'
$masterImage = [System.Drawing.Bitmap]::new((Join-Path $repositoryPath 'assets/branding/issen-launcher-foreground-v1.png'))
$densities = [ordered]@{ mdpi = @(48,108); hdpi = @(72,162); xhdpi = @(96,216); xxhdpi = @(144,324); xxxhdpi = @(192,432) }
try {
    $bounds = [IssenIconBounds]::Find($masterImage)
    $diagonal = [Math]::Sqrt($bounds.Width * $bounds.Width + $bounds.Height * $bounds.Height)
    $selectedDensities = if ($PlayStoreOnly) { @() } else { $densities.GetEnumerator() }
    foreach ($density in $selectedDensities) {
        foreach ($kind in @('ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground')) {
            $foreground = $kind -eq 'ic_launcher_foreground'
            $size = if ($foreground) { $density.Value[1] } else { $density.Value[0] }
            $bitmap = [System.Drawing.Bitmap]::new($size, $size)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.Clear([System.Drawing.Color]::Transparent)
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                if (-not $foreground) {
                    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#1a1917'))
                    try {
                        if ($kind -eq 'ic_launcher_round') { $graphics.FillEllipse($brush, 0, 0, $size, $size) }
                        else { $graphics.FillRectangle($brush, 0, 0, $size, $size) }
                    } finally { $brush.Dispose() }
                }
                # Adaptive art stays inside the central 66dp safe circle of a 108dp layer.
                $safeDiameter = if ($foreground) { $size * (66.0 / 108) * 0.95 } else { $size * 0.86 }
                $scale = $safeDiameter / $diagonal
                $drawWidth = [single]($bounds.Width * $scale)
                $drawHeight = [single]($bounds.Height * $scale)
                $destination = [System.Drawing.RectangleF]::new(($size - $drawWidth) / 2, ($size - $drawHeight) / 2, $drawWidth, $drawHeight)
                $graphics.DrawImage($masterImage, $destination, [System.Drawing.RectangleF]$bounds, [System.Drawing.GraphicsUnit]::Pixel)
                $bitmap.Save((Join-Path $resourcePath "mipmap-$($density.Key)/$kind.png"), [System.Drawing.Imaging.ImageFormat]::Png)
                Write-Output "mipmap-$($density.Key)/${kind}: ${size}x${size}"
            } finally { $graphics.Dispose(); $bitmap.Dispose() }
        }
    }
    # Play applies its own mask/shadow: export a full square, opaque 32-bit PNG.
    $storeIcon = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $storeGraphics = [System.Drawing.Graphics]::FromImage($storeIcon)
    try {
        $storeGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#1a1917'))
        $storeGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $storeGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $storeScale = (512 * 0.86) / $diagonal
        $storeWidth = [single]($bounds.Width * $storeScale)
        $storeHeight = [single]($bounds.Height * $storeScale)
        $storeDestination = [System.Drawing.RectangleF]::new((512 - $storeWidth) / 2, (512 - $storeHeight) / 2, $storeWidth, $storeHeight)
        $storeGraphics.DrawImage($masterImage, $storeDestination, [System.Drawing.RectangleF]$bounds, [System.Drawing.GraphicsUnit]::Pixel)
        $storePath = Join-Path $repositoryPath 'assets/branding/issen-play-store-icon-512.png'
        $storeIcon.Save($storePath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output "Play Store icon: $storePath (512x512)"
    } finally { $storeGraphics.Dispose(); $storeIcon.Dispose() }
} finally { $masterImage.Dispose() }
