const form = document.querySelector('#estimate-form');
const steps = [...form.querySelectorAll('[data-step]')];
const progress = [...document.querySelectorAll('.progress li')];
const back = document.querySelector('#back');
const next = document.querySelector('#next');
const error = document.querySelector('#form-error');
const summary = document.querySelector('#summary');
let step = 0;
function showStep(value, focus = true) {
  step = value;
  error.textContent = '';
  steps.forEach((panel, index) => { panel.hidden = index !== step; });
  summary.hidden = step !== 5;
  progress.forEach((item, index) => {
    item.classList.toggle('active', index === Math.min(step, 4));
    item.classList.toggle('complete', index < step);
    if (index === Math.min(step, 4)) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  back.hidden = step === 0;
  next.textContent = step === 5 ? 'Request my free estimate →' : step === 4 ? 'Review my answers →' : step === 3 ? 'Continue (photo optional) →' : 'Continue to next step →';
  if (focus) {
    const heading = step === 5 ? summary.querySelector('h3') : steps[step].querySelector('legend');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}
function makeSummary() {
  const data = new FormData(form);
  const rows = [
    ['Project', data.get('job')], ['ZIP code', data.get('zip')],
    ['Rooms', data.getAll('rooms').join(', ') || 'To discuss at the visit'],
    ['Approximate size', data.get('size') ? `${data.get('size')} square feet` : 'Not sure yet'],
    ['Photo', document.querySelector('#photo').files[0]?.name || 'No photo added'],
    ['Name', data.get('name').trim() || 'Not provided'], ['Phone', data.get('phone')]
  ];
  const list = document.querySelector('#summary-list');
  list.replaceChildren();
  rows.forEach(([label, value]) => {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    list.append(term, description);
  });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (step === 1 && !/^\d{5}$/.test(form.elements.zip.value.trim())) {
    error.textContent = 'Please enter a 5-digit ZIP code.';
    form.elements.zip.setAttribute('aria-invalid', 'true');
    form.elements.zip.focus();
    return;
  }
  form.elements.zip.removeAttribute('aria-invalid');
  if (step === 2 && form.elements.size.value && !form.elements.size.validity.valid) {
    error.textContent = 'Please enter a size of zero or more, or leave it blank.';
    form.elements.size.focus();
    return;
  }
  if (step === 4 && !form.elements.phone.value.trim()) {
    error.textContent = 'Please enter your phone number so Andre can call you.';
    form.elements.phone.setAttribute('aria-invalid', 'true');
    form.elements.phone.focus();
    return;
  }
  form.elements.phone.removeAttribute('aria-invalid');
  if (step === 5) {
    document.querySelector('#sent-message').hidden = false;
    document.querySelector('.form-actions').hidden = true;
    document.querySelector('#edit').hidden = true;
    return;
  }
  if (step === 4) makeSummary();
  showStep(step + 1);
});
back.addEventListener('click', () => showStep(Math.max(0, step - 1)));
document.querySelector('#edit').addEventListener('click', () => showStep(0));
document.querySelectorAll('[data-job]').forEach(card => card.addEventListener('click', () => {
  const radio = [...form.elements.job].find(input => input.value === card.dataset.job);
  if (radio) radio.checked = true;
  document.querySelector('#sent-message').hidden = true;
  document.querySelector('.form-actions').hidden = false;
  document.querySelector('#edit').hidden = false;
  showStep(0, false);
}));
document.querySelector('#photo').addEventListener('change', event => {
  document.querySelector('#photo-name').textContent = event.target.files[0]?.name || 'You can also skip this step.';
});
document.querySelectorAll('.comparison input').forEach(slider => {
  slider.addEventListener('input', () => slider.parentElement.style.setProperty('--reveal', `${slider.value}%`));
});
document.querySelectorAll('.menu nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('.menu').open = false;
}));
