<?php
require_once __DIR__ . '/config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "HTTP Method not allowed. Please use POST."
    ]);
    exit();
}

$json_payload = file_get_contents("php://input");
$request_data = json_decode($json_payload, true);

$employee_id     = isset($request_data['employee_id']) ? trim($request_data['employee_id']) : null;
$first_name      = isset($request_data['first_name']) ? trim($request_data['first_name']) : null;
$middle_name     = isset($request_data['middle_name']) ? trim($request_data['middle_name']) : null;
$last_name       = isset($request_data['last_name']) ? trim($request_data['last_name']) : null;
$suffix          = isset($request_data['suffix']) ? trim($request_data['suffix']) : null;
$department_code = isset($request_data['department']) ? trim($request_data['department']) : null; // e.g., 'DIT'
$email           = isset($request_data['email']) ? trim($request_data['email']) : null;
$contact_number  = isset($request_data['contact_number']) ? trim($request_data['contact_number']) : null;
$password        = isset($request_data['password']) ? $request_data['password'] : null;
$confirm_password = isset($request_data['confirm_password']) ? $request_data['confirm_password'] : null;

if (!$employee_id || !$first_name || !$last_name || !$department_code || !$email || !$contact_number || !$password) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Mandatory form processing fields are missing or incomplete."
    ]);
    exit();
}

if ($password !== $confirm_password) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Security Mismatch: Passwords do not match."
    ]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $check_query = "SELECT id FROM users WHERE employee_id = :emp_id OR email = :email LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":emp_id", $employee_id);
    $check_stmt->bindParam(":email", $email);
    $check_stmt->execute();
    
    if ($check_stmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "message" => "An account with this Employee ID or Email address already exists inside the CEIT records."
        ]);
        exit();
    }

    $dept_query = "SELECT id FROM departments WHERE code = :code LIMIT 1";
    $dept_stmt = $db->prepare($dept_query);
    $dept_stmt->bindParam(":code", $department_code);
    $dept_stmt->execute();
    $dept_row = $dept_stmt->fetch();

    if (!$dept_row) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Selected CEIT department identifier code was unrecognized."
        ]);
        exit();
    }
    $department_id = (int)$dept_row['id'];

    $password_hash = password_hash($password, PASSWORD_BCRYPT, ["cost" => 12]);

    $insert_query = "INSERT INTO users (
                        employee_id, first_name, middle_name, last_name, suffix, 
                        email, contact_number, password_hash, department_id, 
                        role, status, is_active
                    ) VALUES (
                        :employee_id, :first_name, :middle_name, :last_name, :suffix, 
                        :email, :contact_number, :password_hash, :department_id, 
                        'Faculty', 'Pending', 1
                    )";

    $insert_stmt = $db->prepare($insert_query);
    $insert_stmt->bindParam(":employee_id", $employee_id);
    $insert_stmt->bindParam(":first_name", $first_name);
    $m_name = !empty($middle_name) ? $middle_name : null;
    $s_fix = !empty($suffix) ? $suffix : null;
    $insert_stmt->bindParam(":middle_name", $m_name);
    $insert_stmt->bindParam(":last_name", $last_name);
    $insert_stmt->bindParam(":suffix", $s_fix);
    $insert_stmt->bindParam(":email", $email);
    $insert_stmt->bindParam(":contact_number", $contact_number);
    $insert_stmt->bindParam(":password_hash", $password_hash);
    $insert_stmt->bindParam(":department_id", $department_id, PDO::PARAM_INT);

    if ($insert_stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Registration successful! Your account is now pending administrative verification review."
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Failed to write user data record into system tables."
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database Transaction Error: " . $e->getMessage()
    ]);
}
