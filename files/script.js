const API_BASE = "https://mental-health-analysis-tool.onrender.com";

const form = document.getElementById('predict-form');
const submitBtn = document.getElementById('submit-btn');
const loader = document.getElementById('loader');
const errorMsg = document.getElementById('error-msg');
const resultEl = document.getElementById('result');
const scoreNumber = document.getElementById('score-number');
const scoreLabel = document.getElementById('score-label');
const meterFill = document.getElementById('meter-fill');

function describeScore(score){
  if(score >= 8) return "Strong balance — your habits look supportive of good mental health.";
  if(score >= 6) return "Fairly stable, with some room to improve rest or downtime.";
  if(score >= 4) return "Some strain is showing. Small changes to sleep or screen time could help.";
  return "Signs of real strain. Consider talking to someone you trust or a professional.";
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';
  resultEl.classList.remove('show');

  const data = new FormData(form);
  const stress = form.querySelector('input[name="stress_level"]:checked');
  if(!stress){
    errorMsg.textContent = 'Please select a stress level.';
    errorMsg.style.display = 'block';
    return;
  }

  const payload = {
    age: parseInt(data.get('age'), 10),
    gender: data.get('gender'),
    country: data.get('country').trim(),
    academic_level: data.get('academic_level'),
    most_used_platform: data.get('most_used_platform'),
    purpose_of_use: data.get('purpose_of_use'),
    avg_daily_usage_hours: parseFloat(data.get('avg_daily_usage_hours')),
    daily_unlocks: parseInt(data.get('daily_unlocks'), 10),
    study_hours: parseFloat(data.get('study_hours')),
    physical_activity_hours: parseFloat(data.get('physical_activity_hours')),
    sleep_hours_per_night: parseFloat(data.get('sleep_hours_per_night')),
    stress_level: stress.value
  };

  submitBtn.disabled = true;
  loader.classList.add('active');

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.detail ? JSON.stringify(errBody.detail) : `Request failed (${res.status})`);
    }

    const json = await res.json();
    const score = json.predicted_mental_health_score;

    scoreNumber.textContent = score;
    scoreLabel.textContent = describeScore(score);
    resultEl.classList.add('show');
    requestAnimationFrame(() => {
      const pct = Math.max(0, Math.min(100, (score/10)*100));
      meterFill.style.width = pct + '%';
    });
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    errorMsg.textContent = 'Could not reach the prediction API. Make sure it is running on ' + API_BASE + '. (' + err.message + ')';
    errorMsg.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    loader.classList.remove('active');
  }
});
