// Sends form submissions by email via FormSubmit (https://formsubmit.co).
// The first submission triggers a one-time activation email to the address below.
const FORM_EMAIL = 'aleixus3@gmail.com';

document.querySelectorAll('form[data-subject]').forEach(form => {
  const status = form.querySelector('.error');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    if(!form.checkValidity()){ form.reportValidity(); return; }
    if(form.dataset.slots && !form.querySelector('input[name="time"]:checked')){
      status.textContent = 'Please choose a time slot.'; return;
    }
    const btn = form.querySelector('button[type="submit"]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
    const data = Object.fromEntries(new FormData(form));
    data._subject = form.dataset.subject;
    data._template = 'table';
    data._captcha = 'false';
    try{
      const r = await fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
        method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'}, body:JSON.stringify(data)
      });
      const j = await r.json();
      if(!r.ok || String(j.success) !== 'true') throw new Error(j.message || 'Failed');
      form.innerHTML = `<h2 style="font-family:var(--serif);font-weight:400;font-size:2.2rem;margin-bottom:16px">Thank you.</h2>
        <p style="color:#555;line-height:1.7">${form.dataset.thanks}</p>
        <a href="index.html" class="btn" style="margin-top:30px;width:auto;border-color:#000">Back to home</a>`;
    }catch(err){
      status.textContent = 'Something went wrong. Please try again in a moment.';
      btn.disabled = false; btn.textContent = label;
    }
  });
});

// Booking: block past dates and weekends
const d = document.getElementById('date');
if(d){
  const t = new Date(); t.setDate(t.getDate() + 1);
  d.min = t.toISOString().split('T')[0];
  d.addEventListener('input', () => {
    const day = new Date(d.value + 'T12:00').getDay();
    d.setCustomValidity(day === 0 || day === 6 ? 'Appointments are available Monday to Friday.' : '');
  });
}
