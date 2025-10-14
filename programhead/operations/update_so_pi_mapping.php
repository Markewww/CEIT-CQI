<?php
include '../../database/dbconn.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$field = $_POST['field'] ?? '';
$value = $_POST['value'] ?? '';

// Validate allowed fields
$allowed_fields = ['pi', 'so'];
if (!in_array($field, $allowed_fields)) {
    echo json_encode(['success' => false, 'error' => 'Invalid field.']);
    exit;
}

if ($field === 'pi') {
    $value = intval($value);
    $update_stmt = $conn->prepare("UPDATE so_pi_mapping SET pi = ? WHERE id = ?");
    $update_stmt->bind_param("ii", $value, $id);

} elseif ($field === 'so') {
    $value = trim($value);

    // ✅ Optional validation: ensure SO exists in so_mapping
    $check_so = $conn->prepare("SELECT 1 FROM so_mapping WHERE so = ?");
    $check_so->bind_param("s", $value);
    $check_so->execute();
    $result = $check_so->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid SO value.']);
        exit;
    }

    $update_stmt = $conn->prepare("UPDATE so_pi_mapping SET so = ? WHERE id = ?");
    $update_stmt->bind_param("si", $value, $id);
}

if ($update_stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Update failed.']);
}