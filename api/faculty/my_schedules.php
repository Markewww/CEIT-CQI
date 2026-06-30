<?php
// api/faculty/my_schedules.php

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "HTTP Request Method Not Allowed."]);
    exit();
}

// Check if the unique identifier parameter is provided
if (!isset($_GET['employee_id']) || empty(trim($_GET['employee_id']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing instructor employee context parameters."]);
    exit();
}

$employee_id = trim($_GET['employee_id']);

try {
    // Relational query filtered strictly by the logged-in professor's fixed employee ID
    $query = "SELECT 
                s.id,
                s.schedule_id,
                s.course_id,
                c.code AS course_code,
                c.description AS course_description,
                s.program_id,
                p.code AS program_code,
                s.user_id,
                u.employee_id,
                s.academic_year,
                s.semester,
                s.year_level,
                s.section,
                s.is_active
              FROM schedules s
              INNER JOIN courses c ON s.course_id = c.id
              INNER JOIN programs p ON s.program_id = p.id
              INNER JOIN users u ON s.user_id = u.id
              WHERE u.employee_id = :employee_id AND s.is_active = 1
              ORDER BY s.academic_year DESC, s.semester DESC, s.year_level ASC, s.section ASC";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(':employee_id', $employee_id, PDO::PARAM_STR);
    $stmt->execute();
    
    $my_schedules = [];
    while($row = $stmt->fetch()) {
        $my_schedules[] = [
            "id" => (int)$row['id'],
            "schedule_id" => trim($row['schedule_id']),
            "course_id" => (int)$row['course_id'],
            "course_code" => strtoupper(trim($row['course_code'])),
            "course_description" => trim($row['course_description']),
            "program_id" => (int)$row['program_id'],
            "program_code" => strtoupper(trim($row['program_code'])),
            "user_id" => (int)$row['user_id'],
            "employee_id" => trim($row['employee_id']),
            "academic_year" => trim($row['academic_year']),
            "semester" => trim($row['semester']),
            "year_level" => (int)$row['year_level'],
            "section" => strtoupper(trim($row['section'])),
            "is_active" => (int)$row['is_active']
        ];
    }
    
    echo json_encode(["status" => "success", "data" => $my_schedules]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => " Relational filter engine failure: " . $e->getMessage()]);
}
