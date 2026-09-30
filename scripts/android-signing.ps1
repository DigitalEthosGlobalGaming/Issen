# Windows-only local upload signing. Never print passwords or pass them as command arguments.
[CmdletBinding()]
param(
    [ValidateSet('Initialize', 'Build')]
    [string]$Action = 'Initialize',
    [ValidateRange(1, 2100000000)]
    [int]$VersionCode = 1,
    [string]$DistinguishedName = 'CN=Issen, O=Digital Ethos Global Gaming'
)

$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This script requires Windows account encryption (DPAPI).' }
$repo = Split-Path -Parent $PSScriptRoot
$signingDirectory = Join-Path $repo '.android-signing'
$keystore = Join-Path $signingDirectory 'issen-upload.jks'
$credentialFile = Join-Path $signingDirectory 'upload-password.clixml'

# Check both Git exclusion and tracking before writing any credentials.
& git -c "safe.directory=$repo" -C $repo check-ignore --quiet --no-index -- '.android-signing/upload-password.clixml'
if ($LASTEXITCODE -ne 0) { throw '.android-signing/ must be ignored by Git before using this script.' }
$tracked = & git -c "safe.directory=$repo" -C $repo ls-files -- '.android-signing/'
if ($LASTEXITCODE -ne 0 -or $tracked) { throw 'The signing directory must not contain tracked files.' }

