-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 19, 2024 at 07:04 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `test`
--

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` int(11) NOT NULL,
  `qn` int(11) NOT NULL,
  `question` text NOT NULL,
  `opt1` varchar(100) NOT NULL,
  `opt2` varchar(100) NOT NULL,
  `opt3` varchar(100) NOT NULL,
  `opt4` varchar(100) NOT NULL,
  `answer` text NOT NULL,
  `title` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`id`, `qn`, `question`, `opt1`, `opt2`, `opt3`, `opt4`, `answer`, `title`) VALUES
(101, 1, 'Which of the following is the correct extension for Python files?', ' .pyth', ' .py', '.pt', '.pyt', ' .py', 'Python Basics'),
(102, 2, 'What is the output of print(type([])) in Python?', ' <class \'list\'>', ' <class \'tuple\'>', '<class \'dictionary\'>', '<class \'set\'>', ' <class \'list\'>', 'Python Basics'),
(103, 3, 'Which of the following is a valid variable name in Python?', '1variable', 'variable_1', ' variable-1', 'variable.1', 'variable_1', 'Python Basics'),
(104, 4, 'What is the result of 3 + 2 * 2 in Python?', '7', '10', '12', '9', '7', 'Python Basics'),
(105, 5, 'Which keyword is used to define a function in Python?', 'func', 'define', 'def', 'function', 'def', 'Python Basics'),
(106, 6, 'What is the output of print(2**3) in Python?', '8', '6', '9', '7', '8', 'Python Basics'),
(107, 7, 'Which of the following data types is immutable in Python?', 'List', 'Dictionary', 'Set', ' Tuple', ' Tuple', 'Python Basics'),
(108, 8, 'How do you create a comment in Python?', '//', '#', '/*', ' !', '#', 'Python Basics'),
(109, 9, 'Which of the following functions can be used to find the length of a string in Python?', 'len()', ' length()', 'size()', 'str_len()', 'len()', 'Python Basics'),
(110, 10, 'What is the output of print(\'Hello\' + \' World!\')?', 'HelloWorld!', 'Hello World!', 'Hello World', 'Hello+World!', 'Hello World!', 'Python Basics'),
(111, 11, 'Which of the following is a correct syntax to create a set in Python?', 'my_set = {1, 2, 3}', 'my_set = [1, 2, 3]', 'my_set = (1, 2, 3)', 'my_set = <1, 2, 3>', 'my_set = {1, 2, 3}', 'Python Basics'),
(112, 12, 'What will be the output of the following code: print(bool(0))?', 'True', 'False', 'Error', 'None', 'False', 'Python Basics'),
(113, 13, 'Which of the following is used to define a block of code in Python?', ' Curly braces {}', ' Parentheses ()', 'Indentation', 'Square brackets []', 'Indentation', 'Python Basics'),
(114, 14, 'What is the purpose of the pass statement in Python?', 'It breaks out of a loop', ' It is a placeholder for future code', 'It returns a value', 'It continues to the next iteration of a loop', ' It is a placeholder for future code', 'Python Basics'),
(115, 15, 'Which method is used to remove whitespace characters from the beginning and end of a string in Python?', 'trim()', 'strip()', 'remove()', 'lstrip()', 'strip()', 'Python Basics'),
(116, 1, 'What does SQL stand for?', 'Structured Query Language', 'Simple Query Language', 'Structured Question Language', 'Standard Query Language', 'Structured Query Language', 'SQL Basics'),
(117, 2, 'Which SQL statement is used to retrieve data from a database?', 'SELECT', 'GET', 'OPEN', 'EXTRACT', 'SELECT', 'SQL Basics'),
(118, 3, 'Which of the following is not a SQL data type?', 'INT', 'VARCHAR', 'CHAR', 'BOOLEAN', 'BOOLEAN', 'SQL Basics'),
(119, 4, 'What is the correct SQL syntax to create a new table named \"Students\"?', 'CREATE TABLE Students;', 'CREATE Students TABLE;', 'CREATE TABLE \"Students\";', 'CREATE TABLE (Students);', 'CREATE TABLE Students;', 'SQL Basics'),
(120, 5, 'Which SQL clause is used to filter records in a SELECT statement?', 'WHERE', 'FROM', 'HAVING', 'ORDER BY', 'WHERE', 'SQL Basics'),
(121, 6, 'How do you select all columns from a table named \"Employees\"?', 'SELECT * FROM Employees;', 'SELECT Employees FROM *;', 'SELECT ALL FROM Employees;', 'SELECT * FROM Employees WHERE ALL;', 'SELECT * FROM Employees;', 'SQL Basics'),
(122, 7, 'Which SQL statement is used to delete data from a database?', 'REMOVE', 'DELETE', 'DROP', 'ERASE', 'DELETE', 'SQL Basics'),
(123, 8, 'What is the purpose of the GROUP BY clause in SQL?', 'To sort the result set', 'To group rows that have the same values in specified columns', 'To filter records', 'To join tables', 'To group rows that have the same values in specified columns', 'SQL Basics'),
(124, 9, 'Which SQL function is used to count the number of rows in a result set?', 'SUM()', 'COUNT()', 'AVG()', 'TOTAL()', 'COUNT()', 'SQL Basics'),
(125, 10, 'What is the correct SQL statement to update the \"email\" field in a table named \"Users\" for a specific user?', 'UPDATE Users SET email = \'newemail@example.com\' WHERE id = 1;', 'MODIFY Users SET email = \'newemail@example.com\' WHERE id = 1;', 'CHANGE Users SET email = \'newemail@example.com\' WHERE id = 1;', 'ALTER Users SET email = \'newemail@example.com\' WHERE id = 1;', 'UPDATE Users SET email = \'newemail@example.com\' WHERE id = 1;', 'SQL Basics');

-- --------------------------------------------------------

--
-- Table structure for table `exam`
--

CREATE TABLE `exam` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `timer` int(11) NOT NULL,
  `teacher` varchar(100) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `c_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `exam`
