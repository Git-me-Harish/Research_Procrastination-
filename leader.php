<?php
session_start();
$teacher_name = $_SESSION['teacher_name'] ?? '';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leaderboard</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #6366f1;
            --primary-dark: #4f46e5;
            --text-color: #333;
            --bg-color: #f3f4f6;
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .leaderboard-container {
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            background-color: var(--white);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            position: relative;
        }

        h1 {
            text-align: center;
            color: var(--primary-color);
            margin-bottom: 30px;
            font-size: 2.5em;
            font-weight: 700;
        }

        #search-form {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }

        #search-input {
            width: 300px;
            padding: 10px;
            border: 2px solid var(--gray-300);
            border-radius: 5px 0 0 5px;
            outline: none;
            font-size: 16px;
        }

        #search-button {
            padding: 10px 20px;
            background-color: var(--primary-color);
            color: var(--white);
            border: none;
            border-radius: 0 5px 5px 0;
            cursor: pointer;
            transition: background-color 0.3s;
            font-size: 16px;
        }

        #search-button:hover {
            background-color: var(--primary-dark);
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 0.5rem;
            margin-bottom: 20px;
        }

        thead {
            background-color: var(--primary-color);
            color: var(--white);
        }

        thead th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        tbody tr {
            background-color: var(--gray-100);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        tbody tr:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        tbody td {
            padding: 15px;
            border-top: 1px solid var(--gray-200);
        }

        #pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 20px;
        }

        #pagination button {
            padding: 10px 20px;
            background-color: var(--primary-color);
            color: var(--white);
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
            margin: 0 5px;
            font-size: 14px;
        }

        #pagination button:hover {
            background-color: var(--primary-dark);
        }

        #pagination #current-page {
            margin: 0 10px;
            font-weight: 600;
        }

        .analysis-button {
            position: absolute;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: var(--primary-color);
            color: var(--white);
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.3s;
            font-size: 16px;
        }

        .analysis-button:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
        }

        @media (max-width: 768px) {
            #search-input {
                width: 200px;
            }

            table, thead, tbody, th, td, tr {
                display: block;
            }

            thead {
                display: none;
            }

            tbody tr {
                margin-bottom: 15px;
                border-radius: 8px;
                overflow: hidden;
            }

            tbody td {
                text-align: right;
                padding-left: 50%;
                position: relative;
            }

            tbody td::before {
                content: attr(data-label);
                position: absolute;
                left: 15px;
                width: 45%;
                padding-right: 10px;
                white-space: nowrap;
                font-weight: bold;
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="leaderboard-container">
        <h1>Leaderboard</h1>
        <form id="search-form">
            <input type="search" id="search-input" placeholder="Search by student name">
            <button type="button" id="search-button">
                <i class="fas fa-search"></i> Search
            </button>
        </form>
        <div id="leaderboard-content">
            <!-- leaderboard data will be populated here -->
        </div>
        <div id="pagination">
            <button id="previous-page">
                <i class="fas fa-chevron-left"></i> Previous
            </button>
            <span id="current-page">Page 1 of 1</span>
            <button id="next-page">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        </div>

        <button class="analysis-button" onclick="location.href='analysis2.php'">
            <i class="fas fa-chart-bar"></i> Analysis
        </button>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const searchForm = document.getElementById('search-form');
            const searchInput = document.getElementById('search-input');
            const leaderboardContent = document.getElementById('leaderboard-content');
            const previousPageButton = document.getElementById('previous-page');
            const nextPageButton = document.getElementById('next-page');
            const currentPageSpan = document.getElementById('current-page');
            
            let currentPage = 1;
            let totalPages = 1;
            const rowsPerPage = 10;

            // Function to fetch leaderboard data from the server
            function fetchLeaderboard(query = '', page = 1) {
                fetch(`fetch_leaderboard.php?search=${query}&page=${page}&teacher_name=<?php echo $teacher_name; ?>`)
                    .then(response => response.json())
                    .then(data => {
                        totalPages = data.totalPages;
                        populateLeaderboard(data.data);
                        updatePagination(totalPages, page);
                    })
                    .catch(error => console.error('Error fetching leaderboard data:', error));
            }

            // Function to populate leaderboard with fetched data
            function populateLeaderboard(data) {
                leaderboardContent.innerHTML = '';

                data.forEach(group => {
                    const subjectHeading = document.createElement('h2');
                    subjectHeading.textContent = `Subject: ${group.subject}`;
                    subjectHeading.style.color = 'var(--primary-color)';
                    subjectHeading.style.marginTop = '20px';
                    subjectHeading.style.marginBottom = '10px';
                    leaderboardContent.appendChild(subjectHeading);

                    const table = document.createElement('table');
                    const thead = document.createElement('thead');
                    thead.innerHTML = `
                        <tr>
                            <th>Title</th>
                            <th>Student Name</th>
                            <th>Marks</th>
                            <th>Date</th>
                        </tr>
                    `;
                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');

                    group.users.forEach(user => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td data-label="Title">${user.title}</td>
                            <td data-label="Student Name">${user.stu_name}</td>
                            <td data-label="Marks">${user.marks}</td>
                            <td data-label="Date">${user.date}</td>
                        `;
                        tbody.appendChild(row);
                    });

                    table.appendChild(tbody);
                    leaderboardContent.appendChild(table);
                });
            }

            // Function to update pagination controls
            function updatePagination(totalPages, page) {
                currentPageSpan.textContent = `Page ${page} of ${totalPages}`;
                previousPageButton.disabled = page === 1;
                nextPageButton.disabled = page === totalPages;
                if (totalPages === 1) {
                    previousPageButton.style.display = 'none';
                    nextPageButton.style.display = 'none';
                } else {
                    previousPageButton.style.display = 'inline-block';
                    nextPageButton.style.display = 'inline-block';
                }
            }

            // Event listener for search button
            document.getElementById('search-button').addEventListener('click', () => {
                const query = searchInput.value;
                currentPage = 1;
                fetchLeaderboard(query, currentPage);
            });

            // Event listeners for pagination buttons
            previousPageButton.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    fetchLeaderboard(searchInput.value, currentPage);
                }
            });

            nextPageButton.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    fetchLeaderboard(searchInput.value, currentPage);
                }
            });

            // Initial fetch of leaderboard data
            fetchLeaderboard();
        });
    </script>
</body>
</html>