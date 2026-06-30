<?php
// api/admin/update_schedule.php

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

// 2. Read the raw incoming JSON stream sent from your React modal
$data = json_decode(file_get_contents("php://input"), true);

// 3. Validation: Verify that crucial table identifiers and fields exist
if (
    !isset($data['id']) || 
    !isset($data['schedule_id']) || 
    !isset($data['course_id']) || 
    !isset($data['program_id']) || 
    !isset($data['user_id']) ||
    !isset($data['academic_year']) ||
    !isset($data['semester']) ||
    !isset($data['year_level']) ||
    !isset($data['section']) ||
    !isset($data['is_active'])
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required schedule modification parameters."]);
    exit();
}

// 4. Data Sanitization: Clean up whitespace and force proper data types
$id            = (int)$data['id'];
$schedule_id   = trim($data['schedule_id']);
$course_id     = (int)$data['course_id'];
$program_id    = (int)$data['program_id'];
$user_id       = (int)$data['user_id'];
$academic_year = trim($data['academic_year']);
$semester      = trim($data['semester']);
$year_level    = (int)$data['year_level'];
$section       = strtoupper(trim($data['section']));
$is_active     = (int)$data['is_active'];

if ($id <= 0 || empty($schedule_id) || $course_id <= 0 || $program_id <= 0 || $user_id <= 0 || empty($academic_year) || empty($semester) || $year_level <= 0 || empty($section)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Schedule fields cannot remain empty or hold invalid keys."]);
    exit();
}

try {
    // 5. Build and execute parameterized SQL update statement
    $query = "UPDATE schedules SET 
                schedule_id = :schedule_id,
                course_id = :course_id, 
                program_id = :program_id, 
                user_id = :user_id, 
                academic_year = :academic_year, 
                semester = :semester, 
                year_level = :year_level, 
                section = :section, 
                is_active = :is_active 
              WHERE id = :id";
              
    $stmt = $db->prepare($query);
    
    // Bind primitive input parameters securely against structural injections
    $stmt->bindParam(':schedule_id', $schedule_id, PDO::PARAM_STR);
    $stmt->bindParam(':course_id', $course_id, PDO::PARAM_INT);
    $stmt->bindParam(':program_id', $program_id, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':academic_year', $academic_year, PDO::PARAM_STR);
    $stmt->bindParam(':semester', $semester, PDO::PARAM_STR);
    $stmt->bindParam(':year_level', $year_level, PDO::PARAM_INT);
    $stmt->bindParam(':section', $section, PDO::PARAM_STR);
    $stmt->bindParam(':is_active', $is_active, PDO::PARAM_INT);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Class schedule parameters modified successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Statement compiled but database failed to update rows."]);
    }

} catch (PDOException $e) {
    // Duplicate constraint checking if trying to rename an active item to an existing schedule_id
    if ($e->getCode() == 23000 || str_contains($e->getMessage(), '1062')) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Conflict error. This Class Schedule ID ('" . $schedule_id . "') is already assigned to another entry."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database engine exception encountered: " . $e->getMessage()]);
    }
}
