<?php
header('Content-Type: application/json');

$apiUrl = "https://streamingv2.zeno.fm/api/nowplaying/ezq3fcuf5ehvv";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
curl_close($ch);

if ($response) {
    $data = json_decode($response, true);
    if (isset($data['listeners']['current'])) {
        echo json_encode([
            'listeners' => $data['listeners']['current']
        ]);
        exit;
    }
}

echo json_encode(['listeners' => 0]);
?>
