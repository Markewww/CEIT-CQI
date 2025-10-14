<?php
session_start();
require_once '../database/dbconn.php';

// Ensure user is logged in
if (!isset($_SESSION['username'])) {
    header("Location: ../login.php");
    exit;
}

// Fetch user info
$username = $_SESSION['username'];
$stmt = $conn->prepare("SELECT userID, username, email, password, usertype FROM account WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

// Handle password change
$message = "";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['change_password'])) {
        $oldPassword = $_POST['old_password'];
        $newPassword = $_POST['new_password'];
        $confirmPassword = $_POST['confirm_password'];

        // Password rules
        $length = strlen($newPassword) >= 8;
        $uppercase = preg_match('@[A-Z]@', $newPassword);
        $lowercase = preg_match('@[a-z]@', $newPassword);
        $number = preg_match('@[0-9]@', $newPassword);
        $symbols = preg_match('@[^A-Za-z0-9]@', $newPassword); // must NOT contain

        if (!password_verify($oldPassword, $user['password'])) {
            $message = "<div class='alert alert-danger'>Old password is incorrect.</div>";
        } elseif ($newPassword !== $confirmPassword) {
            $message = "<div class='alert alert-danger'>New passwords do not match.</div>";
        } elseif (!$length || !$uppercase || !$lowercase || !$number || $symbols) {
            $message = "<div class='alert alert-danger'>
                Password must be at least 8 characters, include uppercase, lowercase, numbers, 
                and contain <b>no symbols</b>.
            </div>";
        } else {
            $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
            $update = $conn->prepare("UPDATE account SET password = ? WHERE userID = ?");
            $update->bind_param("si", $hashed, $user['userID']);
            if ($update->execute()) {
                $message = "<div class='alert alert-success'>Password updated successfully!</div>";
            } else {
                $message = "<div class='alert alert-danger'>Error updating password.</div>";
            }
        }
    }

    // Update username
    if (isset($_POST['update_username'])) {
        $newUsername = trim($_POST['new_username']);
        if (!empty($newUsername)) {
            $update = $conn->prepare("UPDATE account SET username = ? WHERE userID = ?");
            $update->bind_param("si", $newUsername, $user['userID']);
            if ($update->execute()) {
                $_SESSION['username'] = $newUsername;
                $user['username'] = $newUsername;
                $message = "<div class='alert alert-success'>Username updated successfully!</div>";
            } else {
                $message = "<div class='alert alert-danger'>Error updating username.</div>";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Profile</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="assets/css/profile.css" rel="stylesheet">
  <style>
    /* Password strength indicators */
    .password-rules li {
        list-style: none;
        margin: 2px 0;
        font-size: 0.9rem;
    }
    .valid { color: green; font-weight: bold; }
    .invalid { color: red; }
    .toggle-eye {
        position: absolute;
        right: 15px;
        top: 38px;
        cursor: pointer;
        color: #555;
    }
  </style>
</head>
<body class="bg-light">

<!-- Green Header -->
<nav class="navbar navbar-expand-lg navbar-dark bg-success">
  <div class="container-fluid">
    <a class="navbar-brand fw-bold text-white" href="#">User Profile</a>
  </div>
</nav>

<div class="container mt-4">
  <h2 class="mb-4">Profile</h2>
  <?= $message ?>

  <div class="row">
    <!-- User Information -->
    <div class="col-md-6 mb-4">
      <div class="card">
        <div class="card-header bg-success text-white">User Information</div>
        <div class="card-body">
          <p><strong>User ID:</strong> <?= htmlspecialchars($user['userID']) ?></p>
          <form method="POST" class="d-flex align-items-center mb-3">
            <strong class="me-2">Full Name:</strong>
            <input type="text" name="new_username" class="form-control me-2" 
                   value="<?= htmlspecialchars($user['username']) ?>" style="max-width: 200px;" required>
            <button type="submit" name="update_username" class="btn btn-primary btn-sm me-2">Save</button>
          </form>
          <p><strong>Email:</strong> <?= htmlspecialchars($user['email']) ?></p>
          <p><strong>User type:</strong> <?= htmlspecialchars($user['usertype']) ?></p>
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="col-md-6 mb-4">
      <div class="card">
        <div class="card-header bg-success text-white">Security & Password</div>
        <div class="card-body">
          <form method="POST" action="">
            <div class="mb-3">
              <label for="old_password" class="form-label">Old Password</label>
              <input type="password" name="old_password" id="old_password" class="form-control" required>
            </div>
            <div class="mb-3 position-relative">
              <label for="new_password" class="form-label">New Password</label>
              <input type="password" name="new_password" id="new_password" class="form-control" required>
              <span class="toggle-eye" onclick="togglePasswords()">👁️</span>
            </div>
            <div class="mb-3 position-relative">
              <label for="confirm_password" class="form-label">Confirm New Password</label>
              <input type="password" name="confirm_password" id="confirm_password" class="form-control" required>
            </div>

            <!-- Live password rules -->
            <ul class="password-rules">
              <li id="rule-length" class="invalid">At least 8 characters</li>
              <li id="rule-upper" class="invalid">At least 1 uppercase letter</li>
              <li id="rule-lower" class="invalid">At least 1 lowercase letter</li>
              <li id="rule-number" class="invalid">At least 1 number</li>
              <li id="rule-symbol" class="invalid">No symbols allowed</li>
            </ul>

            <button type="submit" name="change_password" class="btn btn-success">Save</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Back Button -->
<div class="back-btn-container">
  <?php if (file_exists("dashboard.php")): ?>
    <a href="dashboard.php" class="btn btn-danger">&larr; Back</a>
  <?php else: ?>
    <a href="index.php" class="btn btn-danger">&larr; Back</a>
  <?php endif; ?>
</div>

<script>
// Password toggle
function togglePasswords() {
  const newPass = document.getElementById("new_password");
  const confirmPass = document.getElementById("confirm_password");
  const type = newPass.type === "password" ? "text" : "password";
  newPass.type = type;
  confirmPass.type = type;
}

// Live validation
document.getElementById("new_password").addEventListener("input", function() {
  const val = this.value;
  document.getElementById("rule-length").className = val.length >= 8 ? "valid" : "invalid";
  document.getElementById("rule-upper").className = /[A-Z]/.test(val) ? "valid" : "invalid";
  document.getElementById("rule-lower").className = /[a-z]/.test(val) ? "valid" : "invalid";
  document.getElementById("rule-number").className = /[0-9]/.test(val) ? "valid" : "invalid";
  document.getElementById("rule-symbol").className = /[^A-Za-z0-9]/.test(val) ? "invalid" : "valid";
});
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>