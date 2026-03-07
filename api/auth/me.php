<?php
require_once "../config.php";

if(!isset($_SESSION['user'])){
    http_response_code(401);
    echo json_encode(["error"=>"Not logged in"]);
    exit;
}

echo json_encode($_SESSION['user']);