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
    die("Connection failed: " . $conn->connect_error);
}

// Retrieve student name from session
$student_name = $_SESSION['student_name'] ?? '';

// Fetch data from marks table for the specific student and join with exam table
$sql = "
    SELECT e.subject, m.title, m.correct, m.wrong, m.marks, m.time_difference 
    FROM marks m
    JOIN exam e ON m.title = e.title
    WHERE m.stu_name = ?
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
    <title>Marks - <?php echo htmlspecialchars($student_name); ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        :root {
            --primary-color: #6366f1;
            --secondary-color: #f3f4f6;
            --text-color: #333;
            --accent-color: #10b981;
            --white: #ffffff;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Roboto', sans-serif;
            background-color: var(--secondary-color);
            color: var(--text-color);
            line-height: 1.6;
            position: relative;
            min-height: 100vh;
            padding-bottom: 60px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background-color: var(--primary-color);
            color: var(--white);
            padding: 20px 0;
            text-align: center;
            margin-bottom: 30px;
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .subject-header {
            background-color: var(--white);
            color: var(--primary-color);
            padding: 15px;
            margin-top: 30px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            font-size: 1.5rem;
            text-align: center;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 10px;
            margin-bottom: 30px;
        }

        th, td {
            padding: 15px;
            text-align: left;
            background-color: var(--white);
        }

        th {
            background-color: var(--primary-color);
            color: var(--white);
            font-weight: 500;
            text-transform: uppercase;
        }

        tr {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        tr:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .analysis-button {
            position: fixed;
            right: 20px;
            bottom: 20px;
            background-color: var(--accent-color);
            color: var(--white);
            border: none;
            padding: 12px 24px;
            font-size: 1rem;
            cursor: pointer;
            border-radius: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .analysis-button:hover {
            background-color: #0d9488;
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }

        .analysis-button i {
            margin-right: 8px;
        }

        @media (max-width: 768px) {
            table, thead, tbody, th, td, tr {
                display: block;
            }

            thead tr {
                position: absolute;
                top: -9999px;
                left: -9999px;
            }

            tr {
                margin-bottom: 15px;
            }

            td {
                border: none;
                position: relative;
                padding-left: 50%;
            }

            td:before {
                position: absolute;
                top: 6px;
                left: 6px;
                width: 45%;
                padding-right: 10px;
                white-space: nowrap;
                content: attr(data-label);
                font-weight: bold;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>Marks Dashboard</h1>
            <p>Student: <?php echo htmlspecialchars($student_name); ?></p>
        </div>
    </header>

    <main class="container">
        <?php
        // Display marks data grouped by subject
        foreach ($grouped_marks as $subject => $marks) {
            echo "<h2 class='subject-header'>" . htmlspecialchars($subject) . "</h2>";
            echo "<table>";
            echo "<thead><tr><th>Title</th><th>Correct</th><th>Wrong</th><th>Marks</th><th>Time</th></tr></thead><tbody>";
            foreach ($marks as $mark) {
                echo "<tr>";
                echo "<td data-label='Title'>" . htmlspecialchars($mark['title']) . "</td>";
                echo "<td data-label='Correct'>" . htmlspecialchars($mark['correct']) . "</td>";
                echo "<td data-label='Wrong'>" . htmlspecialchars($mark['wrong']) . "</td>";
                echo "<td data-label='Marks'>" . htmlspecialchars($mark['marks']) . "</td>";
                echo "<td data-label='Time'>" . htmlspecialchars($mark['time_difference']) . "</td>";
                echo "</tr>";
            }
            echo "</tbody></table>";
        }
        ?>
    </main>

    <!-- Analysis Button -->
    <button class="analysis-button" onclick="window.location.href='analysis.php'">
        <i class="fas fa-chart-line"></i> View Analysis
    </button>

</body>
</html>

<?php
// Close statement and connection
$stmt->close();
$conn->close();
?>