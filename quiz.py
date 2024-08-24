import streamlit as st
import PyPDF2
import docx
import re
from typing import List, Dict, Union
from io import BytesIO
import datetime
import json
from streamlit_lottie import st_lottie
import requests

class QuizApp:
    def __init__(self):
        if 'quiz_name' not in st.session_state:
            st.session_state.quiz_name = ""
        if 'extracted_questions' not in st.session_state:
            st.session_state.extracted_questions = []
        if 'correct_answers' not in st.session_state:
            st.session_state.correct_answers = {}

    def extract_questions(self, file, num_questions):
        content = self.read_file(file)
        questions = self.parse_questions(content)
        self.questions = questions[:num_questions]

    def read_file(self, file):
        if file.name.endswith('.pdf'):
            return self.read_pdf(file)
        elif file.name.endswith('.docx'):
            return self.read_docx(file)
        else:
            return file.getvalue().decode()

    def read_pdf(self, file):
        pdf_reader = PyPDF2.PdfReader(file)
        content = ""
        for page in pdf_reader.pages:
            content += page.extract_text() + "\n"
        return content

    def read_docx(self, file):
        doc = docx.Document(BytesIO(file.getvalue()))
        content = ""
        for para in doc.paragraphs:
            content += para.text + "\n"
        return content

    def parse_questions(self, content: str) -> List[Dict[str, Union[str, List[str]]]]:
        questions = []
        
        # Method 1: Parse based on question numbers
        questions.extend(self.parse_questions_by_numbers(content))
        
        # Method 2: Parse based on keywords
        if not questions:
            questions.extend(self.parse_questions_by_keywords(content))
        
        # Method 3: Parse based on line breaks and options
        if not questions:
            questions.extend(self.parse_questions_by_line_breaks(content))

        return questions

    def parse_questions_by_numbers(self, content: str) -> List[Dict[str, Union[str, List[str]]]]:
        questions = []
        lines = content.split('\n')
        current_question = None
        current_options = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if re.match(r'^(\d+\.|\w+\.)\s', line):
                if current_question:
                    questions.append(self.format_question(current_question, current_options))
                current_question = line
                current_options = []
            elif current_question:
                option_match = re.match(r'^([a-d])\)\s*(.*)', line)
                if option_match:
                    current_options.append(option_match.group(2))
                else:
                    current_question += " " + line

        if current_question:
            questions.append(self.format_question(current_question, current_options))

        return questions

    def parse_questions_by_keywords(self, content: str) -> List[Dict[str, Union[str, List[str]]]]:
        questions = []
        question_keywords = ['what', 'when', 'where', 'who', 'why', 'how']
        lines = content.split('\n')
        current_question = None
        current_options = []

        for line in lines:
            line = line.strip().lower()
            if not line:
                continue

            if any(line.startswith(keyword) for keyword in question_keywords):
                if current_question:
                    questions.append(self.format_question(current_question, current_options))
                current_question = line
                current_options = []
            elif current_question:
                option_match = re.match(r'^([a-d])\)\s*(.*)', line)
                if option_match:
                    current_options.append(option_match.group(2))
                else:
                    current_question += " " + line

        if current_question:
            questions.append(self.format_question(current_question, current_options))

        return questions

    def parse_questions_by_line_breaks(self, content: str) -> List[Dict[str, Union[str, List[str]]]]:
        questions = []
        lines = content.split('\n')
        current_question = None
        current_options = []

        for line in lines:
            line = line.strip()
            if not line:
                if current_question:
                    questions.append(self.format_question(current_question, current_options))
                    current_question = None
                    current_options = []
                continue

            option_match = re.match(r'^([a-d])\)\s*(.*)', line)
            if option_match:
                if not current_question:
                    current_question = "Implied question"
                current_options.append(option_match.group(2))
            elif not current_question:
                current_question = line
            else:
                current_options.append(line)

        if current_question:
            questions.append(self.format_question(current_question, current_options))

        return questions

    def format_question(self, question: str, options: List[str]) -> Dict[str, Union[str, List[str]]]:
        question = re.sub(r'^\d+\.\s*', '', question)
        question = re.sub(r'\s*[a-d]\)\s*.*', '', question)

        if options:
            return {
                'question': question.strip(),
                'options': options,
                'type': 'multiple_choice'
            }
        else:
            return {
                'question': question.strip(),
                'options': [],
                'type': 'fill_in_blank'
            }

    def create_quiz(self):
        st.title("Create Quiz")
        
        quiz_name = st.text_input("Enter Quiz Name", value=st.session_state.quiz_name)
        st.session_state.quiz_name = quiz_name

        uploaded_file = st.file_uploader("Upload a document (PDF, DOCX, or TXT)", type=["pdf", "docx", "txt"])
        num_questions = st.number_input("Number of questions to extract", min_value=1, value=10)
        
        if uploaded_file and st.button("Extract Questions"):
            self.extract_questions(uploaded_file, num_questions)
            st.session_state.extracted_questions = self.questions
            st.success(f"Extracted {len(self.questions)} questions")
        
        if st.session_state.extracted_questions:
            for i, q in enumerate(st.session_state.extracted_questions):
                st.subheader(f"Question {i+1}")
                st.write(q['question'])
                if q['type'] == 'multiple_choice':
                    correct_answer = st.selectbox(f"Select correct answer for Question {i+1}", q['options'], key=f"correct_{i}")
                else:
                    correct_answer = st.text_input(f"Enter correct answer for Question {i+1}", key=f"correct_{i}")
                st.session_state.correct_answers[i] = correct_answer
        
        if st.button("Save Quiz"):
            if quiz_name and st.session_state.extracted_questions:
                if 'quizzes' not in st.session_state:
                    st.session_state.quizzes = {}
                st.session_state.quizzes[quiz_name] = {
                    'questions': st.session_state.extracted_questions,
                    'correct_answers': st.session_state.correct_answers
                }
                st.success(f"Quiz '{quiz_name}' saved successfully!")
                st.session_state.quiz_name = ""
                st.session_state.extracted_questions = []
                st.session_state.correct_answers = {}
                st.rerun()
            else:
                if not quiz_name:
                    st.error("Please enter a quiz name.")
                if not st.session_state.extracted_questions:
                    st.error("Please extract questions before saving.")

    def take_quiz(self):
        st.title("Take Quiz")
        
        if 'quizzes' not in st.session_state or not st.session_state.quizzes:
            st.error("No quizzes available. Please create a quiz first.")
            return
        
        quiz_name = st.selectbox("Select a quiz to take", list(st.session_state.quizzes.keys()))
        
        if st.button("Start Quiz"):
            quiz = st.session_state.quizzes[quiz_name]
            st.session_state.current_quiz = quiz
            st.session_state.start_time = datetime.datetime.now()
            st.session_state.user_answers = {}
            st.rerun()
        
        if 'current_quiz' in st.session_state:
            self.display_quiz(st.session_state.current_quiz)

    def display_quiz(self, quiz):
        st.write(f"Start Time: {st.session_state.start_time}")
        
        for i, q in enumerate(quiz['questions']):
            st.subheader(f"Question {i+1}")
            st.write(q['question'])
            if q['type'] == 'multiple_choice':
                # Use radio buttons without any default selection
                answer = st.radio(f"Select answer for Question {i+1}", q['options'], key=f"q_{i}", index=None)
                if answer is not None:
                    st.session_state.user_answers[i] = answer
            else:
                answer = st.text_input(f"Enter your answer for Question {i+1}", key=f"q_{i}")
                st.session_state.user_answers[i] = answer
        
        if st.button("Submit Quiz"):
            end_time = datetime.datetime.now()
            self.calculate_score(quiz, st.session_state.user_answers, st.session_state.start_time, end_time)

    def calculate_score(self, quiz, user_answers, start_time, end_time):
        correct_count = 0
        total_questions = len(quiz['questions'])
        
        for i, question in enumerate(quiz['questions']):
            if str(user_answers.get(i, '')).strip().lower() == str(quiz['correct_answers'].get(i, '')).strip().lower():
                correct_count += 1
        
        score_percentage = (correct_count / total_questions) * 100
        
        self.display_score_feedback(score_percentage, correct_count, total_questions, start_time, end_time)
        
        st.session_state.pop('current_quiz', None)
        st.session_state.pop('user_answers', None)
        st.session_state.pop('start_time', None)
      
        
    def display_score_feedback(self, score_percentage, correct_count, total_questions, start_time, end_time):
            # Determine which animation to show based on score
        if score_percentage == 100:
            animation_url = "https://assets9.lottiefiles.com/packages/lf20_aEFaHc.json"
            message = "🎉 Perfect Score! You're amazing! 🎉"
        elif score_percentage >= 90:
            animation_url = "https://assets1.lottiefiles.com/packages/lf20_usmfx6bp.json"
            message = "🌟 Outstanding Performance! 🌟"
        elif score_percentage >= 75:
            animation_url = "https://assets9.lottiefiles.com/private_files/lf30_loyzcnxj.json"
            message = "👍 Well Done! Keep pushing yourself! 👍"
        elif score_percentage >= 50:
            animation_url = "https://assets2.lottiefiles.com/packages/lf20_aYfBBE.json"
            message = "💪 Good Effort! There's room for improvement. 💪"
        else:
            animation_url = "https://assets3.lottiefiles.com/packages/lf20_qm8eqzse.json"
            message = "📚 Time to hit the books! You can do better! 📚"

        # Create a container for the pop-up
        popup = st.empty()

        with popup.container():
            col1, col2 = st.columns([1, 1])

            with col1:
                # Display Lottie animation
                animation_json = requests.get(animation_url).json()
                st_lottie(animation_json, key="score_animation", height=200)

            with col2:
                st.title("Quiz Results")
                st.write(f"Start Time: {start_time}")
                st.write(f"End Time: {end_time}")
                st.write(f"Time Taken: {end_time - start_time}")
                st.write(f"Score: {correct_count}/{total_questions}")
                st.progress(score_percentage / 100)
                st.write(f"Percentage: {score_percentage:.2f}%")
                st.subheader(message)

            if st.button("Close"):
                popup.empty()

    def calculate_score(self, quiz, user_answers, start_time, end_time):
        correct_count = 0
        total_questions = len(quiz['questions'])
        
        for i, question in enumerate(quiz['questions']):
            if str(user_answers.get(i, '')).strip().lower() == str(quiz['correct_answers'].get(i, '')).strip().lower():
                correct_count += 1
        
        score_percentage = (correct_count / total_questions) * 100
        
        self.display_score_feedback(score_percentage, correct_count, total_questions, start_time, end_time)
        
        st.session_state.pop('current_quiz', None)
        st.session_state.pop('user_answers', None)
        st.session_state.pop('start_time', None)

def main():
    st.set_page_config(page_title="Interactive Quiz App", layout="wide")
    st.sidebar.title("Quiz App")
    
    app_mode = st.sidebar.radio("Choose the app mode", ["Create Quiz", "Take Quiz"])
    
    quiz_app = QuizApp()
    
    if app_mode == "Create Quiz":
        quiz_app.create_quiz()
    elif app_mode == "Take Quiz":
        quiz_app.take_quiz()

if __name__ == "__main__":
    main()