--

INSERT INTO `exam` (`id`, `title`, `timer`, `teacher`, `subject`, `c_date`) VALUES
(68, 'Python Basics', 15, 'Ramnivash', 'Computer Science', '2024-08-19 19:27:17'),
(69, 'SQL Basics', 10, 'Ramnivash', 'Computer Science', '2024-08-19 22:06:07');

-- --------------------------------------------------------

--
-- Table structure for table `feed`
--

CREATE TABLE `feed` (
  `id` int(11) NOT NULL,
  `qn` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `reason` varchar(100) NOT NULL,
  `title` varchar(100) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `timing` time NOT NULL,
  `c_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `feed`
--

INSERT INTO `feed` (`id`, `qn`, `name`, `reason`, `title`, `subject`, `timing`, `c_date`) VALUES
(32, 3, 'Harish', 'More Questions', 'SQL Basics', 'Computer Science', '00:00:12', '2024-08-19 22:25:49'),
(33, 2, 'brama', 'Boring', 'SQL Basics', 'Computer Science', '00:00:09', '2024-08-19 22:27:59'),
(34, 2, 'Moorthy', 'Boring', 'SQL Basics', 'Computer Science', '00:00:06', '2024-08-19 22:29:34');

-- --------------------------------------------------------

--
-- Table structure for table `marks`
--

CREATE TABLE `marks` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `stu_name` varchar(100) NOT NULL,
  `correct` int(11) NOT NULL,
  `wrong` int(11) NOT NULL,
  `marks` int(11) NOT NULL,
  `date` date NOT NULL DEFAULT current_timestamp(),
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `time_difference` time NOT NULL,
  `status` varchar(10) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `marks`
--

INSERT INTO `marks` (`id`, `title`, `stu_name`, `correct`, `wrong`, `marks`, `date`, `start_time`, `end_time`, `time_difference`, `status`) VALUES
(85, 'Python Basics', 'Manoj', 9, 6, 60, '2024-08-19', '20:15:32', '20:17:50', '00:01:38', 'completed'),
(86, 'Python Basics', 'Adharv', 8, 7, 53, '2024-08-19', '20:33:42', '20:35:11', '00:00:00', 'completed'),
(87, 'Python Basics', 'Moorthy', 11, 4, 73, '2024-08-19', '20:59:49', '21:01:21', '00:00:00', 'completed'),
(88, 'Python Basics', 'Athish', 10, 5, 67, '2024-08-19', '21:06:11', '21:07:41', '00:00:00', 'completed'),
(89, 'SQL Basics', 'Manoj', 6, 4, 60, '2024-08-19', '22:06:29', '22:07:25', '00:00:56', 'completed');

-- --------------------------------------------------------

--
-- Table structure for table `stu_signup`
--

CREATE TABLE `stu_signup` (
  `id` int(11) NOT NULL,
  `na` varchar(100) NOT NULL,
  `em` varchar(100) NOT NULL,
  `pass` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `stu_signup`
--

INSERT INTO `stu_signup` (`id`, `na`, `em`, `pass`) VALUES
(12, 'Harish', 'harish@gmail.com', '$2y$10$9fAxKQ1P/WqhcYqYeOEeOOMqTZ7pTs1JyxdSLyGnPHw/ReM6i/sVK'),
(13, 'brama', 'brama@gmail.com', '$2y$10$h9QUVqU8N7NpWyzPoBOpDOsokId8XWAZETbySQp67ZnXp2JkZ5wzO'),
(14, 'Manoj', 'manoj@gmail.com', '$2y$10$a1ONo652N0WXQE7b38p1Ie4C/qb/.XsOm0q0JxSdaEEB7a.UVxr1S'),
(15, 'Adharv', 'adharv@gmail.com', '$2y$10$VAmLOdJKYFXNeAkEqlM42.AI3PzGOxSnuUWjBmwGBJSyCQDxpBzTe'),
(16, 'Manish', 'manish@gmail.com', '$2y$10$JR5rBEBjqSAV3oKFsEdcP.F6MzjzM2Damv1eQPLY3efmWM.U9Qeka'),
(17, 'Sanjay', 'sanjay@gmail.com', '$2y$10$fhl9IR6Mr6PTyRPE/PR/PO/Uy9FBh78us2e7w1Y6DnNs.5C27fZ3G'),
(18, 'Moorthy', 'moorthy@gmail.com', '$2y$10$GaIziu4CTxDISU5VpVmVkO8ifkhh3eqwA6I917EJF1SOmBn.u8aDy'),
(19, 'Athish', 'athish@gmail.com', '$2y$10$6UGfvK8rNHMRzoP3Il.rke3I2qNJwEi0wHcAKrt3zSP.0v3C7wZoi'),
(20, 'Nikhil', 'nikhil@gmail.com', '$2y$10$iicKC1tUaOyFAPIp8Rq9geA0F1e2Fql5J1.UpX5/aRO4NI5D4NzOS'),
(21, 'Kanishk', 'kanishk@gmail.com', '$2y$10$GLLnA.uVBtyO2Xs4L/i.Fep2q.PGoEUSynW2AKIMET.FeU1R2AxOu');

-- --------------------------------------------------------

--
-- Table structure for table `tea_signup`
--

CREATE TABLE `tea_signup` (
  `id` int(11) NOT NULL,
  `na` varchar(100) NOT NULL,
  `em` varchar(100) NOT NULL,
  `pass` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tea_signup`
--

INSERT INTO `tea_signup` (`id`, `na`, `em`, `pass`) VALUES
(12, 'Ramnivash', 'ram@gmail.com', '$2y$10$SwB7rsQUZxuauA5zryyXtOFQ5xD.4uxcXGyljfytrRAe0NzjmogR2');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `exam`
--
ALTER TABLE `exam`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `feed`
--
ALTER TABLE `feed`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `marks`
--
ALTER TABLE `marks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stu_signup`
--
ALTER TABLE `stu_signup`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tea_signup`
--
ALTER TABLE `tea_signup`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT for table `exam`
--
ALTER TABLE `exam`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `feed`
--
ALTER TABLE `feed`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `marks`
--
ALTER TABLE `marks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `stu_signup`
--
ALTER TABLE `stu_signup`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `tea_signup`
--
ALTER TABLE `tea_signup`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
