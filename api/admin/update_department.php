<?php
// api/admin/update_department.php

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

// 3. Validation: Verify that crucial table descriptors exist
if (!isset($data['id']) || !isset($data['code']) || !isset($data['name'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required department identifier parameters."]);
    exit();
}

// 4. Data Sanitization: Clean up whitespace trailing blocks
$dept_id = (int)$data['id'];
$dept_code = strtoupper(trim($data['code'])); // Forces uppercase for structural uniform consistency (e.g. 'DIT')
$dept_name = trim($data['name']);

if (empty($dept_code) || empty($dept_name)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Department fields cannot remain empty or blank strings."]);
    exit();
}

try {
    // 5. Build and execute parameterized SQL update statement
    $query = "UPDATE departments 
              SET code = :code, name = :name 
              WHERE id = :id";
              
    $stmt = $db->prepare($query);
    
    // Bind primitive input parameters securely against structural injections
    $stmt->bindParam(':code', $dept_code, PDO::PARAM_STR);
    $stmt->bindParam(':name', $dept_name, PDO::PARAM_STR);
    $stmt->bindParam(':id', $dept_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Department parameters modified successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Statement compiled but database failed to update rows."]);
    }

} catch (PDOException $e) {
    // Elegant duplicate index code collision block verification catching engine rules
    if ($e->getCode() == 23000 || str_contains($e->getMessage(), '1062')) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Conflict error. This Department Code ('" . $dept_code . "') is already taken by another academic branch."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database driver exception thrown: " . $e->getMessage()]);
    }
}
