$ErrorActionPreference='Stop'
$base='C:\Users\lastm\No Fate Platform'
$repo='C:\Users\lastm\No Fate Platform\AXIS Toolbox'
$apps=@(
  @{ Name='AXIS Recon'; Slug='axis-recon'; Desc='Reconciliation Headache Killer' },
  @{ Name='AXIS Onboard'; Slug='axis-onboard'; Desc='Seller Onboarding & Verification Speed Killer' },
  @{ Name='AXIS Payouts'; Slug='axis-payouts'; Desc='Payout Exception & Delay Killer' },
  @{ Name='AXIS Evidence'; Slug='axis-evidence'; Desc='Compliance Evidence Pack Killer' },
  @{ Name='AXIS Quote'; Slug='axis-quote'; Desc='Pilot / Quote / ROI Visibility Killer' }
)
$results=@()

foreach($a in $apps){
  $appPath=Join-Path $base $a.Name
  $srcPath=Join-Path $appPath 'src'
  New-Item -ItemType Directory -Path $srcPath -Force | Out-Null

  $pkg=@{
    name=$a.Slug
    version='0.1.0'
    private=$true
    description=$a.Desc
    type='module'
    scripts=@{ dev='node src/main.ts'; build='echo build'; test='echo test' }
  } | ConvertTo-Json -Depth 6
  Set-Content -Path (Join-Path $appPath 'package.json') -Value $pkg -Encoding UTF8

  $mainTs = @(
    "export const appName = '$($a.Name)';",
    "export const valueProp = '$($a.Desc)';",
    "export function healthCheck(): string {",
    "  return `${appName} ready`;",
    "}",
    "",
    "console.log(healthCheck());"
  ) -join "`n"
  Set-Content -Path (Join-Path $srcPath 'main.ts') -Value $mainTs -Encoding UTF8

  $outPath=Join-Path $appPath '.ai-output'
  if(Test-Path $outPath){ Remove-Item $outPath -Recurse -Force }

  $status='success'
  $errMsg=''
  $exitCode=0
  try {
    & node "$repo\apps\cli\bin\axis.js" analyze "$appPath" --output "$outPath" | Out-Null
    $exitCode=$LASTEXITCODE
    if($exitCode -ne 0){
      $status='failure'
      $errMsg="axis analyze exited with code $exitCode"
    }
  } catch {
    $status='failure'
    $errMsg=$_.Exception.Message
  }

  $count=if(Test-Path $outPath){ (Get-ChildItem $outPath -Recurse -File | Measure-Object).Count } else { 0 }
  if($count -eq 0 -and $status -eq 'success'){
    $status='failure'
    if(-not $errMsg){ $errMsg='No files generated; output directory missing or empty' }
  }

  $summaryLines=@(
    "app: $($a.Name)",
    "output: $outPath",
    "timestamp: $(Get-Date -Format o)",
    "status: $status",
    "generated_files: $count",
    "exit_code: $exitCode"
  )
  if($errMsg){ $summaryLines += "error: $errMsg" }
  Set-Content -Path (Join-Path $appPath 'build-summary.txt') -Value ($summaryLines -join "`n") -Encoding UTF8

  $results += [pscustomobject]@{
    app=$a.Name
    status=$status
    generated_files=$count
    output=$outPath
    package_json=(Test-Path (Join-Path $appPath 'package.json'))
    main_ts=(Test-Path (Join-Path $srcPath 'main.ts'))
    exit_code=$exitCode
    error=$errMsg
  }
}

$results | Format-Table -AutoSize
Write-Output 'RESULTS_JSON_START'
$results | ConvertTo-Json -Depth 5
Write-Output 'RESULTS_JSON_END'
