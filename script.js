(() => {
 const $ = id => document.getElementById(id);
 const params = new URLSearchParams(window.location.search);
 const useFreeLink = $('useFree');
 if (useFreeLink) useFreeLink.href = window.location.pathname + '?page=calculator';
 if (params.get('page') === 'calculator') { document.body.classList.add('calculator-page'); document.title = 'BunkMeter Calculator — Attendance Planner'; }
 let mode = 'lecture';
 let latestProjection = null;
 const num = id => Math.max(0, Math.floor(Number($(id).value) || 0));
 function setMode(next) { mode = next; $('lectureMode').classList.toggle('active', mode === 'lecture'); $('dayMode').classList.toggle('active', mode === 'day'); $('lectureFields').classList.toggle('hidden', mode !== 'lecture'); $('dayFields').classList.toggle('hidden', mode !== 'day'); calculate(); }
 function calculate() {
   const a = num('attended'), t = num('total'), targetValue = Number($('target').value), target = targetValue / 100;
   if (!Number.isFinite(targetValue) || targetValue < 1 || targetValue > 100) { latestProjection = null; $('resultTitle').textContent = 'Check required attendance'; $('resultSub').textContent = 'Enter a percentage from 1 to 100.'; $('percentage').textContent = '—'; $('status').textContent = 'Invalid target'; $('status').classList.add('danger'); $('advice').innerHTML = '<strong>Required attendance must be between 1% and 100%.</strong>You can type your own percentage in the target field.'; return; }
   $('status').classList.remove('danger');
   document.querySelectorAll('[data-target]').forEach(btn => btn.classList.toggle('selected', Number(btn.dataset.target) === targetValue));
   if (t < 1 || a > t) { latestProjection = null; $('resultTitle').textContent = 'Check your numbers'; $('resultSub').textContent = 'Attended lectures cannot exceed total lectures.'; $('percentage').textContent = '—'; $('status').textContent = 'Invalid input'; $('status').classList.add('danger'); $('advice').innerHTML = '<strong>Update your attendance details.</strong>Enter a total greater than zero and attended lectures no greater than total lectures.'; return; }
   let missed = 0, future = 0, title = '';
   if (mode === 'lecture') { missed = num('missLectures'); future = num('attendLectures'); title = `After missing ${missed} lecture${missed===1?'':'s'}`; }
   else { const perDay = num('perDay'); if (perDay < 1) { $('resultTitle').textContent = 'Enter lectures per day'; $('resultSub').textContent = 'Day mode needs your daily lecture count.'; $('percentage').textContent = '—'; return; } missed = num('missDays') * perDay; future = num('attendDays') * perDay; title = `After missing ${num('missDays')} college day${num('missDays')===1?'':'s'}`; }
   const projectedTotal = t + missed + future;
   const projectedAttended = a + future;
   const pct = projectedAttended / projectedTotal * 100;
   latestProjection = { attended: projectedAttended, total: projectedTotal, pct };
   const current = a / t * 100;
   const maxMiss = pct + 1e-10 < target * 100 || target >= 1 ? 0 : Math.max(0, Math.floor((projectedAttended / target) - projectedTotal + 1e-10));
   const gap = pct - target * 100;
   const recover = pct >= target*100 ? 0 : (target >= 1 ? Infinity : Math.max(0, Math.ceil((target*projectedTotal-projectedAttended)/(1-target))));
   $('resultTitle').textContent = title; $('resultSub').textContent = mode === 'day' ? `${missed} lectures missed · ${future} lectures attended` : 'Your projected attendance';
   $('percentage').textContent = pct.toFixed(2) + '%'; $('percentage').className = 'big-number ' + (pct >= target*100 ? 'good' : 'bad');
   $('progressFill').style.width = Math.min(100, pct) + '%'; $('progressFill').classList.toggle('bad', pct < target*100);
   $('targetLabel').textContent = `Required: ${(target*100).toFixed(0)}%`;
   $('status').textContent = pct >= target*100 ? 'Above minimum' : 'Below minimum'; $('status').classList.toggle('danger', pct < target*100);
   $('currentMetric').textContent = current.toFixed(2) + '%'; $('maxMissMetric').textContent = maxMiss < 0 ? '0' : maxMiss;
   $('attendedMetric').textContent = `${projectedAttended} / ${projectedTotal}`; $('gapMetric').textContent = `${gap >= 0 ? '+' : ''}${gap.toFixed(2)}%`;
   if (pct >= target*100) { $('advice').innerHTML = `<strong>You're within your limit.</strong>Your projected attendance is ${pct.toFixed(2)}%, which is ${(pct-target*100).toFixed(2)} percentage points above the minimum.`; }
   else { $('advice').innerHTML = `<strong>Careful — you'll fall below the minimum.</strong>Your projected attendance is ${pct.toFixed(2)}%. You need to attend ${Math.max(0,Math.ceil((target*projectedTotal-projectedAttended)/(1-target)))} consecutive lectures to recover to ${(target*100).toFixed(0)}%.`; }
   if (pct >= target*100) {
     const projectedBuffer = target >= 1 ? 0 : Math.max(0, Math.floor(projectedAttended/target-projectedTotal+1e-10));
     $('recoveryText').textContent = `Your projected attendance is ${pct.toFixed(2)}%, which meets the ${target*100}% target. From this projected position, you could miss up to ${projectedBuffer} more lecture${projectedBuffer===1?'':'s'} and stay at or above the target.`;
   } else if (!Number.isFinite(recover)) {
     $('recoveryText').textContent = `At a 100% target, recovery is only possible if every lecture counted so far and every future lecture is attended. Because your projected attendance is ${pct.toFixed(2)}%, there is no finite number of lectures that can restore 100% after an absence.`;
   } else {
     $('recoveryText').textContent = `After your planned changes, attendance is ${pct.toFixed(2)}%. Attend ${recover} consecutive lectures without missing any to reach ${(target*100).toFixed(0)}%. This recovery estimate starts from the projected total of ${projectedTotal} lectures and ${projectedAttended} attended.`;
   }
 }
 function planRecovery() {
   const goalValue = Number($('goalAttendance').value);
   const perDay = Math.floor(Number($('recoveryPerDay').value));
   const message = $('recoveryPlannerMessage');
   if (!Number.isFinite(goalValue) || goalValue < 1 || goalValue > 100 || !Number.isFinite(perDay) || perDay < 1) {
     $('recoveryLecturesResult').textContent = '—'; $('recoveryDaysResult').textContent = '—';
     message.innerHTML = '<strong>Check your inputs.</strong>Desired attendance must be 1–100%, and lectures per day must be at least 1.'; return;
   }
   if (!latestProjection) { $('recoveryLecturesResult').textContent = '—'; $('recoveryDaysResult').textContent = '—'; message.innerHTML = '<strong>Fix your attendance inputs first.</strong>Enter valid attended and total lecture counts above.'; return; }
   const goal = goalValue / 100;
   const { attended, total, pct } = latestProjection;
   if (pct + 1e-10 >= goalValue) {
     $('recoveryLecturesResult').textContent = '0'; $('recoveryDaysResult').textContent = '0';
     message.innerHTML = `<strong>Goal already achieved.</strong>Your projected attendance is ${pct.toFixed(2)}%, which meets your ${goalValue}% goal. Keep attending to maintain a buffer.`; return;
   }
   if (goal >= 1) {
     $('recoveryLecturesResult').textContent = 'Not possible'; $('recoveryDaysResult').textContent = 'Not possible';
     message.innerHTML = `<strong>A 100% target cannot be recovered from your current projection.</strong>Your projected attendance is ${pct.toFixed(2)}%. Once any lecture has been missed, attending future lectures can approach but not restore 100%.`; return;
   }
   const lectures = Math.max(0, Math.ceil((goal * total - attended) / (1 - goal) - 1e-10));
   const days = Math.ceil(lectures / perDay);
   $('recoveryLecturesResult').textContent = lectures.toLocaleString(); $('recoveryDaysResult').textContent = days.toLocaleString();
   const finalPct = (attended + lectures) / (total + lectures) * 100;
   message.innerHTML = `<strong>Recovery plan from ${pct.toFixed(2)}% to ${goalValue}%.</strong>Attend ${lectures} lectures without missing any. At ${perDay} lectures per day, that is about ${days} college day${days===1?'':'s'} (the final day may require fewer than ${perDay} lectures). Estimated attendance after recovery: ${finalPct.toFixed(2)}%.`;
 }
 $('planRecovery').addEventListener('click', planRecovery);
 ['goalAttendance','recoveryPerDay'].forEach(id => $(id).addEventListener('input', planRecovery));
 $('lectureMode').addEventListener('click', () => setMode('lecture')); $('dayMode').addEventListener('click', () => setMode('day')); $('calculate').addEventListener('click', () => { calculate(); planRecovery(); }); $('target').addEventListener('input', () => { calculate(); planRecovery(); });
 document.querySelectorAll('[data-target]').forEach(btn => btn.addEventListener('click', () => { $('target').value = btn.dataset.target; calculate(); planRecovery(); }));
 ['attended','total','missLectures','attendLectures','perDay','missDays','attendDays'].forEach(id => $(id).addEventListener('input', () => { calculate(); planRecovery(); }));
 calculate(); planRecovery();
})();
