from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.batches.models import Batch
from apps.students.models import StudentProfile
from apps.courses.models import Course, CourseEnrollment
from apps.curriculum.models import CourseWeek, Topic
from apps.questions.models import Question
from apps.quizzes.models import Quiz, QuizQuestion
from apps.attempts.models import QuizAttempt, AttemptQuestion, AttemptAnswer
from apps.announcements.models import Announcement

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds database with realistic demo data for KDTechX Learning & Assessment Portal'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Initializing KDTechX Database Demo Seeding..."))

        # 1. Admin Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@kdtechx.edu',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        lead_trainer, _ = User.objects.get_or_create(
            username='maruthi25',
            defaults={
                'email': 'trainer@kdtechx.edu',
                'first_name': 'Maruthi',
                'last_name': 'Lead Trainer',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            }
        )
        lead_trainer.set_password('maruthis@2529')
        lead_trainer.save()
        self.stdout.write(self.style.SUCCESS("[OK] Admin and Lead Trainer seeded."))

        # 2. Batches
        batch_pfs, _ = Batch.objects.get_or_create(
            code='PFS-2026-A',
            defaults={
                'name': 'Python Full Stack 2026',
                'description': 'Premier evening engineering cohort covering Python, Django, APIs, and React.',
                'status': Batch.Status.ACTIVE
            }
        )
        batch_aiml, _ = Batch.objects.get_or_create(
            code='AIML-2026',
            defaults={
                'name': 'AI & ML Masters 2026',
                'description': 'Advanced machine learning, deep learning, and generative AI track.',
                'status': Batch.Status.ACTIVE
            }
        )
        batch_ds, _ = Batch.objects.get_or_create(
            code='DS-2026-B',
            defaults={
                'name': 'Data Science Cohort 2026',
                'description': 'Exploratory data analysis, statistical modeling, and data pipelines.',
                'status': Batch.Status.ACTIVE
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Batches seeded."))

        # 3. Courses
        c_py, _ = Course.objects.get_or_create(
            code='PY-FS-101',
            defaults={
                'name': 'Python Full Stack Development',
                'description': 'Master Python 3, object-oriented design, Django REST Framework, and full-stack integration.',
                'category': 'Full Stack',
                'level': Course.Level.INTERMEDIATE,
                'duration_weeks': 8,
                'thumbnail': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=600&q=80',
                'status': Course.Status.PUBLISHED,
                'created_by': lead_trainer
            }
        )
        c_ds, _ = Course.objects.get_or_create(
            code='DS-PY-201',
            defaults={
                'name': 'Data Science with Python',
                'description': 'Data wrangling, statistical inference, feature engineering, NumPy, Pandas, and visualization.',
                'category': 'Data Science',
                'level': Course.Level.BEGINNER,
                'duration_weeks': 6,
                'thumbnail': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
                'status': Course.Status.PUBLISHED,
                'created_by': lead_trainer
            }
        )
        c_react, _ = Course.objects.get_or_create(
            code='REACT-301',
            defaults={
                'name': 'React JS Development',
                'description': 'Modern front-end engineering with React 19, hooks, component architecture, and state management.',
                'category': 'Frontend',
                'level': Course.Level.INTERMEDIATE,
                'duration_weeks': 6,
                'thumbnail': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
                'status': Course.Status.PUBLISHED,
                'created_by': lead_trainer
            }
        )
        c_aiml, _ = Course.objects.get_or_create(
            code='AI-ML-401',
            defaults={
                'name': 'Artificial Intelligence & Machine Learning',
                'description': 'Supervised and unsupervised models, neural networks, transformers, and model evaluation.',
                'category': 'Machine Learning',
                'level': Course.Level.ADVANCED,
                'duration_weeks': 10,
                'thumbnail': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
                'status': Course.Status.PUBLISHED,
                'created_by': lead_trainer
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Courses seeded."))

        # 4. Curriculum Weeks & Topics for Python Course
        w1_py, _ = CourseWeek.objects.get_or_create(
            course=c_py,
            week_number=1,
            defaults={'title': 'Python Fundamentals & Data Structures', 'order': 1}
        )
        w2_py, _ = CourseWeek.objects.get_or_create(
            course=c_py,
            week_number=2,
            defaults={'title': 'OOP, Decorators & Generators', 'order': 2}
        )
        w3_py, _ = CourseWeek.objects.get_or_create(
            course=c_py,
            week_number=3,
            defaults={'title': 'Django Architecture & Models', 'order': 3}
        )

        t_py1, _ = Topic.objects.get_or_create(week=w1_py, title='Data Types, Lists & Dicts', defaults={'order': 1})
        t_py2, _ = Topic.objects.get_or_create(week=w2_py, title='Classes, Methods & Inheritance', defaults={'order': 1})
        t_py3, _ = Topic.objects.get_or_create(week=w2_py, title='Decorators, Closures & Context Managers', defaults={'order': 2})

        # Weeks for React Course
        w1_react, _ = CourseWeek.objects.get_or_create(
            course=c_react,
            week_number=1,
            defaults={'title': 'Components, JSX & Props', 'order': 1}
        )
        w2_react, _ = CourseWeek.objects.get_or_create(
            course=c_react,
            week_number=2,
            defaults={'title': 'State, useEffect & Hooks', 'order': 2}
        )
        t_react1, _ = Topic.objects.get_or_create(week=w1_react, title='Component Lifecycle & Virtual DOM', defaults={'order': 1})
        t_react2, _ = Topic.objects.get_or_create(week=w2_react, title='Hooks & Performance Optimization', defaults={'order': 1})

        # 5. Students (5 verified accounts)
        student_data = [
            {
                'username': 'arun',
                'student_id': 'KDX26001',
                'first_name': 'Arun',
                'last_name': 'Kumar',
                'email': 'arun.kumar@kdtechx.edu',
                'batch': batch_pfs,
                'courses': [c_py, c_react],
                'avatar': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80'
            },
            {
                'username': 'priya',
                'student_id': 'KDX26002',
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'email': 'priya.sharma@kdtechx.edu',
                'batch': batch_pfs,
                'courses': [c_py, c_ds],
                'avatar': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
            },
            {
                'username': 'vikram',
                'student_id': 'KDX26003',
                'first_name': 'Vikram',
                'last_name': 'Aditya',
                'email': 'vikram.aditya@kdtechx.edu',
                'batch': batch_aiml,
                'courses': [c_aiml, c_ds],
                'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
            },
            {
                'username': 'ananya',
                'student_id': 'KDX26004',
                'first_name': 'Ananya',
                'last_name': 'Deshmukh',
                'email': 'ananya.d@kdtechx.edu',
                'batch': batch_pfs,
                'courses': [c_py],
                'avatar': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
            },
            {
                'username': 'rohan',
                'student_id': 'KDX26005',
                'first_name': 'Rohan',
                'last_name': 'Mehra',
                'email': 'rohan.mehra@kdtechx.edu',
                'batch': batch_ds,
                'courses': [c_ds],
                'avatar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
            },
        ]

        student_profiles = {}
        for s in student_data:
            u, _ = User.objects.get_or_create(
                username=s['username'],
                defaults={
                    'email': s['email'],
                    'first_name': s['first_name'],
                    'last_name': s['last_name'],
                    'role': User.Role.STUDENT,
                    'avatar': s['avatar']
                }
            )
            u.set_password('password123')
            u.save()

            sp, _ = StudentProfile.objects.get_or_create(
                user=u,
                defaults={
                    'student_id': s['student_id'],
                    'batch': s['batch'],
                    'status': StudentProfile.Status.ACTIVE,
                    'last_active_at': timezone.now() - timedelta(hours=2)
                }
            )
            student_profiles[s['username']] = sp

            for crs in s['courses']:
                CourseEnrollment.objects.get_or_create(
                    student=sp,
                    course=crs,
                    defaults={'assigned_by': lead_trainer}
                )

        self.stdout.write(self.style.SUCCESS("[OK] 5 Verified Student accounts seeded."))

        # 6. Question Bank (55+ technical questions across courses)
        raw_questions = [
            # Python Questions (15 items)
            (c_py, t_py1, "Which of the following is mutable in Python?", "Tuple", "String", "List", "FrozenSet", "C", "easy", "Lists are mutable sequences in Python.", 1.0),
            (c_py, t_py1, "What is the time complexity of looking up a key in a Python dictionary on average?", "O(n)", "O(1)", "O(log n)", "O(n^2)", "B", "medium", "Python dicts use hash tables providing average O(1) key lookups.", 1.0),
            (c_py, t_py1, "What does the expression [x**2 for x in range(5) if x % 2 == 0] evaluate to?", "[0, 4, 16]", "[1, 9]", "[0, 1, 4, 9, 16]", "[4, 16]", "A", "easy", "Evaluates squares of 0, 2, and 4.", 1.0),
            (c_py, t_py1, "Which built-in function returns a tuple containing the index and item of an iterable?", "enumerate()", "zip()", "map()", "filter()", "A", "easy", "enumerate() yields (index, item) pairs.", 1.0),
            (c_py, t_py1, "What will be the output of bool([]) in Python?", "True", "False", "None", "Error", "B", "easy", "Empty containers evaluate to False in boolean context.", 1.0),
            (c_py, t_py2, "In Python, which method is invoked when an object is instantiated?", "__init__", "__new__", "__call__", "__repr__", "A", "easy", "__init__ is the instance initializer.", 1.0),
            (c_py, t_py2, "How do you achieve method overriding in Python?", "By defining a method in a child class with the same name as in parent class", "Using the override keyword", "Using @overload decorator", "Python does not support method overriding", "A", "medium", "Defining matching signature in subclass overrides parent method.", 1.0),
            (c_py, t_py2, "What does the super() function do in Python?", "Calls the destructor", "Returns a proxy object delegating method calls to a parent class", "Declares an abstract method", "Forces garbage collection", "B", "medium", "super() allows calling parent class implementations.", 1.0),
            (c_py, t_py2, "What is the Method Resolution Order (MRO) algorithm used by Python?", "Depth First Search", "Breadth First Search", "C3 Linearization", "Dijkstra Algorithm", "C", "hard", "Python 3 uses C3 Linearization to resolve multiple inheritance.", 1.0),
            (c_py, t_py3, "What is the primary function of Python's @property decorator?", "Converts method to private", "Allows getter and setter syntax for class methods", "Enforces static types", "Converts function to coroutine", "B", "medium", "@property exposes a method as a managed attribute.", 1.0),
            (c_py, t_py3, "Which keyword turns a regular Python function into a generator?", "return", "yield", "async", "generate", "B", "easy", "yield produces a value and suspends function state.", 1.0),
            (c_py, t_py3, "Which dunder methods must a class implement to act as a context manager with the 'with' statement?", "__enter__ and __exit__", "__start__ and __stop__", "__open__ and __close__", "__begin__ and __commit__", "A", "medium", "Context managers require __enter__ and __exit__.", 1.0),
            (c_py, t_py3, "What does functools.wraps do when creating custom decorators?", "Accelerates bytecode execution", "Preserves original function name and docstrings", "Encrypts function arguments", "Enforces type annotations", "B", "medium", "functools.wraps copies metadata from decorated function.", 1.0),
            (c_py, t_py3, "What is GIL in standard CPython?", "Global Interface Layer", "Global Interpreter Lock", "General Instruction Loop", "Generic Iteration Linker", "B", "medium", "The GIL is a mutex that prevents multiple native threads from executing Python bytecodes simultaneously.", 1.0),
            (c_py, t_py3, "Which module provides high-performance container data types such as deque, Counter, and defaultdict?", "itertools", "collections", "types", "functools", "B", "easy", "The collections module provides specialized container datatypes.", 1.0),

            # React Questions (15 items)
            (c_react, t_react1, "What is JSX in React?", "A JavaScript extension allowing HTML-like syntax", "A standalone templating language", "A JSON dialect", "A state management library", "A", "easy", "JSX produces React elements with HTML-like syntax.", 1.0),
            (c_react, t_react1, "Why should list items in React have unique 'key' props?", "For CSS styling purposes", "To help React identify which items have changed, been added, or removed in the DOM diffing process", "To bind click events", "To enable server-side rendering", "B", "medium", "Keys give stable identity to array items for reconciliation.", 1.0),
            (c_react, t_react1, "Are React props mutable by the receiving component?", "Yes, anytime", "No, props are read-only (immutable)", "Only inside class components", "Only if passed by reference", "B", "easy", "React components must act like pure functions regarding props.", 1.0),
            (c_react, t_react1, "What is the Virtual DOM in React?", "An in-memory lightweight representation of the real DOM", "A browser extension", "A web worker thread", "A replacement for HTML", "A", "easy", "The Virtual DOM optimizes updates before applying them to native DOM.", 1.0),
            (c_react, t_react2, "What does the useState hook return?", "An object containing state and dispatch", "An array with the current state value and a state updater function", "A single state reference", "A promise resolving to state", "B", "easy", "const [state, setState] = useState(initial);", 1.0),
            (c_react, t_react2, "When does a useEffect hook with an empty dependency array [] execute?", "Before every render", "After every render", "Only once after initial component mount", "Only on component unmount", "C", "medium", "Empty dependency array indicates the effect runs on mount.", 1.0),
            (c_react, t_react2, "What is the purpose of the cleanup function returned inside useEffect?", "To trigger garbage collection", "To unsubscribe, clear timers, or abort pending requests on unmount/re-render", "To reset component state", "To reload the page", "B", "medium", "Returned function is executed when cleaning up previous effects.", 1.0),
            (c_react, t_react2, "Which hook is designed to memoize the return value of an expensive calculation?", "useCallback", "useMemo", "useRef", "useTransition", "B", "medium", "useMemo recomputes memoized value only when dependencies change.", 1.0),
            (c_react, t_react2, "What is the key difference between useMemo and useCallback?", "useMemo caches calculated values; useCallback caches function definitions", "useCallback is for classes; useMemo is for functional components", "useMemo is asynchronous; useCallback is synchronous", "They are identical aliases", "A", "medium", "useMemo(fn, deps) returns result; useCallback(fn, deps) returns memoized callback.", 1.0),
            (c_react, t_react2, "What does useRef return, and does changing its current property trigger a re-render?", "A mutable object with .current; does NOT trigger a re-render", "A state variable; triggers a re-render", "A DOM selector; triggers re-render", "A frozen object; cannot be mutated", "A", "medium", "useRef holds mutable values that persist across renders without causing DOM re-renders.", 1.0),
            (c_react, t_react2, "Which hook allows access to React Context values?", "useReducer", "useContext", "useProvider", "useConsumer", "B", "easy", "useContext accepts a context object and returns current context value.", 1.0),
            (c_react, t_react2, "In React 19, what hook handles form actions and pending state?", "useFormStatus", "useActionState", "useTransition", "useOptimistic", "B", "hard", "useActionState updates state based on the result of a form action.", 1.0),
            (c_react, t_react2, "What is React Suspense primarily used for?", "Handling runtime JavaScript exceptions", "Coordinating loading states for components fetching data or code-split bundles", "Freezing component updates", "Caching HTTP responses", "B", "medium", "Suspense lets you display fallback UI while children are loading.", 1.0),
            (c_react, t_react2, "How do you prevent unnecessary re-rendering of a functional child component?", "Wrap it with React.memo()", "Use the pure keyword", "Add shouldComponentUpdate", "Set immutable: true", "A", "medium", "React.memo is a higher-order component for memoizing pure components.", 1.0),
            (c_react, t_react2, "What is a custom hook in React?", "A JavaScript function whose name starts with 'use' and may call other hooks", "A class extending React.Hook", "A third party npm package", "A native Web Component", "A", "easy", "Custom hooks encapsulate reusable stateful logic.", 1.0),

            # Data Science Questions (15 items)
            (c_ds, None, "Which library is the primary numerical computing foundation in Python?", "Pandas", "NumPy", "Scipy", "Matplotlib", "B", "easy", "NumPy provides n-dimensional arrays and vector math.", 1.0),
            (c_ds, None, "What is a DataFrame in Pandas?", "A 1-dimensional labeled array", "A 2-dimensional labeled tabular data structure", "A 3-dimensional tensor", "A hashmap of sets", "B", "easy", "DataFrame is a 2D labeled data structure with columns of potentially different types.", 1.0),
            (c_ds, None, "How do you drop rows with missing values in a Pandas DataFrame df?", "df.remove_nulls()", "df.dropna()", "df.clean()", "df.fillna()", "B", "easy", "dropna() drops rows or columns containing missing values.", 1.0),
            (c_ds, None, "What does the loc accessor use for indexing in Pandas?", "Integer position indices", "Row and column labels", "Memory addresses", "Random sampling", "B", "medium", "loc is label-based indexing; iloc is integer-based.", 1.0),
            (c_ds, None, "Which metric measures the dispersion or spread of a dataset relative to its mean?", "Standard Deviation", "Median", "Mode", "Skewness", "A", "easy", "Standard deviation quantifies variation from the mean.", 1.0),
            (c_ds, None, "What does a correlation coefficient of -1 indicate?", "No linear correlation", "Perfect positive linear correlation", "Perfect negative linear correlation", "Zero covariance", "C", "easy", "-1 indicates a deterministic inverse linear relationship.", 1.0),
            (c_ds, None, "Which Pandas method generates summary statistics (count, mean, std, percentiles) for numerical columns?", "df.summary()", "df.describe()", "df.info()", "df.stats()", "B", "easy", "describe() calculates central tendency, dispersion and shape of distribution.", 1.0),
            (c_ds, None, "What is one-hot encoding in feature engineering?", "Scaling numerical features between 0 and 1", "Converting categorical variables into binary indicator vectors", "Imputing missing values with the median", "Applying log transformation", "B", "medium", "One-hot encoding represents categorical variables as binary dummy columns.", 1.0),
            (c_ds, None, "Which method merges two DataFrames in Pandas based on common key columns?", "df.concat()", "pd.merge()", "df.append()", "pd.stack()", "B", "medium", "pd.merge() performs SQL-style join operations.", 1.0),
            (c_ds, None, "What does NumPy's np.linspace(0, 10, 5) return?", "5 evenly spaced numbers over [0, 10]", "Integers between 0 and 10 stepping by 5", "5 random numbers", "An empty array of size 5", "A", "medium", "linspace generates evenly spaced numbers over a specified interval.", 1.0),

            # AI & Machine Learning Questions (12 items)
            (c_aiml, None, "Which of the following is a supervised learning task?", "K-Means Clustering", "Linear Regression", "Principal Component Analysis (PCA)", "Isolation Forest", "B", "easy", "Linear regression learns mapping from labeled target values.", 1.0),
            (c_aiml, None, "What is overfitting in a machine learning model?", "Model performs well on training data but poorly on unseen test data", "Model performs poorly on both training and test data", "Model has too few parameters", "Model training converges in 1 epoch", "A", "easy", "Overfitting occurs when model memorizes training noise.", 1.0),
            (c_aiml, None, "Which metric is the harmonic mean of precision and recall?", "Accuracy", "F1 Score", "ROC-AUC", "Mean Squared Error", "B", "medium", "F1 Score balances precision and recall.", 1.0),
            (c_aiml, None, "What does regularization (L1 / L2) prevent in statistical models?", "Underfitting", "Overfitting", "Gradient descent convergence", "Data leakage", "B", "medium", "Regularization adds penalty weights to prevent excessive parameter complexity.", 1.0),
            (c_aiml, None, "Which algorithm uses an ensemble of multiple decision trees trained with bagging?", "Random Forest", "Support Vector Machine", "Logistic Regression", "Naive Bayes", "A", "easy", "Random Forest ensembles decision trees using bootstrap aggregation.", 1.0),
        ]

        created_questions = []
        for course_obj, topic_obj, q_text, opt_a, opt_b, opt_c, opt_d, ans, diff, exp, marks in raw_questions:
            q, _ = Question.objects.get_or_create(
                course=course_obj,
                question_text=q_text,
                defaults={
                    'topic': topic_obj,
                    'topic_name': topic_obj.title if topic_obj else 'Core Foundations',
                    'option_a': opt_a,
                    'option_b': opt_b,
                    'option_c': opt_c,
                    'option_d': opt_d,
                    'correct_answer': ans,
                    'difficulty': diff,
                    'explanation': exp,
                    'marks': Decimal(str(marks)),
                    'created_by': lead_trainer
                }
            )
            created_questions.append(q)

        self.stdout.write(self.style.SUCCESS(f"[OK] {len(created_questions)} Question Bank items seeded."))

        # 7. Quizzes (5 Quizzes as required by Section 88)
        now = timezone.now()
        quiz_configs = [
            {
                'title': 'Python Core & Data Structures Assessment',
                'course': c_py,
                'week': w1_py,
                'duration': 25,
                'total_marks': 5.00,
                'pass_pct': 60.00,
                'questions': [q for q in created_questions if q.course == c_py][:5],
                'negative': False
            },
            {
                'title': 'OOP Concepts & Decorators Assessment',
                'course': c_py,
                'week': w2_py,
                'duration': 30,
                'total_marks': 5.00,
                'pass_pct': 70.00,
                'questions': [q for q in created_questions if q.course == c_py][5:10],
                'negative': True
            },
            {
                'title': 'React Components, State & Hooks Assessment',
                'course': c_react,
                'week': w1_react,
                'duration': 20,
                'total_marks': 5.00,
                'pass_pct': 60.00,
                'questions': [q for q in created_questions if q.course == c_react][:5],
                'negative': False
            },
            {
                'title': 'Data Wrangling & Statistical Analysis Assessment',
                'course': c_ds,
                'week': None,
                'duration': 30,
                'total_marks': 5.00,
                'pass_pct': 60.00,
                'questions': [q for q in created_questions if q.course == c_ds][:5],
                'negative': False
            },
            {
                'title': 'Machine Learning Fundamentals Assessment',
                'course': c_aiml,
                'week': None,
                'duration': 35,
                'total_marks': 5.00,
                'pass_pct': 65.00,
                'questions': [q for q in created_questions if q.course == c_aiml][:5],
                'negative': True
            },
        ]

        seeded_quizzes = []
        for qc in quiz_configs:
            qz, _ = Quiz.objects.get_or_create(
                title=qc['title'],
                course=qc['course'],
                defaults={
                    'week': qc['week'],
                    'duration_minutes': qc['duration'],
                    'total_marks': qc['total_marks'],
                    'pass_percentage': qc['pass_pct'],
                    'start_at': now - timedelta(days=7),
                    'deadline': now + timedelta(days=30),
                    'max_attempts': 2,
                    'status': Quiz.Status.PUBLISHED,
                    'negative_marking': qc['negative'],
                    'negative_marks': Decimal('0.25') if qc['negative'] else Decimal('0.00'),
                    'show_result': True,
                    'show_answers': True,
                    'require_fullscreen': True,
                    'tab_warning_limit': 3,
                    'prevent_copy': True,
                    'created_by': lead_trainer
                }
            )
            for idx, q_item in enumerate(qc['questions'], start=1):
                QuizQuestion.objects.get_or_create(
                    quiz=qz,
                    question=q_item,
                    defaults={'order': idx, 'marks': q_item.marks}
                )
            seeded_quizzes.append(qz)

        self.stdout.write(self.style.SUCCESS(f"[OK] {len(seeded_quizzes)} Quizzes configured and published."))

        # 8. Realistic Quiz Results for Students
        # Arun takes Python Quiz 1
        q_py1 = seeded_quizzes[0]
        sp_arun = student_profiles['arun']
        att1, _ = QuizAttempt.objects.get_or_create(
            quiz=q_py1,
            student=sp_arun,
            attempt_number=1,
            defaults={
                'deadline_at': now - timedelta(days=2, hours=1),
                'submitted_at': now - timedelta(days=2, hours=1, minutes=15),
                'status': QuizAttempt.Status.SUBMITTED,
                'score': Decimal('4.00'),
                'percentage': Decimal('80.00'),
                'is_passed': True,
                'correct_count': 4,
                'wrong_count': 1,
                'unanswered_count': 0,
                'time_taken_seconds': 740,
                'tab_violations': 0
            }
        )
        # Seed snapshots for Arun
        for order, qq in enumerate(q_py1.quiz_questions.all(), start=1):
            snap, _ = AttemptQuestion.objects.get_or_create(
                attempt=att1,
                question=qq.question,
                defaults={'display_order': order, 'option_mapping': {}}
            )
            # Arun answers mostly correct
            ans_choice = qq.question.correct_answer if order != 2 else ('B' if qq.question.correct_answer != 'B' else 'A')
            is_corr = (ans_choice == qq.question.correct_answer)
            AttemptAnswer.objects.get_or_create(
                attempt_question=snap,
                defaults={
                    'selected_option': ans_choice,
                    'is_correct': is_corr,
                    'marks_awarded': Decimal('1.00') if is_corr else Decimal('0.00')
                }
            )

        # Priya takes Python Quiz 1
        sp_priya = student_profiles['priya']
        att2, _ = QuizAttempt.objects.get_or_create(
            quiz=q_py1,
            student=sp_priya,
            attempt_number=1,
            defaults={
                'deadline_at': now - timedelta(days=1),
                'submitted_at': now - timedelta(days=1, minutes=20),
                'status': QuizAttempt.Status.SUBMITTED,
                'score': Decimal('5.00'),
                'percentage': Decimal('100.00'),
                'is_passed': True,
                'correct_count': 5,
                'wrong_count': 0,
                'unanswered_count': 0,
                'time_taken_seconds': 820,
                'tab_violations': 1
            }
        )
        for order, qq in enumerate(q_py1.quiz_questions.all(), start=1):
            snap, _ = AttemptQuestion.objects.get_or_create(
                attempt=att2,
                question=qq.question,
                defaults={'display_order': order, 'option_mapping': {}}
            )
            AttemptAnswer.objects.get_or_create(
                attempt_question=snap,
                defaults={
                    'selected_option': qq.question.correct_answer,
                    'is_correct': True,
                    'marks_awarded': Decimal('1.00')
                }
            )

        # Vikram takes ML Quiz
        q_ml = seeded_quizzes[4]
        sp_vikram = student_profiles['vikram']
        att3, _ = QuizAttempt.objects.get_or_create(
            quiz=q_ml,
            student=sp_vikram,
            attempt_number=1,
            defaults={
                'deadline_at': now - timedelta(hours=6),
                'submitted_at': now - timedelta(hours=6, minutes=24),
                'status': QuizAttempt.Status.SUBMITTED,
                'score': Decimal('4.00'),
                'percentage': Decimal('80.00'),
                'is_passed': True,
                'correct_count': 4,
                'wrong_count': 1,
                'unanswered_count': 0,
                'time_taken_seconds': 910,
                'tab_violations': 0
            }
        )

        self.stdout.write(self.style.SUCCESS("[OK] Realistic Quiz Attempts and Scorecards seeded."))

        # 9. Announcements
        Announcement.objects.get_or_create(
            title="Welcome to KDTechX Engineering Cohort 2026",
            defaults={
                'content': "All students have been assigned to their curriculum modules. Weekly assessments unlock every Monday at 09:00 AM UTC. Please review your course schedule.",
                'priority': Announcement.Priority.HIGH,
                'created_by': lead_trainer
            }
        )
        Announcement.objects.get_or_create(
            title="Week 2 Assessment Guidelines",
            course=c_py,
            batch=batch_pfs,
            defaults={
                'content': "The Python OOP and Decorators assessment has negative marking enabled (-0.25 marks for wrong answers). Review the curriculum materials before starting your attempt.",
                'priority': Announcement.Priority.NORMAL,
                'created_by': lead_trainer
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Cohort announcements published."))

        self.stdout.write(self.style.SUCCESS("""
========================================================================
[OK] KDTECHX PLATFORM SEEDING COMPLETE!
========================================================================
Lead Trainer Portal:
  Username: maruthi25   Password: maruthis@2529
  Username: admin       Password: admin123

Student Portal:
  Username: arun        Password: password123   (ID: KDX26001)
  Username: priya       Password: password123   (ID: KDX26002)
  Username: vikram      Password: password123   (ID: KDX26003)
  Username: ananya      Password: password123   (ID: KDX26004)
  Username: rohan       Password: password123   (ID: KDX26005)
========================================================================
"""))
