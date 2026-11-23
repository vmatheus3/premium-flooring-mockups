'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const menu = $('.menu-toggle');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); $('#mobile-nav').hidden = true; }
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  $('#mobile-nav').hidden = open;
});
$$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
});

function clearErrors(form) {
  $$('.field-error', form).forEach(error => { error.textContent = ''; });
  $$('[aria-invalid]', form).forEach(input => input.removeAttribute('aria-invalid'));
}
function fieldError(input, output, message) {
  input.setAttribute('aria-invalid', 'true');
  output.textContent = message;
  return input;
}
const validPhone = phone => phone.replace(/\D/g, '').length === 10;
async function copyMessage(message, status, block) {
  try {
    await navigator.clipboard.writeText(message);
    status.textContent = 'Message copied. Text it to (303) 349-5952.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(block);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range); block.focus();
    status.textContent = 'Select and copy the message above, then text it to (303) 349-5952.';
  }
}
let quickData;
$('#quick-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  clearErrors(form);
  const name = $('#quick-name'), phone = $('#quick-phone'), zip = $('#quick-zip');
  const invalid = [];
  if (!name.value.trim()) invalid.push(fieldError(name, $('#quick-name-error'), 'Enter your name.'));
  if (!validPhone(phone.value)) invalid.push(fieldError(phone, $('#quick-phone-error'), 'Enter a 10-digit phone number.'));
  if (!/^\d{5}$/.test(zip.value.trim())) invalid.push(fieldError(zip, $('#quick-zip-error'), 'Enter a 5-digit ZIP code.'));
  if (invalid.length) { $('#quick-status').textContent = 'Please check the highlighted fields.'; invalid[0].focus(); return; }
  quickData = {name: name.value.trim(), phone: phone.value.trim(), zip: zip.value.trim(), job: 'Not sure yet'};
  $('#quick-message').textContent = PFEstimate.buildMessage(quickData);
  $('#quick-fallback').hidden = false;
  $('#quick-status').textContent = 'Your request is ready in your text messages. Press send there. If messages did not open, copy your request below.';
  PFEstimate.send(quickData);
});
$('#quick-copy').addEventListener('click', () => copyMessage(PFEstimate.buildMessage(quickData), $('#quick-status'), $('#quick-message')));

// Both the native range control and arrow keys change the photo reveal.
$$('.comparison').forEach(comparison => {
  const range = $('input[type=range]', comparison);
  range.addEventListener('input', () => {
    $('.comparison-images', comparison).style.setProperty('--reveal', range.value + '%');
    range.setAttribute('aria-valuetext', range.value + ' percent during photo visible');
  });
});
const galleryItems = $$('.gallery-item');
const filters = $$('.filters button');
let currentPhotos = galleryItems;
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  galleryItems.forEach(item => { item.hidden = button.dataset.filter !== 'All' && item.dataset.category !== button.dataset.filter; });
  currentPhotos = galleryItems.filter(item => !item.hidden);
  $('#gallery-status').textContent = currentPhotos.length + ' ' + (button.dataset.filter === 'All' ? 'project' : button.dataset.filter.toLowerCase()) + ' photos shown.';
}));
const lightbox = $('#lightbox');
let photoIndex = 0;
function showPhoto() {
  const item = currentPhotos[photoIndex];
  const source = $('img', item), target = $('.lightbox-photo');
  target.src = source.src; target.alt = source.alt;
  target.width = source.getAttribute('width'); target.height = source.getAttribute('height');
  $('#lightbox-caption').textContent = $('figcaption', item).textContent;
  $('#lightbox-counter').textContent = 'Photo ' + (photoIndex + 1) + ' of ' + currentPhotos.length;
}
function movePhoto(direction) { photoIndex = (photoIndex + direction + currentPhotos.length) % currentPhotos.length; showPhoto(); }
galleryItems.forEach(item => $('.photo-button', item).addEventListener('click', () => {
  photoIndex = currentPhotos.indexOf(item); showPhoto(); lightbox.showModal(); $('#lightbox-close').focus();
}));
$('#lightbox-close').addEventListener('click', () => lightbox.close());
$('#lightbox-prev').addEventListener('click', () => movePhoto(-1));
$('#lightbox-next').addEventListener('click', () => movePhoto(1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); movePhoto(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); movePhoto(1); }
});
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) {
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
  }
});

