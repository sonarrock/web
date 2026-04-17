<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$file = __DIR__ . "/history.json";

if (!file_exists($file)) {
    echo json_encode([]);
    exit;
}

echo file_get_contents($file);
