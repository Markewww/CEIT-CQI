<?php
// api/config/database.php

// =========================================================================
// 1. GLOBAL CORS HEADERS (Applies automatically to any file requiring this config)
// =========================================================================
// Capture the exact web origin address sending the request
$incoming_origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Define the exact frontend origins authorized to talk to your PHP API
$allowed_origins = [
    "http://localhost:5173",       /* Your default standard local browser port */
    "http://127.0.0.1:5173"        /* Loopback fallback port mapping */
];

// AUTOMATIC IP DETECTOR: If you are running Vite in network mode, this automatically 
// checks if the request is coming from a standard local network IP (e.g., 192.168.x.x)
if (preg_match('/^http:\/\/192\.168\.\d+\.\d+:5173$/', $incoming_origin)) {
    $allowed_origins[] = $incoming_origin;
}

// Alternatively, if your network IP is completely fixed, you can uncomment and type it here:
// $allowed_origins[] = "http://192.168.1.15:5173"; 

// Match and serve the valid header
if (in_array($incoming_origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $incoming_origin);
}
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE"); // Allow HTTP verbs
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With"); // Allow JSON data/auth headers
header("Content-Type: application/json; charset=UTF-8"); // Tell browser this is JSON format

// Catch and reply to the browser's silent "OPTIONS" pre-flight safety ping instantly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =========================================================================
// 2. DATABASE CONFIGURATION CLASS
// =========================================================================
class Database {
    private $host = "localhost";
    private $db_name = "ceit_cqi"; 
    private $username = "root";    
    private $password = "";        
    public ?PDO $conn = null;


    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            
        } catch (PDOException $exception) {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Database connection failure: " . $exception->getMessage()
            ]);
            exit();
        }

        return $this->conn;
    }
}
