<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$url = "https://giss.tv:667/status-json.xsl";

$response = file_get_contents($url);

if (!$response) {
    echo json_encode(["error" => true]);
    exit;
}

$data = json_decode($response, true);

$source = $data["icestats"]["source"] ?? null;

// 🔥 filtrar tu stream
if (is_array($source)) {
    foreach ($source as $s) {
        if (strpos($s["listenurl"], "sonarrock.mp3") !== false) {
            $source = $s;
            break;
        }
    }
}

// devolver solo lo necesario
echo json_encode([
    "title" => $source["title"] ?? "",
    "listeners" => $source["listeners"] ?? 0
], JSON_UNESCAPED_UNICODE);
