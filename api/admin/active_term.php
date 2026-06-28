<?php
// api/admin/active_term.php

// 1. Include database configuration (Go up two levels out of the admin folder)
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];

switch($request_method) {
    case 'GET':
        try {
            // Pull the latest parameters using the global 'SYSTEM' scope tag
            $query = "SELECT setting_key, setting_value FROM system_settings 
                      WHERE setting_key IN ('active_academic_year', 'active_semester') 
                      AND department_code = 'SYSTEM'";
                      
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $settings = ["academic_year" => "", "semester" => ""];
            while($row = $stmt->fetch()) {
                if ($row['setting_key'] === 'active_academic_year') {
                    $settings['academic_year'] = $row['setting_value'];
                }
                if ($row['setting_key'] === 'active_semester') {
                    $settings['semester'] = $row['setting_value'];
                }
            }
            
            echo json_encode(["status" => "success", "data" => $settings]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database read execution failure: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Extract incoming JSON payload from Vite React form submission
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['academic_year']) || !isset($data['semester']) || !isset($data['updated_by_user'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing required term parameters."]);
            break;
        }

        try {
            // Begin a transaction to ensure BOTH configuration metrics update safely together
            $db->beginTransaction();

            $query = "INSERT INTO system_settings (setting_key, setting_value, department_code, updated_by_user)
                      VALUES (:key, :val, 'SYSTEM', :user)
                      ON DUPLICATE KEY UPDATE 
                          setting_value = VALUES(setting_value), 
                          updated_by_user = VALUES(updated_by_user)";
                      
            $stmt = $db->prepare($query);
            
            // Task 1: Upsert Global Academic Year
            $stmt->bindValue(':key', 'active_academic_year');
            $stmt->bindValue(':val', trim($data['academic_year']));
            $stmt->bindValue(':user', trim($data['updated_by_user']));
            $stmt->execute();

            // Task 2: Upsert Global Semester
            $stmt->bindValue(':key', 'active_semester');
            $stmt->bindValue(':val', trim($data['semester']));
            $stmt->bindValue(':user', trim($data['updated_by_user']));
            $stmt->execute();

            // Commit transaction to database disk
            $db->commit();
            echo json_encode(["status" => "success", "message" => "Global term changes recorded successfully."]);
        } catch (Exception $e) {
            // Revert changes if any single record update throws an error
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Transaction failure. Configurations discarded: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "HTTP Request Method Not Allowed."]);
        break;
}