if (Test-Path -LiteralPath $signingDirectory) {
    $directoryItem = Get-Item -LiteralPath $signingDirectory -Force
    if (-not $directoryItem.PSIsContainer -or ($directoryItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw 'The signing directory must be a regular local directory, not a link.'
    }
} else {
    if ($Action -eq 'Build') { throw 'Run this script with -Action Initialize first.' }
    New-Item -ItemType Directory -Path $signingDirectory | Out-Null
}

# Replace inherited permissions before creating files. Allow only this user and SYSTEM.
$userSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
$acl = Get-Acl -LiteralPath $signingDirectory
if ($acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $userSid.Value) {
    throw 'Run signing as the Windows account that owns this signing directory.'
}
$allowedSids = @($userSid.Value, 'S-1-5-18')
$existingRules = @($acl.Access)
$unexpectedRules = @($existingRules | Where-Object {
    $_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -notin $allowedSids -or
    $_.FileSystemRights -ne [Security.AccessControl.FileSystemRights]::FullControl -or
    $_.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow -or
    $_.InheritanceFlags -ne ([Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit) -or
    $_.PropagationFlags -ne [Security.AccessControl.PropagationFlags]::None
})
if (-not $acl.AreAccessRulesProtected -or $existingRules.Count -ne 2 -or $unexpectedRules.Count -gt 0) {
    $acl.SetAccessRuleProtection($true, $false)
    foreach ($entry in @($acl.Access)) { $acl.RemoveAccessRuleSpecific($entry) }
    foreach ($sid in @($userSid, [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) {
        $rule = [Security.AccessControl.FileSystemAccessRule]::new(
            $sid, 'FullControl', 'ContainerInherit, ObjectInherit', 'None', 'Allow'
        )
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $signingDirectory -AclObject $acl
}

$environmentKeys = @(
    'JAVA_HOME', 'ANDROID_HOME', 'GRADLE_USER_HOME', 'PATH', 'ISSEN_KEYTOOL_PASSWORD',
    'ISSEN_UPLOAD_STORE_FILE', 'ISSEN_UPLOAD_STORE_PASSWORD', 'ISSEN_UPLOAD_KEY_ALIAS',
    'ISSEN_UPLOAD_KEY_PASSWORD', 'ISSEN_ANDROID_VERSION_CODE'
)
$previousEnvironment = @{}
foreach ($name in $environmentKeys) {
    $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}
$passwordPointer = [IntPtr]::Zero
$originalLocation = Get-Location

try {
    $localJavaDirectory = Join-Path $repo '.android-tools/java'
    if (Test-Path -LiteralPath $localJavaDirectory) {
        $localJava = Get-ChildItem -LiteralPath $localJavaDirectory -Directory |
            Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin/keytool.exe') } |
            Select-Object -First 1
        if ($localJava) { $env:JAVA_HOME = $localJava.FullName }
    }
    $keytool = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/keytool.exe' } else { 'keytool.exe' }
    if (-not (Get-Command $keytool -ErrorAction SilentlyContinue)) { throw 'Install Java 21 first.' }

    if ($Action -eq 'Initialize') {
        if ((Test-Path -LiteralPath $keystore) -or (Test-Path -LiteralPath $credentialFile)) {
            throw 'Signing files already exist. They will not be overwritten. Use -Action Build, or resolve a partial initialization manually.'
        }
        $securePassword = Read-Host 'Choose an upload password and save it in your password manager' -AsSecureString
        if ($securePassword.Length -lt 12) { throw 'Use an upload password of at least 12 characters.' }
        $credential = [Management.Automation.PSCredential]::new('issen-upload', $securePassword)
        # Export-Clixml encrypts SecureString with Windows DPAPI for this user on this PC.
        # Save it before key generation so a failed keytool operation cannot lose the password.
        $credential | Export-Clixml -LiteralPath $credentialFile
    } else {
        if (-not (Test-Path -LiteralPath $keystore) -or -not (Test-Path -LiteralPath $credentialFile)) {
            throw 'Both the keystore and encrypted password file are required.'
        }
        try { $credential = Import-Clixml -LiteralPath $credentialFile } catch {
            throw 'Cannot decrypt signing credentials. Run as the Windows account on the PC that initialized them.'
        }
        if ($credential -isnot [Management.Automation.PSCredential]) { throw 'Invalid signing credential file.' }
    }

    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential.Password)
    $passwordText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    Set-Location -LiteralPath $repo
    if ($Action -eq 'Initialize') {
        $env:ISSEN_KEYTOOL_PASSWORD = $passwordText
        & $keytool -genkeypair -keystore $keystore -storetype PKCS12 -alias $credential.UserName `
            -keyalg RSA -keysize 2048 -validity 10000 -dname $DistinguishedName `
            -storepass:env ISSEN_KEYTOOL_PASSWORD -keypass:env ISSEN_KEYTOOL_PASSWORD
        if ($LASTEXITCODE -ne 0) { throw 'Key creation failed. The encrypted password is retained; do not discard it if a keystore was created.' }
        Write-Output 'Created upload keystore and Windows-encrypted password in .android-signing/.'
        Write-Output 'Keep a secure backup; the encrypted password file is tied to this Windows account and PC.'
    } else {
        $localSdk = Join-Path $repo '.android-tools/sdk'
        if (Test-Path -LiteralPath $localSdk) { $env:ANDROID_HOME = $localSdk }
        if (-not $env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME = Join-Path $repo '.android-tools/gradle-cache' }
        if ($env:JAVA_HOME) { $env:PATH = "$env:JAVA_HOME/bin;$env:PATH" }
        $env:ISSEN_UPLOAD_STORE_FILE = $keystore
        $env:ISSEN_UPLOAD_STORE_PASSWORD = $passwordText
        $env:ISSEN_UPLOAD_KEY_PASSWORD = $passwordText
        $env:ISSEN_UPLOAD_KEY_ALIAS = $credential.UserName
        $env:ISSEN_ANDROID_VERSION_CODE = [string]$VersionCode
        & npm.cmd run android:bundle
        if ($LASTEXITCODE -ne 0) { throw 'Signed bundle build failed. Signing files have been retained.' }
        Write-Output 'Signed bundle: android/app/build/outputs/bundle/release/app-release.aab'
    }
} finally {
    foreach ($name in $environmentKeys) {
        [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
    }
    if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
    $passwordText = $null
    Set-Location -LiteralPath $originalLocation.Path
}
