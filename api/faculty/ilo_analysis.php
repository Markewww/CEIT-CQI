<?php
// api/faculty/ilo_analysis.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database unreachable."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// =========================================================================
// 📍 ROUTE A: GET METRICS — Combined Fetch and Real-time Math Loop
// =========================================================================
if ($method === 'GET') {
    $schedule_id = isset($_GET['schedule_id']) ? trim($_GET['schedule_id']) : '';
    $period = isset($_GET['period']) ? trim($_GET['period']) : '';

    if (empty($schedule_id) || empty($period)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing core keys."]);
        exit();
    }

    try {
        // 1. Fetch system attainment target percentage threshold [INDEX: 0.1.6]
        $s_stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'attainment_target_percentage' LIMIT 1");
        $s_stmt->execute();
        $setting = $s_stmt->fetch(PDO::FETCH_ASSOC);
        $target_percentage = $setting ? (float)$setting['setting_value'] : 40.0;

        // 2. Query total items configured for this specific test grid [INDEX: 0.1.6]
        $c_stmt = $db->prepare("SELECT total_items FROM class_test_configs WHERE schedule_id = :id AND period = :period LIMIT 1");
        $c_stmt->execute([':id' => $schedule_id, ':period' => $period]);
        $config = $c_stmt->fetch(PDO::FETCH_ASSOC);
        $total_items = $config ? (int)$config['total_items'] : 10;

        // 3. Fetch the absolute total number of students enrolled from the actual class roster table [INDEX: 0.1.6]
        $r_stmt = $db->prepare("SELECT COUNT(*) as roster_total FROM student_schedules WHERE schedule_id = :id");
        $r_stmt->execute([':id' => $schedule_id]);
        $roster_data = $r_stmt->fetch(PDO::FETCH_ASSOC);
        $total_students = $roster_data ? (int)$roster_data['roster_total'] : 0;

        // 4. Fetch any existing user-edited ILO mappings and Action Plans [INDEX: 0.1.7]
        $i_stmt = $db->prepare("SELECT item_number, ilo_name, action_plan FROM class_ilo_configs WHERE schedule_id = :id AND period = :period");
        $i_stmt->execute([':id' => $schedule_id, ':period' => $period]);
        $saved_configs = [];
        while ($i_row = $i_stmt->fetch(PDO::FETCH_ASSOC)) {
            $saved_configs[(int)$i_row['item_number']] = [
                "ilo_name" => $i_row['ilo_name'],
                "action_plan" => $i_row['action_plan']
            ];
        }

        // 5. Fetch raw student score response checkbox arrays [INDEX: 0.1.7]
        $a_stmt = $db->prepare("SELECT corrected_items FROM student_test_analysis WHERE schedule_id = :id AND period = :period");
        $a_stmt->execute([':id' => $schedule_id, ':period' => $period]);
        $all_student_responses = [];
        while ($a_row = $a_stmt->fetch(PDO::FETCH_ASSOC)) {
            $parsed = json_decode($a_row['corrected_items'], true);
            $all_student_responses[] = is_array($parsed) ? $parsed : [];
        }

        $computed_report = [];

        // 6. Loop matching total grid item counts [INDEX: 0.1.7]
        for ($i = 1; $i <= $total_items; $i++) {
            $passed_for_this_item = 0;

            foreach ($all_student_responses as $response_array) {
                if (in_array($i, $response_array)) {
                    $passed_for_this_item++;
                }
            }

            // Attainment Score calculated against the entire active roster total [INDEX: 0.1.7]
            $attainment_score = $total_students > 0 ? round(($passed_for_this_item / $total_students) * 100, 2) : 0;

            $user_ilo = isset($saved_configs[$i]) ? $saved_configs[$i]['ilo_name'] : "";
            $user_plan = isset($saved_configs[$i]) ? $saved_configs[$i]['action_plan'] : "";

            $computed_report[] = [
                "ilo_name" => $user_ilo,
                "item_number" => $i,
                "num_passed" => $passed_for_this_item,
                "total_students" => $total_students,
                "attainment_score" => $attainment_score,
                "attainment_target" => $target_percentage,
                "remarks" => $attainment_score >= $target_percentage ? "ATTAINED" : "NOT ATTAINED",
                "action_plan" => $user_plan
            ];
        }

        echo json_encode([
            "status" => "success",
            "target_percentage" => $target_percentage,
            "report_data" => $computed_report
        ]);
        exit();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit();
    }
}

// =========================================================================
// 📍 ROUTE B: POST MUTATION — Real-time Blur Field Cells Modification [INDEX: 0.1.8]
// =========================================================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['schedule_id']) || !isset($data['period']) || !isset($data['item_number'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Incomplete request keys."]);
        exit();
    }

    $schedule_id = trim($data['schedule_id']);
    $period = trim($data['period']);
    $item_number = (int)$data['item_number'];

    try {
        // Extract existing row attributes to prevent overwriting companion column values [INDEX: 0.1.9]
        $check = $db->prepare("SELECT ilo_name, action_plan FROM class_ilo_configs WHERE schedule_id = :sid AND period = :period AND item_number = :num LIMIT 1");
        $check->execute([':sid' => $schedule_id, ':period' => $period, ':num' => $item_number]);
        $existing = $check->fetch(PDO::FETCH_ASSOC);

        $current_ilo = $existing ? $existing['ilo_name'] : "";
        $current_plan = $existing ? $existing['action_plan'] : "";

        // Overwrite only the parameter that was altered on focus loss [INDEX: 0.1.9]
        if (isset($data['ilo_name'])) {
            $current_ilo = trim($data['ilo_name']);
        }
        if (isset($data['action_plan'])) {
            $current_plan = trim($data['action_plan']);
        }

        // FIXED: Assigned completely unique named tokens for the UPDATE clause to respect strict PDO rules [INDEX: 0.1.9]
        $stmt = $db->prepare("INSERT INTO class_ilo_configs (schedule_id, period, item_number, ilo_name, action_plan) 
                              VALUES (:sid, :period, :num, :ilo, :plan) 
                              ON DUPLICATE KEY UPDATE ilo_name = :update_ilo, action_plan = :update_plan");
        
        $stmt->execute([
            ':sid'         => $schedule_id,
            ':period'      => $period,
            ':num'         => $item_number,
            ':ilo'         => $current_ilo,
            ':plan'        => $current_plan,
            ':update_ilo'  => $current_ilo,  // ◄ Unique token representation fixed
            ':update_plan' => $current_plan  // ◄ Unique token representation fixed
        ]);

        echo json_encode(["status" => "success", "message" => "Cell parameters synced."]);
        exit();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Mutation exception: " . $e->getMessage()]);
        exit();
    }
}
