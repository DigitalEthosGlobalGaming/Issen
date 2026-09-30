# Export existing branding to exact Play listing dimensions; preserve source masters.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repo = Split-Path -Parent $PSScriptRoot
$output = Join-Path $repo 'assets/play-store'
New-Item -ItemType Directory -Force (Join-Path $output 'common'), (Join-Path $output 'pc') | Out-Null
Copy-Item -LiteralPath (Join-Path $repo 'assets/branding/issen-play-store-icon-512.png') -Destination (Join-Path $output 'common/app-icon-512.png')
if (-not ('IssenStoreBounds' -as [type])) {
    Add-Type -ReferencedAssemblies @([System.Drawing.Bitmap].Assembly.Location, [System.Drawing.Rectangle].Assembly.Location) -TypeDefinition @'
using System;
using System.Drawing;
public static class IssenStoreBounds {
    public static Rectangle Find(Bitmap image, bool transparent) {
        int l=image.Width,t=image.Height,r=-1,b=-1;
        for(int y=0;y<image.Height;y++)for(int x=0;x<image.Width;x++) {
            Color c=image.GetPixel(x,y);
            bool ink=transparent ? c.A>16 : (c.R>130 && c.G>100 && c.B>80) || (c.R>100 && c.R>c.G*1.7 && c.R>c.B*1.7);
            if(ink){l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);b=Math.Max(b,y);}
        }
        if(r<0)throw new InvalidOperationException("No visible branding");
        return Rectangle.FromLTRB(Math.Max(0,l-12),Math.Max(0,t-12),Math.Min(image.Width,r+13),Math.Min(image.Height,b+13));
    }
}
'@
}
function Save-StoreArtwork($SourcePath, $DestinationPath, [int]$Width, [int]$Height, $Mode) {
    $source = [System.Drawing.Bitmap]::new($SourcePath)
    $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#1a1917'))
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        if ($Mode -eq 'feature') {
            $bounds = [IssenStoreBounds]::Find($source, $false)
            $scale = [Math]::Min(($Width * 0.86) / $bounds.Width, ($Height * 0.82) / $bounds.Height)
            $dw = [single]($bounds.Width * $scale); $dh = [single]($bounds.Height * $scale)
            $dest = [System.Drawing.RectangleF]::new(($Width-$dw)/2, ($Height-$dh)/2, $dw, $dh)
            $graphics.DrawImage($source, $dest, [System.Drawing.RectangleF]$bounds, [System.Drawing.GraphicsUnit]::Pixel)
        } elseif ($Mode -eq 'logo') {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $bounds = [IssenStoreBounds]::Find($source, $true)
            $scale = [Math]::Min(500 / $bounds.Width, 280 / $bounds.Height)
            $dw = [single]($bounds.Width * $scale); $dh = [single]($bounds.Height * $scale)
            $dest = [System.Drawing.RectangleF]::new(($Width-$dw)/2, 18+(280-$dh)/2, $dw, $dh)
            $graphics.DrawImage($source, $dest, [System.Drawing.RectangleF]$bounds, [System.Drawing.GraphicsUnit]::Pixel)
            $font = [System.Drawing.Font]::new('Georgia', 32, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
            $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#eee7d7'))
            $format = [System.Drawing.StringFormat]::new()
            try {
                $format.Alignment = [System.Drawing.StringAlignment]::Center
                $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
                $graphics.DrawString('I S S E N', $font, $brush, [System.Drawing.RectangleF]::new(0,316,$Width,60), $format)
            } finally { $font.Dispose(); $brush.Dispose(); $format.Dispose() }
        } else {
            $scale = [Math]::Max($Width / $source.Width, $Height / $source.Height)
            $dw = [single]($source.Width*$scale); $dh = [single]($source.Height*$scale)
            $graphics.DrawImage($source, [System.Drawing.RectangleF]::new(($Width-$dw)/2,($Height-$dh)/2,$dw,$dh))
        }
        $bitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output "$DestinationPath : ${Width}x${Height}"
    } finally { $graphics.Dispose(); $bitmap.Dispose(); $source.Dispose() }
}
Save-StoreArtwork (Join-Path $repo 'assets/branding/issen-splash-v1.png') (Join-Path $output 'common/feature-graphic-1024x500.png') 1024 500 'feature'
# Conventional RGB JPEG alternative for the common Play feature-graphic field.
$featureSource = [System.Drawing.Image]::FromFile((Join-Path $output 'common/feature-graphic-1024x500.png'))
$featureJpeg = [System.Drawing.Bitmap]::new(1024, 500, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$featureGraphics = [System.Drawing.Graphics]::FromImage($featureJpeg)
$parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
try {
    $featureJpeg.SetResolution(72,72)
    $featureGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#1a1917'))
    $featureGraphics.DrawImage($featureSource,0,0,1024,500)
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]95)
    $featureJpeg.Save((Join-Path $output 'issen-feature-graphic-1024x500.jpg'),$codec,$parameters)
} finally { $parameters.Dispose(); $featureGraphics.Dispose(); $featureJpeg.Dispose(); $featureSource.Dispose() }
Save-StoreArtwork (Join-Path $repo 'assets/branding/issen-launcher-foreground-v1.png') (Join-Path $output 'pc/logo-600x400.png') 600 400 'logo'
Save-StoreArtwork (Join-Path $repo 'assets/branding/issen-text-free-cover-v1.png') (Join-Path $output 'pc/feature-graphic-1920x1080.png') 1920 1080 'cover'
