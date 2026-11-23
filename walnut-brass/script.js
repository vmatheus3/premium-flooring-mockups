'use strict';
(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#menu-panel');
  const setMenu = open => {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuButton.querySelector('use').setAttribute('href', '../shared/icons.svg#' + (open ? 'close' : 'menu'));
  };
  menuButton.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { setMenu(false); menuButton.focus(); }
  });
  const form = document.querySelector('#estimate-form');
  const steps = [...form.querySelectorAll('.form-step')];
  const back = document.querySelector('#back');
  const next = document.querySelector('#next');
  const review = document.querySelector('#review');
  const status = document.querySelector('#step-status');
  const preview = document.querySelector('#message-preview');
  const stairsField = document.querySelector('#stairs-field');
  let step = 0;
  const value = name => form.elements.namedItem(name).value.trim();
  const rooms = () => [...form.querySelectorAll('input[name="rooms"]:checked')].map(input => input.value);
  const hasStairs = () => value('job') === 'Fix up my stairs' || rooms().includes('Stairs');
  const data = () => ({ job: value('job'), zip: value('zip'), rooms: rooms(), size: value('size'), stairs: hasStairs() ? value('stairs') : '', photo: value('photo') === 'yes', name: value('name'), phone: value('phone'), notes: value('notes') });
  const updateStairs = () => { stairsField.hidden = !hasStairs(); };
  const show = (index, focus = true) => {
    step = index;
    const isReview = step === 5;
    steps.forEach((section, i) => { section.hidden = i !== step; });
    review.hidden = !isReview;
    document.querySelector('#wizard-nav').hidden = isReview;
    back.hidden = step === 0;
    status.textContent = isReview ? 'Your request is ready to review' : 'Step ' + (step + 1) + ' of 5';
    document.querySelector('#progress-fill').style.width = Math.min((step + 1) * 20, 100) + '%';
    next.firstChild.textContent = step === 4 ? 'Review request' : 'Next';
    updateStairs();
    if (isReview) preview.textContent = PFEstimate.buildMessage(data());
    if (focus) (isReview ? document.querySelector('#review-title') : steps[step].querySelector('h3')).focus();
  };
  const clearErrors = () => {
    form.querySelectorAll('.error').forEach(error => { error.hidden = true; error.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
  };
  const validate = () => {
    clearErrors();
    let firstError;
    const fail = (name, message) => {
      const input = name === 'job' ? form.querySelector('[name="job"]') : form.elements.namedItem(name);
      const error = document.querySelector('#' + name + '-error');
      error.textContent = message;
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      if (!firstError) firstError = input;
    };
    if (step === 0 && !value('job')) fail('job', 'Choose the work you need.');
    if (step === 1 && !/^\d{5}$/.test(value('zip'))) fail('zip', 'Enter a 5-digit ZIP code.');
    if (step === 2) {
      ['size', ...(hasStairs() ? ['stairs'] : [])].forEach(name => {
        const input = form.elements.namedItem(name);
        if (input.validity.badInput || (input.value && (!Number.isInteger(Number(input.value)) || Number(input.value) < 0))) fail(name, 'Enter a whole number of 0 or more.');
      });
    }
    if (step === 4) {
      if (!value('name')) fail('name', 'Enter your name.');
      if (value('phone').replace(/\D/g, '').length !== 10) fail('phone', 'Enter a 10-digit phone number.');
    }
    if (firstError) { firstError.focus(); return false; }
    return true;
  };
  form.addEventListener('submit', event => { event.preventDefault(); if (step < 5 && validate()) show(step + 1); });
  back.addEventListener('click', () => { clearErrors(); show(step - 1); });
  form.addEventListener('change', updateStairs);
  document.querySelector('#edit').addEventListener('click', () => { clearErrors(); show(0); });
  document.querySelectorAll('[data-job]').forEach(link => {
    link.addEventListener('click', () => {
      form.querySelectorAll('[name="job"]').forEach(input => { input.checked = input.value === link.dataset.job; });
      clearErrors(); show(0, false);
      requestAnimationFrame(() => steps[0].querySelector('h3').focus({ preventScroll: true }));
    });
  });
  document.querySelector('#send').addEventListener('click', () => { PFEstimate.send(data()); });
  document.querySelector('#copy').addEventListener('click', async () => {
    const copyStatus = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText(PFEstimate.buildMessage(data()));
      copyStatus.textContent = 'Message copied. Paste it into a text to (303) 349-5952.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(preview); selection.removeAllRanges(); selection.addRange(range);
      copyStatus.textContent = 'Select and copy the message above, then text it to (303) 349-5952.';
    }
  });
  show(0, false);
})();
