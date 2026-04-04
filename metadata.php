<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$url = "https://giss.tv:667/status-json.xsl";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 12);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($httpCode === 200 && $response) {
    echo $response;
    exit;
}

echo json_encode([
    "error" => true,
    "message" => "No se pudo obtener metadata desde GISS",
    "http_code" => $httpCode,
    "curl_error" => $error
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
