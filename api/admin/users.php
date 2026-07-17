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
            // FIXED: Expanded the SELECT script with explicit columns and LEFT JOIN dependencies [INDEX: 1]
            $query = "SELECT 
                        u.id, 
                        u.employee_id, 
                        u.first_name, 
                        u.middle_name, 
                        u.last_name, 
                        u.suffix, 
                        u.email, 
                        u.contact_number, 
                        u.department_id, 
                        u.program_id,
                        u.role, 
                        u.status, 
                        u.is_active,
                        d.code AS department_code,
                        d.name AS department_name,
                        p.code AS program_code,
                        p.name AS program_name
                      FROM users u
                      LEFT JOIN departments d ON u.department_id = d.id
                      LEFT JOIN programs p ON u.program_id = p.id
                      ORDER BY u.created_at DESC";
                      
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
                    "program_id" => $row['program_id'] !== null ? (int)$row['program_id'] : null, // ◄ Passed numeric ID to frontend state [INDEX: 1]
                    "role" => $row['role'],
                    "status" => $row['status'],
                    "is_active" => (int)$row['is_active'],
                    
                    // ◄ INJECTED COMPANION LABELS TEXT FOR CLEAN DISPLAY ON FRONTEND [INDEX: 1]
                    "department_code" => $row['department_code'] ?? '—',
                    "department_name" => $row['department_name'] ?? '',
                    "program_code"    => $row['program_code'] ?? null,
                    "program_name"    => $row['program_name'] ?? null
                ];
            }
            
            // FIXED: Ensure the response json reads the object wrapper matching your React frontend fetch loops
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
