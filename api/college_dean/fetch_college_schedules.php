<?php
// api/dean/fetch_college_schedules.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$dean_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($dean_id === 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required dean user_id."]);
    exit();
}

try {
    // 1. Safety verification check gate ensuring user holds master Dean clearance privileges [INDEX: 1]
    $user_stmt = $db->prepare("SELECT id FROM users WHERE id = :id AND LOWER(role) = 'dean' AND is_active = 1 LIMIT 1");
    $user_stmt->execute([':id' => $dean_id]);
    $is_dean = $user_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$is_dean) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Master college dean clearance privileges were not found for this profile."]);
        exit();
    }

    // 2. Fetch ALL class schedule offerings across the entire college including structural relation data mappings [INDEX: 1]
    $query = "SELECT s.id, s.schedule_id, s.course_code, s.course_name, s.section, 
                     p.code as program_code, d.code as department_code,
                     CONCAT(u.first_name, ' ', u.last_name) AS faculty_name, u.email AS faculty_email
              FROM schedules s
              INNER JOIN programs p ON s.program_id = p.id
              INNER JOIN departments d ON p.department_id = d.id
              LEFT JOIN users u ON s.faculty_id = u.id
              ORDER BY d.code ASC, p.code ASC, s.course_code ASC, s.section ASC";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $monitored_registry = [];

    // 3. Dynamically loop through entries to audit continuous quality assessment compliance metrics [INDEX: 1]
    foreach ($schedules as $row) {
        $sid = $row['id'];

        // Midterm tracking check loops
        $mid_test_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_test_analysis WHERE schedule_id = :sid AND period = 'midterms'");
        $mid_test_stmt->execute([':sid' => $sid]);
        $mid_test_done = ($mid_test_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $mid_action_stmt = $db->prepare("SELECT COUNT(*) as total FROM action_plan_summary WHERE schedule_id = :sid AND period = 'midterms' AND proposed_timeline IS NOT NULL AND proposed_timeline != ''");
        $mid_action_stmt->execute([':sid' => $sid]);
        $mid_action_done = ($mid_action_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        // Finals tracking check loops
        $fin_test_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_test_analysis WHERE schedule_id = :sid AND period = 'finals'");
        $fin_test_stmt->execute([':sid' => $sid]);
        $fin_test_done = ($fin_test_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $fin_action_stmt = $db->prepare("SELECT COUNT(*) as total FROM action_plan_summary WHERE schedule_id = :sid AND period = 'finals' AND proposed_timeline IS NOT NULL AND proposed_timeline != ''");
        $fin_action_stmt->execute([':sid' => $sid]);
        $fin_action_done = ($fin_action_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $monitored_registry[] = [
            "id" => $sid,
            "schedule_code" => $row['schedule_id'],
            "department_code" => $row['department_code'],
            "program_code" => $row['program_code'],
            "course_code" => $row['course_code'],
            "course_name" => $row['course_name'],
            "section" => $row['section'],
            "faculty_name" => $row['faculty_name'] ?? "Unassigned Instructor",
            "faculty_email" => $row['faculty_email'] ?? "",
            "midterms_status" => ($mid_test_done && $mid_action_done) ? "Completed" : (($mid_test_done || $mid_action_done) ? "In Progress" : "Pending"),
            "finals_status" => ($fin_test_done && $fin_action_done) ? "Completed" : (($fin_test_done || $fin_action_done) ? "In Progress" : "Pending")
        ];
    }

    echo json_encode(["status" => "success", "data" => $monitored_registry]);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database dean overview monitoring failure: " . $e->getMessage()]);
    exit();
}
