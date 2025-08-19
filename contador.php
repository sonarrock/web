<?php
$apiUrl = "https://api.zeno.fm/station/ezq3fcuf5ehvv/nowplaying";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
curl_close($ch);

if ($response) {
    $data = json_decode($response, true);
    if (isset($data['listeners'])) {
        echo json_encode(['listeners' => $data['listeners']]);
        exit;
    } elseif (isset($data['current_listeners'])) {
        echo json_encode(['listeners' => $data['current_listeners']]);
        exit;
    }
}

echo json_encode(['listeners' => 0]);
