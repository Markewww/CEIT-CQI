<?php 
include '../database/dbconn.php';
session_start();

// Check if the user is logged in as a Facilitator
if (!isset($_SESSION['usertype']) || !in_array($_SESSION['usertype'], ['Faculty', 'Programhead'])) {
    error_log("Access denied - Session usertype: " . $_SESSION['usertype']);
    header("Location: ../index.php?error=unauthorized");
    exit();
}

// Get schedule_id from URL
$schedule_id = isset($_GET['schedule_id']) ? $_GET['schedule_id'] : null;

// Fetch active semester and academic year
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

// Initialize schedule data
$schedule = null;

if ($schedule_id) {
    $sql = "SELECT * FROM schedule WHERE schedule_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $schedule_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $schedule = $result->fetch_assoc();
    }
}

// Fetch students for the schedule
$students = [];
if ($schedule_id) {
    $sql = "SELECT * FROM listofstudents WHERE schedule_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $schedule_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
}

$isActiveSchedule = $schedule && 
    $schedule['semester'] == $activeSchedule['semester'] && 
    $schedule['academic_year'] == $activeSchedule['academic_year'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Class</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <link rel="stylesheet" href="assets/css/index.css">
    <link rel="stylesheet" href="assets/css/class.css">
    <link rel="stylesheet" href="cqi/css/bootstrap.css">
</head>
<body>
    <?php include './includes/navbar.php'; ?>
    <div class="d-flex">
        <?php include './includes/sidebar_class.php'; ?>

        <div id="mainContent" class="container p-4">            
            <?php if ($schedule): ?>
                <div class="card border-success shadow-sm mb-4">
                    <div class="card-body">
                        <h4 class="card-title text-success text-center mb-4">
                            Class Information
                        </h4>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Schedule ID:</strong> <?php echo htmlspecialchars($schedule['schedule_id']); ?></p>
                                <p><strong>Subject Code:</strong> <?php echo htmlspecialchars($schedule['subject_code']); ?></p>
                                <p><strong>Description:</strong> <?php echo htmlspecialchars($schedule['description']); ?></p>
                                <p><strong>Teacher Assigned:</strong> <?php echo htmlspecialchars($schedule['username']); ?></p>
                                <p><strong>Academic Year:</strong> <?php echo htmlspecialchars($schedule['academic_year']); ?></p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Semester:</strong> <?php echo htmlspecialchars($schedule['semester']); ?></p>
                                <p><strong>Course:</strong> <?php echo htmlspecialchars($schedule['course_code']); ?></p>
                                <p><strong>Year:</strong> <?php echo htmlspecialchars($schedule['year']); ?></p>
                                <p><strong>Section:</strong> <?php echo htmlspecialchars($schedule['section']); ?></p>
                            </div>
                        </div>
                    </div>
                </div>
            <?php else: ?>
                <div class="alert alert-warning text-center">
                    No schedule found for the selected ID.
                </div>
            <?php endif; ?>

            <div class="table-container">
                <div class="table-wrapper">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col">Student Number</th>
                                <th scope="col">Full Name</th>
                                <th scope="col">Course</th>
                                <th scope="col">Year</th>
                                <th scope="col">Section</th>
                                <th scope="col">Semester</th>
                                <th scope="col">Academic Year</th>
                                <th scope="col">Action</th>
                            </tr>
                        </thead>
                        <tbody id="listofstudents">
                        <?php if (count($students) === 0): ?>
                            <tr>
                                <td colspan="8" class="text-center text-muted">No students found for this schedule.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($students as $row): ?>
                                <tr>
                                    <th scope="row"><?php echo htmlspecialchars($row['studID']); ?></th>
                                    <td><?php echo htmlspecialchars($row['fullname']); ?></td>
                                    <td><?php echo htmlspecialchars($row['course_code']); ?></td>
                                    <td><?php echo htmlspecialchars($row['year']); ?></td>
                                    <td><?php echo htmlspecialchars($row['section']); ?></td>
                                    <td><?php echo htmlspecialchars($row['semester']); ?></td>
                                    <td><?php echo htmlspecialchars($row['academic_year']); ?></td>
                                    <td>
                                        <?php if ($isActiveSchedule): ?>
                                            <a class="btn btn-sm btn-danger" href="operations/delete.php?id=<?php echo $row['id']; ?>&schedule_id=<?php echo $schedule_id; ?>"
                                                onclick="return confirm('Are you sure you want to delete this student?');">Delete</a>
                                        <?php else: ?>
                                            <span class="text-muted">View Only</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <?php if ($isActiveSchedule): ?>
                    <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addStudentModal">Add Student</button>
                    <h2 class="mt-4">Upload Excel File (.xlsx)</h2>
                    <p><strong>Note:</strong> Excel file will be converted to CSV automatically in-browser.</p>
                    
                    <!-- ✅ Fixed, Bootstrap-styled Upload Section -->
                    <div class="file-upload mt-3">
                        <input type="file" id="excelFile" class="file-input" accept=".xlsx">
                        <button class="btn btn-primary mt-2" onclick="convertExcelToCSV()">Upload</button>
                    </div>
                <?php else: ?>
                    <p class="text-muted mt-3">Actions are disabled for previous semesters/years.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Modal for Adding Student -->
    <?php if ($isActiveSchedule): ?>
        <div class="modal fade" id="addStudentModal" tabindex="-1" aria-labelledby="addStudentModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addStudentModalLabel">Add Student: Class - <?php echo htmlspecialchars($schedule['schedule_id']); ?></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addStudentForm">
                            <div class="mb-3">
                                <label for="studentIdInput" class="form-label">Student Number</label>
                                <input type="text" class="form-control" id="studentIdInput" required>
                            </div>
                            <div class="mb-3">
                                <label for="fullNameInput" class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="fullNameInput" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- ✅ Scripts -->
    <script>
        // Show selected filename beside button
        document.getElementById('excelFile').addEventListener('change', function() {
            const fileNameDisplay = document.querySelector('.file-name');
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                fileNameDisplay.textContent = `${file.name} (${file.type || 'unknown format'})`;
            } else {
                fileNameDisplay.textContent = 'No file selected';
            }
        });

        // Convert Excel to CSV and submit
        function convertExcelToCSV() {
            const fileInput = document.getElementById('excelFile');
            const file = fileInput.files[0];
            if (!file) return alert("Please select an Excel file.");

            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const csv = XLSX.utils.sheet_to_csv(firstSheet);

                const form = document.createElement('form');
                form.method = 'POST';
                form.enctype = 'multipart/form-data';
                form.action = 'operations/addstudentexcel.php';

                const scheduleInput = document.createElement('input');
                scheduleInput.type = 'hidden';
                scheduleInput.name = 'schedule_id';
                scheduleInput.value = "<?php echo $schedule_id; ?>";

                const csvInput = document.createElement('input');
                csvInput.type = 'hidden';
                csvInput.name = 'csv_data';
                csvInput.value = csv;

                form.appendChild(scheduleInput);
                form.appendChild(csvInput);
                document.body.appendChild(form);
                form.submit();
            };
            reader.readAsArrayBuffer(file);
        }
    </script>
</body>
</html>
