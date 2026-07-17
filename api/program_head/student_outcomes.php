<?php
// api/program_head/student_outcomes.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($user_id === 0 && $method === 'GET') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required user_id."]);
    exit();
}

try {
    // 1. Resolve program_id from user context
    $u_stmt = $db->prepare("SELECT program_id FROM users WHERE id = :id AND LOWER(role) = 'program head' AND is_active = 1 LIMIT 1");
    $u_stmt->execute([':id' => $user_id ? $user_id : json_decode(file_get_contents("php://input"), true)['user_id']]);
    $u_meta = $u_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$u_meta || empty($u_meta['program_id'])) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Unauthorized access: Program Head profile not found."]);
        exit();
    }
    $program_id = (int)$u_meta['program_id'];

    // =========================================================================
    // 📍 GET: Fetch All Outcomes Ordered Alphabetically
    // =========================================================================
    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT id, so_letter, so_value FROM student_outcomes WHERE program_id = :pid ORDER BY so_letter ASC");
        $stmt->execute([':pid' => $program_id]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit();
    }

    // =========================================================================
    // 📍 POST: Add or Update (Upsert) Student Outcome details
    // =========================================================================
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $so_letter = strtoupper(trim($data['so_letter']));
        $so_value = trim($data['so_value']);

        if (empty($so_letter) || empty($so_value) || strlen($so_letter) !== 1 || !preg_match("/^[A-Z]$/", $so_letter)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid parameters. Outcome identifier must be a single letter (A-Z)."]);
            exit();
        }

        $stmt = $db->prepare("INSERT INTO student_outcomes (program_id, so_letter, so_value) 
                              VALUES (:pid, :letter, :val) 
                              ON DUPLICATE KEY UPDATE so_value = :update_val");
        $stmt->execute([
            ':pid'        => $program_id,
            ':letter'     => $so_letter,
            ':val'        => $so_value,
            ':update_val' => $so_value
        ]);

        echo json_encode(["status" => "success", "message" => "Student Outcome synchronized successfully."]);
        exit();
    }

    // =========================================================================
    // 📍 DELETE: Remove Student Outcome Row
    // =========================================================================
    if ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)$data['id'];

        $stmt = $db->prepare("DELETE FROM student_outcomes WHERE id = :id AND program_id = :pid");
        $stmt->execute([':id' => $id, ':pid' => $program_id]);

        echo json_encode(["status" => "success", "message" => "Student Outcome deleted cleanly."]);
        exit();
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "API Execution Error: " . $e->getMessage()]);
    exit();
}
