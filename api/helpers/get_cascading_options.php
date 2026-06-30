<?php
// api/helpers/get_cascading_options.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

try {
    // If a department_id is passed in the URL line, grab its programs immediately! [INDEX: 1]
    if (isset($_GET['department_id']) && !empty(trim($_GET['department_id']))) {
        $dept_id = (int)$_GET['department_id'];
        
        // FIXED: Querying 'name' instead of 'description' [INDEX: 1]
        $stmt = $db->prepare("SELECT id, code, name FROM programs WHERE department_id = :dept_id ORDER BY code ASC");
        $stmt->execute([':dept_id' => $dept_id]);
        $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "status" => "success", 
            "programs" => $programs
        ]);
        exit();
    }

    // Baseline Fallback: If no department id is specified, return all departments list
    $stmt = $db->query("SELECT id, code, description FROM departments ORDER BY code ASC");
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success", 
        "departments" => $departments
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "SQL Cascading Error: " . $e->getMessage()]);
}
