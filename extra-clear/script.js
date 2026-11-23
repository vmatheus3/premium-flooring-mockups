const form = document.querySelector('#estimate-form');
const steps = [...form.querySelectorAll('[data-step]')];
const progress = [...document.querySelectorAll('.progress li')];
const navigation = document.querySelector('#form-navigation');
const back = document.querySelector('#back');
const next = document.querySelector('#next');
const error = document.querySelector('#form-error');
const summary = document.querySelector('#estimate-summary');
const sent = document.querySelector('#sent-message');
let current = 0;

function showStep(step, focus = true) {
  current = step;
  steps.forEach((panel, index) => { panel.hidden = index !== step; });
  progress.forEach((dot, index) => {
    dot.classList.toggle('complete', index < step);
    if (index === step) dot.setAttribute('aria-current', 'step');
    else dot.removeAttribute('aria-current');
  });
  navigation.hidden = false;
  summary.hidden = true;
  sent.hidden = true;
  back.hidden = step === 0;
  next.innerHTML = step === 4 ? 'Review my answers →' : 'Next →';
  error.textContent = '';
  if (focus) {
    const legend = steps[step].querySelector('legend');
    legend.tabIndex = -1;
    legend.focus();
  }
}

function review() {
  const answers = new FormData(form);
  const rows = [
    ['Job', answers.get('job')],
    ['ZIP code', answers.get('zip')],
    ['Rooms', answers.getAll('rooms').join(', ') || 'Not specified'],
    ['Approximate size', answers.get('size').trim() || 'Not specified'],
    ['Photo', form.elements.photo.files[0]?.name || 'No photo added'],
    ['Name', answers.get('name').trim() || 'Not specified'],
    ['Phone', answers.get('phone')]
  ];
  const list = document.querySelector('#summary-list');
  list.replaceChildren();
  rows.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    list.append(dt, dd);
  });
  steps.forEach(panel => { panel.hidden = true; });
  navigation.hidden = true;
  summary.hidden = false;
  progress.forEach(dot => { dot.removeAttribute('aria-current'); dot.classList.add('complete'); });
  summary.querySelector('h3').focus();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  error.textContent = '';
  if (current === 1 && !/^[0-9]{5}$/.test(form.elements.zip.value)) {
    error.textContent = 'Please enter a 5-digit ZIP code.';
    form.elements.zip.focus();
    return;
  }
  if (current === 4 && !form.elements.phone.value.trim()) {
    error.textContent = 'Please enter your phone number so Andre can call you.';
    form.elements.phone.focus();
    return;
  }
  if (current < 4) showStep(current + 1);
  else review();
});
back.addEventListener('click', () => showStep(Math.max(0, current - 1)));
document.querySelector('#edit').addEventListener('click', () => showStep(0));
document.querySelector('#submit-estimate').addEventListener('click', () => {
  summary.hidden = true;
  sent.hidden = false;
  sent.tabIndex = -1;
  sent.focus();
});
document.querySelectorAll('[data-job]').forEach(link => {
  link.addEventListener('click', () => {
    const choice = [...form.elements.job].find(input => input.value === link.dataset.job);
    if (choice) choice.checked = true;
    showStep(0, false);
  });
});
document.querySelectorAll('.menu nav a').forEach(link => {
  link.addEventListener('click', () => { document.querySelector('.menu').open = false; });
});
showStep(0, false);