const estimate = $('#estimate-form');
const steps = $$('[data-step]', estimate);
let step = 0;
let requestData;
function updateStairs() {
  const job = $('input[name=job]:checked', estimate)?.value;
  const stairsRoom = $('input[name=rooms][value=Stairs]', estimate).checked;
  $('#stairs-field').hidden = job !== 'Fix up my stairs' && !stairsRoom;
}
estimate.addEventListener('change', updateStairs);
function showStep(next, focus = true) {
  step = next;
  steps.forEach((fieldset, index) => { fieldset.hidden = index !== step; });
  const review = step === 5;
  $('#review-screen').hidden = !review;
  $('.wizard-controls').hidden = review;
  $('#back-step').hidden = step === 0;
  $('#step-label').textContent = review ? 'Review your request' : 'Step ' + (step + 1) + ' of 5';
  $('.progress-track').setAttribute('aria-valuenow', String(Math.min(step + 1, 5)));
  $('.progress-track>span').style.width = (Math.min(step + 1, 5) * 20) + '%';
  $('#next-step').firstChild.textContent = step === 4 ? 'Review my request' : 'Next';
  $('#wizard-status').textContent = '';
  if (focus) {
    const heading = review ? $('#review-screen h3') : $('legend', steps[step]);
    heading.focus({preventScroll: true});
    $('.wizard-panel').scrollIntoView({block:'nearest',behavior:'instant'});
  }
}
function dataFromForm() {
  const values = new FormData(estimate);
  return { job: values.get('job'), zip: String(values.get('zip')).trim(), rooms: values.getAll('rooms'), size: values.get('size'), stairs: $('#stairs-field').hidden ? '' : values.get('stairs'), photo: values.get('photo') === 'yes', name: String(values.get('name')).trim(), phone: String(values.get('phone')).trim(), notes: String(values.get('notes')).trim() };
}
function validateStep() {
  clearErrors(estimate);
  let invalid;
  if (step === 0 && !$('input[name=job]:checked', estimate)) {
    const input = $('input[name=job]', estimate);
    input.setAttribute('aria-describedby', 'job-error');
    invalid = fieldError(input, $('#job-error'), 'Choose the work you need.');
  }
  if (step === 1 && !/^\d{5}$/.test($('#zip').value.trim())) invalid = fieldError($('#zip'), $('#zip-error'), 'Enter a 5-digit ZIP code.');
  if (step === 2) {
    const size = $('#size'), stairs = $('#stairs');
    if (!size.validity.valid) invalid = fieldError(size, $('#size-error'), 'Enter a whole number greater than zero, or leave size blank.');
    else if (!$('#stairs-field').hidden && !stairs.validity.valid) { stairs.setAttribute('aria-describedby', 'size-error'); invalid = fieldError(stairs, $('#size-error'), 'Enter a whole number of stairs greater than zero, or leave it blank.'); }
  }
  if (step === 4) {
    if (!$('#name').value.trim()) invalid = fieldError($('#name'), $('#name-error'), 'Enter your name.');
    if (!validPhone($('#phone').value)) { const phoneError = fieldError($('#phone'), $('#phone-error'), 'Enter a 10-digit phone number.'); if (!invalid) invalid = phoneError; }
  }
  if (invalid) { invalid.focus(); return false; }
  return true;
}
estimate.addEventListener('submit', event => {
  event.preventDefault();
  if (step === 5 || !validateStep()) return;
  if (step === 4) {
    requestData = dataFromForm();
    $('#request-message').textContent = PFEstimate.buildMessage(requestData);
  }
  showStep(step + 1);
});
$('#back-step').addEventListener('click', () => showStep(Math.max(0, step - 1)));
$('#change-answers').addEventListener('click', () => showStep(0));
$('#send-request').addEventListener('click', () => {
  $('#wizard-status').textContent = 'Your request is ready in your text messages. Press send there. If messages did not open, use Copy message.';
  PFEstimate.send(requestData);
});
$('#copy-request').addEventListener('click', () => copyMessage(PFEstimate.buildMessage(requestData), $('#wizard-status'), $('#request-message')));
$$('[data-job]').forEach(card => card.addEventListener('click', () => {
  $$('input[name=job]', estimate).forEach(input => { input.checked = input.value === card.dataset.job; });
  clearErrors(estimate); updateStairs(); showStep(0, false);
  requestAnimationFrame(() => $('input[name=job]:checked', estimate).focus({preventScroll:true}));
}));
