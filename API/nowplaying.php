<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$url = "https://giss.tv:667/status-json.xsl";

$response = @file_get_contents($url);

if (!$response) {
    echo json_encode(["error" => true]);
    exit;
}

$data = json_decode($response, true);

$source = $data["icestats"]["source"] ?? null;

if (is_array($source)) {
    foreach ($source as $s) {
        if (strpos($s["listenurl"], "sonarrock.mp3") !== false) {
            $source = $s;
            break;
        }
    }
}

$title = $source["title"] ?? "";

if (!$title || $title === "-") {
    echo json_encode(["title" => "", "artist" => ""]);
    exit;
}

// PARSE
$artist = "SONAR ROCK";
$song = $title;

if (strpos($title, " - ") !== false) {
    $parts = explode(" - ", $title);
    $artist = trim($parts[0]);
    $song = trim(implode(" - ", array_slice($parts, 1)));
}

// COVER (simple fallback)
$cover = "https://www.sonarrock.com/attached_assets/logo_1749601460841.jpeg";

echo json_encode([
    "title" => $song,
    "artist" => $artist,
    "cover" => $cover
], JSON_UNESCAPED_UNICODE);
