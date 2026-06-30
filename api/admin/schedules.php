<?php
// api/admin/schedules.php

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database link unreachable."]);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];

switch($request_method) {
    case 'GET':
        try {
            // CRITICAL: Ensure s.schedule_id is explicitly selected here!
            $query = "SELECT 
                        s.id,
                        s.schedule_id,
                        s.course_id,
                        c.code AS course_code,
                        c.description AS course_description,
                        s.program_id,
                        p.code AS program_code,
                        s.user_id,
                        u.employee_id,
                        u.first_name,
                        u.middle_name,
                        u.last_name,
                        u.suffix,
                        s.academic_year,
                        s.semester,
                        s.year_level,
                        s.section,
                        s.is_active
                      FROM schedules s
                      INNER JOIN courses c ON s.course_id = c.id
                      INNER JOIN programs p ON s.program_id = p.id
                      INNER JOIN users u ON s.user_id = u.id
                      ORDER BY s.academic_year DESC, s.semester DESC, p.code ASC, s.year_level ASC, s.section ASC";
                      
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $schedules = [];
            while($row = $stmt->fetch()) {
                $middle_initial = !empty($row['middle_name']) ? ' ' . substr($row['middle_name'], 0, 1) . '.' : '';
                $suffix_str = !empty($row['suffix']) ? ' ' . $row['suffix'] : '';
                $full_instructor_name = $row['first_name'] . $middle_initial . ' ' . $row['last_name'] . $suffix_str;

                $schedules[] = [
                    "id" => (int)$row['id'],
                    "schedule_id" => isset($row['schedule_id']) ? trim($row['schedule_id']) : "", // ◄ CRITICAL PART MISSING IN YOUR FILE
                    "course_id" => (int)$row['course_id'],
                    "course_code" => strtoupper(trim($row['course_code'])),
                    "course_description" => trim($row['course_description']),
                    "program_id" => (int)$row['program_id'],
                    "program_code" => strtoupper(trim($row['program_code'])),
                    "user_id" => (int)$row['user_id'],
                    "employee_id" => trim($row['employee_id']), 
                    "instructor_name" => trim($full_instructor_name),
                    "academic_year" => trim($row['academic_year']),
                    "semester" => trim($row['semester']),
                    "year_level" => (int)$row['year_level'],
                    "section" => strtoupper(trim($row['section'])),
                    "is_active" => (int)$row['is_active']
                ];
            }
            
            echo json_encode(["status" => "success", "data" => $schedules]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Relational error: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Not Allowed."]);
        break;
}
