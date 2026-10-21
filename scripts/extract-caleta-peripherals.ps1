$ErrorActionPreference = 'Stop'

$categories = @('teclado', 'mouse', 'audi', 'parlante')
$rows = [System.Collections.Generic.List[object]]::new()
$regexOptions = [System.Text.RegularExpressions.RegexOptions]::Singleline

foreach ($category in $categories) {
    $listingUrl = "https://www.caleta.pe/tienda.php?fam=$category"
    $html = (Invoke-WebRequest -Uri $listingUrl -UseBasicParsing -TimeoutSec 30).Content
    $cards = [regex]::Split($html, '<div\s+class="product-item"\s*>')

    foreach ($card in $cards | Select-Object -Skip 1) {
        $titleMatch = [regex]::Match($card, '<h3\s+class="product-title"[^>]*>\s*<a[^>]+href="detalleprod\.php\?prod=(\d+)"[^>]*>(.*?)</a>', $regexOptions)
        $priceMatch = [regex]::Match($card, '<div\s+class="product-price"[^>]*>\s*<span[^>]*>\s*S/\s*([\d,.]+)', $regexOptions)
        $stockMatch = [regex]::Match($card, 'Stock:\s*([^<]+)<', $regexOptions)
        if (-not ($titleMatch.Success -and $priceMatch.Success)) { continue }

        $sku = $titleMatch.Groups[1].Value
        $name = [System.Net.WebUtility]::HtmlDecode($titleMatch.Groups[2].Value)
        $name = [regex]::Replace($name, '\s+', ' ').Trim()
        $rawPrice = $priceMatch.Groups[1].Value.Replace(',', '')
        $price = [decimal]::Parse($rawPrice, [Globalization.CultureInfo]::InvariantCulture)
        $stock = if ($stockMatch.Success) { [System.Net.WebUtility]::HtmlDecode($stockMatch.Groups[1].Value).Trim() } else { $null }

        $rows.Add([pscustomobject]@{
            id = "caleta-$sku"
            source_sku = $sku
            source_category = $category
            name = $name
            price_pen = $price
            stock_label = $stock
            source_url = "https://www.caleta.pe/detalleprod.php?prod=$sku"
        })
    }
}

$outputPath = Join-Path $PSScriptRoot '..\data\caleta-peripherals.json'
$outputDirectory = Split-Path -Parent $outputPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$document = [ordered]@{
    source = 'Caleta'
    captured_at = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    currency = 'PEN'
    products = $rows.ToArray()
}
ConvertTo-Json -InputObject $document -Depth 8 | Set-Content -LiteralPath $outputPath -Encoding utf8
$rows | Group-Object source_category | ForEach-Object { "{0}: {1}" -f $_.Name, $_.Count }
"total: $($rows.Count)"
