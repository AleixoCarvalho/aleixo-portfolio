// Sends form submissions by email via FormSubmit (https://formsubmit.co).
// The first submission triggers a one-time activation email to the address below.
const FORM_EMAIL = 'aleixus3@gmail.com';

document.querySelectorAll('form[data-subject]').forEach(form => {
  // This script saves to Skybase itself (one handler, one message), so tell Skybase's
  // auto-hook to leave this form alone.
  form.__skybase = true;
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
    const record = Object.fromEntries(new FormData(form));
    record.submitted_at = new Date().toISOString();
    try{
      // Start both at once: the Skybase save (fast, local) and the email copy (FormSubmit, can be slow).
      const emailP = sendEmail(form, record);
      const savedToDb = await saveToSkybase(form.dataset.skybase || form.dataset.table, record);
      // If Skybase saved it, show "Thank you" straight away and let the email finish in the background.
      // Only wait for the email when Skybase couldn't be reached (e.g. a visitor on another device).
      if(!savedToDb && !(await emailP)) throw new Error('Not saved');
      form.innerHTML = `<h2 style="font-family:var(--serif);font-weight:400;font-size:2.2rem;margin-bottom:16px">Thank you.</h2>
        <p style="color:#555;line-height:1.7">${form.dataset.thanks}</p>
        <a href="index.html" class="btn" style="margin-top:30px;width:auto;border-color:#000">Back to home</a>`;
    }catch(err){
      status.textContent = 'Something went wrong. Please try again in a moment.';
      btn.disabled = false; btn.textContent = label;
    }
  });
});

// Email copy via FormSubmit. keepalive lets it finish even after the page changes;
// gives up after 15 seconds so a visitor is never left waiting forever.
async function sendEmail(form, record){
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 15000);
  try{
    const r = await fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
      method:'POST', keepalive:true, signal:ctrl.signal,
      headers:{'Content-Type':'application/json', Accept:'application/json'},
      body:JSON.stringify({...record, _subject:form.dataset.subject, _template:'table', _captcha:'false'})
    });
    const j = await r.json();
    return r.ok && String(j.success) === 'true';
  }catch(_){ return false; }
  finally{ clearTimeout(timer); }
}

// Skybase save: tries the form's own table (clients / appointments);
// if Skybase won't create that table, falls back to "appointments" with a record_type column.
async function saveToSkybase(table, record){
  if(!window.Skybase || !Skybase.db) return false;
  const type = table === 'clients' ? 'registration' : 'booking';
  try{ await Skybase.db.table(table).add(record); return true; }
  catch(e){ console.warn('Skybase: could not save to "' + table + '"', e); }
  if(table !== 'appointments'){
    try{ await Skybase.db.table('appointments').add({record_type:type, ...record}); return true; }
    catch(e){ console.warn('Skybase: fallback save failed', e); }
  }
  return false;
}

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
