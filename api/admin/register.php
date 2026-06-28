<?php
// api/admin/register.php

// 1. Include database configuration (Go up two levels to find the config directory)
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

// 2. Extract incoming content stream from the Vite React client request
$data = json_decode(file_get_contents("php://input"), true);

// 3. Validation: Verify that required parameters exist
if (
    !isset($data['employee_id']) || 
    !isset($data['first_name']) || 
    !isset($data['last_name']) || 
    !isset($data['department']) || 
    !isset($data['email']) || 
    !isset($data['contact_number']) ||
    !isset($data['password']) ||
    !isset($data['confirm_password']) ||
    !isset($data['role'])
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required user configuration parameters."]);
    exit();
}

// 4. Verify password confirmation match parameters
if ($data['password'] !== $data['confirm_password']) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Password fields do not match."]);
    exit();
}

try {
    // 5. Duplicate Entry Verification Check
    $check_query = "SELECT id FROM users WHERE employee_id = :emp OR email = :email LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindValue(':emp', trim($data['employee_id']));
    $check_stmt->bindValue(':email', trim($data['email']));
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Conflict detected. Employee ID or Email address already registered."]);
        exit();
    }

    // 6. Map text department codes to your table's integer department_id setup
    $dept_map = [
        "DIT"  => 1,
        "DCEA" => 2,
        "DAE"  => 3,
        "DEE"  => 4,
        "DIET" => 5
    ];
    $selected_dept = trim($data['department']);
    $department_id = isset($dept_map[$selected_dept]) ? $dept_map[$selected_dept] : 1;

    // 7. Direct Admin Creation Defaults
    // Because this endpoint is strictly inside the admin directory, accounts bypass the pending state entirely.
    $status = 'Approved';
    $is_active = 1;

    // Extract username prefix from email handle
    $email_parts = explode('@', trim($data['email']));
    $username = $email_parts[0];

    // 8. Compile query with secure password cryptography
    $query = "INSERT INTO users (
                employee_id, username, first_name, middle_name, last_name, suffix, 
                email, contact_number, password_hash, department_id, role, status, is_active
              ) VALUES (
                :employee_id, :username, :first_name, :middle_name, :last_name, :suffix, 
                :email, :contact_number, :password_hash, :department_id, :role, :status, :is_active
              )";
              
    $stmt = $db->prepare($query);
    
    // Encrypt the password using standard modern hashing algorithms
    $hashed_password = password_hash($data['password'], PASSWORD_BCRYPT);

    $stmt->bindValue(':employee_id', trim($data['employee_id']));
    $stmt->bindValue(':username', $username);
    $stmt->bindValue(':first_name', trim($data['first_name']));
    $stmt->bindValue(':middle_name', !empty($data['middle_name']) ? trim($data['middle_name']) : null);
    $stmt->bindValue(':last_name', trim($data['last_name']));
    $stmt->bindValue(':suffix', !empty($data['suffix']) ? trim($data['suffix']) : null);
    $stmt->bindValue(':email', trim($data['email']));
    $stmt->bindValue(':contact_number', trim($data['contact_number']));
    $stmt->bindValue(':password_hash', $hashed_password);
    $stmt->bindValue(':department_id', $department_id, PDO::PARAM_INT);
    $stmt->bindValue(':role', trim($data['role']));
    $stmt->bindValue(':status', $status);
    $stmt->bindValue(':is_active', $is_active, PDO::PARAM_INT);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "status" => "success", 
            "message" => "Account created directly by Admin. Profile activated and approved automatically."
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database write statement failed to execute."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database exception encountered: " . $e->getMessage()]);
}
