<?php
// api/admin/create_department.php

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
if (!isset($data['code']) || !isset($data['name'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required department registration parameters."]);
    exit();
}

// 4. Data Sanitization: Clean up trailing spaces and force structural uniform constraints
$dept_code = strtoupper(trim($data['code'])); // Forces uppercase for system tracking metrics consistency (e.g. 'DIT')
$dept_name = trim($data['name']);

if (empty($dept_code) || empty($dept_name)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Department fields cannot remain empty or blank strings."]);
    exit();
}

try {
    // 5. Execute secure parameterized SQL statement insert query
    $query = "INSERT INTO departments (code, name) VALUES (:code, :name)";
              
    $stmt = $db->prepare($query);
    
    // Bind primitive properties cleanly
    $stmt->bindParam(':code', $dept_code, PDO::PARAM_STR);
    $stmt->bindParam(':name', $dept_name, PDO::PARAM_STR);
    
    if ($stmt->execute()) {
        http_response_code(201); // 201 Created status code response format
        echo json_encode(["status" => "success", "message" => "New department branch registered into database core successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to execute database configuration write statement."]);
    }

} catch (PDOException $e) {
    // Elegant check checking duplicate unique index key collision engine constraints 
    if ($e->getCode() == 23000 || str_contains($e->getMessage(), '1062')) {
        http_response_code(409); // 409 Conflict status code response layout
        echo json_encode(["status" => "error", "message" => "Conflict error. This Department Code ('" . $dept_code . "') is already registered in the system structure."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database exception thrown during execution: " . $e->getMessage()]);
    }
}
