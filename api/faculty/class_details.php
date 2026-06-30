<?php
// api/faculty/class_details.php

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

if (!isset($_GET['schedule_id']) || empty(trim($_GET['schedule_id']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing unique schedule selection token key."]);
    exit();
}

$schedule_id = trim($_GET['schedule_id']);

try {
    // 1. Fetch Class Header Summary Metrics
    $q1 = "SELECT s.schedule_id, c.code AS course_code, c.description AS course_description,
                  p.code AS program_code, s.academic_year, s.semester, s.year_level, s.section
           FROM schedules s
           INNER JOIN courses c ON s.course_id = c.id
           INNER JOIN programs p ON s.program_id = p.id
           WHERE s.schedule_id = :id LIMIT 1";
           
    $stmt1 = $db->prepare($q1);
    $stmt1->execute([':id' => $schedule_id]);
    $meta = $stmt1->fetch(PDO::FETCH_ASSOC);

    if (!$meta) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Requested class code index does not exist."]);
        exit();
    }

    // 2. Fetch Direct Roster Rows from your updated table
    $q2 = "SELECT student_id, full_name FROM student_schedules WHERE schedule_id = :id ORDER BY full_name ASC";
    $stmt2 = $db->prepare($q2);
    $stmt2->execute([':id' => $schedule_id]);
    $roster = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success", 
        "class_info" => $meta, 
        "students" => $roster
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Relational extraction error trace: " . $e->getMessage()]);
}
