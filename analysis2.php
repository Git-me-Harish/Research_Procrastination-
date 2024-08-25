<?php
session_start();
$teacher_name = $_SESSION['teacher_name'] ?? '';

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "test";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8mb4");

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch data for the highest marks per subject-title combination
$sql = "SELECT e.subject, m.title, m.stu_name, MAX(m.marks) AS max_marks
        FROM marks m
        INNER JOIN exam e ON m.title = e.title
        WHERE e.teacher = '$teacher_name'
        GROUP BY e.subject, m.title
        ORDER BY e.subject, m.title";

$result = $conn->query($sql);

// Check if the query was successful
if (!$result) {
    die("Query failed: " . $conn->error);
}

$labels = [];
$chartData = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $subjectTitle = $row['subject'] . ' - ' . $row['title'];
        $labels[] = $subjectTitle;
        $chartData[] = [
            'stu_name' => $row['stu_name'],
            'marks' => $row['max_marks']
        ];
    }
} else {
    die("No data found.");
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analysis Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #6366f1;
            --primary-dark: #4f46e5;
            --text-color: #333;
            --bg-color: #f3f4f6;
            --white: #ffffff;
            --gray-100: #f7fafc;
            --gray-200: #edf2f7;
            --gray-300: #e2e8f0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
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

        .card {
            background-color: var(--white);
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .card h3 {
            font-size: 1.2rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }

        .chart-container {
            height: 400px;
        }

        #table-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: var(--primary-color);
            color: var(--white);
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
        }

        #table-button:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
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
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="sidebar">
            <h1>Analysis Dashboard</h1>
            <ul>
                <li><a href="#"><i class="fas fa-chart-bar"></i> Overview</a></li>
                <li><a href="#"><i class="fas fa-users"></i> Students</a></li>
                <li><a href="#"><i class="fas fa-book"></i> Subjects</a></li>
                <li><a href="#"><i class="fas fa-cog"></i> Settings</a></li>
            </ul>
        </div>
        <div class="main-content">
            <div class="header">
                <h2>Highest Marks Analysis</h2>
                <span id="current-date"></span>
            </div>
            <div class="card">
                <h3>Highest Marks per Subject-Title Combination</h3>
                <div class="chart-container">
                    <canvas id="highestMarksChart"></canvas>
                </div>
            </div>
            <!-- You can add more cards here for additional charts or statistics -->
        </div>
    </div>

    <button id="table-button" onclick="location.href='leader.php'">
        <i class="fas fa-table"></i> View Table
    </button>

    <script>
        // Set current date
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const labels = <?php echo json_encode($labels); ?>;
        const chartData = <?php echo json_encode($chartData); ?>;
        const data = chartData.map(item => item.marks);
        const backgroundColors = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff'];

        const ctx = document.getElementById('highestMarksChart').getContext('2d');
        const highestMarksChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Highest Marks',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItem) {
                                return labels[tooltipItem[0].dataIndex];
                            },
                            label: function(tooltipItem) {
                                return `Student: ${chartData[tooltipItem.dataIndex].stu_name}, Marks: ${tooltipItem.raw}`;
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>