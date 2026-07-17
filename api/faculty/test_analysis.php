<?php
// api/faculty/test_analysis.php

// Pull in database configuration class 
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// =========================================================================
// 📍 ROUTE A: GET METRICS — Fetch Test Configurations and Student Array Marks
// =========================================================================
if ($method === 'GET') {
    $schedule_id = isset($_GET['schedule_id']) ? trim($_GET['schedule_id']) : '';
    $period = isset($_GET['period']) ? trim($_GET['period']) : '';

    if (empty($schedule_id) || empty($period)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing request parameters."]);
        exit();
    }

    try {
        // 1. Fetch total items count configuration boundaries
        $c_stmt = $db->prepare("SELECT total_items FROM class_test_configs WHERE schedule_id = :id AND period = :period LIMIT 1");
        $c_stmt->execute([':id' => $schedule_id, ':period' => $period]);
        $config = $c_stmt->fetch(PDO::FETCH_ASSOC);
        $total_items = $config ? (int)$config['total_items'] : 50;

        // 2. Fetch individual question analysis data rows
        $a_stmt = $db->prepare("SELECT student_id, corrected_items FROM student_test_analysis WHERE schedule_id = :id AND period = :period");
        $a_stmt->execute([':id' => $schedule_id, ':period' => $period]);
        
        $scores = [];
        while ($row = $a_stmt->fetch(PDO::FETCH_ASSOC)) {
            $parsed_items = json_decode($row['corrected_items'], true);
            $scores[$row['student_id']] = is_array($parsed_items) ? $parsed_items : [];
        }

        echo json_encode([
            "status" => "success",
            "total_items" => $total_items,
            "analysis_data" => (object)$scores
        ]);
        exit();
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Read Failure: " . $e->getMessage()]);
        exit();
    }
}

// =========================================================================
// 📍 ROUTE B: POST MUTATION — Handle Independent Param Updates Securely
// =========================================================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['schedule_id']) || !isset($data['period'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing tracking identifiers."]);
        exit();
    }

    $schedule_id = trim($data['schedule_id']);
    $period = trim($data['period']);

    // =========================================================================
    // CASE 1: Updating overall test limits AND auto-generating ILO config placeholders
    // =========================================================================
    if (isset($data['total_items'])) {
        try {
            $total_items = (int)$data['total_items'];
            
            $db->beginTransaction();

            // 1. Save or modify main item boundaries count
            $u_conf = $db->prepare("INSERT INTO class_test_configs (schedule_id, period, total_items)  
                                    VALUES (:schedule_id, :period, :total_items)
                                    ON DUPLICATE KEY UPDATE total_items = :update_total_items");
            
            $u_conf->execute([
                ':schedule_id'        => $schedule_id,
                ':period'             => $period,
                ':total_items'        => $total_items,
                ':update_total_items' => $total_items 
            ]);

            // 2. 📍 AUTOMATED SYNC: Pre-seed empty rows inside class_ilo_configs dynamically!
            // INSERT IGNORE ensures that if row items already have customized data, they are untouched.
            $ilo_seed_query = "INSERT IGNORE INTO class_ilo_configs (schedule_id, period, item_number, ilo_name, action_plan) 
                               VALUES (:schedule_id, :period, :item_number, '', '')";
            $ilo_seed_stmt = $db->prepare($ilo_seed_query);

            for ($i = 1; $i <= $total_items; $i++) {
                $ilo_seed_stmt->execute([
                    ':schedule_id' => $schedule_id,
                    ':period'      => $period,
                    ':item_number' => $i
                ]);
            }

            $db->commit();
            
            echo json_encode(["status" => "success", "message" => "Grid items count and learning outcome records synchronized automatically."]);
            exit();
        } catch (PDOException $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Automated Sync Error: " . $e->getMessage()]);
            exit();
        }
    }

    // =========================================================================
    // CASE 2: Updating an isolated cell checkbox checkmark index for a student
    // =========================================================================
    if (isset($data['student_id']) && isset($data['corrected_items'])) {
        try {
            $student_id = trim($data['student_id']);
            $json_items = json_encode($data['corrected_items']);
            
            $u_score = $db->prepare("INSERT INTO student_test_analysis (schedule_id, period, student_id, corrected_items) 
                                     VALUES (:schedule_id, :period, :student_id, :corrected_items) 
                                     ON DUPLICATE KEY UPDATE corrected_items = :update_corrected_items");
            
            $u_score->execute([
                ':schedule_id'            => $schedule_id,
                ':period'                 => $period,
                ':student_id'             => $student_id,
                ':corrected_items'        => $json_items,
                ':update_corrected_items' => $json_items
            ]);
            
            echo json_encode(["status" => "success", "message" => "Student checkboxes saved successfully."]);
            exit();
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Cell Save Error: " . $e->getMessage()]);
            exit();
        }
    }

    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Unhandled payload parameter structure state."]);
    exit();
}
