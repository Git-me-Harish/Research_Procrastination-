<?php
header('Content-Type: application/json');

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "test";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

// Get parameters from request
$search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$teacher_name = isset($_GET['teacher_name']) ? $conn->real_escape_string($_GET['teacher_name']) : '';
$rowsPerPage = 10;
$offset = ($page - 1) * $rowsPerPage;

// Fetch distinct subjects
$subjectQuery = "SELECT DISTINCT e.subject 
                 FROM marks m
                 INNER JOIN exam e ON m.title = e.title
                 WHERE e.teacher = '$teacher_name' AND m.stu_name LIKE '%$search%'
                 ORDER BY e.subject ASC";
$subjectResult = $conn->query($subjectQuery);

$subjects = [];
if ($subjectResult->num_rows > 0) {
    while ($subjectRow = $subjectResult->fetch_assoc()) {
        $subjects[] = $subjectRow['subject'];
    }
}

$data = [];
foreach ($subjects as $subject) {
    $sql = "SELECT m.title, m.stu_name, m.marks, m.date 
            FROM marks m
            INNER JOIN exam e ON m.title = e.title
            WHERE e.teacher = '$teacher_name' AND e.subject = '$subject' AND m.stu_name LIKE '%$search%'
            ORDER BY m.marks DESC
            LIMIT $offset, $rowsPerPage";
    $result = $conn->query($sql);

    $users = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $users[] = [
                'title' => $row['title'],
                'stu_name' => $row['stu_name'],
                'marks' => $row['marks'],
                'date' => $row['date']
            ];
        }
    }
    $data[] = ['subject' => $subject, 'users' => $users];
}

// Get the total number of rows for pagination
$totalRowsResult = $conn->query("SELECT FOUND_ROWS() as totalRows");
$totalRows = $totalRowsResult->fetch_assoc()['totalRows'];
$totalPages = ceil($totalRows / $rowsPerPage);

echo json_encode(['data' => $data, 'totalPages' => $totalPages]);

$conn->close();
?>
