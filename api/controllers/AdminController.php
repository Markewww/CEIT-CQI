<?php
// api/controllers/AdminController.php

class AdminController {
    private ?PDO $db = null;
    private $table_name = "users";

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get list of all accounts registered in the system (Except sensitive hashes)
     * @return array
     */
    public function getAllUsers() {
        try {
            $query = "SELECT u.id, u.username, u.first_name, u.middle_name, u.last_name, u.suffix, 
                             u.email, u.contact_number, u.role, u.is_active, u.created_at, d.name as department_name 
                      FROM " . $this->table_name . " u
                      JOIN departments d ON u.department_id = d.id
                      ORDER BY u.created_at DESC";

            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $users = $stmt->fetchAll();

            http_response_code(200);
            return [
                "status" => "success",
                "data" => $users
            ];
        } catch (PDOException $e) {
            http_response_code(500);
            return [
                "status" => "error",
                "message" => "Failed compiling users registry database loop."
            ];
        }
    }

    /**
     * Toggle a user's active access status (Suspend / Unsuspend)
     * @param int $userId
     * @param int $status (1 for Active, 0 for Suspended)
     * @return array
     */
    public function toggleUserStatus($userId, $status) {
        $userId = (int)$userId;
        $status = (int)$status === 1 ? 1 : 0;

        try {
            $query = "UPDATE " . $this->table_name . " SET is_active = :status WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":status", $status, PDO::PARAM_INT);
            $stmt->bindParam(":id", $userId, PDO::PARAM_INT);

            if ($stmt->execute()) {
                http_response_code(200);
                return [
                    "status" => "success",
                    "message" => "Account baseline operational access updated successfully."
                ];
            }
            
            http_response_code(400);
            return ["status" => "error", "message" => "Could not execute status update parameter modification."];

        } catch (PDOException $e) {
            http_response_code(500);
            return [
                "status" => "error",
                "message" => "Failed modifying user status record constraints."
            ];
        }
    }
}
