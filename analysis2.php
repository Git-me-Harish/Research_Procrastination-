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
    <title>Highest Marks Chart</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }

        .chart-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
        }

        #highestMarksChart {
            width: 100% !important;
            height: 400px;
        }

        #table-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        #table-button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>

<div class="chart-container">
    <canvas id="highestMarksChart"></canvas>
</div>

<button id="table-button" onclick="location.href='leader.php'">Table</button>

<script>
    const labels = <?php echo json_encode($labels); ?>;
    const chartData = <?php echo json_encode($chartData); ?>;
    const data = chartData.map(item => item.marks);
    const backgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

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
            scales: {
                x: {
                    beginAtZero: true,
                },
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false,  // Hide the legend since we're only showing one data set
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
