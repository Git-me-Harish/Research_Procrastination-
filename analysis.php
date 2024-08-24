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
    <title>Marks Charts</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            padding: 20px;
            text-align: center;
            position: relative;
            min-height: 100vh;
        }

        .chart-container {
            width: 400px;
            height: 300px;
            display: inline-block;
            margin: 20px;
        }

        .subject-header {
            font-size: 24px;
            margin-top: 40px;
            margin-bottom: 20px;
            color: #333;
        }

        .table-button {
            position: absolute;
            right: 20px;
            bottom: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .table-button:hover {
            background-color: #0056b3;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h2>Marks Analysis for <?php echo htmlspecialchars($student_name); ?></h2>
    <?php
    // Display charts grouped by subject
    foreach ($grouped_marks as $subject => $marks) {
        echo "<h3 class='subject-header'>Subject: " . htmlspecialchars($subject) . "</h3>";

        foreach ($marks as $index => $mark) {
            $chartIdBar = $subject . '_bar_' . $index;
            $chartIdPie = $subject . '_pie_' . $index;
            $remainingMarks = 100 - $mark['marks'];
            ?>
            <div class="chart-container">
                <canvas id="<?php echo $chartIdBar; ?>"></canvas>
                <p>Correct vs Wrong: <?php echo htmlspecialchars($mark['title']); ?></p>
            </div>

            <div class="chart-container">
                <canvas id="<?php echo $chartIdPie; ?>"></canvas>
                <p>Marks Distribution (Out of 100): <?php echo htmlspecialchars($mark['title']); ?></p>
            </div>

            <script>
                // Render bar chart for correct vs wrong answers
                var ctxBar = document.getElementById('<?php echo $chartIdBar; ?>').getContext('2d');
                new Chart(ctxBar, {
                    type: 'bar',
                    data: {
                        labels: ['Correct', 'Wrong'],
                        datasets: [{
                            label: '<?php echo htmlspecialchars($mark['title']); ?>',
                            data: [<?php echo $mark['correct']; ?>, <?php echo $mark['wrong']; ?>],
                            backgroundColor: ['#28a745', '#dc3545'],
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });

                // Render pie chart for marks out of 100
                var ctxPie = document.getElementById('<?php echo $chartIdPie; ?>').getContext('2d');
                new Chart(ctxPie, {
                    type: 'pie',
                    data: {
                        labels: ['Marks', 'Remaining'],
                        datasets: [{
                            data: [<?php echo $mark['marks']; ?>, <?php echo $remainingMarks; ?>],
                            backgroundColor: ['#007bff', '#f0f0f0'],
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                    }
                });
            </script>
            <?php
        }
    }
    ?>
    <!-- Table Button -->
    <button class="table-button" onclick="window.location.href='marks.php'">Show Table</button>

</body>
</html>

<?php
// Close statement and connection
$stmt->close();
$conn->close();
?>
