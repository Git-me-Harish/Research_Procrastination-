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

// Function to extract text from PDF (placeholder)
function extractTextFromPDF($file_path) {
    return "PDF extraction is not implemented in this demo. Please use a TXT file for testing.";
}

// Function to extract text from DOCX
function extractTextFromDOCX($file_path) {
    $content = '';
    $zip = new ZipArchive();
    if ($zip->open($file_path) === TRUE) {
        if (($index = $zip->locateName("word/document.xml")) !== false) {
            $content = $zip->getFromIndex($index);
            $xml = new DOMDocument();
            $xml->loadXML($content, LIBXML_NOENT | LIBXML_XINCLUDE | LIBXML_NOERROR | LIBXML_NOWARNING);
            $content = strip_tags($xml->saveXML());
        }
        $zip->close();
    }
    return $content;
}

// Function to parse questions from text
function parseQuestions($content) {
    $questions = [];
    $lines = explode("\n", $content);
    $current_question = null;
    $current_options = [];
    $question_number = 1;

    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;

        if (preg_match('/^(\d+\.|\w+\.)\s/', $line)) {
            if ($current_question) {
                $questions[] = [
                    'qn' => $question_number,
                    'question' => $current_question,
                    'opt1' => $current_options[0] ?? '',
                    'opt2' => $current_options[1] ?? '',
                    'opt3' => $current_options[2] ?? '',
                    'opt4' => $current_options[3] ?? '',
                    'answer' => ''
                ];
                $question_number++;
            }
            $current_question = $line;
            $current_options = [];
        } elseif ($current_question) {
            if (preg_match('/^[a-d]\)\s*(.*)/', $line, $matches)) {
                $current_options[] = $matches[1];
            } else {
                $current_question .= " " . $line;
            }
        }
    }

    if ($current_question) {
        $questions[] = [
            'qn' => $question_number,
            'question' => $current_question,
            'opt1' => $current_options[0] ?? '',
            'opt2' => $current_options[1] ?? '',
            'opt3' => $current_options[2] ?? '',
            'opt4' => $current_options[3] ?? '',
            'answer' => ''
        ];
    }

    return $questions;
}

// Check if the session variable containing the teacher's name is set
if (!isset($_SESSION['teacher_name'])) {
    header("Location: tea_signin.php");
    exit();
}

// Handle AJAX file upload and question extraction
if (isset($_FILES['document'])) {
    $file_name = $_FILES['document']['name'];
    $file_tmp = $_FILES['document']['tmp_name'];
    $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    $content = '';
    if ($file_ext == 'pdf') {
        $content = extractTextFromPDF($file_tmp);
    } elseif ($file_ext == 'docx') {
        $content = extractTextFromDOCX($file_tmp);
    } elseif ($file_ext == 'txt') {
        $content = file_get_contents($file_tmp);
    }

    $extracted_questions = parseQuestions($content);
    $_SESSION['extracted_questions'] = $extracted_questions;

    // Return the extracted questions as JSON
    echo json_encode($extracted_questions);
    exit();
}

// Handle quiz saving
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['save'])) {
    $exam_title = $_POST['exam_title'];
    $subject = $_POST['subject'];
    $timer = (int)$_POST['timer'];
    $extracted_questions = $_SESSION['extracted_questions'] ?? [];

    foreach ($extracted_questions as $index => $question) {
        $answer_key = 'correct_answer_' . $question['qn'];
        if (isset($_POST[$answer_key])) {
            $extracted_questions[$index]['answer'] = $_POST[$answer_key];
        }
    }

    saveQuestionsToDatabase($extracted_questions, $exam_title, $subject, $timer, $teacher_name, $conn);

    // Clear the session variable after saving
    unset($_SESSION['extracted_questions']);

    header("Location: teacher.html");
    exit();
}

// Close database connection
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Automated Quiz Creation</title>
    <style>
        /* Your existing styles here */
    </style>
</head>
<body>
    <div class="container">
        <h1>Automated Quiz Creation</h1>
        <form id="upload-form" enctype="multipart/form-data">
            <div class="form-group">
                <label for="document">Upload Document (PDF, DOCX, or TXT):</label>
                <input type="file" id="document" name="document" accept=".pdf,.docx,.txt" required>
            </div>
            <button type="submit">Extract Questions</button>
        </form>

        <div id="loading">Extracting questions, please wait...</div>
        <div id="error-message"></div>

        <form id="quiz-form" method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" style="display: none;">
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

            <div id="questions-container"></div>

            <input type="submit" name="save" value="Save Quiz">
        </form>
    </div>

    <script>
        document.getElementById('upload-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            var xhr = new XMLHttpRequest();
            var loadingDiv = document.getElementById('loading');
            var errorDiv = document.getElementById('error-message');
            var quizForm = document.getElementById('quiz-form');
            var questionsContainer = document.getElementById('questions-container');

            loadingDiv.style.display = 'block';
            errorDiv.innerHTML = '';
            quizForm.style.display = 'none';
            questionsContainer.innerHTML = '';

            xhr.open('POST', '<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>', true);
            xhr.onload = function() {
                loadingDiv.style.display = 'none';
                if (xhr.status === 200) {
                    try {
                        var questions = JSON.parse(xhr.responseText);
                        if (questions.length > 0) {
                            displayQuestions(questions);
                            quizForm.style.display = 'block';
                        } else {
                            errorDiv.innerHTML = 'No questions were extracted from the document.';
                        }
                    } catch (e) {
                        errorDiv.innerHTML = 'Error parsing extracted questions.';
                    }
                } else {
                    errorDiv.innerHTML = 'Error extracting questions. Please try again.';
                }
            };
            xhr.send(formData);
        });

        function displayQuestions(questions) {
            var container = document.getElementById('questions-container');
            questions.forEach(function(question, index) {
                var questionBlock = document.createElement('div');
                questionBlock.className = 'question-block';
                questionBlock.innerHTML = `
                    <h3>Question ${question.qn}</h3>
                    <p>${question.question}</p>
                    <div class="radio-group">
                        <input type="radio" id="option_${question.qn}_1" name="correct_answer_${question.qn}" value="${question.opt1}" required>
                        <label for="option_${question.qn}_1">${question.opt1}</label>
                    </div>
                    <div class="radio-group">
                        <input type="radio" id="option_${question.qn}_2" name="correct_answer_${question.qn}" value="${question.opt2}" required>
                        <label for="option_${question.qn}_2">${question.opt2}</label>
                    </div>
                    <div class="radio-group">
                        <input type="radio" id="option_${question.qn}_3" name="correct_answer_${question.qn}" value="${question.opt3}" required>
                        <label for="option_${question.qn}_3">${question.opt3}</label>
                    </div>
                    <div class="radio-group">
                        <input type="radio" id="option_${question.qn}_4" name="correct_answer_${question.qn}" value="${question.opt4}" required>
                        <label for="option_${question.qn}_4">${question.opt4}</label>
                    </div>
                `;
                container.appendChild(questionBlock);
            });
        }
    </script>
</body>
</html>