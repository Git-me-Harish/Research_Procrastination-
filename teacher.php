<?php
session_start();

// Database connection configuration
$servername = "localhost";
$username = "root";
$password = "";
$database = "test";

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$teacher_name = $_SESSION['teacher_name'] ?? '';

// Function to save questions to the database using prepared statements
function saveQuestionsToDatabase($questions, $exam_title, $subject, $timer, $teacher_name, $conn) {
    // Prepare statement for inserting exam title into the exam table
    $stmt_exam = $conn->prepare("INSERT INTO exam (title, subject, timer, teacher) VALUES (?, ?, ?, ?)");
    if (!$stmt_exam) {
        die("Error preparing statement: " . $conn->error);
    }
    $stmt_exam->bind_param("ssis", $exam_title, $subject, $timer, $teacher_name);
    $stmt_exam->execute();
    $exam_id = $stmt_exam->insert_id; // Get the inserted exam_id
    $stmt_exam->close();

    // Prepare statement for inserting assignments
    $stmt_assign = $conn->prepare("INSERT INTO assignments (qn, question, opt1, opt2, opt3, opt4, answer, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt_assign) {
        die("Error preparing statement: " . $conn->error);
    }

    // Execute the statement for inserting questions
    foreach ($questions as $question) {
        $qn = $question['qn'];
        $question_text = $question['question'];
        $opt1 = $question['opt1'];
        $opt2 = $question['opt2'];
        $opt3 = $question['opt3'];
        $opt4 = $question['opt4'];
        $answer = $question['answer'];

        // Bind parameters
        $stmt_assign->bind_param("isssssss", $qn, $question_text, $opt1, $opt2, $opt3, $opt4, $answer, $exam_title);

        // Execute the statement
        $stmt_assign->execute();
    }

    // Close the statement
    $stmt_assign->close();
}

// Check if the session variable containing the teacher's name is set
if (!isset($_SESSION['teacher_name'])) {
    // Redirect to signin page if session variable is not set
    header("Location: tea_signin.php");
    exit();
}

// Initialize variables
$num_questions = isset($_POST['num_questions']) ? (int)$_POST['num_questions'] : 0;
$exam_title = "";
$subject = "";
$timer = 0;

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get number of questions entered by the user
    $num_questions = (int)$_POST['num_questions'];

    // Save questions to database only if the exam title, subject, and timer are provided
    if ($num_questions > 0 && isset($_POST['exam_title']) && isset($_POST['subject']) && isset($_POST['timer'])) {
        $exam_title = $_POST['exam_title'];
        $subject = $_POST['subject'];
        $timer = (int)$_POST['timer'];
        $questions = array();

        // Loop through submitted form data to extract questions and choices
        for ($i = 1; $i <= $num_questions; $i++) {
            $question_key = 'question_' . $i;
            $qn_key = 'qn_' . $i;
            if (isset($_POST[$question_key]) && isset($_POST[$qn_key])) {
                $qn = (int)$_POST[$qn_key];
                $question_text = $_POST[$question_key];
                $choices_key = 'choices_' . $i;
                $opt1 = $_POST[$choices_key][0];
                $opt2 = $_POST[$choices_key][1];
                $opt3 = $_POST[$choices_key][2];
                $opt4 = $_POST[$choices_key][3];

                // Get the selected answer
                $answer_key = 'correct_option_' . $i;
                if (isset($_POST[$answer_key])) {
                    $selected_option_index = $_POST[$answer_key];
                    $answer = $_POST[$choices_key][$selected_option_index - 1]; // Adjust index to match array
                } else {
                    $answer = ""; // If no answer selected, set it to empty string
                }

                // Save question and its answer
                $questions[] = array(
                    'qn' => $qn,
                    'question' => $question_text,
                    'opt1' => $opt1,
                    'opt2' => $opt2,
                    'opt3' => $opt3,
                    'opt4' => $opt4,
                    'answer' => $answer
                );
            }
        }

        // Save questions to database
        saveQuestionsToDatabase($questions, $exam_title, $subject, $timer, $teacher_name, $conn);

        // Redirect to teacher.html page
        header("Location: teacher.html");
        exit();
    }
}

// Close database connection
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Generated Form</title>
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
            padding: 0;
            color: var(--text-color);
        }
        
        .container {
            max-width: 800px;
            margin: 40px auto;
            padding: 30px;
            background-color: var(--white);
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
            text-align: center;
            color: var(--primary-color);
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        form {
            margin-top: 20px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--primary-color);
        }
        
        input[type="text"], input[type="number"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        input[type="text"]:focus, input[type="number"]:focus {
            outline: none;
            border-color: var(--primary-color);
        }
        
        .radio-group {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        input[type="radio"] {
            margin-right: 10px;
        }
        
        input[type="submit"] {
            background-color: var(--primary-color);
            color: var(--white);
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            font-weight: 600;
            transition: background-color 0.3s ease;
            display: block;
            margin: 30px auto 0;
        }
        
        input[type="submit"]:hover {
            background-color: var(--primary-dark);
        }
        
        .question-block {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid var(--primary-color);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>User Generated Form</h1>
        <form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
            <div class="form-group">
                <label for="num_questions">Number of Questions:</label>
                <input type="number" id="num_questions" name="num_questions" value="<?php echo $num_questions; ?>" required>
            </div>

            <?php
            // Display input fields for questions and choices based on user input
            for ($i = 1; $i <= $num_questions; $i++) {
                echo '<label for="qn_' . $i . '">Question Number ' . $i . ':</label>';
                echo '<input type="number" id="qn_' . $i . '" name="qn_' . $i . '" required><br>';
                
                echo '<label for="question_' . $i . '">Question ' . $i . ':</label>';
                echo '<input type="text" id="question_' . $i . '" name="question_' . $i . '" required><br>';
                
                echo '<label for="choices_' . $i . '">Choices:</label><br>';
                for ($j = 1; $j <= 4; $j++) { // Fixed 4 choices
                    echo '<input type="radio" id="choice_' . $i . '_' . $j . '" name="correct_option_' . $i . '" value="' . $j . '">';
                    echo '<input type="text" id="choice_' . $i . '_' . $j . '" name="choices_' . $i . '[]" placeholder="Option ' . $j . '">';
                    echo '<br>';
                }
                echo '<br>';
            }
            ?>
            
            <?php if ($num_questions > 0): ?>
                <div class="form-group">
                    <label for="exam_title">Exam Title:</label>
                    <input type="text" id="exam_title" name="exam_title" required>
                </div>
                <div class="form-group">
                    <label for="subject">Subject:</label>
                    <input type="text" id="subject" name="subject" required>
                </div>
                <div class="form-group">
                    <label for="timer">Timer (minutes):</label>
                    <input type="number" id="timer" name="timer" required>
                </div>
                <?php endif; ?>
                <input type="submit" value="Submit">
        </form>
    </div>
</body>
</html>