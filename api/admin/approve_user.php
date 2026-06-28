<?php
// api/admin/approve_user.php

// 1. Include database configuration (fires automated global CORS configs instantly)
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

// 3. Validation: Check if user_id is present
if (!isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required user ID parameter."]);
    exit();
}

try {
    // 4. Update query execution: Change status to Approved and force account activation
    $query = "UPDATE users 
              SET status = 'Approved', is_active = 1 
              WHERE id = :user_id";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        // Double-check if a row was actually changed (e.g., in case an invalid ID was passed)
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "User account approved and activated successfully."]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Account not found or registration properties already modified."]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Statement executed but failed to update user registration records."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database execution engine error: " . $e->getMessage()]);
}
