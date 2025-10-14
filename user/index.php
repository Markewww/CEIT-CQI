<?php
include '../database/dbconn.php';
session_start();

// Check if the user is logged in as a Faculty or Program Head
if (!isset($_SESSION['usertype']) || !in_array($_SESSION['usertype'], ['Faculty', 'Programhead'])) {
    error_log("Access denied - Session usertype: " . ($_SESSION['usertype'] ?? 'none'));
    header("Location: ../index.php?error=unauthorized");
    exit();
}

$user = $_SESSION['userID'];

// Get active semester and academic year
$activeFile = "../data/active_semester_year.txt";
function getActiveSemesterAndYearFromFile($filePath) {
    if (file_exists($filePath)) {
        $content = file_get_contents($filePath);
        if ($content) {
            return json_decode($content, true);
        }
    }
    return ["semester" => "1", "academic_year" => date('Y') . "-" . (date('Y') + 1)];
}
$activeSchedule = getActiveSemesterAndYearFromFile($activeFile);

// Handle semester/year filtering
$isFiltered = isset($_GET['filter']); // detect if user clicked "Filter"
$selectedSemester = $_GET['semester'] ?? '';
$selectedYear = $_GET['academic_year'] ?? '';

$scheds = [];

if ($isFiltered && $selectedSemester && $selectedYear) {
    $stmt = $conn->prepare("SELECT * FROM schedule WHERE userID = ? AND semester = ? AND academic_year = ?");
    $stmt->bind_param('iss', $user, $selectedSemester, $selectedYear);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $scheds[] = $row;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Dashboard - Schedules</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js"></script>
    <link rel="stylesheet" href="assets/css/index.css">
    <link rel="stylesheet" href="cqi/css/bootstrap.css">
</head>
<body>
    <?php include './includes/navbar.php'; ?>
    <div class="d-flex">
        <?php include './includes/sidebar.php'; ?>
        <div id="mainContent" class="container p-4">
            <div class="table-container">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h1 class="fw-bold text-success">
                        Schedules
                        <small class="text-muted fs-5">
                            — Active: <?= htmlspecialchars($activeSchedule['academic_year']); ?> 
                            (<?= $activeSchedule['semester'] == '1' ? '1st Sem' : ($activeSchedule['semester'] == '2' ? '2nd Sem' : 'Summer'); ?>)
                        </small>
                    </h1>
                </div>

                <!-- Semester and Academic Year Filter -->
                <form method="GET" class="row g-3 mb-4">
                    <div class="col-md-4">
                        <label for="academic_year" class="form-label">Academic Year</label>
                        <select id="academic_year" name="academic_year" class="form-select" required>
                            <option value="" disabled <?= $selectedYear == '' ? 'selected' : '' ?>>Select Academic Year</option>
                            <?php
                                $currentYear = date('Y');
                                $previousYear = $currentYear - 1;
                                $endYear = $currentYear + 5;
                                for ($year = $previousYear; $year <= $endYear; $year++) {
                                    $nextYear = $year + 1;
                                    $value = "$year-$nextYear";
                                    echo "<option value='$value' " . ($selectedYear == $value ? 'selected' : '') . ">$value</option>";
                                }
                            ?>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="semester" class="form-label">Semester</label>
                        <select id="semester" name="semester" class="form-select" required>
                            <option value="" disabled <?= $selectedSemester == '' ? 'selected' : '' ?>>Select Semester</option>
                            <option value="1" <?= $selectedSemester == '1' ? 'selected' : '' ?>>1st</option>
                            <option value="2" <?= $selectedSemester == '2' ? 'selected' : '' ?>>2nd</option>
                            <option value="Summer" <?= $selectedSemester == 'Summer' ? 'selected' : '' ?>>Summer</option>
                        </select>
                    </div>
                    <div class="col-md-2 align-self-end">
                        <button type="submit" name="filter" value="true" class="btn btn-success w-100">Filter</button>
                    </div>
                </form>

                <!-- Table -->
                <div class="table-wrapper">
                    <table class="table table-striped table-bordered align-middle">
                        <thead class="table-success">
                            <tr>
                                <th scope="col">Schedule ID</th>
                                <th scope="col">Course Code</th>
                                <th scope="col">Course Title</th>
                                <th scope="col">Full Name</th>
                                <th scope="col">Academic Year</th>
                                <th scope="col">Semester</th>
                                <th scope="col">Class</th>
                                <th scope="col">Action</th>
                            </tr>
                        </thead>
                        <tbody id="userTable">
                            <?php if (!$isFiltered): ?>
                                <tr>
                                    <td colspan="8" class="text-center text-muted">Please select an academic year and semester to view schedules.</td>
                                </tr>
                            <?php elseif (count($scheds) === 0): ?>
                                <tr>
                                    <td colspan="8" class="text-center text-muted">No schedules found for the selected semester and academic year.</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($scheds as $row): ?>
                                    <tr>
                                        <th scope="row">
                                            <a href="class.php?schedule_id=<?= $row['schedule_id']; ?>" class="text-success fw-bold">
                                                <?= htmlspecialchars($row['schedule_id']); ?>
                                            </a>
                                        </th>
                                        <td><?= htmlspecialchars($row['subject_code']); ?></td>
                                        <td><?= htmlspecialchars($row['description']); ?></td>
                                        <td><?= htmlspecialchars($row['username']); ?></td>
                                        <td><?= htmlspecialchars($row['academic_year']); ?></td>
                                        <td><?= htmlspecialchars($row['semester']); ?></td>
                                        <td><?= htmlspecialchars($row['course_code'] . " " . $row['year'] . "-" . $row['section']); ?></td>
                                        <td>
                                            <?php if ($row['academic_year'] === $selectedYear && $row['semester'] === $selectedSemester): ?>
                                                <button class="btn btn-sm btn-primary me-2">Update</button>
                                                <button class="btn btn-sm btn-danger">Delete</button>
                                            <?php else: ?>
                                                <span class="text-muted">Read-Only</span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <script src="assets/js/index.js"></script>
    <script src="../js/bootstrap.bundle.min.js"></script>
</body>
</html>
