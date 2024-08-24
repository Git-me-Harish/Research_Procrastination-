<?php
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
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

    // Retrieve form data
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Prepare and execute SQL statement to fetch user data from the "signup" table
    $stmt = $conn->prepare("SELECT * FROM stu_signup WHERE em = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();
        if (password_verify($password, $row['pass'])) {
            // Password is correct, redirect to student.html
            $_SESSION['student_name'] = $row['na'];
            header("Location: student.html");
            exit();
        } else {
            echo "Invalid email or password";
        }
    } else {
        echo "Invalid email or password";
    }

    // Close statement and connection
    $stmt->close();
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Sign In</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Roboto', Arial, sans-serif;
            background-color: #f0f2f5;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 40px;
            width: 100%;
            max-width: 400px;
        }

        h2 {
            color: #1a73e8;
            font-size: 24px;
            margin-bottom: 24px;
            text-align: center;
        }

        form {
            display: flex;
            flex-direction: column;
        }

        label {
            color: #5f6368;
            font-size: 14px;
            margin-bottom: 8px;
        }

        input[type="text"],
        input[type="password"] {
            background-color: #f1f3f4;
            border: none;
            border-radius: 4px;
            color: #3c4043;
            font-size: 16px;
            padding: 12px;
            margin-bottom: 16px;
            transition: background-color 0.3s;
        }

        input[type="text"]:focus,
        input[type="password"]:focus {
            background-color: #e8f0fe;
            outline: none;
        }

        input[type="submit"] {
            background-color: #1a73e8;
            border: none;
            border-radius: 4px;
            color: #ffffff;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            padding: 12px;
            transition: background-color 0.3s;
        }

        input[type="submit"]:hover {
            background-color: #1765cc;
        }

        .error {
            color: #d93025;
            font-size: 14px;
            margin-top: 16px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Student Sign In</h2>
        <form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
            <label for="email">Email</label>
            <input type="text" id="email" name="email" required>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>

            <input type="submit" value="Sign In">

            <?php
            if ($_SERVER["REQUEST_METHOD"] == "POST") {
                echo '<div class="error">Invalid email or password</div>';
            }
            ?>
        </form>
    </div>
</body>
</html>