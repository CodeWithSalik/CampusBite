$pptApp = New-Object -ComObject PowerPoint.Application
$pptPath = (Resolve-Path "presentation\CampusBite_Project_Presentation.pptx").Path
$pdfPath = [System.IO.Path]::ChangeExtension($pptPath, ".pdf")
Write-Host "Opening presentation: $pptPath"
$pres = $pptApp.Presentations.Open($pptPath, 1, 0, 0)
Write-Host "Exporting to PDF: $pdfPath"
$pres.SaveAs($pdfPath, 32)
$pres.Close()
$pptApp.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pptApp) | Out-Null
Write-Host "Export complete! PDF exists: $(Test-Path $pdfPath)"
