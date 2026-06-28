<?php
// api/login.php

// 1. Pull in the relational database link configuration and authentication controller
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/AuthController.php';

// 2. Instantiate and connect to the MySQL database engine via PDO
$database = new Database();
$db = $database->getConnection();

// 3. Ensure the server only responds to actual POST data packets
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "HTTP Method not allowed. Please use POST."
    ]);
    exit();
}

// 4. Intercept and decode the raw JSON input stream sent by React
$json_payload = file_get_contents("php://input");
$request_data = json_decode($json_payload, true);

// 5. Ensure the parsed data object array contains parameters
$loginInput = isset($request_data['loginInput']) ? $request_data['loginInput'] : null;
$password = isset($request_data['password']) ? $request_data['password'] : null;

if (!$loginInput || !$password) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request. Missing authentication properties."
    ]);
    exit();
}

// 6. Pass data parameters directly to your AuthController instance
$authController = new AuthController($db);
$result = $authController->login($loginInput, $password);

// 7. Output whatever array response the controller generated
echo json_encode($result);
