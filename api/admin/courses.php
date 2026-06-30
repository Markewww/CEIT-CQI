<?php
// api/admin/courses.php

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
            $query = "SELECT id, code, description FROM courses ORDER BY code ASC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $courses = [];
            while($row = $stmt->fetch()) {
                $courses[] = [
                    "id" => (int)$row['id'],
                    "code" => strtoupper(trim($row['code'])),
                    "description" => trim($row['description'])
                ];
            }
            
            echo json_encode(["status" => "success", "data" => $courses]);
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
