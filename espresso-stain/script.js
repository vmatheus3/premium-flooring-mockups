const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#menu');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.hidden = !open;
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}));
document.querySelectorAll('.thumb').forEach(button => button.addEventListener('click', () => {
  const photo = document.querySelector('#hero-photo');
  photo.src = `../shared/img/${button.dataset.image}.webp`;
  photo.alt = button.dataset.alt;
  document.querySelectorAll('.thumb').forEach(thumb => {
    thumb.classList.toggle('selected', thumb === button);
    thumb.setAttribute('aria-pressed', String(thumb === button));
  });
}));
const form = document.querySelector('#estimate-form');
const fields = [...form.querySelectorAll('[data-step]')];
const progress = [...document.querySelectorAll('.progress li')];
const back = document.querySelector('#back');
const next = document.querySelector('#next');
const summary = document.querySelector('#summary');
const error = document.querySelector('#form-error');
const confirmation = document.querySelector('#confirmation');
let step = 0;
function render(focus = false) {
  form.hidden = false;
  confirmation.hidden = true;
  fields.forEach((field, i) => { field.hidden = i !== step; });
  summary.hidden = step !== 5;
  back.hidden = step === 0 || step === 5;
  next.textContent = step === 5 ? 'Request my estimate →' : step === 4 ? 'Review my answers →' : 'Next →';
  progress.forEach((item, i) => {
    item.classList.toggle('complete', i < step);
    if (i === Math.min(step, 4)) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  error.textContent = '';
  if (step === 5) makeSummary();
  if (focus) {
    const target = step === 5 ? summary.querySelector('h3') : fields[step].querySelector('legend');
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
}
function validate() {
  if (step === 1 && !/^\d{5}$/.test(form.elements.zip.value.trim())) {
    error.textContent = 'Please enter a 5-digit ZIP code.';
    form.elements.zip.focus();
    return false;
  }
  if (step === 4 && !form.elements.phone.value.trim()) {
    error.textContent = 'Please enter your phone number so Andre can call you.';
    form.elements.phone.focus();
    return false;
  }
  return true;
}
function makeSummary() {
  const data = new FormData(form);
  const photo = form.elements.photo.files[0];
  const entries = [
    ['Job', data.get('job')], ['ZIP code', data.get('zip')],
    ['Rooms', data.getAll('rooms').join(', ') || 'Not specified'],
    ['Approximate size', data.get('size') || 'Not sure'],
    ['Photo', photo ? photo.name : 'No photo added'],
    ['Name', data.get('name') || 'Not provided'], ['Phone', data.get('phone')]
  ];
  const list = document.querySelector('#summary-details');
  list.replaceChildren();
  entries.forEach(([label, value]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    list.append(row);
  });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validate()) return;
  if (step < 5) { step++; render(true); }
  else {
    form.hidden = true;
    confirmation.hidden = false;
    const heading = confirmation.querySelector('h3');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
});
back.addEventListener('click', () => { if (step > 0) step--; render(true); });
document.querySelector('#edit').addEventListener('click', () => { step = 0; render(true); });
document.querySelector('#restart').addEventListener('click', () => { step = 5; render(true); });
document.querySelectorAll('[data-job]').forEach(link => link.addEventListener('click', () => {
  const radio = [...form.querySelectorAll('[name="job"]')].find(input => input.value === link.dataset.job);
  if (radio) radio.checked = true;
  step = 0;
  render();
}));
render();
