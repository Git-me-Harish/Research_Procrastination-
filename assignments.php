<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Test</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }

        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #fff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        .timer {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
        }

        .assignment-details {
            background-color: #fff;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        h2 {
            color: #007bff;
            margin-top: 0;
            margin-bottom: 20px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }

        p {
            margin-bottom: 15px;
        }

        .options {
            margin-top: 20px;
        }

        .option-label {
            display: block;
            margin-bottom: 10px;
            padding: 10px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .option-label:hover {
            background-color: #e9ecef;
        }

        input[type="radio"] {
            margin-right: 10px;
        }

        .button-group {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }

        .btn-primary {
            background-color: #007bff;
            color: white;
        }

        .btn-secondary {
            background-color: #6c757d;
            color: white;
        }

        .btn:hover {
            opacity: 0.9;
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
        }

        .modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 80%;
            max-width: 500px;
            border-radius: 8px;
        }

        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }

        .close:hover,
        .close:focus {
            color: #000;
            text-decoration: none;
        }
    </style>
    <script>
        let timerDuration; // Duration in seconds
        let remainingTime;
        let timerInterval;
        let currentQuestionIndex = 0; // Track current question

        function startTimer(duration) {
            let timer = duration, minutes, seconds;
            const display = document.querySelector('#timer');
            timerInterval = setInterval(() => {
                minutes = parseInt(timer / 60, 10);
                seconds = parseInt(timer % 60, 10);

                minutes = minutes < 10 ? "0" + minutes : minutes;
                seconds = seconds < 10 ? "0" + seconds : seconds;

                display.textContent = minutes + ":" + seconds;
                remainingTime = timer;

                if (--timer < 0) {
                    clearInterval(timerInterval);
                    document.getElementById("examForm").submit();
                }
            }, 1000);
        }

        window.onload = function () {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + timerDuration * 1000);

            document.getElementById('start_time').value = startTime.toTimeString().split(' ')[0];
            document.getElementById('date').value = startTime.toISOString().split('T')[0];

            // Check if there is a saved remaining time in local storage
            const savedRemainingTime = localStorage.getItem('remainingTime');
            if (savedRemainingTime) {
                remainingTime = parseInt(savedRemainingTime, 10);
            } else {
                remainingTime = timerDuration;
            }

            startTimer(remainingTime);
            showQuestion(currentQuestionIndex); // Show the first question initially
        };

        function showQuestion(index) {
			const questions = document.querySelectorAll('.assignment-details');
			questions.forEach((question, i) => {
				question.style.display = (i === index) ? 'block' : 'none';
				if (i === index) {
					const qnValue = question.getAttribute('data-qn'); // Assuming you set data-qn in the HTML
					document.getElementById('qn').value = qnValue;
				}
			});

			// Show or hide navigation buttons
			document.getElementById('prevBtn').style.display = (index === 0) ? 'none' : 'inline-block';
			document.getElementById('nextBtn').style.display = (index === questions.length - 1) ? 'none' : 'inline-block';
			document.getElementById('submitBtn').style.display = (index === questions.length - 1) ? 'inline-block' : 'none';
		}

		// Call this function to set the qn value when an option is selected
		function setQnValue(qn) {
			document.getElementById('qn').value = qn;
		}


        function nextQuestion() {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }

        function prevQuestion() {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }

        function submitForm() {
            // Capture end time when the submit button is clicked
            const endTime = new Date();
            document.getElementById('end_time').value = endTime.toTimeString().split(' ')[0];
            document.getElementById("examForm").submit();
        }
        // Modify the goBack() function
        function goBack() {
            clearInterval(timerInterval); // Pause the timer
            localStorage.setItem('remainingTime', remainingTime); // Save the remaining time in local storage
            
            // Capture quit time
            const quitTime = new Date();
            document.getElementById('quit_time').value = quitTime.toTimeString().split(' ')[0];
            
            document.getElementById('quitConfirmationModal').style.display = 'block'; // Show the quit confirmation modal
            }
            
            // New function to handle quit reason submission
            function submitQuitReason(reason) {
                const startTime = new Date("1970-01-01T" + document.getElementById('start_time').value + "Z");
                const quitTime = new Date("1970-01-01T" + document.getElementById('quit_time').value + "Z");
                const quitTiming = (quitTime - startTime) / 1000; // Quit timing in seconds

                const studentName = "<?php echo $_SESSION['student_name'] ?? ''; ?>";
                const quitReason = reason === 'Other' ? document.getElementById('otherReason').value : reason;
                const assignmentTitle = document.getElementById('assignment_title').value;
                const subject = document.getElementById('subject').value;
                const questionNumber = document.getElementById('qn').value; // Get the question number

                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'submit_quit_reason.php', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        console.log("Quit reason submitted:", xhr.responseText);
                        window.location.href = "student.php"; // Navigate to the student page
                    }
                };
                xhr.send(`name=${encodeURIComponent(studentName)}&reason=${encodeURIComponent(quitReason)}&timing=${quitTiming}&assignment_title=${encodeURIComponent(assignmentTitle)}&subject=${encodeURIComponent(subject)}&question_number=${encodeURIComponent(questionNumber)}`);
                document.getElementById('quitConfirmationModal').style.display = 'none'; // Hide the modal
            }



        var modal = document.getElementById('quitConfirmationModal');
        var span = document.getElementsByClassName("close")[0];

        span.onclick = function() {
            modal.style.display = "none";
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

                function restartTimer() {
                    clearInterval(timerInterval); // Clear any existing timer
                    document.getElementById('examForm').reset(); // Reset the form to clear selected options
                    localStorage.removeItem('remainingTime'); // Remove the saved time from local storage
                    remainingTime = timerDuration; // Reset remaining time to the original duration
                    startTimer(remainingTime); // Start the timer again
                    showQuestion(0); // Reset to the first question
                    currentQuestionIndex = 0; // Reset the question index
                    }
        // Example JavaScript function to set the question number before submitting the form
        function setQuestionNumber(questionNumber) {
            document.getElementById('question_number').value = questionNumber;
        }

        // Function to set the question number
        function setQuestionNumber(questionNumber) {
            document.getElementById('question_number').value = questionNumber;
        }

        // Call this function to increment the question number as needed
        let currentQuestionNumber = 1;

        // Example of moving to the next question
        function goToNextQuestion() {
            currentQuestionNumber++;
            setQuestionNumber(currentQuestionNumber);
            // Logic to display the next question
        }

        // Example of moving to the previous question
        function goToPreviousQuestion() {
            if (currentQuestionNumber > 1) {
                currentQuestionNumber--;
                setQuestionNumber(currentQuestionNumber);
            }
            // Logic to display the previous question
        }


    </script>
</head>
<body>
    <div class="top-bar">
        <button type="button" class="btn btn-secondary" onclick="goBack()">Back</button>
        <div class="timer">
            Time Remaining: <span id="timer"></span>
            <button type="button" class="btn btn-primary" onclick="restartTimer()">Restart</button>
        </div>
    </div>

<form id="examForm" action="submit.php?title=<?php echo urlencode($_GET['title']); ?>" method="post">
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

// Check if title parameter is set in the URL
if (isset($_GET['title'])) {
    // Get the title from the URL
    $title = $_GET['title'];

    // Fetch assignment details and timer from the database
    $sql = "SELECT a.*, e.timer, e.subject FROM assignments a JOIN exam e ON a.title = e.title WHERE a.title = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $title);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Output data of the assignment
        while ($row = $result->fetch_assoc()) {
            echo "<div class='assignment-details' data-qn='" . $row['qn'] . "'>"; // Store qn as a data attribute
            echo "<h2>Question " . $row['qn'] . ": Assignment Details</h2>"; // Display qn number
            echo "<p><strong>Question:</strong> " . $row["question"] . "</p>";
            // Display options as radio buttons
            echo "<p><strong>Options:</strong></p>";
            echo "<p><input type='radio' name='option[" . $row['id'] . "]' value='" . $row["opt1"] . "' id='opt1_" . $row['id'] . "'><label class='option-label' for='opt1_" . $row['id'] . "'>" . $row["opt1"] . "</label></p>";
            echo "<p><input type='radio' name='option[" . $row['id'] . "]' value='" . $row["opt2"] . "' id='opt2_" . $row['id'] . "'><label class='option-label' for='opt2_" . $row['id'] . "'>" . $row["opt2"] . "</label></p>";
            echo "<p><input type='radio' name='option[" . $row['id'] . "]' value='" . $row["opt3"] . "' id='opt3_" . $row['id'] . "'><label class='option-label' for='opt3_" . $row['id'] . "'>" . $row["opt3"] . "</label></p>";
            echo "<p><input type='radio' name='option[" . $row['id'] . "]' value='" . $row["opt4"] . "' id='opt4_" . $row['id'] . "'><label class='option-label' for='opt4_" . $row['id'] . "'>" . $row["opt4"] . "</label></p>";
            echo "</div>";

            // Set the timer duration for JavaScript
            echo "<script>timerDuration = " . $row["timer"] * 60 . ";</script>"; // Timer in seconds

            // Store the subject in a hidden input field
            echo "<input type='hidden' id='subject' name='subject' value='" . $row['subject'] . "'>";
            echo "<input type='hidden' id='assignment_title' name='assignment_title' value='" . $row['title'] . "'>";
        }
    } else {
        echo "No assignment details found for the given title";
    }
} else {
    echo "No title specified";
}

