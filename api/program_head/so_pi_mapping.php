<?php
// api/program_head/so_pi_mapping.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

try {
        // =========================================================================
        // 📍 GET ROUTE: Fetch Mapped Summary Data Rows + Selectable Options
        // =========================================================================
        if ($method === 'GET') {
            $schedule_id = isset($_GET['schedule_id']) ? trim($_GET['schedule_id']) : '';

            if (empty($schedule_id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Missing required schedule_id parameter."]);
                exit();
            }

            // 1. Fetch available SO dropdown list options
            $prog_stmt = $db->prepare("SELECT program_id FROM schedules WHERE schedule_id = :sid LIMIT 1");
            $prog_stmt->execute([':sid' => $schedule_id]);
            $prog_row = $prog_stmt->fetch(PDO::FETCH_ASSOC);
            $program_id = $prog_row ? (int)$prog_row['program_id'] : 0;

            $so_stmt = $db->prepare("SELECT id, so_letter, so_value FROM student_outcomes WHERE program_id = :pid ORDER BY so_letter ASC");
            $so_stmt->execute([':pid' => $program_id]);
            $available_so = $so_stmt->fetchAll(PDO::FETCH_ASSOC);

            // 2. FIXED STRICT LOOKUP: Query strictly from your exact 'learning_outcome_summary' table [INDEX: 1]
            // This eliminates any accidental placeholders or stray Q-items from class_ilo_configs [INDEX: 1]
            $co_stmt = $db->prepare("
                SELECT DISTINCT co_name as co_id 
                FROM learning_outcome_summary 
                WHERE schedule_id = :sid AND co_name IS NOT NULL AND co_name != '' 
                ORDER BY co_name ASC
            ");
            $co_stmt->execute([':sid' => $schedule_id]);
            $available_cos = $co_stmt->fetchAll(PDO::FETCH_ASSOC);

            // 3. Fetch existing mappings
            $m_stmt = $db->prepare("SELECT m.id, m.co_id, m.performance_indicator, m.attainment_score, o.so_letter, o.so_value 
                                    FROM course_so_pi_mapping m
                                    INNER JOIN student_outcomes o ON m.so_id = o.id
                                    WHERE m.schedule_id = :sid
                                    ORDER BY m.co_id ASC, o.so_letter ASC");
            $m_stmt->execute([':sid' => $schedule_id]);
            $grid_rows = $m_stmt->fetchAll(PDO::FETCH_ASSOC);

            // 4. Resolve global admin baseline threshold value
            $s_stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'attainment_target_percentage' LIMIT 1");
            $s_stmt->execute();
            $setting = $s_stmt->fetch(PDO::FETCH_ASSOC);
            $admin_target = $setting ? (float)$setting['setting_value'] : 40.0;

            $grid_matrix = [];
            foreach ($grid_rows as $row) {
                $grid_matrix[] = [
                    "id" => (int)$row['id'],
                    "co_id" => $row['co_id'],
                    "performance_indicator" => $row['performance_indicator'],
                    "so_letter" => $row['so_letter'],
                    "so_value" => $row['so_value'],
                    "attainment_score" => (float)$row['attainment_score'],
                    "attainment_target" => $admin_target
                ];
            }

            echo json_encode([
                "status" => "success",
                "available_outcomes" => $available_so,
                "available_course_outcomes" => $available_cos, // ◄ Now perfectly restricted to CO 1, 2, 3!
                "data" => $grid_matrix
            ]);
            exit();
        }

    // =========================================================================
    // 📍 POST ROUTE: Append New Mapping Entry Row with Synchronized Attainment Math
    // =========================================================================
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $schedule_id = trim($data['schedule_id']);
        $co_id = trim($data['co_id']); // This represents your co_name string target (e.g. 'CO 1', 'CO 2')
        $pi = number_format((float)$data['performance_indicator'], 2, '.', ''); 
        $so_id = (int)$data['so_id'];

        if (empty($co_id) || empty($pi) || $so_id === 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Please complete all fields before appending rows."]);
            exit();
        }

        try {
            // 1. REPLICATE STEP 2 FROM OVERALL_SUMMARY: Fetch absolute student total counts [INDEX: 1]
            $r_stmt = $db->prepare("SELECT COUNT(*) as roster_total FROM student_schedules WHERE schedule_id = :id");
            $r_stmt->execute([':id' => $schedule_id]);
            $roster_data = $r_stmt->fetch(PDO::FETCH_ASSOC);
            $total_students = $roster_data ? (int)$roster_data['roster_total'] : 0;

            // 2. REPLICATE STEP 3 FROM OVERALL_SUMMARY: Fetch items maps and student checkmark check banks [INDEX: 1]
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

            // Calculate independent item score percentages split into period buckets [INDEX: 1]
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

            // 3. REPLICATE STEP 4 FROM OVERALL_SUMMARY: Gather course outcome data mappings [INDEX: 1]
            $co_stmt = $db->prepare("SELECT period, ilo_name, co_name FROM learning_outcome_summary WHERE schedule_id = :id");
            $co_stmt->execute([':id' => $schedule_id]);
            $co_maps = ['midterms' => [], 'finals' => []];
            while ($co_row = $co_stmt->fetch(PDO::FETCH_ASSOC)) {
                $co_maps[$co_row['period']][trim($co_row['ilo_name'])] = trim($co_row['co_name']);
            }

            // 4. REPLICATE STEP 5 FROM OVERALL_SUMMARY: Blend all calculations together [INDEX: 1]
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

            // Extract the precise matching compiled score value [INDEX: 1]
            $faculty_compiled_score = 0.00;
            if (isset($co_aggregated_scores[$co_id])) {
                $scores_array = $co_aggregated_scores[$co_id];
                $co_overall_average = count($scores_array) > 0 ? array_sum($scores_array) / count($scores_array) : 0;
                $faculty_compiled_score = round($co_overall_average, 2);
            }

            // 5. Insert rows using the identical synchronized score percentage value [INDEX: 1]
            $stmt = $db->prepare("INSERT INTO course_so_pi_mapping (schedule_id, co_id, performance_indicator, so_id, attainment_score) 
                                  VALUES (:sid, :co, :pi, :so, :score)");
            $stmt->execute([
                ':sid'   => $schedule_id,
                ':co'    => $co_id,
                ':pi'    => $pi,
                ':so'    => $so_id,
                ':score' => $faculty_compiled_score
            ]);

            echo json_encode(["status" => "success", "message" => "Mapping record synchronized perfectly with faculty summary math!"]);
            exit();

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Math synchronization error: " . $e->getMessage()]);
            exit();
        }
    }

    // =========================================================================
    // 📍 DELETE ROUTE: Drop Mapping Record Row
    // =========================================================================
    if ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        $row_id = (int)$data['id'];

        $stmt = $db->prepare("DELETE FROM course_so_pi_mapping WHERE id = :id");
        $stmt->execute([':id' => $row_id]);

        echo json_encode(["status" => "success", "message" => "Mapping record removed."]);
        exit();
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "SQL Failure: " . $e->getMessage()]);
    exit();
}
