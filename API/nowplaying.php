<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// =========================
// CONFIG
// =========================
$ICECAST_URL = "https://giss.tv:667/status-json.xsl";
$MOUNTPOINT = "sonarrock.mp3";
$CACHE_FILE = __DIR__ . "/cache.json";
$CACHE_TTL = 5; // segundos

// =========================
// CACHE
// =========================
if (file_exists($CACHE_FILE)) {
    $cacheData = json_decode(file_get_contents($CACHE_FILE), true);
    if ($cacheData && (time() - $cacheData["time"] < $CACHE_TTL)) {
        echo json_encode($cacheData["data"]);
        exit;
    }
}

// =========================
// FETCH ICECAST
// =========================
$response = @file_get_contents($ICECAST_URL);

if (!$response) {
    echo json_encode(["error" => true]);
    exit;
}

$data = json_decode($response, true);
$source = $data["icestats"]["source"] ?? null;

// =========================
// FILTRAR MOUNT
// =========================
if (is_array($source)) {
    foreach ($source as $s) {
        if (strpos($s["listenurl"], $MOUNTPOINT) !== false) {
            $source = $s;
            break;
        }
    }
}

// =========================
// PARSE TITLE
// =========================
$titleRaw = $source["title"] ?? "";
$artist = "SONAR ROCK";
$title = "Transmitiendo rock sin concesiones";

if ($titleRaw && strpos($titleRaw, " - ") !== false) {
    $parts = explode(" - ", $titleRaw);
    $artist = trim($parts[0]);
    $title = trim(implode(" - ", array_slice($parts, 1)));
} elseif ($titleRaw) {
    $title = $titleRaw;
}

// =========================
// COVER (itunes)
// =========================
$cover = null;

$search = urlencode($artist . " " . $title);
$itunes = @file_get_contents("https://itunes.apple.com/search?term=$search&limit=1");

if ($itunes) {
    $itunesData = json_decode($itunes, true);
    if (!empty($itunesData["results"][0]["artworkUrl100"])) {
        $cover = str_replace("100x100bb", "600x600bb", $itunesData["results"][0]["artworkUrl100"]);
    }
}

// =========================
// RESULTADO FINAL
// =========================
$result = [
    "artist" => $artist,
    "title" => $title,
    "cover" => $cover,
    "listeners" => $source["listeners"] ?? 0,
    "online" => isset($source["stream_start"]),
    "timestamp" => time()
];

// =========================
// GUARDAR CACHE
// =========================
file_put_contents($CACHE_FILE, json_encode([
    "time" => time(),
    "data" => $result
]));

// =========================
// GUARDAR HISTORIAL
// =========================
$historyFile = __DIR__ . "/history.json";

$history = [];
if (file_exists($historyFile)) {
    $history = json_decode(file_get_contents($historyFile), true) ?? [];
}

$last = $history[0]["key"] ?? "";

$currentKey = $artist . " - " . $title;

if ($currentKey !== $last) {
    array_unshift($history, [
        "key" => $currentKey,
        "artist" => $artist,
        "title" => $title,
        "cover" => $cover,
        "time" => date("H:i")
    ]);

    $history = array_slice($history, 0, 20);
    file_put_contents($historyFile, json_encode($history));
}

// =========================
echo json_encode($result, JSON_UNESCAPED_UNICODE);
