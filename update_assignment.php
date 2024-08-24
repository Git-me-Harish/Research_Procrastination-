<?php
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

if (isset($_POST['question']) && isset($_POST['opt1']) && isset($_POST['opt2']) && isset($_POST['opt3']) && isset($_POST['opt4']) && isset($_POST['answer']) && isset($_POST['id'])) {
    $questions = $_POST['question'];
    $opt1s = $_POST['opt1'];
    $opt2s = $_POST['opt2'];
    $opt3s = $_POST['opt3'];
    $opt4s = $_POST['opt4'];
    $answers = $_POST['answer'];
    $ids = $_POST['id'];

    foreach ($ids as $key => $id) {
        $question = $questions[$key];
        $opt1 = $opt1s[$key];
        $opt2 = $opt2s[$key];
        $opt3 = $opt3s[$key];
        $opt4 = $opt4s[$key];
        $answer = $answers[$key];

        $sql = "UPDATE assignments SET question = ?, opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?, answer = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssi", $question, $opt1, $opt2, $opt3, $opt4, $answer,$id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo "Assignment updated successfully";
        } else {
            echo "Error updating assignment: " . $conn->error;
        }

        $stmt->close();
    }
} else {
    echo "Error: Invalid request.";
}

$conn->close();

// Redirect back to the assignments page
header("Location: view.php?title=" . urlencode($title));
exit;
?>