<?php
// api/faculty/overall_summary.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database offline."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit();
}

$schedule_id = isset($_GET['schedule_id']) ? trim($_GET['schedule_id']) : '';

if (empty($schedule_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing schedule identifier."]);
    exit();
}

try {
    // 1. Fetch system target threshold percentage constant
    $s_stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'target_attainment_percentage' LIMIT 1");
    $s_stmt->execute();
    $setting = $s_stmt->fetch(PDO::FETCH_ASSOC);
    $target_percentage = $setting ? (float)$setting['setting_value'] : 40.0;

    // 2. Fetch absolute roster student totals count [INDEX: 1]
    $r_stmt = $db->prepare("SELECT COUNT(*) as roster_total FROM student_schedules WHERE schedule_id = :id");
    $r_stmt->execute([':id' => $schedule_id]);
    $roster_data = $r_stmt->fetch(PDO::FETCH_ASSOC);
    $total_students = $roster_data ? (int)$roster_data['roster_total'] : 0;

    // 3. Fetch item maps and score checkmarks across BOTH periods simultaneously [INDEX: 1]
    $i_stmt = $db->prepare("SELECT period, item_number, ilo_name FROM class_ilo_configs WHERE schedule_id = :id");
    $i_stmt->execute([':id' => $schedule_id]);
    $item_ilo_maps = $i_stmt->fetchAll(PDO::FETCH_ASSOC);

    $a_stmt = $db->prepare("SELECT period, corrected_items FROM student_test_analysis WHERE schedule_id = :id");
    $a_stmt->execute([':id' => $schedule_id]);
    $responses = ['midterms' => [], 'finals' => []];
    while ($row = $a_stmt->fetch(PDO::FETCH_ASSOC)) {
        $parsed = json_decode($row['corrected_items'], true);
        $responses[$row['period']][] = is_array($parsed) ? $parsed : [];
    }

    // Calculate independent item percentages split by period buckets
    $item_scores = ['midterms' => [], 'finals' => []];
    foreach ($item_ilo_maps as $item) {
        $p = $item['period'];
        $num = (int)$item['item_number'];
        $label = trim($item['ilo_name']);
        if (empty($label)) continue;

        $passed = 0;
        foreach ($responses[$p] as $resp) {
            if (in_array($num, $resp)) $passed++;
        }
        $percentage = $total_students > 0 ? ($passed / $total_students) * 100 : 0;
        $item_scores[$p][$label][] = $percentage;
    }

    // 4. Gather direct user-assigned CO maps [INDEX: 1]
    $co_stmt = $db->prepare("SELECT period, ilo_name, co_name FROM learning_outcome_summary WHERE schedule_id = :id");
    $co_stmt->execute([':id' => $schedule_id]);
    $co_maps = ['midterms' => [], 'finals' => []];
    while ($co_row = $co_stmt->fetch(PDO::FETCH_ASSOC)) {
        $co_maps[$co_row['period']][trim($co_row['ilo_name'])] = trim($co_row['co_name']);
    }

    // 5. Gather and blend all calculated period scores structured per target CO number keys [INDEX: 1]
    $co_aggregated_scores = [];

    foreach (['midterms', 'finals'] as $p) {
        foreach ($item_scores[$p] as $ilo_name => $percentage_array) {
            $ilo_average = count($percentage_array) > 0 ? array_sum($percentage_array) / count($percentage_array) : 0;
            $mapped_co = isset($co_maps[$p][$ilo_name]) ? $co_maps[$p][$ilo_name] : "";
            
            if (!empty($mapped_co)) {
                if (!isset($co_aggregated_scores[$mapped_co])) {
                    $co_aggregated_scores[$mapped_co] = [];
                }
                $co_aggregated_scores[$mapped_co][] = $ilo_average;
            }
        }
    }

    // 6. GENERATE FINAL SIMPLIFIED REPORT MATRIX
    $overall_report = [];
    foreach ($co_aggregated_scores as $co_num => $scores_array) {
        // Average of all identical CO numbers combined from both Midterms and Finals [INDEX: 1]
        $co_overall_average = count($scores_array) > 0 ? array_sum($scores_array) / count($scores_array) : 0;

        $overall_report[] = [
            "co_name" => $co_num,
            "attainment_score" => round($co_overall_average, 2),
            "attainment_target" => $target_percentage,
            "remarks" => $co_overall_average >= $target_percentage ? "ATTAINED" : "NOT ATTAINED"
        ];
    }

    // Sort rows sequentially by Course Outcome digits
    usort($overall_report, function($a, $b) { return (int)$a['co_name'] - (int)$b['co_name']; });

    echo json_encode(["status" => "success", "summary_data" => $overall_report]);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
}
