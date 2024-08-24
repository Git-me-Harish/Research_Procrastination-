<?php
// Start the session
session_start();

// Establishing a connection to the database (replace these values with your database credentials)
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

// Check if title parameter is set in the URL
if (isset($_GET['title'])) {
    // Get the title from the URL
    $title = $_GET['title'];

    // Fetch assignment details from the database
    $sql = "SELECT * FROM assignments WHERE title = '$title'";
    $result = $conn->query($sql);  // Missing semicolon fixed

    // Retrieve student name from session
    $student_name = $_SESSION['student_name'] ?? '';  // Moved this line here

    if ($result->num_rows > 0) {
        // Initialize counters for correct and wrong answers
        $correctCount = 0;
        $wrongCount = 0;

        // Get the form data
        $startTime = isset($_POST['start_time']) ? $_POST['start_time'] : '';
        $endTime = isset($_POST['end_time']) ? $_POST['end_time'] : '';

        // Convert times to DateTime objects
        $startDateTime = new DateTime($startTime);
        $endDateTime = new DateTime($endTime);
        $timeDifference = $endDateTime->getTimestamp() - $startDateTime->getTimestamp(); // Time difference in seconds

        // Iterate through each assignment
        while ($row = $result->fetch_assoc()) {
            // Get the assignment ID
            $assignmentId = $row['id'];

            // Get the selected option for this assignment
            $selectedOption = $_POST['option'][$assignmentId];

            // Check if the selected option matches the correct answer
            if ($selectedOption == $row['answer']) {
                $correctCount++;
            } else {
                $wrongCount++;
            }
        }

        // Calculate the marks
        $totalQuestions = $correctCount + $wrongCount;
        $marks = ($correctCount / $totalQuestions) * 100;

        // Insert or update marks in the marks table, including stu_name and status as 'completed'
        $marksSql = "INSERT INTO marks (stu_name, title, correct, wrong, marks, start_time, end_time, time_difference, status)
                     VALUES ('$student_name', '$title', $correctCount, $wrongCount, $marks, '$startTime', '$endTime', $timeDifference, 'completed')
                     ON DUPLICATE KEY UPDATE correct = VALUES(correct), wrong = VALUES(wrong), marks = VALUES(marks),
                     start_time = VALUES(start_time), end_time = VALUES(end_time), time_difference = VALUES(time_difference), status = 'completed'"; // Ensure status is updated to 'completed'
        if ($conn->query($marksSql) === TRUE) {
            header("Location: student.php");
        } else {
            echo "Error updating marks: " . $conn->error;
        }
    } else {
        echo "No assignment details found for the given title";
    }
} else {
    echo "No title specified";
}

$conn->close();
?>
