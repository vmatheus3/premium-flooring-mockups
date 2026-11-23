'use strict';

const menuButton = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('#site-menu');
function closeMenu() {
  menuPanel.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  menuButton.querySelector('use').setAttribute('href', '../shared/icons.svg#menu');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuPanel.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuButton.querySelector('use').setAttribute('href', `../shared/icons.svg#${open ? 'close' : 'menu'}`);
});
menuPanel.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menuPanel.hidden) {
    closeMenu();
    menuButton.focus();
  }
});

const form = document.querySelector('#estimate-form');
const steps = [...form.querySelectorAll('[data-step]')];
const review = document.querySelector('#review');
const backButton = document.querySelector('#back-button');
const nextButton = document.querySelector('#next-button');
const progress = document.querySelector('.progress-track');
const stepStatus = document.querySelector('#step-status');
const stairsField = document.querySelector('#stairs-field');
let currentStep = 0;
let requestData;

function updateStairs() {
  const data = new FormData(form);
  stairsField.hidden = data.get('job') !== 'Fix up my stairs' && !data.getAll('rooms').includes('Stairs');
}
function clearErrors() {
  form.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
}
function showStep(index, focus = true) {
  currentStep = index;
  clearErrors();
  form.hidden = index === 5;
  review.hidden = index !== 5;
  steps.forEach((step, position) => { step.hidden = position !== index; });
  backButton.hidden = index === 0;
  nextButton.firstChild.textContent = index === 4 ? 'Review request' : 'Continue';
  stepStatus.textContent = index === 5 ? 'All 5 steps complete' : `Step ${index + 1} of 5`;
  progress.setAttribute('aria-valuenow', String(Math.min(index + 1, 5)));
  document.querySelector('#progress-fill').style.width = `${Math.min(index + 1, 5) * 20}%`;
  updateStairs();
  if (focus) {
    const heading = index === 5 ? review.querySelector('h3') : steps[index].querySelector('legend');
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
}
function validateStep() {
  clearErrors();
  let firstInvalid;
  function invalid(input, message, errorId) {
    document.getElementById(errorId).textContent = message;
    input.setAttribute('aria-invalid', 'true');
    firstInvalid ||= input;
  }
  if (currentStep === 0 && !form.querySelector('[name="job"]:checked')) {
    invalid(form.elements.job[0], 'Choose the work you need help with.', 'job-error');
  }
  if (currentStep === 1 && !/^\d{5}$/.test(form.elements.zip.value.trim())) {
    invalid(form.elements.zip, 'Enter a 5-digit ZIP code.', 'zip-error');
  }
  if (currentStep === 2) {
    ['size', ...(stairsField.hidden ? [] : ['stairs'])].forEach(name => {
      const input = form.elements[name];
      if (input.validity.badInput || (input.value && (!/^\d+$/.test(input.value) || Number(input.value) < 1))) {
        invalid(input, 'Enter a whole number greater than zero, or leave this blank.', `${name}-error`);
      }
    });
  }
  if (currentStep === 4) {
    if (!form.elements.name.value.trim()) invalid(form.elements.name, 'Enter your name.', 'name-error');
    if (form.elements.phone.value.replace(/\D/g, '').length !== 10) invalid(form.elements.phone, 'Enter a 10-digit phone number.', 'phone-error');
  }
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}
function collectData() {
  const values = new FormData(form);
  return {
    job: values.get('job'), zip: values.get('zip').trim(), rooms: values.getAll('rooms'),
    size: values.get('size'), stairs: stairsField.hidden ? '' : values.get('stairs'),
    photo: values.get('photo') === 'yes', name: values.get('name').trim(),
    phone: values.get('phone').trim(), notes: values.get('notes').trim()
  };
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateStep()) return;
  if (currentStep === 4) {
    requestData = collectData();
    document.querySelector('#message-preview').textContent = PFEstimate.buildMessage(requestData);
    document.querySelector('#copy-status').textContent = '';
    document.querySelector('#manual-copy').hidden = true;
    document.querySelector('#manual-copy-label').hidden = true;
  }
  showStep(currentStep + 1);
});
backButton.addEventListener('click', () => showStep(currentStep - 1));
form.addEventListener('change', updateStairs);
document.querySelector('#change-answers').addEventListener('click', () => showStep(0));
document.querySelector('#send-request').addEventListener('click', () => PFEstimate.send(requestData));
document.querySelector('#copy-message').addEventListener('click', async () => {
  const message = PFEstimate.buildMessage(requestData);
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(message);
    document.querySelector('#copy-status').textContent = 'Message copied. Paste it into a text to Andre.';
  } catch {
    const manual = document.querySelector('#manual-copy');
    manual.value = message;
    manual.hidden = false;
    document.querySelector('#manual-copy-label').hidden = false;
    document.querySelector('#copy-status').textContent = 'Select the message below and use your device’s Copy command.';
    manual.focus();
    manual.select();
  }
});
document.querySelectorAll('[data-job]').forEach(link => {
  link.addEventListener('click', () => {
    const selected = [...form.elements.job].find(input => input.value === link.dataset.job);
    selected.checked = true;
    showStep(0, false);
    window.setTimeout(() => selected.focus({ preventScroll: true }), 0);
  });
});
document.querySelectorAll('.comparison').forEach(comparison => {
  const slider = comparison.querySelector('input');
  slider.addEventListener('input', () => {
    comparison.style.setProperty('--position', `${slider.value}%`);
    slider.setAttribute('aria-valuetext', `${100 - Number(slider.value)} percent of after image visible`);
  });
});
