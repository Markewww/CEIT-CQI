<?php
// api/admin/users.php

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
            // CRITICAL FIX: Explicitly include all discrete columns needed for the Edit Modal
            $query = "SELECT 
                        id, 
                        employee_id, 
                        first_name, 
                        middle_name, 
                        last_name, 
                        suffix, 
                        email, 
                        contact_number, 
                        department_id, 
                        role, 
                        status, 
                        is_active 
                      FROM users 
                      ORDER BY created_at DESC";
                      
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $users = [];
            while($row = $stmt->fetch()) {
                $middle_initial = !empty($row['middle_name']) ? ' ' . substr($row['middle_name'], 0, 1) . '.' : '';
                $suffix_str = !empty($row['suffix']) ? ' ' . $row['suffix'] : '';
                $full_name = $row['first_name'] . $middle_initial . ' ' . $row['last_name'] . $suffix_str;

                $initials = strtoupper(substr($row['first_name'], 0, 1) . substr($row['last_name'], 0, 1));

                $users[] = [
                    "id" => (int)$row['id'],
                    "employee_id" => $row['employee_id'],
                    "first_name" => $row['first_name'],
                    "middle_name" => $row['middle_name'] ?? '',
                    "last_name" => $row['last_name'],
                    "suffix" => $row['suffix'] ?? '',
                    "full_name" => trim($full_name),
                    "initials" => $initials,
                    "email" => $row['email'] ?? 'No Email Provided',
                    "contact_number" => isset($row['contact_number']) ? trim(str_replace(["\r", "\n", "\t"], "", $row['contact_number'])) : '',  
                    "department_id" => (int)$row['department_id'],
                    "role" => $row['role'],
                    "status" => $row['status'],
                    "is_active" => (int)$row['is_active']
                ];
            }
            
            echo json_encode(["status" => "success", "data" => $users]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database read execution failure: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "HTTP Request Method Not Allowed."]);
        break;
}
