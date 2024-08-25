<?php
// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "test"; // Replace with your actual database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Query for reason with title and subject
$query2 = "SELECT reason, title, subject, COUNT(*) as count FROM feed GROUP BY reason, title, subject";
$result2 = $conn->query($query2);

// Prepare data for Chart.js
$reasons = [];
$subjectTitles = [];
$reasonSubjectTitleCounts = [];

while($row = $result2->fetch_assoc()) {
    $reason = $row['reason'];
    $subjectTitle = $row['subject'] . ' - ' . $row['title']; // Combine subject and title
    $count = $row['count'];
    
    if (!isset($reasonIndex[$reason])) {
        $reasonIndex[$reason] = count($reasons);
        $reasons[] = $reason;
        $reasonSubjectTitleCounts[$reason] = [];
    }
    
    if (!isset($reasonSubjectTitleCounts[$reason][$subjectTitle])) {
        $reasonSubjectTitleCounts[$reason][$subjectTitle] = 0;
    }
    
    $reasonSubjectTitleCounts[$reason][$subjectTitle] += $count;
}

// Prepare datasets for Chart.js
$datasets = [];
$subjectTitleLabels = [];
$backgroundColor = [
    'rgba(99, 102, 241, 0.2)',
    'rgba(79, 70, 229, 0.2)',
    'rgba(129, 140, 248, 0.2)',
    'rgba(165, 180, 252, 0.2)',
    'rgba(199, 210, 254, 0.2)',
    'rgba(224, 231, 255, 0.2)'
];
$borderColor = [
    'rgba(99, 102, 241, 1)',
    'rgba(79, 70, 229, 1)',
    'rgba(129, 140, 248, 1)',
    'rgba(165, 180, 252, 1)',
    'rgba(199, 210, 254, 1)',
    'rgba(224, 231, 255, 1)'
];
$colorIndex = 0;

foreach ($reasonSubjectTitleCounts as $reason => $subjectTitles) {
    foreach ($subjectTitles as $subjectTitle => $count) {
        if (!in_array($subjectTitle, $subjectTitleLabels)) {
            $subjectTitleLabels[] = $subjectTitle;
        }
        
        $datasetIndex = array_search($subjectTitle, $subjectTitleLabels);
        
        if (!isset($datasets[$datasetIndex])) {
            $datasets[$datasetIndex] = [
                'label' => $subjectTitle,
                'data' => array_fill(0, count($reasons), 0),
                'backgroundColor' => $backgroundColor[$colorIndex % count($backgroundColor)],
                'borderColor' => $borderColor[$colorIndex % count($borderColor)],
                'borderWidth' => 1
            ];
            $colorIndex++;
        }
        
        $datasets[$datasetIndex]['data'][$reasonIndex[$reason]] = $count;
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback Analysis Dashboard</title>
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
            <h1>Feedback Analysis</h1>
            <ul>
                <li><a href="#"><i class="fas fa-chart-bar"></i> Overview</a></li>
                <li><a href="#"><i class="fas fa-comments"></i> Feedback</a></li>
                <li><a href="#"><i class="fas fa-users"></i> Students</a></li>
                <li><a href="#"><i class="fas fa-book"></i> Subjects</a></li>
                <li><a href="#"><i class="fas fa-cog"></i> Settings</a></li>
            </ul>
        </div>
        <div class="main-content">
            <div class="header">
                <h2>Feedback Analysis Dashboard</h2>
                <span id="current-date"></span>
            </div>
            <div class="card">
                <h3>Analysis by Reason</h3>
                <div class="chart-container">
                    <canvas id="reasonChart"></canvas>
                </div>
            </div>
            <!-- You can add more cards here for additional charts or statistics -->
        </div>
    </div>

    <script>
        // Set current date
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Config for the Reason chart (Stacked)
        const reasonConfig = {
            type: 'bar',
            data: {
                labels: <?php echo json_encode($reasons); ?>,
                datasets: <?php echo json_encode($datasets); ?>
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Feedback Distribution by Reason and Subject'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        };

        // Render the Reason chart
        const reasonChart = new Chart(
            document.getElementById('reasonChart'),
            reasonConfig
        );
    </script>
</body>
</html>