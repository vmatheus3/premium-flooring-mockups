const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}));

const form = document.querySelector('#estimate-form');
const panels = [...form.querySelectorAll('[data-step]')];
const dots = [...form.querySelectorAll('.progress span')];
const caption = document.querySelector('#step-caption');
const back = document.querySelector('#back');
const next = document.querySelector('#next');
const controls = form.querySelector('.form-controls');
const error = document.querySelector('#form-error');
const summary = document.querySelector('#summary');
const details = document.querySelector('#summary-details');
const progress = form.querySelector('.progress');
const captions = ['Your project', 'Your location', 'Your space', 'Your photo', 'Your details'];
let step = 0;
let finished = false;

function showStep(index, focus = true) {
  step = index;
  finished = false;
  panels.forEach((panel, i) => { panel.hidden = i !== step; });
  summary.hidden = true;
  document.querySelector('#confirmation').hidden = true;
  progress.hidden = false;
  caption.hidden = false;
  controls.hidden = false;
  error.hidden = true;
  back.hidden = step === 0;
  next.textContent = step === 4 ? 'Review my details →' : 'Next →';
  caption.textContent = `Step ${step + 1} of 5 · ${captions[step]}`;
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === step);
    dot.classList.toggle('done', i < step);
    if (i === step) dot.setAttribute('aria-current', 'step');
    else dot.removeAttribute('aria-current');
  });
  if (focus) {
    const legend = panels[step].querySelector('legend');
    legend.setAttribute('tabindex', '-1');
    legend.focus({preventScroll: true});
  }
}
function validateStep() {
  let message = '';
  let target;
  if (step === 0 && !form.querySelector('[name="job"]:checked')) {
    message = 'Please choose the kind of project you have in mind.';
    target = form.querySelector('[name="job"]');
  } else if (step === 1 && !/^\d{5}$/.test(form.elements.zip.value.trim())) {
    message = 'Please enter a 5-digit ZIP code.';
    target = form.elements.zip;
  } else if (step === 4 && !form.elements.phone.value.trim()) {
    message = 'Please enter a phone number so Andre can call you.';
    target = form.elements.phone;
  }
  error.textContent = message;
  error.hidden = !message;
  form.querySelectorAll('[aria-invalid]').forEach(input => {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  });
  if (target) {
    target.setAttribute('aria-invalid', 'true');
    target.setAttribute('aria-describedby', 'form-error');
    target.focus();
  }
  return !message;
}
function showSummary() {
  const values = new FormData(form);
  const photo = form.elements.photo.files[0];
  const rows = [
    ['Project', values.get('job')],
    ['ZIP code', values.get('zip')],
    ['Rooms', values.getAll('rooms').join(', ') || 'Not specified'],
    ['Approximate size', values.get('size').trim() || 'Not sure yet'],
    ['Photo', photo ? photo.name : 'No photo selected'],
    ['Name', values.get('name').trim() || 'Not provided'],
    ['Phone', values.get('phone')]
  ];
  details.replaceChildren();
  rows.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    details.append(dt, dd);
  });
  panels.forEach(panel => { panel.hidden = true; });
  controls.hidden = true;
  caption.textContent = 'Your project · Ready to review';
  dots.forEach(dot => { dot.classList.remove('active'); dot.classList.add('done'); dot.removeAttribute('aria-current'); });
  summary.hidden = false;
  document.querySelector('#summary-title').focus();
}
next.addEventListener('click', () => {
  if (!validateStep()) return;
  if (step < 4) showStep(step + 1);
  else showSummary();
});
back.addEventListener('click', () => showStep(Math.max(0, step - 1)));
document.querySelector('#edit').addEventListener('click', () => showStep(0));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (finished) return;
  if (summary.hidden) {
    next.click();
    return;
  }
  summary.hidden = true;
  progress.hidden = true;
  caption.hidden = true;
  const confirmation = document.querySelector('#confirmation');
  confirmation.hidden = false;
  confirmation.setAttribute('tabindex', '-1');
  confirmation.focus();
  finished = true;
});
document.querySelectorAll('[data-job]').forEach(card => card.addEventListener('click', () => {
  const radio = [...form.querySelectorAll('[name="job"]')].find(input => input.value === card.dataset.job);
  radio.checked = true;
  showStep(0, false);
}));
