<?php
// api/attainment.php

// 1. Include your database config class (This instantly handles all your custom CORS headers)
require_once __DIR__ . '/../config/database.php';

// 2. Instantiate your Database Class object structure
$database = new Database();
$db = $database->getConnection();

// Double check that our DB interface instance generated successfully 
if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection object unavailable."]);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];

switch($request_method) {
    case 'GET':
        // Safe extraction of query parameters
        $dept = isset($_GET['department_code']) ? $_GET['department_code'] : 'CEIT';
        
        try {
            $query = "SELECT setting_value FROM system_settings 
                      WHERE setting_key = 'target_attainment_percentage' 
                      AND department_code = :dept LIMIT 1";
                      
            $stmt = $db->prepare($query);
            $stmt->bindParam(':dept', $dept);
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch(); // Uses PDO::FETCH_ASSOC automatically based on database.php
                echo json_encode(["status" => "success", "value" => (int)$row['setting_value']]);
            } else {
                // Return default state structural 0 if records do not exist yet
                echo json_encode(["status" => "success", "value" => 0]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database read execution error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Extract incoming content stream from Vite React client requests
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (
            !isset($data['setting_value']) || 
            !isset($data['department_code']) || 
            !isset($data['updated_by_user'])
        ) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing core configuration fields."]);
            break;
        }

        // Apply strict server-side system boundary validation checks
        $val = (int)$data['setting_value'];
        if ($val < 0 || $val > 100) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Attainment parameters must remain within 0-100 limits."]);
            break;
        }

        try {
            // Native MySQL Upsert Strategy utilizing PDO bindings safely
            $query = "INSERT INTO system_settings (setting_key, setting_value, department_code, updated_by_user)
                      VALUES ('target_attainment_percentage', :val, :dept, :user)
                      ON DUPLICATE KEY UPDATE 
                          setting_value = VALUES(setting_value),
                          updated_by_user = VALUES(updated_by_user)";
                          
            $stmt = $db->prepare($query);
            
            $stmt->bindParam(':val', $data['setting_value']);
            $stmt->bindParam(':dept', $data['department_code']);
            $stmt->bindParam(':user', $data['updated_by_user']);
            
            if($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["status" => "success", "message" => "Database updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Statement executed but failed to save system records."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database insertion error: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "HTTP Request Method Not Allowed."]);
        break;
}

