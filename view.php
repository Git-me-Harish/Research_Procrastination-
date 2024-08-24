<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assignments</title>
    <style>
        :root {
            --primary-color: #6366f1;
            --primary-dark: #4f46e5;
            --text-color: #333;
            --bg-color: #f3f4f6;
            --white: #ffffff;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            margin: 0;
            padding: 20px;
            color: var(--text-color);
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background-color: var(--white);
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
        }

        h1 {
            text-align: center;
            color: var(--primary-color);
            margin-bottom: 30px;
            font-size: 2.5em;
        }

        table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
        }

        th, td {
            text-align: left;
            padding: 16px;
        }

        th {
            background-color: var(--primary-color);
            color: var(--white);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .assignment-button {
            background-color: var(--primary-color);
            color: var(--white);
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 10px 18px;
            text-decoration: none;
            display: inline-block;
        }

        .assignment-button:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .delete-button {
            background-color: #ef4444;
        }

        .delete-button:hover {
            background-color: #dc2626;
        }

        @media only screen and (max-width: 768px) {
            table {
                font-size: 14px;
            }
            .assignment-button {
                font-size: 12px;
                padding: 8px 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Assignments</h1>
        <table>
            <thead>
                <tr>
                    <th>Assignment</th>
                    <th>Timer</th>
                    <th>Assigned On</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php
                session_start();

                // Establishing a connection to the database (replace these values with your database credentials)
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

                $teacher_name = $_SESSION['teacher_name'] ?? '';

                // Fetching assignments from the database, including the assigned date
                $sql = "SELECT id, title, timer, c_date FROM exam WHERE teacher = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("s", $teacher_name);
                $stmt->execute();
                $result = $stmt->get_result();

                if (!$result) {
                    die("Error executing query: " . $conn->error);
                }

                if ($result->num_rows > 0) {
                    // Output data of each row
                    while($row = $result->fetch_assoc()) {
                        // Format the assigned date for display
                        $assignedOn = date("Y-m-d H:i:s", strtotime($row["c_date"]));
                        echo "<tr>
                                <td><button class='assignment-button' onclick='viewAssignment(\"" . $row["title"] . "\")'>" . $row["title"] . "</button></td>
                                <td>" . $row["timer"] . " mins</td>
                                <td>" . $assignedOn . "</td>
                                <td>
                                    <button class='assignment-button delete-button' onclick='deleteAssignment(\"" . $row["id"] . "\")'>Delete</button>
                                </td>
                              </tr>";
                    }
                } else {
                    echo "<tr><td colspan='4'>No assignments found</td></tr>";
                }

                $stmt->close();
                $conn->close();
                ?>
            </tbody>
        </table>
    </div>

    <script>
        function viewAssignment(title) {
            window.location = "view2.php?title=" + encodeURIComponent(title);
        }

        function deleteAssignment(id) {
            if (confirm("Are you sure you want to delete this assignment?")) {
                window.location = "delete_assignment.php?id=" + encodeURIComponent(id);
            }
        }
    </script>
</body>
</html>