<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>View Assignment</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
    }

    h2 {
        text-align: center;
        color: #333;
    }

    table {
        width: 80%;
        margin: 20px auto;
        border-collapse: collapse;
        background-color: #fff;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    }

    th, td {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        text-align: left;
    }

    th {
        background-color: #007bff; /* Blue color for table header */
        color: white;
    }

    tr:nth-child(even) {
        background-color: #f2f2f2;
    }

    tr:hover {
        background-color: #ddd;
    }
</style>

</head>
<body>

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
    $sql = "SELECT id, question, opt1, opt2, opt3, opt4, answer FROM assignments WHERE title = '$title'";
    $result = $conn->query($sql);

    if (!$result) {
        die("Error executing query: " . $conn->error);
    }

    if ($result->num_rows > 0) {
        echo "<h2>Assignments for $title</h2>";
        echo "<form action='update_assignment.php' method='post'>";
        echo "<table>";
        echo "<tr><th>Question</th><th>Option 1</th><th>Option 2</th><th>Option 3</th><th>Option 4</th><th>Answer</th><th>Actions</th></tr>";
        // Output data of each row
        while($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td><input type='text' name='question[]' value='" . $row["question"] . "'></td>";
            echo "<td><input type='text' name='opt1[]' value='" . $row["opt1"] . "'></td>";
            echo "<td><input type='text' name='opt2[]' value='" . $row["opt2"] . "'></td>";
            echo "<td><input type='text' name='opt3[]' value='" . $row["opt3"] . "'></td>";
            echo "<td><input type='text' name='opt4[]' value='" . $row["opt4"] . "'></td>";
            echo "<td><input type='text' name='answer[]' value='" . $row["answer"] . "'></td>";
            echo "<td><input type='hidden' name='id[]' value='" . $row["id"] . "'><input type='submit' value='Update'></td>";
            echo "</tr>";
        }
        echo "</table>";
        echo "</form>";
    } else {
        echo "<p>No assignments found for $title</p>";
    }
} else {
    echo "<p>No title parameter specified.</p>";
}

$conn->close();
?>

</body>
</html>
