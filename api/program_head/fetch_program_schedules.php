<?php
// api/program_head/fetch_program_schedules.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$program_head_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($program_head_id === 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required user_id parameter."]);
    exit();
}

try {
    // 1. Fetch system calendar metadata [INDEX: 1]
    $ay_stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'active_academic_year' LIMIT 1");
    $ay_stmt->execute();
    $active_ay = ($ay_stmt->fetch(PDO::FETCH_ASSOC))['setting_value'] ?? "—";

    $sem_stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'active_semester' LIMIT 1");
    $sem_stmt->execute();
    $active_sem = ($sem_stmt->fetch(PDO::FETCH_ASSOC))['setting_value'] ?? "—";

    // 2. Resolve Program Head assignment profile [INDEX: 1]
    $user_stmt = $db->prepare("SELECT u.program_id, p.name as program_name, p.code as program_code 
                                FROM users u 
                                INNER JOIN programs p ON u.program_id = p.id 
                                WHERE u.id = :id AND LOWER(u.role) = 'program head' AND u.is_active = 1 
                                LIMIT 1");
    $user_stmt->execute([':id' => $program_head_id]);
    $head_meta = $user_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$head_meta) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Active degree track clearance assignments were not found."]);
        exit();
    }

    $program_id = (int)$head_meta['program_id'];

    // 3. Query all class offerings tied explicitly to this specific Program Track ID [INDEX: 1]
    $query = "SELECT s.id, s.schedule_id, c.code AS course_code, c.description AS course_name, 
                     s.section, s.year_level
              FROM schedules s
              INNER JOIN courses c ON s.course_id = c.id
              WHERE s.program_id = :pid
              ORDER BY s.year_level ASC, c.code ASC, s.section ASC";

    $stmt = $db->prepare($query);
    $stmt->execute([':pid' => $program_id]);
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $monitored_registry = [];

    // 4. DATA SYNCHRONIZATION OVERHAUL: Query tables using schedule_id string [INDEX: 1]
    foreach ($schedules as $row) {
        $sid = $row['id'];
        $schedule_code = $row['schedule_id']; // Alphanumeric calendar string reference (e.g. 202522511)

        // 📍 FIXED ROSTER COUNT: Filters matching the parent schedule_id column string [INDEX: 1]
        $roster_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_schedules WHERE schedule_id = :scode");
        $roster_stmt->execute([':scode' => $schedule_code]);
        $roster_total = ($roster_stmt->fetch(PDO::FETCH_ASSOC))['total'];

        // 📍 FIXED MIDTERM AUDIT: Filters matching the parent schedule_id column string [INDEX: 1]
        $mid_test_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_test_analysis WHERE schedule_id = :scode AND period = 'midterms'");
        $mid_test_stmt->execute([':scode' => $schedule_code]);
        $mid_test_done = ($mid_test_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $mid_action_stmt = $db->prepare("SELECT COUNT(*) as total FROM action_plan_summary WHERE schedule_id = :scode AND period = 'midterms'");
        $mid_action_stmt->execute([':scode' => $schedule_code]);
        $mid_action_done = ($mid_action_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        // 📍 FIXED FINALS AUDIT: Filters matching the parent schedule_id column string [INDEX: 1]
        $fin_test_stmt = $db->prepare("SELECT COUNT(*) as total FROM student_test_analysis WHERE schedule_id = :scode AND period = 'finals'");
        $fin_test_stmt->execute([':scode' => $schedule_code]);
        $fin_test_done = ($fin_test_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $fin_action_stmt = $db->prepare("SELECT COUNT(*) as total FROM action_plan_summary WHERE schedule_id = :scode AND period = 'finals'");
        $fin_action_stmt->execute([':scode' => $schedule_code]);
        $fin_action_done = ($fin_action_stmt->fetch(PDO::FETCH_ASSOC))['total'] > 0;

        $monitored_registry[] = [
            "id" => $sid,
            "schedule_code" => $schedule_code,
            "course_code" => $row['course_code'],
            "course_name" => $row['course_name'],
            "section" => $row['section'],
            "year_level" => (int)$row['year_level'],
            "students_count" => (int)$roster_total, // Now accurately populated!
            "midterms_status" => ($mid_test_done && $mid_action_done) ? "Completed" : (($mid_test_done || $mid_action_done) ? "In Progress" : "Pending"),
            "finals_status" => ($fin_test_done && $fin_action_done) ? "Completed" : (($fin_test_done || $fin_action_done) ? "In Progress" : "Pending")
        ];
    }

    echo json_encode([
        "status" => "success",
        "academic_year" => $active_ay,
        "semester" => $active_sem,
        "program_title" => $head_meta['program_name'],
        "program_code" => $head_meta['program_code'],
        "data" => $monitored_registry
    ]);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database monitor mapping failure: " . $e->getMessage()]);
    exit();
}
