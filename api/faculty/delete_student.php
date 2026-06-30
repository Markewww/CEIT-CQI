<?php
// api/faculty/delete_student.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "HTTP Method Not Allowed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['schedule_id']) || !isset($data['student_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required target keys to process deletion."]);
    exit();
}

$schedule_id = trim($data['schedule_id']);
$student_id  = trim($data['student_id']);

try {
    // Start transaction to execute multiple operations safely
    $db->beginTransaction();

    // 1. Remove the student entry row from your class roster table
    $query1 = "DELETE FROM student_schedules WHERE schedule_id = :sched_id AND student_id = :stud_id";
    $stmt1 = $db->prepare($query1);
    $stmt1->bindParam(':sched_id', $schedule_id, PDO::PARAM_STR);
    $stmt1->bindParam(':stud_id', $student_id, PDO::PARAM_STR);
    $stmt1->execute();

    // 2. NEW: Wipe out their checked test response record cells to clean up item scores calculations
    $query2 = "DELETE FROM student_test_analysis WHERE schedule_id = :sched_id AND student_id = :stud_id";
    $stmt2 = $db->prepare($query2);
    $stmt2->bindParam(':sched_id', $schedule_id, PDO::PARAM_STR);
    $stmt2->bindParam(':stud_id', $student_id, PDO::PARAM_STR);
    $stmt2->execute();

    // Save changes to disk permanently
    $db->commit();
    
    echo json_encode(["status" => "success", "message" => "Student removed from roster and score registries successfully."]);

} catch (PDOException $e) {
    // Discard all operations if either query fails to prevent data corruption
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database exception thrown: " . $e->getMessage()]);
}
