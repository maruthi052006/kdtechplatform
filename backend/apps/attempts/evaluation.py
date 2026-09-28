from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from .models import QuizAttempt, AttemptQuestion, AttemptAnswer

def evaluate_quiz_attempt(attempt: QuizAttempt, submitted_answers_dict: dict) -> QuizAttempt:
    """
    Server-authoritative evaluation engine.
    Compares candidate selections against original questions using the snapshot option mapping.
    Calculates correct, wrong, unanswered counts, applies negative marking if enabled,
    determines final percentage and pass/fail status.
    """
    quiz = attempt.quiz
    now = timezone.now()

    snapshots = attempt.question_snapshots.select_related('question').all()
    total_earned = Decimal('0.00')
    total_penalty = Decimal('0.00')
    correct_count = 0
    wrong_count = 0
    unanswered_count = 0

    with transaction.atomic():
        for snap in snapshots:
            q = snap.question
            # Candidate-facing selected key (e.g. 'A', 'B', 'C', 'D' or None)
            selected_option = submitted_answers_dict.get(str(snap.id)) or submitted_answers_dict.get(snap.id)

            if not selected_option:
                # Unanswered
                unanswered_count += 1
                AttemptAnswer.objects.update_or_create(
                    attempt_question=snap,
                    defaults={
                        'selected_option': None,
                        'is_correct': False,
                        'marks_awarded': Decimal('0.00')
                    }
                )
                continue

            selected_option = str(selected_option).strip().upper()

            # Map candidate-facing key back to original question key if scrambled
            mapping = snap.option_mapping or {}
            # If mapping is {'A': 'B', 'B': 'A'}, then candidate selecting 'A' actually picked original 'B'
            original_choice = mapping.get(selected_option, selected_option)

            is_correct = (original_choice == q.correct_answer)
            item_marks = q.marks or Decimal('1.00')

            if is_correct:
                correct_count += 1
                total_earned += item_marks
                marks_for_item = item_marks
            else:
                wrong_count += 1
                if quiz.negative_marking:
                    penalty = quiz.negative_marks or Decimal('0.25')
                    total_penalty += penalty
                    marks_for_item = -penalty
                else:
                    marks_for_item = Decimal('0.00')

            AttemptAnswer.objects.update_or_create(
                attempt_question=snap,
                defaults={
                    'selected_option': selected_option,
                    'is_correct': is_correct,
                    'marks_awarded': marks_for_item
                }
            )

        # Calculate final score: bounded at 0
        final_score = max(Decimal('0.00'), total_earned - total_penalty)

        # Percentage
        if quiz.total_marks and quiz.total_marks > 0:
            percentage = round((final_score / quiz.total_marks) * Decimal('100.00'), 2)
        else:
            percentage = Decimal('0.00')

        is_passed = percentage >= quiz.pass_percentage

        attempt.submitted_at = now
        attempt.status = QuizAttempt.Status.SUBMITTED
        attempt.score = final_score
        attempt.percentage = percentage
        attempt.is_passed = is_passed
        attempt.correct_count = correct_count
        attempt.wrong_count = wrong_count
        attempt.unanswered_count = unanswered_count
        attempt.time_taken_seconds = max(1, int((now - attempt.started_at).total_seconds()))
        attempt.save()

    return attempt
