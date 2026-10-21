param(
    [string]$OutputPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'data/caleta-core.json'),
    [ValidateRange(0, 60000)]
    [int]$DelayMilliseconds = 500
)

$ErrorActionPreference = 'Stop'
$baseUrl = 'https://www.caleta.pe/'
$families = [ordered]@{
    cpu    = @{ category = 'cpu'; type = 'Procesador' }
    mbb    = @{ category = 'board'; type = 'Placa madre' }
    ram    = @{ category = 'ram'; type = 'Memoria RAM' }
    disco  = @{ category = 'ssd'; type = 'Almacenamiento' }
    video  = @{ category = 'gpu'; type = 'Tarjeta gráfica' }
    case   = @{ category = 'case'; type = 'Case' }
    fuente = @{ category = 'power'; type = 'Fuente de poder' }
    ref    = @{ category = 'cooling'; type = 'Refrigeración' }
}

function Get-PlainText([string]$html) {
    return [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($html, '<[^>]+>', '') -replace '\s+', ' ').Trim())
}

$products = [System.Collections.Generic.List[object]]::new()
$seenIds = [System.Collections.Generic.HashSet[string]]::new()
$categorySources = [ordered]@{}
$order = 0

foreach ($family in $families.Keys) {
    $categoryUrl = "${baseUrl}tienda.php?fam=$family"
    $categorySources[$family] = $categoryUrl
    $response = Invoke-WebRequest -Uri $categoryUrl -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -ne 200) {
        throw "Caleta devolvió HTTP $($response.StatusCode) para $categoryUrl"
    }

    $cardStart = '(?is)<div\s+class\s*=\s*["''][^"'']*\bproduct-item\b[^"'']*["''][^>]*>'
    $cardParts = [regex]::Split([string]$response.Content, $cardStart)
    $countBefore = $products.Count
    foreach ($part in $cardParts | Select-Object -Skip 1) {
        $titleMatch = [regex]::Match($part, '(?is)<h3[^>]*class\s*=\s*["''][^"'']*\bproduct-title\b[^"'']*["''][^>]*>\s*<a[^>]*href\s*=\s*["''](?<href>[^"'']*prod=\d+)["''][^>]*>(?<title>.*?)</a>')
        if (-not $titleMatch.Success) { continue }

        $href = $titleMatch.Groups['href'].Value
        $idMatch = [regex]::Match($href, '[?&]prod=(?<id>\d+)')
        $priceMatch = [regex]::Match($part, '(?is)<div[^>]*class\s*=\s*["''][^"'']*\bproduct-price\b[^"'']*["''][^>]*>\s*<span[^>]*>\s*S/\s*(?<price>[\d.,]+)')
        $stockMatch = [regex]::Match($part, '(?is)Stock:\s*(?<stock>[^<]+)')
        if (-not $idMatch.Success -or -not $priceMatch.Success -or -not $stockMatch.Success) {
            throw "Tarjeta incompleta en $categoryUrl : $(Get-PlainText $titleMatch.Groups['title'].Value)"
        }

        $sourceSku = $idMatch.Groups['id'].Value
        if (-not $seenIds.Add($sourceSku)) {
            Write-Warning "ID repetido en Caleta: $sourceSku; se conserva la primera aparición."
            continue
        }

        $priceText = $priceMatch.Groups['price'].Value.Replace(',', '')
        $price = [decimal]::Parse($priceText, [Globalization.CultureInfo]::InvariantCulture)
        $stockText = (Get-PlainText $stockMatch.Groups['stock'].Value)
        $stockQuantity = if ($stockText -match '^\d+$') { [int]$stockText } else { $null }
        $suspicious = $price -le 0 -or $price -eq 9999 -or $price -eq 99999
        if ($suspicious) { Write-Warning "Revisar precio S/ $price del producto $sourceSku." }

        $order++
        [void]$products.Add([pscustomobject][ordered]@{
            id                  = "caleta-$sourceSku"
            source_sku          = $sourceSku
            source_category     = $family
            category            = $families[$family].category
            name                = Get-PlainText $titleMatch.Groups['title'].Value
            brand               = $null
            type                = $families[$family].type
            detail              = $null
            description         = $null
            price_pen           = $price
            stock_text          = $stockText
            stock_quantity      = $stockQuantity
            source_url          = [Uri]::new([Uri]$categoryUrl, $href).AbsoluteUri
            official_url        = $null
            official_image_url  = $null
            specs               = @{}
            tag                 = $null
            label               = $null
            published           = $false
            sort_order          = $order
            price_needs_review  = $suspicious
        })
    }

    $categoryCount = $products.Count - $countBefore
    if ($categoryCount -eq 0) { throw "No se encontraron productos en $categoryUrl; no se sobrescribió el inventario." }
    Write-Host "$family : $categoryCount productos"
    if ($DelayMilliseconds -gt 0) { Start-Sleep -Milliseconds $DelayMilliseconds }
}

$document = [ordered]@{
    source           = 'Caleta'
    source_base_url  = $baseUrl
    captured_at      = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    currency         = 'PEN'
    notes            = @(
        'Inventario de las ocho familias de componentes solicitadas, leído de las páginas públicas de Caleta.',
        'No incluye imágenes de Caleta; official_image_url y official_url permanecen sin verificar.',
        'description y specs permanecen vacíos hasta cotejo con fichas oficiales.',
        'Precios de 9999 o 99999 se marcaron como sospechosos y requieren revisión antes de publicar.'
    )
    category_sources = $categorySources
    products         = $products.ToArray()
}

$target = [IO.Path]::GetFullPath($OutputPath)
$targetDirectory = Split-Path -Parent $target
if (-not (Test-Path -LiteralPath $targetDirectory)) {
    [void](New-Item -ItemType Directory -Path $targetDirectory -Force)
}
$json = ConvertTo-Json -InputObject $document -Depth 8
Set-Content -LiteralPath $target -Value $json -Encoding utf8
Write-Host "Guardados $($products.Count) productos en $target"
