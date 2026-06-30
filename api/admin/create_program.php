<?php
// api/admin/create_program.php

// 1. Include database configuration (Go up two levels out of the admin folder)
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];

if ($request_method !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "HTTP Request Method Not Allowed."]);
    exit();
}

// 2. Extract incoming content stream from the Vite React client request
$data = json_decode(file_get_contents("php://input"), true);

// 3. Validation: Check if required parameter keys are present
if (!isset($data['code']) || !isset($data['name']) || !isset($data['department_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required program registration parameters."]);
    exit();
}

// 4. Data Sanitization: Clean up trailing spaces and force structural uniform constraints
$program_code = strtoupper(trim($data['code'])); // Forces uppercase for system tracking metrics consistency (e.g., 'BSIT')
$program_name = trim($data['name']);
$department_id = (int)$data['department_id'];

if (empty($program_code) || empty($program_name) || $department_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Program fields cannot remain empty or hold invalid keys."]);
    exit();
}

try {
    // 5. Execute secure parameterized SQL statement insert query
    $query = "INSERT INTO programs (code, name, department_id) VALUES (:code, :name, :department_id)";
              
    $stmt = $db->prepare($query);
    
    // Bind primitive properties cleanly
    $stmt->bindParam(':code', $program_code, PDO::PARAM_STR);
    $stmt->bindParam(':name', $program_name, PDO::PARAM_STR);
    $stmt->bindParam(':department_id', $department_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        http_response_code(201); // 201 Created status code response format
        echo json_encode(["status" => "success", "message" => "New degree program registered into database core successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to execute database configuration write statement."]);
    }

} catch (PDOException $e) {
    // Elegant check checking duplicate unique index key collision engine constraints
    if ($e->getCode() == 23000 || str_contains($e->getMessage(), '1062')) {
        http_response_code(409); // 409 Conflict status code response layout
        echo json_encode(["status" => "error", "message" => "Conflict error. This Program Code ('" . $program_code . "') is already registered in the system structure."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database exception thrown during execution: " . $e->getMessage()]);
    }
}
