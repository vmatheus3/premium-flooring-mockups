const form = document.querySelector('#estimate-form');
const steps = [...form.querySelectorAll('[data-step]')];
const dots = [...document.querySelectorAll('.progress li')];
const next = document.querySelector('#next');
const back = document.querySelector('#back');
const summary = document.querySelector('#estimate-summary');
const result = document.querySelector('#form-result');
const stepLabel = document.querySelector('#step-label');
const titles = ['Your job', 'Your ZIP code', 'Your rooms', 'Your photo', 'Your details'];
let currentStep = 0;

function renderStep(focus = true) {
  steps.forEach((step, index) => {
    step.hidden = index !== currentStep;
    step.disabled = index !== currentStep;
  });
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index <= currentStep);
    if (index === currentStep) dot.setAttribute('aria-current', 'step');
    else dot.removeAttribute('aria-current');
  });
  summary.hidden = currentStep !== 5;
  back.hidden = currentStep === 0 || currentStep === 5;
  next.textContent = currentStep === 5 ? 'Request my estimate ↗' : currentStep === 4 ? 'Review my answers →' : 'Next →';
  stepLabel.textContent = currentStep === 5 ? 'Review your project' : `Step ${currentStep + 1} of 5 · ${titles[currentStep]}`;
  if (focus) {
    const target = currentStep === 5 ? summary : steps[currentStep].querySelector('input');
    target.focus({ preventScroll: true });
  }
}

function makeSummary() {
  const selectedJob = form.querySelector('[name="job"]:checked');
  const rooms = [...form.querySelectorAll('[name="rooms"]:checked')].map(input => input.value);
  const photo = document.querySelector('#photo').files[0];
  const rows = [
    ['Job', selectedJob ? selectedJob.value : 'Not selected'],
    ['ZIP code', form.elements.zip.value],
    ['Rooms', rooms.join(', ') || 'To discuss with Andre'],
    ['Approximate size', form.elements.size.value.trim() || 'Not sure yet'],
    ['Photo', photo ? photo.name : 'No photo selected'],
    ['Name', form.elements.name.value.trim() || 'Not provided'],
    ['Phone', form.elements.phone.value.trim()]
  ];
  const list = document.querySelector('#summary-list');
  list.replaceChildren();
  rows.forEach(([label, value]) => {
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    list.append(term, detail);
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (currentStep === 5) {
    form.hidden = true;
    stepLabel.textContent = 'Thank you for trying the estimate';
    result.hidden = false;
    result.focus({ preventScroll: true });
    return;
  }
  if (currentStep === 4) {
    const phone = form.elements.phone;
    phone.setCustomValidity(phone.value.trim() ? '' : 'Please enter your phone number.');
  }
  if (!form.reportValidity()) return;
  if (currentStep === 4) makeSummary();
  currentStep += 1;
  renderStep();
});
form.elements.phone.addEventListener('input', () => form.elements.phone.setCustomValidity(''));
back.addEventListener('click', () => {
  currentStep = Math.max(0, currentStep - 1);
  renderStep();
});
document.querySelector('#edit-estimate').addEventListener('click', () => {
  currentStep = 0;
  renderStep();
});
document.querySelectorAll('[data-job]').forEach(card => {
  card.addEventListener('click', () => {
    form.querySelectorAll('[name="job"]').forEach(input => {
      input.checked = input.value === card.dataset.job;
    });
    form.hidden = false;
    result.hidden = true;
    currentStep = 0;
    renderStep(false);
  });
});
document.querySelectorAll('.menu nav a').forEach(link => {
  link.addEventListener('click', () => document.querySelector('.menu').open = false);
});
renderStep(false);
