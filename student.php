<?php
session_start();
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

// Fetch assignments from the database including the assigned date
$sql = "SELECT id, title, timer, subject, c_date FROM exam";
$result = $conn->query($sql);

if (!$result) {
    die("Error executing query: " . $conn->error);
}

$assignments = [];
if ($result->num_rows > 0) {
    // Group assignments by subject
    while ($row = $result->fetch_assoc()) {
        $assignments[$row["subject"]][] = $row;
    }
} else {
    echo "<p>No assignments found</p>";
}

$conn->close(); // Close the connection after you're done with it
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        :root {
            --primary-color: #6366f1;
            --secondary-color: #f3f4f6;
            --text-color: #333;
            --accent-color: #e74c3c;
            --success-color: #10b981;
            --white: #ffffff;
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
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background-color: var(--white);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 20px 0;
        }

        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary-color);
        }

        .nav-links a {
            text-decoration: none;
            color: var(--text-color);
            margin-left: 20px;
            transition: color 0.3s ease;
        }

        .nav-links a:hover {
            color: var(--primary-color);
        }

        main {
            margin-top: 40px;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        h1 {
            font-size: 32px;
            color: var(--primary-color);
        }

        .dashboard-actions {
            display: flex;
            gap: 15px;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .btn-primary {
            background-color: var(--primary-color);
            color: var(--white);
        }

        .btn-primary:hover {
            background-color: #4f46e5;
        }

        .btn-secondary {
            background-color: var(--white);
            color: var(--primary-color);
            border: 1px solid var(--primary-color);
        }

        .btn-secondary:hover {
            background-color: var(--primary-color);
            color: var(--white);
        }

        .assignments {
            background-color: var(--white);
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }

        .subject-header {
            font-size: 24px;
            color: var(--primary-color);
            margin-bottom: 20px;
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 10px;
        }

        th, td {
            padding: 15px;
            text-align: left;
        }

        th {
            background-color: var(--primary-color);
            color: var(--white);
            font-weight: 500;
        }

        tr {
            background-color: #f9f9f9;
            transition: transform 0.3s ease;
        }

        tr:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .status {
            font-weight: 500;
        }

        .status-pending {
            color: var(--accent-color);
        }

        .status-completed {
            color: var(--success-color);
        }

        .assignment-button {
            background-color: var(--primary-color);
            color: var(--white);
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .assignment-button:hover {
            background-color: #4f46e5;
        }
    </style>
</head>
<body>
<header>
        <nav class="container">
            <div class="logo">ClassMate</div>
            <div class="nav-links">
                <a href="index.html"><i class="fas fa-home"></i> Home</a>
                <a href="#"><i class="fas fa-book"></i> Courses</a>
                <a href="#"><i class="fas fa-user"></i> Profile</a>
            </div>
        </nav>
    </header>


    <main class="container">
        <div class="dashboard-header">
            <h1>Welcome, <?php echo isset($_SESSION['student_name']) ? htmlspecialchars($_SESSION['student_name']) : 'Student'; ?>!</h1>
            <div class="dashboard-actions">
                <button class="btn btn-primary">Assignments</button>
                <button class="btn btn-secondary" onclick="viewScore()">View Score</button>
            </div>
        </div>

        <section class="assignments">
            <?php
            foreach ($assignments as $subject => $subjectAssignments) {
                echo "<h2 class='subject-header'>$subject</h2>";
                echo "<table>";
                echo "<tr><th>Assignment</th><th>Timer</th><th>Assigned On</th><th>Status</th></tr>";
                foreach ($subjectAssignments as $assignment) {
                    $assignedOn = date("Y-m-d H:i:s", strtotime($assignment["c_date"]));
                    
                    // Check if the assignment has been submitted by the student
                    $conn = new mysqli($servername, $username, $password, $dbname);
                    $sql = "SELECT status FROM marks WHERE title = ? AND stu_name = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("ss", $assignment["title"], $_SESSION['student_name']);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $submitted = $result->num_rows > 0 && $result->fetch_assoc()["status"] == "completed";
                    $stmt->close();
                    $conn->close();

                    if (!$submitted) {
                        echo "<tr>
                                <td><button class='assignment-button' onclick='viewAssignment(\"" . $assignment["title"] . "\")'>" . $assignment["title"] . "</button></td>
                                <td>" . $assignment["timer"] . " mins</td>
                                <td>" . $assignedOn . "</td>
                                <td class='status status-pending'>Pending</td>
                              </tr>";
                    } else {
                        echo "<tr>
                                <td>" . $assignment["title"] . "</td>
                                <td>" . $assignment["timer"] . " mins</td>
                                <td>" . $assignedOn . "</td>
                                <td class='status status-completed'>Completed</td>
                              </tr>";
                    }
                }
                echo "</table>";
            }
            ?>
        </section>
    </main>

    <script>
       function viewAssignment(title) {
            window.location = "assignments.php?title=" + encodeURIComponent(title);
        }

        function viewScore() {
            window.location = "marks.php";
        }
    </script>
</body>
</html>