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
            // Relational query looking up input matching username OR email, joining department code details
            $query = "SELECT u.*, d.code as department_code 
                      FROM " . $this->table_name . " u
                      JOIN departments d ON u.department_id = d.id
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
            // 📍 NEW: STAFF VERIFICATION PIPELINE GATE CHECKS
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

            // Format a clean user payload profile to return back to React's AuthContext state engine
            http_response_code(200);
            return [
                "status" => "success",
                "message" => "Login authorization granted.",
                "user" => [
                    "id" => (int)$user['id'],
                    "username" => $user['username'],
                    "first_name" => $user['first_name'],
                    "last_name" => $user['last_name'],
                    "email" => $user['email'],
                    "role" => $user['role'],
                    "status" => $user['status'], // Included to monitor verification status inside frontend context
                    "department_id" => (int)$user['department_id'],
                    "department_code" => $user['department_code']
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
}
