(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-button');
  const menu = document.querySelector('#menu-panel');
  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('use').setAttribute('href', '../shared/icons.svg#menu');
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('use').setAttribute('href', `../shared/icons.svg#${open ? 'close' : 'menu'}`);
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); }
  });
  const form = document.querySelector('#estimate-form');
  const steps = [...form.querySelectorAll('.wizard-step')];
  const back = document.querySelector('#back');
  const next = document.querySelector('#next');
  const review = document.querySelector('#review-screen');
  const preview = document.querySelector('#message-preview');
  const stairsField = document.querySelector('#stairs-field');
  const stepNames = ['Your project', 'Your home', 'Rooms & size', 'Your photos', 'Your details'];
  let current = 0;

  function updateStairs() {
    stairsField.hidden = !(form.elements.job.value === 'Fix up my stairs' || [...form.querySelectorAll('[name="rooms"]:checked')].some(el => el.value === 'Stairs'));
  }
  function data() {
    const values = new FormData(form);
    return {
      job: values.get('job'), zip: values.get('zip').trim(), rooms: values.getAll('rooms'),
      size: values.get('size'), stairs: stairsField.hidden ? '' : values.get('stairs'),
      photo: values.get('photo') === 'yes', name: values.get('name').trim(),
      phone: values.get('phone').trim(), notes: values.get('notes').trim()
    };
  }
  function showStep(index, focus = true) {
    current = index;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    const reviewing = index === 5;
    review.hidden = !reviewing;
    document.querySelector('.wizard-controls').hidden = reviewing;
    back.hidden = index === 0;
    document.querySelector('#step-count').textContent = reviewing ? 'Ready to send' : `Step ${index + 1} of 5`;
    document.querySelector('#step-name').textContent = reviewing ? 'Review your request' : stepNames[index];
    document.querySelector('#progress-fill').style.width = `${Math.min(index + 1, 5) * 20}%`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow', Math.min(index + 1, 5));
    next.firstChild.textContent = index === 4 ? 'Review request' : 'Next';
    if (reviewing) {
      preview.textContent = PFEstimate.buildMessage(data());
      document.querySelector('#copy-status').textContent = '';
    }
    if (focus) document.querySelector(reviewing ? '#review-title' : `#step-title-${index}`).focus();
  }
  function clearErrors() {
    form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  }
  function validate() {
    clearErrors();
    let firstError = null;
    const error = (field, message) => {
      document.querySelector(`#${field}-error`).textContent = message;
      const input = field === 'job' ? form.querySelector('[name="job"]') : form.elements[field];
      input.setAttribute('aria-invalid', 'true');
      if (!firstError) firstError = input;
    };
    if (current === 0 && !form.elements.job.value) error('job', 'Choose the work you need.');
    if (current === 1 && !/^\d{5}$/.test(form.elements.zip.value.trim())) error('zip', 'Enter a 5-digit ZIP code.');
    if (current === 2) {
      for (const field of ['size', 'stairs']) {
        if (field === 'stairs' && stairsField.hidden) continue;
        const input = form.elements[field];
        if (input.validity.badInput || (input.value && (!Number.isInteger(Number(input.value)) || Number(input.value) < 1))) error(field, 'Enter a whole number greater than zero, or leave this blank.');
      }
    }
    if (current === 4) {
      if (!form.elements.name.value.trim()) error('name', 'Enter your name.');
      if (form.elements.phone.value.replace(/\D/g, '').length !== 10) error('phone', 'Enter a 10-digit phone number.');
    }
    if (firstError) firstError.focus();
    return !firstError;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (current < 5 && validate()) showStep(current + 1);
  });
  back.addEventListener('click', () => showStep(current - 1));
  form.addEventListener('change', updateStairs);
  document.querySelector('#change-answers').addEventListener('click', () => showStep(0));
  document.querySelector('#send-request').addEventListener('click', () => PFEstimate.send(data()));
  document.querySelector('#copy-message').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    const message = PFEstimate.buildMessage(data());
    try {
      await navigator.clipboard.writeText(message);
      status.textContent = 'Message copied. Paste it into a text to Andre.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(preview);
      selection.removeAllRanges();
      selection.addRange(range);
      preview.focus();
      status.textContent = 'Select and copy the message above, then paste it into a text to Andre.';
    }
  });
  document.querySelectorAll('[data-job]').forEach(link => link.addEventListener('click', () => {
    const input = [...form.querySelectorAll('[name="job"]')].find(el => el.value === link.dataset.job);
    input.checked = true;
    clearErrors();
    updateStairs();
    showStep(0);
  }));
  document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => {
    const strip = document.querySelector('.photo-strip');
    strip.scrollBy({ left: Number(button.dataset.scroll) * strip.clientWidth * .8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
  updateStairs();
  showStep(0, false);
})();