$conn->close();
?>
<form id="examForm" action="submit.php" method="post">
        <div class="assignment-details">
            <h2>Question <span id="questionNumber">1</span>: Assignment Details</h2>
            <p><strong>Question:</strong> <span id="questionText"></span></p>
            <div class="options">
                <label class="option-label">
                    <input type="radio" name="option" value="1">
                    <span id="option1"></span>
                </label>
                <label class="option-label">
                    <input type="radio" name="option" value="2">
                    <span id="option2"></span>
                </label>
                <label class="option-label">
                    <input type="radio" name="option" value="3">
                    <span id="option3"></span>
                </label>
                <label class="option-label">
                    <input type="radio" name="option" value="4">
                    <span id="option4"></span>
                </label>
            </div>
        </div>
        
        <div class="button-group">
            <button type="button" class="btn btn-secondary" id="prevBtn" onclick="prevQuestion()">Previous</button>
            <button type="button" class="btn btn-primary" id="nextBtn" onclick="nextQuestion()">Next</button>
            <button type="button" class="btn btn-primary" id="submitBtn" onclick="submitForm()" style="display: none;">Submit</button>
        </div>
        <input type="hidden" id="date" name="date">
        <input type="hidden" id="start_time" name="start_time">
        <input type="hidden" id="end_time" name="end_time">
        <input type="hidden" id="quit_time" name="quit_time">
        <input type="hidden" id="question_number" name="question_number" value="1">
        <input type="hidden" id="qn" name="qn" value="">
    </form>

<!--Quitting Back button -->
<div id="quitConfirmationModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>🤷‍♂️ Why are you leaving this test?</h2>
            <button class="btn btn-secondary" onclick="submitQuitReason('Boring')">Boring</button>
            <button class="btn btn-secondary" onclick="submitQuitReason('More Questions')">More Questions</button>
            <button class="btn btn-secondary" onclick="submitQuitReason('Difficult')">Difficult</button>
            <button class="btn btn-secondary" onclick="submitQuitReason('Other')">Other</button>
            <div id="otherReasonContainer" style="display: none; margin-top: 10px;">
                <input type="text" id="otherReason" placeholder="Enter your reason" style="width: 100%; padding: 5px;">
                <button class="btn btn-primary" onclick="submitQuitReason($('#otherReason').val())" style="margin-top: 10px;">Submit</button>
            </div>
        </div>
    </div>
</body>
</html>