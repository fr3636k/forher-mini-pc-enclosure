$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
    & $nodeCommand.Source (Join-Path $PSScriptRoot 'serve.mjs')
} else {
    $bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (-not (Test-Path -LiteralPath $bundledNode)) {
        throw 'Please install Node.js, then run node serve.mjs.'
    }

    & $bundledNode (Join-Path $PSScriptRoot 'serve.mjs')
}
