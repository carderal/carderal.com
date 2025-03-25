<?php
    const HOST = "venciti.bed.ovh:39596";
    const USER = "u2_sufftLuEZ0";
    const PASSWORD = "!+dR.CwyryBUPqJ1QjByTSuT";
    const DB = "s2_globals";
    
    $conn = new mysqli(HOST, USER, PASSWORD, DB);

    if ($conn->connect_error) {
        http_response_code(500);
        echo $conn->connect_error;
        $conn->close();
        return;
    }

    $conn->close();
 
?>