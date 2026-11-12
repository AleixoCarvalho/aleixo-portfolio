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
    const record = Object.fromEntries(new FormData(form));
    record.submitted_at = new Date().toISOString();
    try{
      // 1) Save to the Skybase database (only reachable while Skybase is running on this computer)
      // Forms marked data-skybase are saved by Skybase's own script, so don't save them twice.
      const savedToDb = (form.dataset.skybase && window.Skybase) ? true : await saveToSkybase(form.dataset.table, record);
      // 2) Email backup via FormSubmit
      let emailed = false;
      try{
        const r = await fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
          method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'},
          body:JSON.stringify({...record, _subject:form.dataset.subject, _template:'table', _captcha:'false'})
        });
        const j = await r.json();
        emailed = r.ok && String(j.success) === 'true';
      }catch(_){}
      if(!savedToDb && !emailed) throw new Error('Not saved');
      form.innerHTML = `<h2 style="font-family:var(--serif);font-weight:400;font-size:2.2rem;margin-bottom:16px">Thank you.</h2>
        <p style="color:#555;line-height:1.7">${form.dataset.thanks}</p>
        <a href="index.html" class="btn" style="margin-top:30px;width:auto;border-color:#000">Back to home</a>`;
    }catch(err){
      status.textContent = 'Something went wrong. Please try again in a moment.';
      btn.disabled = false; btn.textContent = label;
    }
  });
});

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
