<?php
// api/chairperson/fetch_program_schedules.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$chairperson_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($chairperson_id === 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required chairperson identifier user_id."]);
    exit();
}

try {
    // 1. Resolve the specific program_id and department_id bound to this Chairperson account profile
    $user_stmt = $db->prepare("SELECT program_id, department_id FROM users WHERE id = :id AND (LOWER(role) = 'chairperson' OR LOWER(role) = 'personhead') AND is_active = 1 LIMIT 1");
    $user_stmt->execute([':id' => $chairperson_id]);
    $chair_meta = $user_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$chair_meta || empty($chair_meta['program_id'])) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Active program track clearance assignments were not found for this account position."]);
        exit();
    }

    $program_id = (int)$chair_meta['program_id'];

    // 2. Fetch all class section offerings assigned under this tracking index node
    $query = "SELECT s.id, s.schedule_id, s.course_code, s.course_name, s.section, 
                     CONCAT(u.first_name, ' ', u.last_name) AS faculty_name, u.email AS faculty_email
              FROM schedules s
              LEFT JOIN users u ON s.faculty_id = u.id
              WHERE s.program_id = :pid
              ORDER BY s.course_code ASC, s.section ASC";

    $stmt = $db->prepare($query);
    $stmt->execute([':pid' => $program_id]);
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $monitored_registry = [];

    // 3. Loop through class schedules to dynamically audit term progression metrics
    foreach ($schedules as $row) {
        $sid = $row['id']; // Unique internal database row id (e.g., 3)

        // A. Audit Midterm Metrics completion checklists
        $mid_test_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_test_analysis WHERE schedule_id = :sid AND period = 'midterms'");
        $mid_test_stmt->execute([':sid' => $sid]);
        $mid_test_done = ($mid_test_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $mid_action_stmt = $db->prepare("SELECT COUNT(*) as total FROM action_plan_summary WHERE schedule_id = :sid AND period = 'midterms' AND proposed_timeline IS NOT NULL AND proposed_timeline != ''");
        $mid_action_stmt->execute([':sid' => $sid]);
        $mid_action_done = ($mid_action_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        // B. Audit Final Term Metrics completion checklists
        $fin_test_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_test_analysis WHERE schedule_id = :sid AND period = 'finals'");
        $fin_test_stmt->execute([':sid' => $sid]);
        $fin_test_done = ($fin_test_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $fin_action_stmt = $db->prepare("SELECT COUNT(*) as total FROM action_plan_summary WHERE schedule_id = :sid AND period = 'finals' AND proposed_timeline IS NOT NULL AND proposed_timeline != ''");
        $fin_action_stmt->execute([':sid' => $sid]);
        $fin_action_done = ($fin_action_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $monitored_registry[] = [
            "id" => $sid,
            "schedule_code" => $row['schedule_id'], // unique alphanumeric character code descriptor text
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
    echo json_encode(["status" => "error", "message" => "Database monitoring failure: " . $e->getMessage()]);
    exit();
}
