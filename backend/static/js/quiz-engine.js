/**
 * KDTechX Exam & Assessment Engine
 * Manages question navigation, option selection, server-authoritative timer, and atomic submission.
 */

window.KDTechXQuiz = (function() {
  let config = {
    quizId: null,
    attemptId: null,
    remainingSeconds: 0,
    totalQuestions: 0,
    submitUrl: '',
    storageKey: ''
  };

  let timerInterval = null;
  let currentQuestionIndex = 0;

  function init(options) {
    config = { ...config, ...options };
    config.storageKey = `kdtechx_quiz_attempt_${config.attemptId}`;

    restoreLocalAnswers();
    setupOptionListeners();
    setupNavigationListeners();
    startTimer();
    updateQuestionVisibility(0);
    updatePalettePills();
  }

  function startTimer() {
    const timerEl = document.getElementById('quiz-timer');
    if (!timerEl) return;

    function renderTime() {
      if (config.remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerEl.textContent = '00:00';
        timerEl.className = 'kd-timer critical';
        if (window.KDTechXToast) {
          window.KDTechXToast.show('Time has expired! Submitting assessment...', 'danger');
        }
        submitQuiz(true);
        return;
      }

      const mins = Math.floor(config.remainingSeconds / 60);
      const secs = config.remainingSeconds % 60;
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      // Update visual urgency states
      if (config.remainingSeconds < 60) {
        timerEl.className = 'kd-timer critical';
      } else if (config.remainingSeconds < 300) {
        timerEl.className = 'kd-timer warning';
      } else {
        timerEl.className = 'kd-timer';
      }

      config.remainingSeconds--;
    }

    renderTime();
    timerInterval = setInterval(renderTime, 1000);
  }

  function setupOptionListeners() {
    const optionLabels = document.querySelectorAll('.kd-option-label');
    optionLabels.forEach(label => {
      label.addEventListener('click', function(e) {
        const input = this.querySelector('input[type="radio"]');
        if (!input) return;

        input.checked = true;

        // Deselect siblings in the same question card
        const card = this.closest('.kd-question-card');
        card.querySelectorAll('.kd-option-label').forEach(sibling => {
          sibling.classList.remove('selected');
        });

        this.classList.add('selected');

        // Persist answer locally
        saveAnswer(input.name, input.value);
        updatePalettePills();
      });
    });
  }

  function saveAnswer(questionName, selectedOption) {
    try {
      const answers = JSON.parse(localStorage.getItem(config.storageKey) || '{}');
      answers[questionName] = selectedOption;
      localStorage.setItem(config.storageKey, JSON.stringify(answers));
    } catch (e) {
      console.warn('LocalStorage unavailable for quiz answer persistence');
    }
  }

  function restoreLocalAnswers() {
    try {
      const saved = JSON.parse(localStorage.getItem(config.storageKey) || '{}');
      for (const [name, val] of Object.entries(saved)) {
        const input = document.querySelector(`input[name="${name}"][value="${val}"]`);
        if (input) {
          input.checked = true;
          const label = input.closest('.kd-option-label');
          if (label) label.classList.add('selected');
        }
      }
    } catch (e) {
      console.warn('Could not restore local answers');
    }
  }

  function updateQuestionVisibility(index) {
    const cards = document.querySelectorAll('.kd-question-card');
    if (!cards.length) return;

    if (index < 0) index = 0;
    if (index >= cards.length) index = cards.length - 1;

    currentQuestionIndex = index;

    cards.forEach((card, i) => {
      card.style.display = i === currentQuestionIndex ? 'block' : 'none';
    });

    // Update navigation buttons
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-btn');

    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    if (nextBtn) {
      if (currentQuestionIndex === cards.length - 1) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = 'inline-flex';
      }
    }

    // Highlight current in question palette
    document.querySelectorAll('.kd-nav-pill').forEach((pill, i) => {
      pill.classList.toggle('current', i === currentQuestionIndex);
    });
  }

  function updatePalettePills() {
    const cards = document.querySelectorAll('.kd-question-card');
    cards.forEach((card, i) => {
      const answered = card.querySelector('input[type="radio"]:checked');
      const pill = document.querySelector(`.kd-nav-pill[data-question-index="${i}"]`);
      if (pill) {
        pill.classList.toggle('answered', !!answered);
      }
    });
  }

  function setupNavigationListeners() {
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        updateQuestionVisibility(currentQuestionIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        updateQuestionVisibility(currentQuestionIndex + 1);
      });
    }

    document.querySelectorAll('.kd-nav-pill').forEach(pill => {
      pill.addEventListener('click', function() {
        const targetIndex = parseInt(this.getAttribute('data-question-index'), 10);
        updateQuestionVisibility(targetIndex);
      });
    });

    // Submit confirmation button
    const submitBtn = document.getElementById('quiz-finish-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        showSubmitConfirmation();
      });
    }
  }

  function showSubmitConfirmation() {
    const cards = document.querySelectorAll('.kd-question-card');
    let answeredCount = 0;
    cards.forEach(card => {
      if (card.querySelector('input[type="radio"]:checked')) {
        answeredCount++;
      }
    });
    const unansweredCount = cards.length - answeredCount;

    const modalAnsweredEl = document.getElementById('modal-answered-count');
    const modalUnansweredEl = document.getElementById('modal-unanswered-count');

    if (modalAnsweredEl) modalAnsweredEl.textContent = answeredCount;
    if (modalUnansweredEl) modalUnansweredEl.textContent = unansweredCount;

    const modalEl = document.getElementById('quizConfirmSubmitModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    } else {
      if (confirm(`Submit assessment now?\n\nAnswered: ${answeredCount}\nUnanswered: ${unansweredCount}`)) {
        submitQuiz(false);
      }
    }
  }

  function submitQuiz(forced = false) {
    if (timerInterval) clearInterval(timerInterval);

    try {
      localStorage.removeItem(config.storageKey);
    } catch (e) {}

    const form = document.getElementById('quiz-submission-form');
    if (form) {
      if (forced) {
        const forcedInput = document.createElement('input');
        forcedInput.type = 'hidden';
        forcedInput.name = 'forced_timeout';
        forcedInput.value = '1';
        form.appendChild(forcedInput);
      }
      form.submit();
    }
  }

  return {
    init,
    submitQuiz
  };
})();
