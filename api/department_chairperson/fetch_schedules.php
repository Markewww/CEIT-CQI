<?php
// api/department_chair/fetch_schedules.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$dept_head_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($dept_head_id === 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required department head user_id."]);
    exit();
}

try {
    // 1. Resolve the specific department_id bound to this Department Head profile [INDEX: 1]
    $user_stmt = $db->prepare("SELECT department_id FROM users WHERE id = :id AND (LOWER(role) = 'department head' OR LOWER(role) = 'department chair') AND is_active = 1 LIMIT 1");
    $user_stmt->execute([':id' => $dept_head_id]);
    $dept_meta = $user_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$dept_meta || empty($dept_meta['department_id'])) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Active department clearance assignments were not found for this account."]);
        exit();
    }

    $department_id = (int)$dept_meta['department_id'];

    // 2. Fetch all class schedules and track codes belonging to programs under this department [INDEX: 1]
    $query = "SELECT s.id, s.schedule_id, s.course_code, s.course_name, s.section, p.code as program_code,
                     CONCAT(u.first_name, ' ', u.last_name) AS faculty_name, u.email AS faculty_email
              FROM schedules s
              INNER JOIN programs p ON s.program_id = p.id
              LEFT JOIN users u ON s.faculty_id = u.id
              WHERE p.department_id = :did
              ORDER BY p.code ASC, s.course_code ASC, s.section ASC";

    $stmt = $db->prepare($query);
    $stmt->execute([':did' => $department_id]);
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $monitored_registry = [];

    // 3. Dynamically audit term completion checklists
    foreach ($schedules as $row) {
        $sid = $row['id'];

        // Midterm audit checks [INDEX: 1]
        $mid_test_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_test_analysis WHERE schedule_id = :sid AND period = 'midterms'");
        $mid_test_stmt->execute([':sid' => $sid]);
        $mid_test_done = ($mid_test_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $mid_action_stmt = $db->prepare("SELECT COUNT(*) as total FROM action_plan_summary WHERE schedule_id = :sid AND period = 'midterms' AND proposed_timeline IS NOT NULL AND proposed_timeline != ''");
        $mid_action_stmt->execute([':sid' => $sid]);
        $mid_action_done = ($mid_action_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        // Finals audit checks [INDEX: 1]
        $fin_test_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_test_analysis WHERE schedule_id = :sid AND period = 'finals'");
        $fin_test_stmt->execute([':sid' => $sid]);
        $fin_test_done = ($fin_test_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $fin_action_stmt = $db->prepare("SELECT COUNT(*) as total FROM action_plan_summary WHERE schedule_id = :sid AND period = 'finals' AND proposed_timeline IS NOT NULL AND proposed_timeline != ''");
        $fin_action_stmt->execute([':sid' => $sid]);
        $fin_action_done = ($fin_action_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $monitored_registry[] = [
            "id" => $sid,
            "schedule_code" => $row['schedule_id'],
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
    echo json_encode(["status" => "error", "message" => "Database departmental monitoring failure: " . $e->getMessage()]);
    exit();
}
