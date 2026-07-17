<?php
// api/controllers/AuthController.php

class AuthController {
    private ?PDO $db = null;
    private string $table_name = "users";

    // Inject the PDO connection instance upon creation
    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Authenticate a user by username or email
     * @param string $loginInput
     * @param string $password
     * @return array
     */
    public function login($loginInput, $password) {
        // Basic inputs scrubbing validation
        $loginInput = trim(htmlspecialchars(strip_tags($loginInput)));

        if (empty($loginInput) || empty($password)) {
            http_response_code(400);
            return [
                "status" => "error",
                "message" => "All login authentication fields are required."
            ];
        }

        try {
            // Relational query looking up input matching username OR email, joining department and program code details [INDEX: 1]
            $query = "SELECT u.*, d.code as department_code, p.code as program_code 
                      FROM " . $this->table_name . " u
                      LEFT JOIN departments d ON u.department_id = d.id
                      LEFT JOIN programs p ON u.program_id = p.id
                      WHERE u.email = :email OR u.username = :username 
                      LIMIT 1";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":email", $loginInput);
            $stmt->bindParam(":username", $loginInput);
            $stmt->execute();

            $user = $stmt->fetch();

            // If account doesn't exist or hash evaluation fails
            if (!$user || !password_verify($password, $user['password_hash'])) {
                http_response_code(401);
                return [
                    "status" => "error",
                    "message" => "Invalid email/username or password credentials."
                ];
            }

            // =========================================================================
            // 📍 STAFF VERIFICATION PIPELINE GATE CHECKS
            // =========================================================================
            if ($user['status'] === 'Pending') {
                http_response_code(403);
                return [
                    "status" => "error",
                    "message" => "Your registration is currently pending review. A CEIT Administrator will verify your details shortly."
                ];
            }

            if ($user['status'] === 'Rejected') {
                http_response_code(403);
                return [
                    "status" => "error",
                    "message" => "Your account registration request has been rejected. Please contact the CEIT Dean's office if you believe this is a mistake."
                ];
            }

            // Safety check evaluating administrative status locks (Suspended Accounts)
            if ((int)$user['is_active'] !== 1) {
                http_response_code(403);
                return [
                    "status" => "error",
                    "message" => "Your account access profile has been temporarily suspended."
                ];
            }

            // Format a clean user payload profile to return back to React's AuthContext state engine [INDEX: 1]
            http_response_code(200);
            return [
                "status" => "success",
                "message" => "Login authorization granted.",
                "user" => [
                    "id" => (int)$user['id'],
                    "employee_id" => isset($user['employee_id']) ? trim($user['employee_id']) : "",
                    "username" => $user['username'],
                    "first_name" => $user['first_name'],
                    "last_name" => $user['last_name'],
                    "email" => $user['email'],
                    "role" => $user['role'],
                    "status" => $user['status'],
                    "department_id" => (int)$user['department_id'],
                    "department_code" => $user['department_code'],
                    "program_id" => $user['program_id'] ? (int)$user['program_id'] : null,   // ◄ Added for cascading sync [INDEX: 1]
                    "program_code" => $user['program_code'] ? $user['program_code'] : null    // ◄ Added for cascading sync [INDEX: 1]
                ]
            ];

        } catch (PDOException $e) {
            http_response_code(500);
            return [
                "status" => "error",
                "message" => "SQL Error Trace: " . $e->getMessage()
            ];
        }
    }

    /**
     * 📍 NEW: Process a fresh registration/account insertion request safely
     * Handles cascading program ids and enforces single-head/chair constraints via MariaDB triggers [INDEX: 1]
     * @param array $data
     * @return array
     */
    public function register($data) {
        $employee_id = trim($data['employee_id'] ?? '');
        $username = trim($data['username'] ?? '');
        $first_name = trim($data['first_name'] ?? '');
        $last_name = trim($data['last_name'] ?? '');
        $email = trim($data['email'] ?? '');
        $contact_number = trim($data['contact_number'] ?? '');
        $password = $data['password'] ?? '';
        $role = trim($data['role'] ?? 'Faculty');
        $status = trim($data['status'] ?? 'Pending');

        // Capture structural dropdown parameters [INDEX: 1]
        $department_id = !empty($data['department_id']) ? (int)$data['department_id'] : null;
        $program_id = !empty($data['program_id']) ? (int)$data['program_id'] : null;
        $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;

        if (empty($employee_id) || empty($first_name) || empty($last_name) || empty($password) || empty($contact_number)) {
            http_response_code(400);
            return ["status" => "error", "message" => "All mandatory profile registration data cells are required."];
        }

        try {
            // Prepare insert tracking statement mapped with the missing column values [INDEX: 1]
            $query = "INSERT INTO " . $this->table_name . " 
                        (employee_id, username, first_name, last_name, email, contact_number, password_hash, department_id, program_id, role, status, is_active) 
                      VALUES 
                        (:employee_id, :username, :first_name, :last_name, :email, :contact_number, :password_hash, :department_id, :program_id, :role, :status, :is_active)";
            
            $stmt = $this->db->prepare($query);
            
            $stmt->bindValue(':employee_id', $employee_id);
            $stmt->bindValue(':username', !empty($username) ? $username : null);
            $stmt->bindValue(':first_name', $first_name);
            $stmt->bindValue(':last_name', $last_name);
            $stmt->bindValue(':email', !empty($email) ? $email : null);
            $stmt->bindValue(':contact_number', $contact_number);
            $stmt->bindValue(':password_hash', password_hash($password, PASSWORD_BCRYPT));
            $stmt->bindValue(':department_id', $department_id, PDO::PARAM_INT);
            $stmt->bindValue(':program_id', $program_id, PDO::PARAM_INT);
            $stmt->bindValue(':role', $role);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':is_active', $is_active, PDO::PARAM_INT);

            if ($stmt->execute()) {
                return ["status" => "success", "message" => "Account registration request submitted securely."];
            }
            
            http_response_code(500);
            return ["status" => "error", "message" => "Internal processing pipeline failure executing write."];

        } catch (PDOException $e) {
            $error_msg = $e->getMessage();
            
            // 📍 INTERCEPT THE CUSTOM MARIADB DATABASE TRIGGERS UNIQ SIGNALS [INDEX: 1]
            if (strpos($error_msg, 'An active Department Head is already registered') !== false) {
                http_response_code(409);
                return ["status" => "error", "message" => "This department already contains an active Department Chairperson. To replace them, you must alter the current head's role or deactivate their account first."];
            }
            if (strpos($error_msg, 'An active Chairperson is already assigned') !== false) {
                http_response_code(409);
                return ["status" => "error", "message" => "This academic program already contains an active Program Head. To replace them, you must alter the current chair's role or deactivate their account first."];
            }

            // Fallback unique constraint conflicts checker (employee_id, username, email)
            if ($e->getCode() == 23000) {
                http_response_code(409);
                return ["status" => "error", "message" => "Conflict validation failure: Employee ID, Username, or Email is already registered in the system."];
            }

            http_response_code(500);
            return ["status" => "error", "message" => "System Database Error: " . $error_msg];
        }
    }
}
