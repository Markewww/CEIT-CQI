<?php
// api/faculty/get_signatories.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$schedule_id = isset($_GET['schedule_id']) ? trim($_GET['schedule_id']) : '';

if (empty($schedule_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing schedule_id query parameter."]);
    exit();
}

try {
    // 1. Resolve College Dean Name Globally
    $dean_stmt = $db->prepare("SELECT CONCAT(first_name, ' ', last_name) as full_name FROM users WHERE LOWER(role) LIKE '%dean%' AND is_active = 1 LIMIT 1");
    $dean_stmt->execute();
    $dean_row = $dean_stmt->fetch(PDO::FETCH_ASSOC);
    $dean_name = $dean_row ? trim($dean_row['full_name']) : "No Assigned Dean";

    // 2. Fetch the program_id tied to this specific class schedule row
    $class_stmt = $db->prepare("SELECT program_id FROM schedules WHERE id = :id OR schedule_id = :id_alt LIMIT 1");
    $class_stmt->execute([
        ':id'     => $schedule_id,
        ':id_alt' => $schedule_id
    ]);
    $class_meta = $class_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$class_meta) {
        echo json_encode([
            "status" => "success",
            "signatories" => [
                "chairperson" => "Schedule ID '" . $schedule_id . "' not found",
                "department_head" => "Schedule ID '" . $schedule_id . "' not found",
                "dean" => $dean_name
            ]
        ]);
        exit();
    }

    $class_prog_id = (int)$class_meta['program_id'];

    // 3. Resolve the department_id linked to this specific program row
    $prog_stmt = $db->prepare("SELECT department_id FROM programs WHERE id = :pid LIMIT 1");
    $prog_stmt->execute([':pid' => $class_prog_id]);
    $prog_meta = $prog_stmt->fetch(PDO::FETCH_ASSOC);
    $class_dept_id = $prog_meta ? (int)$prog_meta['department_id'] : 0;

    // 4. FIXED MAPPING ROLES: Strictly matching your exact schema layout string terms
    
    // A. Program Chairperson / personhead (Matches your interchangeable single terms)
    $chair_stmt = $db->prepare("SELECT CONCAT(first_name, ' ', last_name) as full_name 
                                FROM users 
                                WHERE program_id = :pid 
                                  AND (LOWER(role) = 'chairperson' OR LOWER(role) = 'personhead') 
                                  AND is_active = 1 
                                LIMIT 1");
    $chair_stmt->execute([':pid' => $class_prog_id]);
    $chair_row = $chair_stmt->fetch(PDO::FETCH_ASSOC);
    $chairperson_name = $chair_row ? trim($chair_row['full_name']) : "No Assigned Program Chair";

    // B. Department Head (Checks strictly for the distinct 'Department Head' role)
    $dept_head_stmt = $db->prepare("SELECT CONCAT(first_name, ' ', last_name) as full_name 
                                    FROM users 
                                    WHERE department_id = :did 
                                      AND LOWER(role) = 'department head' 
                                      AND is_active = 1 
                                    LIMIT 1");
    $dept_head_stmt->execute([':did' => $class_dept_id]);
    $dept_head_row = $dept_head_stmt->fetch(PDO::FETCH_ASSOC);
    $dept_head_name = $dept_head_row ? trim($dept_head_row['full_name']) : "No Assigned Department Head";

    // 5. Return complete payload
    echo json_encode([
        "status" => "success",
        "signatories" => [
            "chairperson" => $chairperson_name,
            "department_head" => $dept_head_name,
            "dean" => $dean_name
        ]
    ]);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Signatory query error trace: " . $e->getMessage()]);
    exit();
}
