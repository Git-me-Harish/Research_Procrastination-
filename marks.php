<?php
session_start();

// Establish connection to MySQL database
$servername = "localhost";
$username = "root";
$password = "";
$database = "test";

$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: ". $conn->connect_error);
}

// Retrieve student name from session
$student_name = $_SESSION['student_name']?? '';

// Fetch data from marks table for the specific student and join with exam table
$sql = "
    SELECT e.subject, m.title, m.correct, m.wrong, m.marks, m.time_difference 
    FROM marks m
    JOIN exam e ON m.title = e.title
    WHERE m.stu_name =?
    ORDER BY e.subject
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $student_name);
$stmt->execute();
$result = $stmt->get_result();

// Initialize an associative array to store grouped results
$grouped_marks = [];

while ($row = $result->fetch_assoc()) {
    $grouped_marks[$row['subject']][] = $row;
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marks</title>
    <style>
        /* Global styles */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            position: relative;
            min-height: 100vh;
        }
        h2 {
            color: #333;
            text-align: center;
            margin-top: 20px;
        }
        
        /* Table styles */
        table {
            width: 80%;
            margin: 20px auto;
            border-collapse: collapse;
            border: 1px solid #333;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ccc;
        }
        th {
            background-color: #007bff; /* Blue color for table headers */
            color: white; /* Text color for table headers */
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        
        /* Subject header styles */
       .subject-header {
            text-align: center;
            margin-bottom: 10px;
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }

        /* Analysis button styles */
        .analysis-button {
            position: fixed;
            right: 20px;
            bottom: 20px;
            background-color: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .analysis-button:hover {
            background-color: #218838;
        }
    </style>
</head>
<body>
    <h2>Marks for <?php echo htmlspecialchars($student_name);?></h2>
    <?php
    // Display marks data grouped by subject
    foreach ($grouped_marks as $subject => $marks) {
        echo "<h3 class='subject-header'>Subject: ". htmlspecialchars($subject). "</h3>";
        echo "<table>";
        echo "<tr><th>Title</th><th>Correct</th><th>Wrong</th><th>Marks</th><th>Time</th></tr>";
        foreach ($marks as $mark) {
            echo "<tr>";
            echo "<td>". htmlspecialchars($mark['title']). "</td>";
            echo "<td>". htmlspecialchars($mark['correct']). "</td>";
            echo "<td>". htmlspecialchars($mark['wrong']). "</td>";
            echo "<td>". htmlspecialchars($mark['marks']). "</td>";
            echo "<td>". htmlspecialchars($mark['time_difference']). "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
   ?>

   <!-- Analysis Button -->
   <button class="analysis-button" onclick="window.location.href='analysis.php'">Analysis</button>
</body>
</html>

<?php
// Close statement and connection
$stmt->close();
$conn->close();
?>
