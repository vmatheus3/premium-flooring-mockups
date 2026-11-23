(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-menu');
  function setMenu(open) {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('use').setAttribute('href', `../shared/icons.svg#${open ? 'close' : 'menu'}`);
    menuButton.querySelector('span').textContent = open ? 'Close menu' : 'Menu';
  }
  menuButton.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });

  const form = document.querySelector('#estimate-form');
  const steps = [...form.querySelectorAll('fieldset')];
  const progress = document.querySelector('#step-progress');
  const status = document.querySelector('#step-status');
  const review = document.querySelector('#request-review');
  const navigation = document.querySelector('#form-navigation');
  const back = document.querySelector('#back');
  const nextLabel = document.querySelector('#next span');
  const stairsField = document.querySelector('#stairs-field');
  const preview = document.querySelector('#message-preview');
  let currentStep = 0;

  function data() {
    const values = new FormData(form);
    return {
      job: values.get('job') || '',
      zip: (values.get('zip') || '').trim(),
      rooms: values.getAll('rooms'),
      size: values.get('size') || '',
      stairs: stairsField.hidden ? '' : values.get('stairs') || '',
      photo: values.get('photo') === 'yes',
      name: (values.get('name') || '').trim(),
      phone: (values.get('phone') || '').trim(),
      notes: (values.get('notes') || '').trim()
    };
  }

  function updateStairs() {
    stairsField.hidden = !(data().job === 'Fix up my stairs' || data().rooms.includes('Stairs'));
  }

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
  }

  function showStep(step, moveFocus = true) {
    currentStep = step;
    clearErrors();
    steps.forEach((fieldset, index) => { fieldset.hidden = index !== step; });
    const isReview = step === steps.length;
    review.hidden = !isReview;
    navigation.hidden = isReview;
    back.hidden = step === 0;
    progress.value = Math.min(step + 1, 5);
    status.textContent = isReview ? 'All 5 steps complete. Review your request.' : `Step ${step + 1} of 5`;
    nextLabel.textContent = step === 4 ? 'Review my request' : 'Next';
    updateStairs();
    if (isReview) preview.textContent = PFEstimate.buildMessage(data());
    if (moveFocus) {
      (isReview ? document.querySelector('#review-title') : steps[step].querySelector('legend')).focus({preventScroll:true});
      document.querySelector('.wizard').scrollIntoView({block:'start'});
    }
  }

  function validateStep() {
    clearErrors();
    const values = data();
    let firstInvalid;
    function error(id, message, input) {
      document.getElementById(id).textContent = message;
      input.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = input;
    }
    if (currentStep === 0 && !values.job) {
      error('job-error', 'Choose the work you need help with.', form.querySelector('[name="job"]'));
    }
    if (currentStep === 1 && !/^\d{5}$/.test(values.zip)) {
      error('zip-error', 'Enter a 5-digit ZIP code.', form.elements.zip);
    }
    if (currentStep === 2) {
      ['size', 'stairs'].forEach((name) => {
        if (name === 'stairs' && stairsField.hidden) return;
        const input = form.elements[name];
        if (input.validity.badInput || (input.value && (!Number.isInteger(Number(input.value)) || Number(input.value) < 1))) {
          error(`${name}-error`, 'Enter a whole number greater than zero, or leave this blank.', input);
        }
      });
    }
    if (currentStep === 4) {
      if (!values.name) error('name-error', 'Enter your name.', form.elements.name);
      if (values.phone.replace(/\D/g, '').length !== 10) {
        error('phone-error', 'Enter a 10-digit phone number.', form.elements.phone);
      }
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (currentStep < steps.length && validateStep()) showStep(currentStep + 1);
  });
  back.addEventListener('click', () => showStep(currentStep - 1));
  form.addEventListener('change', updateStairs);
  document.querySelector('#change-answers').addEventListener('click', () => showStep(0));
  document.querySelectorAll('[data-job]').forEach((link) => {
    link.addEventListener('click', () => {
      [...form.querySelectorAll('[name="job"]')].forEach((radio) => { radio.checked = radio.value === link.dataset.job; });
      showStep(0, false);
      // The anchor performs the scroll; focus the first selected answer without overriding it.
      form.querySelector('[name="job"]:checked').focus({preventScroll:true});
    });
  });
  document.querySelector('#send-request').addEventListener('click', () => {
    PFEstimate.send(data());
  });
  document.querySelector('#copy-message').addEventListener('click', async () => {
    const copyStatus = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText(PFEstimate.buildMessage(data()));
      copyStatus.textContent = 'Message copied. Paste it into a text to Andre.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(preview);
      selection.removeAllRanges();
      selection.addRange(range);
      preview.focus();
      copyStatus.textContent = 'Select and copy the message above, then paste it into a text to Andre.';
    }
  });
  showStep(0, false);
})();
