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
    <title>Marks Analysis Dashboard - <?php echo htmlspecialchars($student_name); ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary-color: #6366f1;
            --secondary-color: #f3f4f6;
            --text-color: #333;
            --accent-color: #10b981;
            --white: #ffffff;
            --gray-100: #f7fafc;
            --gray-200: #edf2f7;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Roboto', sans-serif;
            background-color: var(--secondary-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .dashboard {
            display: flex;
            min-height: 100vh;
        }

        .sidebar {
            width: 250px;
            background-color: var(--primary-color);
            color: var(--white);
            padding: 2rem;
        }

        .sidebar h1 {
            font-size: 1.5rem;
            margin-bottom: 2rem;
        }

        .sidebar ul {
            list-style-type: none;
        }

        .sidebar li {
            margin-bottom: 1rem;
        }

        .sidebar a {
            color: var(--white);
            text-decoration: none;
            display: flex;
            align-items: center;
            transition: opacity 0.3s ease;
        }

        .sidebar a:hover {
            opacity: 0.8;
        }

        .sidebar i {
            margin-right: 0.5rem;
        }

        .main-content {
            flex-grow: 1;
            padding: 2rem;
            overflow-y: auto;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .header h2 {
            font-size: 2rem;
            color: var(--primary-color);
        }

        .subject-header {
            font-size: 1.5rem;
            color: var(--primary-color);
            margin-top: 2rem;
            margin-bottom: 1rem;
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 0.5rem;
        }

        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .chart-card {
            background-color: var(--white);
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .chart-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }

        .chart-title {
            font-size: 1rem;
            font-weight: 500;
            margin-bottom: 1rem;
            text-align: center;
        }

        .chart-container {
            height: 250px;
        }

        .table-button {
            position: fixed;
            right: 2rem;
            bottom: 2rem;
            padding: 0.75rem 1.5rem;
            background-color: var(--accent-color);
            color: var(--white);
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .table-button:hover {
            background-color: #0d9488;
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }

        .table-button i {
            margin-right: 0.5rem;
        }

        @media (max-width: 768px) {
            .dashboard {
                flex-direction: column;
            }

            .sidebar {
                width: 100%;
                padding: 1rem;
            }

            .main-content {
                padding: 1rem;
            }

            .charts-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="sidebar">
            <h1>Analysis Dashboard</h1>
            <ul>
                <li><a href="#"><i class="fas fa-chart-bar"></i> Overview</a></li>
                <li><a href="#"><i class="fas fa-book"></i> Subjects</a></li>
                <li><a href="#"><i class="fas fa-clock"></i> Time Analysis</a></li>
                <li><a href="#"><i class="fas fa-cog"></i> Settings</a></li>
            </ul>
        </div>
        <div class="main-content">
            <div class="header">
                <h2>Marks Analysis for <?php echo htmlspecialchars($student_name); ?></h2>
                <span id="current-date"></span>
            </div>
            <?php
            // Display charts grouped by subject
            foreach ($grouped_marks as $subject => $marks) {
                echo "<h3 class='subject-header'>" . htmlspecialchars($subject) . "</h3>";
                echo "<div class='charts-grid'>";
                foreach ($marks as $index => $mark) {
                    $chartIdBar = $subject . '_bar_' . $index;
                    $chartIdPie = $subject . '_pie_' . $index;
                    $remainingMarks = 100 - $mark['marks'];
                    ?>
                    <div class="chart-card">
                        <h4 class="chart-title">Correct vs Wrong: <?php echo htmlspecialchars($mark['title']); ?></h4>
                        <div class="chart-container">
                            <canvas id="<?php echo $chartIdBar; ?>"></canvas>
                        </div>
                    </div>

                    <div class="chart-card">
                        <h4 class="chart-title">Marks Distribution: <?php echo htmlspecialchars($mark['title']); ?></h4>
                        <div class="chart-container">
                            <canvas id="<?php echo $chartIdPie; ?>"></canvas>
                        </div>
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
                                    backgroundColor: ['#10b981', '#ef4444'],
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
                                    backgroundColor: ['#6366f1', '#e2e8f0'],
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
                echo "</div>";
            }
            ?>
        </div>
    </div>

    <!-- Table Button -->
    <button class="table-button" onclick="window.location.href='marks.php'">
        <i class="fas fa-table"></i> Show Table View
    </button>

    <script>
        // Set current date
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    </script>
</body>
</html>

<?php
// Close statement and connection
$stmt->close();
$conn->close();
?>