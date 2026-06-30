<?php
// api/admin/departments.php

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection engine offline."]);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];

switch($request_method) {
    case 'GET':
        try {
            // MATCHED EXPLICITLY: Using d.code and d.name as per your schema layout
            $query = "SELECT 
                        d.id, 
                        d.code, 
                        d.name,
                        (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) as user_count
                      FROM departments d
                      ORDER BY d.code ASC";
                      
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $departments = [];
            while($row = $stmt->fetch()) {
                $departments[] = [
                    "id" => (int)$row['id'],
                    "code" => strtoupper(trim($row['code'])), // Maps directly to your code field
                    "name" => trim($row['name']),             // Maps directly to your name field
                    "user_count" => (int)$row['user_count']
                ];
            }
            
            echo json_encode(["status" => "success", "data" => $departments]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database exception thrown: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "HTTP Request Method Not Allowed."]);
        break;
}
