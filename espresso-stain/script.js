(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const menu = $('#site-menu');
  const menuButton = $('.menu-toggle');
  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    menuButton.querySelector('use').setAttribute('href', '../shared/icons.svg#menu');
  }
  menuButton.addEventListener('click', () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
    menuButton.querySelector('use').setAttribute('href', `../shared/icons.svg#${opening ? 'close' : 'menu'}`);
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) {
      closeMenu();
      menuButton.focus();
    }
  });

  const form = $('#estimate-form');
  const steps = [...form.querySelectorAll('[data-step]')];
  const review = $('#review-screen');
  const error = $('#form-error');
  const bar = $('.progress-track');
  const stepNames = ['Job', 'ZIP code', 'Rooms & size', 'Photos', 'Contact'];
  let step = 1;
  let reviewData;

  function getData() {
    const values = new FormData(form);
    return {
      job: values.get('job') || '',
      zip: String(values.get('zip') || '').trim(),
      rooms: values.getAll('rooms'),
      size: values.get('size') || '',
      stairs: $('#stairs-field').hidden ? '' : values.get('stairs') || '',
      photo: values.get('photo') === 'yes',
      name: String(values.get('name') || '').trim(),
      phone: String(values.get('phone') || '').trim(),
      notes: String(values.get('notes') || '').trim()
    };
  }
  function updateStairs() {
    const values = new FormData(form);
    $('#stairs-field').hidden = values.get('job') !== 'Fix up my stairs' && !values.getAll('rooms').includes('Stairs');
  }
  function clearError() {
    error.textContent = '';
    form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  }
  function showStep(number, focus = true) {
    step = number;
    clearError();
    form.hidden = false;
    review.hidden = true;
    steps.forEach((panel, index) => { panel.hidden = index !== step - 1; });
    $('#step-status').textContent = `Step ${step} of 5`;
    $('#step-name').textContent = stepNames[step - 1];
    $('#progress-fill').style.width = `${step * 20}%`;
    bar.setAttribute('aria-valuenow', String(step));
    bar.removeAttribute('aria-valuetext');
    $('#back').hidden = step === 1;
    $('#next').firstChild.textContent = step === 5 ? 'Review request' : 'Next';
    updateStairs();
    if (focus) steps[step - 1].querySelector('legend').focus();
  }
  function fail(message, field) {
    error.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.focus();
    return false;
  }
  function validate() {
    const data = getData();
    clearError();
    if (step === 1 && !data.job) return fail('Choose the work you need.', form.querySelector('[name="job"]'));
    if (step === 2 && !/^\d{5}$/.test(data.zip)) return fail('Enter a 5-digit ZIP code.', $('#zip'));
    if (step === 3) {
      for (const field of [$('#size'), $('#stairs')]) {
        if (!field.closest('[hidden]') && field.value && (!Number.isInteger(Number(field.value)) || Number(field.value) < 1)) {
          return fail('Enter a whole number greater than zero, or leave this blank.', field);
        }
      }
    }
    if (step === 5) {
      if (!data.name) return fail('Enter your name.', $('#name'));
      if (data.phone.replace(/\D/g, '').length !== 10) return fail('Enter a 10-digit phone number.', $('#phone'));
    }
    return true;
  }
  form.addEventListener('change', updateStairs);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validate()) return;
    if (step < 5) { showStep(step + 1); return; }
    reviewData = getData();
    $('#message-preview').textContent = PFEstimate.buildMessage(reviewData);
    form.hidden = true;
    review.hidden = false;
    $('#step-status').textContent = 'Check your request';
    $('#step-name').textContent = 'Ready to text';
    bar.setAttribute('aria-valuetext', 'All five steps complete. Review your request.');
    $('#send-status').textContent = '';
    review.querySelector('h3').focus();
  });
  $('#back').addEventListener('click', () => showStep(Math.max(1, step - 1)));
  $('#change-answers').addEventListener('click', () => showStep(1));
  $('#send-request').addEventListener('click', () => {
    PFEstimate.send(reviewData);
    $('#send-status').textContent = 'If your messaging app did not open, you can copy the request above and text it to (303) 349-5952. Nothing is sent until you press send in your messaging app.';
  });
  document.querySelectorAll('[data-job]').forEach(link => {
    link.addEventListener('click', () => {
      const field = [...form.querySelectorAll('[name="job"]')].find(input => input.value === link.dataset.job);
      if (field) field.checked = true;
      showStep(1, false);
    });
  });

  const dialog = $('#project-dialog');
  const projectLinks = [...document.querySelectorAll('.project-mosaic .text-link')];
  projectLinks.forEach(link => link.addEventListener('click', event => {
    const figure = link.closest('figure');
    const photo = figure.querySelector('img');
    event.preventDefault();
    const target = $('#dialog-photo');
    target.src = photo.src;
    target.alt = photo.alt;
    target.width = photo.width;
    target.height = photo.height;
    $('#dialog-caption').textContent = figure.querySelector('h3').textContent;
    dialog.showModal();
  }));
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  $('#google-reviews-link').addEventListener('click', event => {
    event.preventDefault();
    $('#reviews-note').hidden = !$('#reviews-note').hidden;
  });
  showStep(1, false);
})();
