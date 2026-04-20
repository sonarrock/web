<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$url      = "https://giss.tv:667/status-json.xsl";
$response = file_get_contents($url);

if (!$response) {
    echo json_encode(["error" => true, "title" => "", "listeners" => 0]);
    exit;
}

$data = json_decode($response, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["error" => true, "title" => "", "listeners" => 0]);
    exit;
}

$source = $data["icestats"]["source"] ?? null;

// Icecast puede devolver "source" como:
//   - objeto directo  (un solo stream en el servidor)
//   - array de objetos (varios streams activos)
// Normalizamos siempre a array para iterar de forma segura.
if (is_array($source) && isset($source["listenurl"])) {
    // Es un objeto directo (array asociativo), lo envolvemos
    $source = [$source];
}

// Buscamos el mount específico de Sonar Rock
$found = null;

if (is_array($source)) {
    foreach ($source as $s) {
        if (
            isset($s["listenurl"]) &&
            strpos($s["listenurl"], "sonarrock.mp3") !== false
        ) {
            $found = $s;
            break;
        }
    }
}

if (!$found) {
    // Mount no encontrado: devolvemos vacío pero sin error fatal
    echo json_encode(["title" => "", "listeners" => 0]);
    exit;
}

echo json_encode([
    "title"     => $found["title"]     ?? "",
    "artist"    => $found["artist"]    ?? "",
    "listeners" => $found["listeners"] ?? 0
], JSON_UNESCAPED_UNICODE);
