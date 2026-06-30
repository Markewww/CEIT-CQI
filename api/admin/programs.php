<?php
// api/admin/programs.php

// 1. Include core database config class (Handles automated custom CORS headers instantly)
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection link unreachable."]);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];

switch($request_method) {
    case 'GET':
        try {
            // 2. EXPLICIT INNER JOIN: Grab program keys and attach matched department codes seamlessly
            $query = "SELECT 
                        p.id, 
                        p.code, 
                        p.name, 
                        p.department_id, 
                        d.code AS department_code 
                      FROM programs p
                      INNER JOIN departments d ON p.department_id = d.id
                      ORDER BY d.code ASC, p.code ASC";
                      
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $programs = [];
            while($row = $stmt->fetch()) {
                $programs[] = [
                    "id" => (int)$row['id'],
                    "code" => strtoupper(trim($row['code'])),           // Degree code indicator (e.g., BSIT)
                    "name" => trim($row['name']),                       // Full program description title
                    "department_id" => (int)$row['department_id'],     // Relational mapping anchor integer
                    "department_code" => strtoupper(trim($row['department_code'])) // Attached text label via JOIN (e.g., DIT)
                ];
            }
            
            // 3. Output structural data collection to Vite React client application layout matrix
            echo json_encode(["status" => "success", "data" => $programs]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Relational query engine error: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "HTTP Request Method Not Allowed."]);
        break;
}
