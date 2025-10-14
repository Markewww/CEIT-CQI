<?php 
if (!isset($_SESSION['usertype']) || $_SESSION['usertype'] != "Admin") {
    header("Location: ../index.php");
    exit();
}

$current_page = basename($_SERVER['PHP_SELF']);
$username = isset($_SESSION['username']) ? $_SESSION['username'] : 'Guest';
?>

<nav class="navbar navbar-dark bg-dark px-3" id="navbar">
    <div class="container-fluid d-flex align-items-center justify-content-between">
        <!-- Logo (Left) -->
        <div class="d-flex align-items-center">
            <img src="/cqi/images/cvsu-logo.png" alt="CvSU Logo" style="max-width: 60px; height: auto;">
        </div>

        <!-- Right Side: Username + Menu -->
        <div class="d-flex align-items-center">
            <!-- Username -->
            <span class="text-white me-3"><?= htmlspecialchars($username) ?></span>

            <!-- Dropdown Menu -->
            <div class="dropdown me-3">
                <a class="btn btn-dark dropdown-toggle" href="#" role="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    Menu
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="profile.php">Profile</a></li>
                    <li><a class="dropdown-item" href="#">Switch Account</a></li>
                    <li><a class="dropdown-item" href="https://cvsu.edu.ph" target="_blank">CvSU Website</a></li>
                </ul>
            </div>

            <!-- Optional Logout Button -->
            <!-- <a class="btn btn-danger" href="../logout.php" role="button" aria-label="Logout">
                <strong>X</strong>
            </a> -->
        </div>
    </div>
</nav>

<!-- Bootstrap JS (Ensures dropdown works) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
