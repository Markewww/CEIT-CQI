<?php
// api/admin/create_schedule.php

// 1. Include core database config class (Handles automated global CORS headers instantly)
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
if (
    !isset($data['schedule_id']) ||
    !isset($data['course_id']) || 
    !isset($data['program_id']) || 
    !isset($data['user_id']) ||
    !isset($data['academic_year']) ||
    !isset($data['semester']) ||
    !isset($data['year_level']) ||
    !isset($data['section'])
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required schedule registration parameters."]);
    exit();
}

// 4. Data Sanitization: Clean up trailing spaces and force precise data types
$schedule_id   = trim($data['schedule_id']);
$course_id     = (int)$data['course_id'];
$program_id    = (int)$data['program_id'];
$user_id       = (int)$data['user_id'];
$academic_year = trim($data['academic_year']);
$semester      = trim($data['semester']);
$year_level    = (int)$data['year_level'];
$section       = strtoupper(trim($data['section']));

if (empty($schedule_id) || $course_id <= 0 || $program_id <= 0 || $user_id <= 0 || empty($academic_year) || empty($semester) || $year_level <= 0 || empty($section)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Schedule fields cannot remain empty or hold invalid keys."]);
    exit();
}

try {
    // 5. Execute secure parameterized SQL statement insert query
    $query = "INSERT INTO schedules (schedule_id, course_id, program_id, user_id, academic_year, semester, year_level, section, is_active) 
              VALUES (:schedule_id, :course_id, :program_id, :user_id, :academic_year, :semester, :year_level, :section, 1)";
              
    $stmt = $db->prepare($query);
    
    // Bind parameters securely to neutralize injection vulnerabilities
    $stmt->bindParam(':schedule_id', $schedule_id, PDO::PARAM_STR);
    $stmt->bindParam(':course_id', $course_id, PDO::PARAM_INT);
    $stmt->bindParam(':program_id', $program_id, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':academic_year', $academic_year, PDO::PARAM_STR);
    $stmt->bindParam(':semester', $semester, PDO::PARAM_STR);
    $stmt->bindParam(':year_level', $year_level, PDO::PARAM_INT);
    $stmt->bindParam(':section', $section, PDO::PARAM_STR);
    
    if ($stmt->execute()) {
        http_response_code(201); // 201 Created
        echo json_encode(["status" => "success", "message" => "New class schedule generated into system database successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to execute database schedule configuration write statement."]);
    }

} catch (PDOException $e) {
    // Check for duplicate unique index key collision engine constraints (Error 23000 / 1062)
    if ($e->getCode() == 23000 || str_contains($e->getMessage(), '1062')) {
        http_response_code(409); // 409 Conflict
        echo json_encode(["status" => "error", "message" => "Conflict error. This Class Schedule ID ('" . $schedule_id . "') is already registered in the system."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database exception thrown during execution: " . $e->getMessage()]);
    }
}
