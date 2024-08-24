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
    'rgba(255, 99, 132, 0.2)',
    'rgba(54, 162, 235, 0.2)',
    'rgba(255, 206, 86, 0.2)',
    'rgba(75, 192, 192, 0.2)',
    'rgba(153, 102, 255, 0.2)',
    'rgba(255, 159, 64, 0.2)'
];
$borderColor = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)'
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
    <title>Feedback Analysis</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

    <!-- Reason Count Chart -->
    <div style="width: 50%; margin: 0 auto; margin-top: 50px;">
        <h2>Analysis by Reason</h2>
        <canvas id="reasonChart"></canvas>
    </div>

    <script>
        // Config for the Reason chart (Stacked)
        const reasonConfig = {
            type: 'bar',
            data: {
                labels: <?php echo json_encode($reasons); ?>,
                datasets: <?php echo json_encode($datasets); ?>
            },
            options: {
                scales: {
                    x: {
                        stacked: true // Stack the bars horizontally
                    },
                    y: {
                        stacked: true, // Stack the bars vertically
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
