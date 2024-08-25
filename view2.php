<?php
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

// Retrieve the title parameter from the URL
if (isset($_GET['title'])) {
    $title = $_GET['title'];

    // Query the assignments table based on the title
    $sql = "SELECT id, question, opt1, opt2, opt3, opt4, answer FROM assignments WHERE title = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $title);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result) {
        die("Error executing query: " . $conn->error);
    }
} else {
    echo "<p>No title parameter specified.</p>";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>View Assignment - <?php echo htmlspecialchars($title ?? ''); ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #6366f1;
            --primary-dark: #4f46e5;
            --secondary-color: #f3f4f6;
            --text-color: #333;
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
            font-family: 'Roboto', sans-serif;
            background-color: var(--secondary-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        h2 {
            text-align: center;
            color: var(--primary-color);
            margin: 30px 0;
            font-size: 2.5rem;
        }

        table {
            width: 100%;
            margin: 20px 0;
            border-collapse: separate;
            border-spacing: 0 15px;
            background-color: var(--white);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }

        th, td {
            padding: 15px;
            text-align: left;
        }

        th {
            background-color: var(--primary-color);
            color: var(--white);
            font-weight: 500;
            text-transform: uppercase;
        }

        tr {
            background-color: var(--gray-100);
            transition: all 0.3s ease;
        }

        tr:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        input[type="text"] {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--gray-300);
            border-radius: 4px;
            font-size: 14px;
        }

        input[type="submit"] {
            background-color: var(--primary-color);
            color: var(--white);
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        input[type="submit"]:hover {
            background-color: var(--primary-dark);
        }

        @media (max-width: 768px) {
            table {
                font-size: 14px;
            }

            th, td {
                padding: 10px;
            }

            input[type="text"] {
                font-size: 12px;
            }

            input[type="submit"] {
                padding: 8px 12px;
            }
        }

        @media (max-width: 480px) {
            .container {
                padding: 10px;
            }

            h2 {
                font-size: 2rem;
            }

            table {
                font-size: 12px;
            }

            th, td {
                padding: 8px;
            }

            input[type="text"] {
                font-size: 10px;
            }

            input[type="submit"] {
                padding: 6px 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <?php
        if (isset($result) && $result->num_rows > 0) {
            echo "<h2>Assignments for " . htmlspecialchars($title) . "</h2>";
            echo "<form action='update_assignment.php' method='post'>";
            echo "<table>";
            echo "<tr><th>Question</th><th>Option 1</th><th>Option 2</th><th>Option 3</th><th>Option 4</th><th>Answer</th><th>Actions</th></tr>";
            // Output data of each row
            while($row = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td><input type='text' name='question[]' value='" . htmlspecialchars($row["question"]) . "'></td>";
                echo "<td><input type='text' name='opt1[]' value='" . htmlspecialchars($row["opt1"]) . "'></td>";
                echo "<td><input type='text' name='opt2[]' value='" . htmlspecialchars($row["opt2"]) . "'></td>";
                echo "<td><input type='text' name='opt3[]' value='" . htmlspecialchars($row["opt3"]) . "'></td>";
                echo "<td><input type='text' name='opt4[]' value='" . htmlspecialchars($row["opt4"]) . "'></td>";
                echo "<td><input type='text' name='answer[]' value='" . htmlspecialchars($row["answer"]) . "'></td>";
                echo "<td><input type='hidden' name='id[]' value='" . htmlspecialchars($row["id"]) . "'><input type='submit' value='Update'></td>";
                echo "</tr>";
            }
            echo "</table>";
            echo "</form>";
        } elseif (isset($title)) {
            echo "<p>No assignments found for " . htmlspecialchars($title) . "</p>";
        }
        ?>
    </div>
</body>
</html>

<?php
if (isset($stmt)) {
    $stmt->close();
}
if (isset($conn)) {
    $conn->close();
}
?>