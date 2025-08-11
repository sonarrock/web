<?php
// URL del endpoint interno de Zeno (cambia el ID de tu stream si es distinto)
$apiUrl = "https://streamingv2.zeno.fm/api/nowplaying/ezq3fcuf5ehvv";

// Llamada a la API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
curl_close($ch);

// Si la API responde correctamente
if ($response) {
    $data = json_decode($response, true);
    if (isset($data['listeners']['current'])) {
        echo json_encode([
            'listeners' => $data['listeners']['current']
        ]);
        exit;
    }
}

// Si algo falla, devolvemos 0 oyentes
echo json_encode(['listeners' => 0]);
