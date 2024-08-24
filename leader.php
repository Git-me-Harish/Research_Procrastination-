<?php
session_start();
$teacher_name = $_SESSION['teacher_name'] ?? '';
?>

<!DOCTYPE html>
<html>
<head>
    <title>Leaderboard</title>
    <link rel="stylesheet" href="#">
</head>
<body>
<style>
    /* General Styles */
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        color: #333;
    }

    .leaderboard-container {
        max-width: 1200px;
        margin: 20px auto;
        padding: 20px;
        background-color: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        position: relative;
    }

    h1 {
        text-align: center;
        margin-bottom: 20px;
    }

    /* Form Styles */
    #search-form {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }

    #search-input {
        width: 300px;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px 0 0 5px;
        outline: none;
    }

    #search-button {
        padding: 10px 20px;
        border: 1px solid #ccc;
        border-left: none;
        border-radius: 0 5px 5px 0;
        background-color: #007bff;
        color: #fff;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    #search-button:hover {
        background-color: #0056b3;
    }

    /* Table Styles */
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }

    thead {
        background-color: #007bff;
        color: #fff;
    }

    thead th {
        padding: 10px;
        text-align: left;
    }

    tbody tr:nth-child(odd) {
        background-color: #f9f9f9;
    }

    tbody tr:nth-child(even) {
        background-color: #fff;
    }

    tbody td {
        padding: 10px;
        border-bottom: 1px solid #ddd;
    }

    tbody td a {
        color: #007bff;
        text-decoration: none;
    }

    tbody td a:hover {
        text-decoration: underline;
    }

    /* Pagination Styles */
    #pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 20px;
    }

    #pagination button {
        padding: 10px 20px;
        border: 1px solid #007bff;
        background-color: #007bff;
        color: #fff;
        cursor: pointer;
        transition: background-color 0.3s;
        margin: 0 5px;
    }

    #pagination button:hover {
        background-color: #0056b3;
    }

    #pagination #current-page {
        margin: 0 10px;
    }

    /* Analysis Button Styles */
    .analysis-button {
        position: absolute;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background-color: #28a745;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .analysis-button:hover {
        background-color: #218838;
    }

    /* Responsive Styles */
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
        }

        tbody td {
            text-align: right;
            padding-left: 50%;
            position: relative;
        }

        tbody td::before {
            content: attr(data-label);
            position: absolute;
            left: 0;
            width: 50%;
            padding-left: 15px;
            font-weight: bold;
            text-align: left;
        }
    }
</style>
<div class="leaderboard-container">
    <h1>Leaderboard</h1>
    <form id="search-form">
        <input type="search" id="search-input" placeholder="Search by student name">
        <button type="button" id="search-button">Search</button>
    </form>
    <div id="leaderboard-content">
        <!-- leaderboard data will be populated here -->
    </div>
    <div id="pagination">
        <button id="previous-page">Previous</button>
        <button id="next-page">Next</button>
        <span id="current-page">Page 1 of 1</span>
    </div>

    <!-- Analysis Button -->
    <button class="analysis-button" onclick="location.href='analysis2.php'">Analysis</button>

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
