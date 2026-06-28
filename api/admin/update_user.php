<?php
// api/admin/update_user.php

// 1. Include the database config class (Handles custom global CORS origins automatically)
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];

if ($request_method !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "HTTP Request Method Not Allowed."]);
    exit();
}

// 2. Read the raw incoming JSON stream sent from your React modal
$data = json_decode(file_get_contents("php://input"), true);

// 3. Validation: Verify that crucial user descriptors exist
if (
    !isset($data['id']) || 
    !isset($data['employee_id']) || 
    !isset($data['first_name']) || 
    !isset($data['last_name']) || 
    !isset($data['email']) || 
    !isset($data['contact_number']) ||
    !isset($data['department_id']) ||
    !isset($data['role']) ||
    !isset($data['status']) ||
    !isset($data['is_active'])
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required user profile fields."]);
    exit();
}

try {
    // 4. Dynamic query compilation based on password criteria
    // If the password string is blank, we skip altering password_hash fields entirely
    $password_changed = !empty(trim($data['password']));
    
    $query = "UPDATE users SET 
                employee_id = :employee_id,
                first_name = :first_name,
                middle_name = :middle_name,
                last_name = :last_name,
                suffix = :suffix,
                email = :email,
                contact_number = :contact_number,
                department_id = :department_id,
                role = :role,
                status = :status,
                is_active = :is_active";
                
    if ($password_changed) {
        $query .= ", password_hash = :password_hash";
    }
    
    $query .= " WHERE id = :id";
    
    // 5. Prepare PDO parameter bindings safely against injections
    $stmt = $db->prepare($query);
    
    $stmt->bindValue(':employee_id', trim($data['employee_id']));
    $stmt->bindValue(':first_name', trim($data['first_name']));
    $stmt->bindValue(':middle_name', !empty($data['middle_name']) ? trim($data['middle_name']) : null, PDO::PARAM_STR);
    $stmt->bindValue(':last_name', trim($data['last_name']));
    $stmt->bindValue(':suffix', !empty($data['suffix']) ? trim($data['suffix']) : null, PDO::PARAM_STR);
    $stmt->bindValue(':email', trim($data['email']));
    $stmt->bindValue(':contact_number', trim($data['contact_number']));
    $stmt->bindValue(':department_id', (int)$data['department_id'], PDO::PARAM_INT);
    $stmt->bindValue(':role', $data['role']);
    $stmt->bindValue(':status', $data['status']);
    $stmt->bindValue(':is_active', (int)$data['is_active'], PDO::PARAM_INT);
    $stmt->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);
    
    if ($password_changed) {
        // Secure cryptography fallback for modern system accounts
        $hashed_password = password_hash($data['password'], PASSWORD_BCRYPT);
        $stmt->bindValue(':password_hash', $hashed_password);
    }
    
    // 6. Execute statement and return structural outcome to Vite React
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Account changes recorded successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to update profile values inside database structure."]);
    }

} catch (PDOException $e) {
    // Elegant error response handling unique keys (e.g. email or employee ID overlaps)
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Conflict detected. Employee ID or Email belongs to another user."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database engine failure: " . $e->getMessage()]);
    }
}
