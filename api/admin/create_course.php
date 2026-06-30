<?php
// api/admin/create_course.php

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
if (!isset($data['code']) || !isset($data['description'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required course creation parameters."]);
    exit();
}

// 4. Data Sanitization: Clean up trailing spaces and force uniform catalog constraints
$course_code = strtoupper(trim($data['code'])); // Forces uppercase for system tracking consistency (e.g., 'ITEC199')
$course_desc = trim($data['description']);

if (empty($course_code) || empty($course_desc)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Course fields cannot remain empty or blank strings."]);
    exit();
}

try {
    // 5. Execute secure parameterized SQL statement insert query
    $query = "INSERT INTO courses (code, description) VALUES (:code, :description)";
              
    $stmt = $db->prepare($query);
    
    // Bind primitive properties cleanly to neutralize injection vulnerabilities
    $stmt->bindParam(':code', $course_code, PDO::PARAM_STR);
    $stmt->bindParam(':description', $course_desc, PDO::PARAM_STR);
    
    if ($stmt->execute()) {
        http_response_code(201); // 201 Created status code response format
        echo json_encode(["status" => "success", "message" => "New course registered into catalog core successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to execute database configuration write statement."]);
    }

} catch (PDOException $e) {
    // Elegant check checking duplicate unique index key collision engine constraints
    if ($e->getCode() == 23000 || str_contains($e->getMessage(), '1062')) {
        http_response_code(409); // 409 Conflict status code response layout
        echo json_encode(["status" => "error", "message" => "Conflict error. This Course Code ('" . $course_code . "') is already registered inside your catalog structure."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database exception thrown during execution: " . $e->getMessage()]);
    }
}
