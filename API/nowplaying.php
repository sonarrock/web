<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// ================= CONFIG =================
$GISS_URL = "https://giss.tv:667/status-json.xsl";
$CACHE_DIR = __DIR__ . "/cache/covers/";
$CACHE_TIME = 86400; // 24h

// ================= HELPERS =================
function clean_text($text) {
    $text = urldecode($text);
    $text = str_replace("+", " ", $text);
    $text = preg_replace('/\s+/', ' ', $text);
    return trim($text);
}

function parse_title($text) {
    $text = clean_text($text);

    if (!$text || $text === "-") {
        return ["artist" => "SONAR ROCK", "title" => "Transmitiendo rock sin concesiones"];
    }

    if (strpos($text, " - ") !== false) {
        $parts = explode(" - ", $text);
        $artist = clean_text(array_shift($parts));
        $title = clean_text(implode(" - ", $parts));
        return ["artist" => $artist, "title" => $title];
    }

    return ["artist" => "SONAR ROCK", "title" => $text];
}

function get_json($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => false
    ]);

    $res = curl_exec($ch);
    curl_close($ch);

    return $res ? json_decode($res, true) : null;
}

// ================= GET METADATA =================
$data = get_json($GISS_URL);

$title = "";

if ($data && isset($data["icestats"]["source"])) {
    $source = $data["icestats"]["source"];

    if (is_array($source)) {
        foreach ($source as $s) {
            if (strpos($s["listenurl"] ?? "", "sonarrock.mp3") !== false) {
                $title = $s["title"] ?? "";
                break;
            }
        }
    } else {
        $title = $source["title"] ?? "";
    }
}

$parsed = parse_title($title);
$artist = $parsed["artist"];
$song = $parsed["title"];

// ================= CACHE KEY =================
$cacheKey = md5(strtolower($artist . "_" . $song));
$cacheFile = $CACHE_DIR . $cacheKey . ".jpg";
$coverUrl = "";

// ================= COVER CACHE =================
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $CACHE_TIME)) {
    $coverUrl = "/api/cache/covers/" . $cacheKey . ".jpg";
} else {

    // Buscar en iTunes
    $query = urlencode($artist . " " . $song);
    $itunes = get_json("https://itunes.apple.com/search?term=$query&limit=1");

    if ($itunes && isset($itunes["results"][0]["artworkUrl100"])) {
        $img = str_replace("100x100bb", "600x600bb", $itunes["results"][0]["artworkUrl100"]);

        $imgData = @file_get_contents($img);

        if ($imgData) {
            file_put_contents($cacheFile, $imgData);
            $coverUrl = "/api/cache/covers/" . $cacheKey . ".jpg";
        }
    }
}

// fallback
if (!$coverUrl) {
    $coverUrl = "/attached_assets/logo_1749601460841.jpeg";
}

// ================= OUTPUT =================
echo json_encode([
    "artist" => $artist,
    "title" => $song,
    "cover" => $coverUrl
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
