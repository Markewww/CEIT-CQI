<?php
// api/faculty/manage_roster.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($data['is_batch']) && $data['is_batch'] === true) {
        try {
            $db->beginTransaction();
            // INSERT IGNORE silently skips any duplicate rows matching our unique index constraint
            $query = "INSERT IGNORE INTO student_schedules (schedule_id, student_id, full_name) VALUES (:sched_id, :stud_id, :name)";
            $stmt = $db->prepare($query);
            
            $inserted = 0;
            foreach ($data['students'] as $row) {
                if (empty(trim($row['student_id'])) || empty(trim($row['full_name']))) continue;
                
                $stmt->bindValue(':sched_id', trim($data['schedule_id']));
                $stmt->bindValue(':stud_id', trim($row['student_id']));
                $stmt->bindValue(':name', trim($row['full_name']));
                $stmt->execute();
                if ($stmt->rowCount() > 0) $inserted++;
            }
            
            $db->commit();
            echo json_encode(["status" => "success", "message" => "Roster process complete. Imported $inserted non-duplicate rows."]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } else {
        // Manual Single Entry
        try {
            $query = "INSERT INTO student_schedules (schedule_id, student_id, full_name) VALUES (:sched_id, :stud_id, :name)";
            $stmt = $db->prepare($query);
            $stmt->bindValue(':sched_id', trim($data['schedule_id']));
            $stmt->bindValue(':stud_id', trim($data['student_id']));
            $stmt->bindValue(':name', trim($data['full_name']));
            
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Student registered successfully."]);
            }
        } catch (PDOException $e) {
            http_response_code($e->getCode() == 23000 ? 409 : 500);
            echo json_encode(["status" => "error", "message" => $e->getCode() == 23000 ? "This Student ID is already added to this class schedule." : $e->getMessage()]);
        }
    }
}
