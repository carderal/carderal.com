<?php
    $data = json_decode(file_get_contents("config.json"), true);
    const HOST = $data["venciti.bed.ovh:39596"];
    const USER = $data["u2_sufftLuEZ0"];
    const PASSWORD = $data["!+dR.CwyryBUPqJ1QjByTSuT"];
    const DB = $data["s2_globals"];
    const ACCESS_TOKEN = $data["APP_USR-3704943938436288-032508-d84d386ad25ca8abe3418646ae83ebd5-1941395902"];

   if ($_SERVER["REQUEST_METHOD"] != "POST") {
        http_response_code(500);
        return;
   }
   if (!(isset($_GET['id'])) && !(isset($_GET['topic']))) {
        http_response_code(500);
        return;
   }
   if ($_GET['topic'] != "payment") {
        http_response_code(500);
        return;
   }

   $id = $_GET['id'];

   $curl = curl_init();

   curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://api.mercadopago.com/v1/payments/' . $id,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => array(
            'Authorization: Bearer ' . ACCESS_TOKEN
        )
   ));

   $payment = json_decode(curl_exec($curl), true);

   if ($payment["status"] === "approved") {
    
    $conn = new mysqli(HOST, USER, PASSWORD, DB);

    if ($conn->connect_error) {
        http_response_code(500);
        $conn->close();
        return;
    }
    $player = $payment["external_reference"];

    $insertSql = "INSERT INTO autopix_pendings (id, player) " 
            . "VALUES ('" . $id . "', '" . $player . "');";

    if ($conn->query($insertSql)) {
        $conn->close();
        http_response_code(201);
    } else {
        http_response_code(500);
        $conn->close();
    }
   }
  
?>