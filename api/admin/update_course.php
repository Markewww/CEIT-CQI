<?php
// api/admin/update_course.php

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

// 3. Validation: Check if all required identifier parameter keys are present
if (!isset($data['id']) || !isset($data['code']) || !isset($data['description'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required course modification parameters."]);
    exit();
}

// 4. Data Sanitization: Clean up trailing spaces and force uppercase constraints
$course_id = (int)$data['id'];
$course_code = strtoupper(trim($data['code'])); // Forces uppercase for uniform catalog indexation (e.g., 'ITEC199')
$course_desc = trim($data['description']);

if ($course_id <= 0 || empty($course_code) || empty($course_desc)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Course fields cannot remain empty or hold invalid keys."]);
    exit();
}

try {
    // 5. Execute secure parameterized SQL statement update query
    $query = "UPDATE courses 
              SET code = :code, description = :description 
              WHERE id = :id";
              
    $stmt = $db->prepare($query);
    
    // Bind primitive input parameters securely against structural injections
    $stmt->bindParam(':code', $course_code, PDO::PARAM_STR);
    $stmt->bindParam(':description', $course_desc, PDO::PARAM_STR);
    $stmt->bindParam(':id', $course_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Course parameters modified successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Statement compiled but database failed to update rows."]);
    }

} catch (PDOException $e) {
    // Elegant duplicate index code collision block verification catching engine rules
    if ($e->getCode() == 23000 || str_contains($e->getMessage(), '1062')) {
        http_response_code(409); // 409 Conflict status code response
        echo json_encode(["status" => "error", "message" => "Conflict error. This Course Code ('" . $course_code . "') is already registered inside your system catalog."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database engine exception encountered: " . $e->getMessage()]);
    }
}
