<?php
// Establish connection to MySQL database
$servername = "localhost";
$username = "root";
$password = "";
$database="test";

$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Initialize $success_message variable
$success_message = "";

// Process signup form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve form data
    $name = $_POST['name'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Sanitize and validate email (you can add more validation as needed)
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Invalid email format";
        exit();
    }

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Prepare and execute SQL statement to insert user data into the "signup" table
    // Prepare and execute SQL statement to insert user data into the "tea_signup" table
    $stmt = $conn->prepare("INSERT INTO stu_signup (na, em, pass) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $email, $hashed_password); // Update bind_param accordingly


    if ($stmt->execute() === TRUE) {
        $success_message = "New record created successfully";
        // Redirect to index.html
        header("Location: stu_sign.html");
        exit();
    } else {
        echo "Error: " . $conn->error;
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
    <title>Student Sign Up</title>
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

        .success {
            color: #0f9d58;
            font-size: 14px;
            margin-top: 16px;
            text-align: center;
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
        <h2>Student Sign Up</h2>
        <form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required>

            <label for="email">Email</label>
            <input type="text" id="email" name="email" required>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>

            <input type="submit" value="Sign Up">

            <?php
            if (!empty($success_message)) {
                echo '<div class="success">' . $success_message . '</div>';
            }
            if ($_SERVER["REQUEST_METHOD"] == "POST" && empty($success_message)) {
                echo '<div class="error">Error: ' . $conn->error . '</div>';
            }
            ?>
        </form>
    </div>
</body>
</html>