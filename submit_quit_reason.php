<?php
// Start the session
session_start();

// Database connection parameters
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "test";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get the student name, reason, timing, title, subject, and question number from the POST request
$student_name = $_SESSION['student_name'] ?? '';
$reason = $_POST['reason'] ?? '';
$timing = $_POST['timing'] ?? 0; // Default to 0 if not set
$title = $_POST['assignment_title'] ?? '';
$subject = $_POST['subject'] ?? '';
$question_number = $_POST['question_number'] ?? 0; // Default to 0 if not set

// Convert seconds to HH:MM:SS format for MySQL TIME data type
$quitTime = gmdate('H:i:s', $timing);

// Prepare and bind
$stmt = $conn->prepare("INSERT INTO feed (name, reason, timing, title, subject, qn) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssi", $student_name, $reason, $quitTime, $title, $subject, $question_number);

// Execute the statement
if ($stmt->execute()) {
    echo "Record inserted successfully";
} else {
    echo "Error: " . $stmt->error;
}

// Close the connection
$stmt->close();
$conn->close();
?>
