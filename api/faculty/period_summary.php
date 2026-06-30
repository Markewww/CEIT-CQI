<?php
// api/faculty/period_summary.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database offline."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// =========================================================================
// 📍 ROUTE A: GET METRICS — Combined ILO, CO & Action Plan Aggregations
// =========================================================================
if ($method === 'GET') {
    $schedule_id = isset($_GET['schedule_id']) ? trim($_GET['schedule_id']) : '';
    $period = isset($_GET['period']) ? trim($_GET['period']) : '';
    $action = isset($_GET['action']) ? trim($_GET['action']) : 'ilo_summary';

    if (empty($schedule_id) || empty($period)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing core keys."]);
        exit();
    }

    try {
        // --- 1. HANDLE SUB-TAB 3: ACTION PLAN SUMMARY REQUEST LAYER ---
        if ($action === 'action_summary') {
            // Fetch raw entries written by the professor per item number
            $stmt_plans = $db->prepare("SELECT ilo_name, action_plan FROM class_ilo_configs WHERE schedule_id = :id AND period = :period ORDER BY item_number ASC");
            $stmt_plans->execute([':id' => $schedule_id, ':period' => $period]);
            
            // Group and collapse identical text arrays per identical ILO token names
            $collapsed_plans = [];
            while ($p_row = $stmt_plans->fetch(PDO::FETCH_ASSOC)) {
                $ilo = trim($p_row['ilo_name']);
                $plan = trim($p_row['action_plan']);
                if (empty($ilo) || empty($plan)) continue;

                if (!isset($collapsed_plans[$ilo])) $collapsed_plans[$ilo] = [];
                if (!in_array($plan, $collapsed_plans[$ilo])) {
                    $collapsed_plans[$ilo][] = $plan;
                }
            }

            // Fetch custom timelines and comments mapping from our action plan summary table
            $stmt_meta = $db->prepare("SELECT ilo_name, proposed_timeline, comment FROM action_plan_summary WHERE schedule_id = :id AND period = :period");
            $stmt_meta->execute([':id' => $schedule_id, ':period' => $period]);
            $meta_map = [];
            while ($m_row = $stmt_meta->fetch(PDO::FETCH_ASSOC)) {
                $meta_map[trim($m_row['ilo_name'])] = [
                    "proposed_timeline" => $m_row['proposed_timeline'],
                    "comment" => $m_row['comment']
                ];
            }

            $action_report = [];
            foreach ($collapsed_plans as $ilo_name => $text_array) {
                $timeline = isset($meta_map[$ilo_name]) ? $meta_map[$ilo_name]['proposed_timeline'] : "";
                $comment = isset($meta_map[$ilo_name]) ? $meta_map[$ilo_name]['comment'] : "";

                // Seed empty layout rows dynamically if missing from summary persistence
                if (!isset($meta_map[$ilo_name])) {
                    $seed = $db->prepare("INSERT IGNORE INTO action_plan_summary (schedule_id, period, ilo_name) VALUES (:sid, :p, :ilo)");
                    $seed->execute([':sid' => $schedule_id, ':p' => $period, ':ilo' => $ilo_name]);
                }

                $action_report[] = [
                    "ilo_name" => $ilo_name,
                    "action_plan_summary" => implode(", ", $text_array), // Merged text blocks separated by a comma
                    "proposed_timeline" => $timeline,
                    "comment" => $comment
                ];
            }

            // Natural numeric sort order sequencing
            usort($action_report, function($a, $b) { return (int)$a['ilo_name'] - (int)$b['ilo_name']; });
            echo json_encode(["status" => "success", "summary_data" => $action_report]);
            exit();
        }

        // --- STANDARD UNIFIED SECTIONS (ILO & CO Summary GET pipelines continue unchanged below) ---
        $s_stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'attainment_target_percentage' LIMIT 1");
        $s_stmt->execute();
        $setting = $s_stmt->fetch(PDO::FETCH_ASSOC);
        $target_percentage = $setting ? (float)$setting['setting_value'] : 40.0;

        $r_stmt = $db->prepare("SELECT COUNT(*) as roster_total FROM student_schedules WHERE schedule_id = :id");
        $r_stmt->execute([':id' => $schedule_id]);
        $roster_data = $r_stmt->fetch(PDO::FETCH_ASSOC);
        $total_students = $roster_data ? (int)$roster_data['roster_total'] : 0;

        $co_stmt = $db->prepare("SELECT ilo_name, co_name FROM learning_outcome_summary WHERE schedule_id = :id AND period = :period");
        $co_stmt->execute([':id' => $schedule_id, ':period' => $period]);
        $co_map = [];
        while ($co_row = $co_stmt->fetch(PDO::FETCH_ASSOC)) { $co_map[trim($co_row['ilo_name'])] = trim($co_row['co_name']); }

        $i_stmt = $db->prepare("SELECT item_number, ilo_name FROM class_ilo_configs WHERE schedule_id = :id AND period = :period");
        $i_stmt->execute([':id' => $schedule_id, ':period' => $period]);
        $item_ilo_map = $i_stmt->fetchAll(PDO::FETCH_ASSOC);

        $a_stmt = $db->prepare("SELECT corrected_items FROM student_test_analysis WHERE schedule_id = :id AND period = :period");
        $a_stmt->execute([':id' => $schedule_id, ':period' => $period]);
        $all_student_responses = [];
        while ($a_row = $a_stmt->fetch(PDO::FETCH_ASSOC)) {
            $parsed = json_decode($a_row['corrected_items'], true);
            $all_student_responses[] = is_array($parsed) ? $parsed : [];
        }

        $item_scores = [];
        foreach ($item_ilo_map as $item) {
            $num = (int)$item['item_number'];
            $label = trim($item['ilo_name']);
            if (empty($label)) continue;

            $passed_count = 0;
            foreach ($all_student_responses as $resp) { if (in_array($num, $resp)) $passed_count++; }
            $item_percentage = $total_students > 0 ? ($passed_count / $total_students) * 100 : 0;
            
            if (!isset($item_scores[$label])) $item_scores[$label] = [];
            $item_scores[$label][] = $item_percentage;
        }

        $ilo_report = [];
        $co_groups = [];

        foreach ($item_scores as $ilo_name => $percentage_array) {
            $ilo_average = count($percentage_array) > 0 ? array_sum($percentage_array) / count($percentage_array) : 0;
            $mapped_co = isset($co_map[$ilo_name]) ? $co_map[$ilo_name] : "";

            if (!isset($co_map[$ilo_name])) {
                $seed = $db->prepare("INSERT IGNORE INTO learning_outcome_summary (schedule_id, period, ilo_name, co_name) VALUES (:sid, :p, :ilo, '')");
                $seed->execute([':sid' => $schedule_id, ':p' => $period, ':ilo' => $ilo_name]);
            }

            $ilo_report[] = [
                "co_name" => $mapped_co, "ilo_name" => $ilo_name,
                "attainment_score" => round($ilo_average, 2), "attainment_target" => $target_percentage,
                "remarks" => $ilo_average >= $target_percentage ? "ATTAINED" : "NOT ATTAINED"
            ];

            if (!empty($mapped_co)) {
                if (!isset($co_groups[$mapped_co])) $co_groups[$mapped_co] = [];
                $co_groups[$mapped_co][] = $ilo_average;
            }
        }

        if ($action === 'ilo_summary') {
            usort($ilo_report, function($a, $b) { return (int)$a['ilo_name'] - (int)$b['ilo_name']; });
            echo json_encode(["status" => "success", "target_percentage" => $target_percentage, "summary_data" => $ilo_report]);
            exit();
        }

        $co_report = [];
        foreach ($co_groups as $co_num => $ilo_scores_array) {
            $co_average = count($ilo_scores_array) > 0 ? array_sum($ilo_scores_array) / count($ilo_scores_array) : 0;
            $co_report[] = [
                "co_name" => $co_num, "attainment_score" => round($co_average, 2),
                "attainment_target" => $target_percentage, "remarks" => $co_average >= $target_percentage ? "ATTAINED" : "NOT ATTAINED"
            ];
        }

        usort($co_report, function($a, $b) { return (int)$a['co_name'] - (int)$b['co_name']; });
        echo json_encode(["status" => "success", "target_percentage" => $target_percentage, "summary_data" => $co_report]);
        exit();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// =========================================================================
// 📍 ROUTE B: POST MUTATION — Real-time Focus Loss Synchronization Gateway
// =========================================================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['schedule_id']) || !isset($data['period']) || !isset($data['ilo_name'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing core required identifiers keys."]);
        exit();
    }

    $schedule_id = trim($data['schedule_id']);
    $period = trim($data['period']);
    $ilo_name = trim($data['ilo_name']);

    try {
        // CASE 1: Syncing Course Outcome numbers from Sub-Tab 1 (Learning Outcome Summary) [INDEX: 0.1.2]
        if (isset($data['co_name'])) {
            $clean_co = preg_replace('/[^0-9]/', '', $data['co_name']);
            
            $stmt = $db->prepare("INSERT INTO learning_outcome_summary (schedule_id, period, ilo_name, co_name) 
                                  VALUES (:sid, :period, :ilo, :co) 
                                  ON DUPLICATE KEY UPDATE co_name = :update_co");
            
            $stmt->execute([
                ':sid'       => $schedule_id,
                ':period'    => $period,
                ':ilo'       => $ilo_name,
                ':co'        => $clean_co,
                ':update_co' => $clean_co // ◄ Unique update token representation fixed
            ]);
            
            echo json_encode(["status" => "success", "message" => "Course outcome number synced successfully."]);
            exit();
        }

        // CASE 2: Syncing Proposed Timelines/Comments from Sub-Tab 3 (Action Plan Summary) [INDEX: 0.1.2]
        if (isset($data['proposed_timeline']) || isset($data['comment'])) {
            
            // Fetch existing row properties first to prevent accidental empty overwrites
            $check = $db->prepare("SELECT proposed_timeline, comment FROM action_plan_summary WHERE schedule_id = :sid AND period = :period AND ilo_name = :ilo LIMIT 1");
            $check->execute([':sid' => $schedule_id, ':period' => $period, ':ilo' => $ilo_name]);
            $existing = $check->fetch(PDO::FETCH_ASSOC);

            $current_timeline = $existing ? $existing['proposed_timeline'] : "";
            $current_comment = $existing ? $existing['comment'] : "";

            if (isset($data['proposed_timeline'])) $current_timeline = trim($data['proposed_timeline']);
            if (isset($data['comment'])) $current_comment = trim($data['comment']);

            $stmt = $db->prepare("INSERT INTO action_plan_summary (schedule_id, period, ilo_name, proposed_timeline, comment) 
                                  VALUES (:sid, :period, :ilo, :timeline, :comment) 
                                  ON DUPLICATE KEY UPDATE proposed_timeline = :update_timeline, comment = :update_comment");
            
            $stmt->execute([
                ':sid'             => $schedule_id,
                ':period'          => $period,
                ':ilo'             => $ilo_name,
                ':timeline'        => $current_timeline,
                ':comment'         => $current_comment,
                ':update_timeline' => $current_timeline, // ◄ Unique update token representation fixed
                ':update_comment'  => $current_comment   // ◄ Unique update token representation fixed
            ]);

            echo json_encode(["status" => "success", "message" => "Action Plan summary components updated successfully."]);
            exit();
        }

        // Fallback catch if payload parameter structure is unhandled
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Unhandled post parameter mutation attributes."]);
        exit();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database save exception thrown: " . $e->getMessage()]);
        exit();
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "HTTP Method Request Not Allowed."]);
    exit();
}
