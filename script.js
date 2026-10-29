(() => {
 const $ = id => document.getElementById(id);
 // Always return to the published landing page, removing the calculator query string.
 const homeLink = document.querySelector('.back-home');
 if (homeLink) homeLink.addEventListener('click', event => {
   event.preventDefault();
   window.location.assign(window.location.pathname.replace(/[^/]*$/, 'index.html'));
 });
 const params = new URLSearchParams(window.location.search);
 const useFreeLink = $('useFree');
 if (useFreeLink) useFreeLink.href = window.location.pathname + '?page=calculator';
 if (params.get('page') === 'calculator') { document.body.classList.add('calculator-page'); document.title = 'BunkMeter Calculator — Attendance Planner'; }
 let mode = 'lecture';
 let latestProjection = null;
 const num = id => Math.max(0, Math.floor(Number($(id).value) || 0));
 function setMode(next) { mode = next; $('lectureMode').classList.toggle('active', mode === 'lecture'); $('dayMode').classList.toggle('active', mode === 'day'); $('lectureFields').classList.toggle('hidden', mode !== 'lecture'); $('dayFields').classList.toggle('hidden', mode !== 'day'); }

 function renderAttendanceCharts(a,t,targetValue,pct,missed=0,future=0,recover=0) {
   const svgFor=(withTarget=true)=> {
     const W=760,H=286,L=54,R=22,T=22,B=48,PW=W-L-R,PH=H-T-B,N=24;
     const range=Math.max(12,Math.ceil(Math.max(t*.3,missed,future,1)/N)*N);
     const xs=Array.from({length:N+1},(_,i)=>-range+2*range*i/N);
     const x=v=>L+(v+range)/(2*range)*PW;
     const y=v=>T+(100-Math.max(0,Math.min(100,v)))/100*PH;
     const bunk=v=>a/(t+Math.max(0,-v))*100;
     const attend=v=>(a+Math.max(0,v))/(t+Math.max(0,v))*100;
     const path=fn=>xs.map((v,i)=>(i?'L':'M')+x(v).toFixed(1)+','+y(fn(v)).toFixed(1)).join(' ');
     const area=fn=>path(fn)+` L${x(range).toFixed(1)},${y(0).toFixed(1)} L${x(-range).toFixed(1)},${y(0).toFixed(1)} Z`;
     let grid='';
     [0,25,50,75,100].forEach(v=>{grid+=`<line x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}" class="chart-grid"/><text x="${L-12}" y="${y(v)+4}" class="chart-y-label" text-anchor="end">${v}%</text>`;});
     const ticks=[-range,-Math.round(range/2),0,Math.round(range/2),range];
     ticks.forEach(v=>{grid+=`<line x1="${x(v)}" y1="${T}" x2="${x(v)}" y2="${H-B}" class="chart-grid chart-grid-vertical"/><text x="${x(v)}" y="${H-25}" class="chart-x-label" text-anchor="middle">${v>0?'+':''}${v}</text>`;});
     const tx=y(targetValue),bx=Math.max(-range,Math.min(range,-missed)),ax=Math.max(-range,Math.min(range,future)),cx=x(0),cy=y(a/t*100);
     return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Attendance forecast. The pink curve shows attendance if lectures are missed, the teal curve shows attendance if extra lectures are attended, and the dashed purple line is the required target.">
       <defs><linearGradient id="bunkArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff356b" stop-opacity=".22"/><stop offset="100%" stop-color="#ff356b" stop-opacity="0"/></linearGradient><linearGradient id="attendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#20ad91" stop-opacity=".2"/><stop offset="100%" stop-color="#20ad91" stop-opacity="0"/></linearGradient></defs>
       ${grid}
       <line x1="${cx}" y1="${T}" x2="${cx}" y2="${H-B}" class="chart-current-line"/>
       ${withTarget?`<line x1="${L}" y1="${tx}" x2="${W-R}" y2="${tx}" class="chart-target-line"/><text x="${W-R-2}" y="${Math.max(13,tx-8)}" class="chart-target-label" text-anchor="end">Target ${targetValue}%</text>`:''}
       <path d="${area(bunk)}" fill="url(#bunkArea)"/><path d="${area(attend)}" fill="url(#attendArea)"/>
       <path d="${path(bunk)}" class="chart-line chart-line-bunk"/><path d="${path(attend)}" class="chart-line chart-line-attend"/>
       <circle cx="${cx}" cy="${cy}" r="7" class="chart-current-halo"/><circle cx="${cx}" cy="${cy}" r="4" class="chart-current-dot"/>
       <circle cx="${x(bx)}" cy="${y(bunk(bx))}" r="5" class="chart-point chart-point-bunk"><title>After ${Math.abs(bx)} missed lectures: ${bunk(bx).toFixed(2)}%</title></circle>
       <circle cx="${x(ax)}" cy="${y(attend(ax))}" r="5" class="chart-point chart-point-attend"><title>After ${ax} extra attended lectures: ${attend(ax).toFixed(2)}%</title></circle>
       <text x="${L}" y="${H-7}" class="chart-axis-caption">Missed lectures</text><text x="${W-R}" y="${H-7}" class="chart-axis-caption" text-anchor="end">Extra attended lectures</text>
     </svg>`;
   };
   const trend=$('trendChart');if(trend)trend.innerHTML=svgFor();
   const preview=$('previewChart');if(preview)preview.innerHTML=svgFor(false);
   const current=a/t*100;
   const currentEl=$('previewCurrent');if(currentEl)currentEl.textContent=current.toFixed(2)+'%';
   const p=$('previewProjected');if(p)p.textContent=pct.toFixed(2)+'%';
   const target=$('previewTarget');if(target)target.textContent=targetValue+'%';
   const recovery=$('previewRecovery');if(recovery)recovery.textContent=Number.isFinite(recover)?String(recover):'—';
 }

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
   // This metric describes the student's current bunk allowance, not the projected scenario.
   // If current attendance is below the required percentage, no additional lectures can be missed.
   const maxMiss = current + 1e-10 < targetValue || target >= 1 ? 0 : Math.max(0, Math.floor((a / target) - t + 1e-10));
   const gap = pct - target * 100;
   const recover = pct >= target*100 ? 0 : (target >= 1 ? Infinity : Math.max(0, Math.ceil((target*projectedTotal-projectedAttended)/(1-target))));
   renderAttendanceCharts(a,t,targetValue,pct,missed,future,recover);
   $('resultTitle').textContent = title; $('resultSub').textContent = mode === 'day' ? `${missed} lectures missed · ${future} lectures attended` : 'Your projected attendance';
   $('percentage').textContent = pct.toFixed(2) + '%'; $('percentage').className = 'big-number ' + (pct >= target*100 ? 'good' : 'bad');
   $('progressFill').style.width = Math.min(100, pct) + '%'; $('progressFill').classList.toggle('bad', pct < target*100);
   $('targetLabel').textContent = `Required: ${(target*100).toFixed(0)}%`;
   $('status').textContent = pct >= target*100 ? 'Above minimum' : 'Below minimum'; $('status').classList.toggle('danger', pct < target*100);
   $('currentMetric').textContent = current.toFixed(2) + '%'; $('maxMissMetric').textContent = maxMiss;
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
 $('lectureMode').addEventListener('click', () => setMode('lecture')); $('dayMode').addEventListener('click', () => setMode('day'));
 $('calculate').addEventListener('click', calculate);
 document.querySelectorAll('[data-target]').forEach(btn => btn.addEventListener('click', () => { $('target').value = btn.dataset.target; document.querySelectorAll('[data-target]').forEach(b => b.classList.toggle('selected', b === btn)); }));
 // Inputs only update when the user explicitly taps a calculation button.
 $('resultTitle').textContent = 'Ready to calculate';
 $('resultSub').textContent = 'Enter your attendance details, then tap Calculate My Attendance.';
 $('percentage').textContent = '—';
 $('status').textContent = 'Awaiting input';
 $('status').classList.remove('danger');
 $('currentMetric').textContent = '—'; $('maxMissMetric').textContent = '—'; $('attendedMetric').textContent = '—'; $('gapMetric').textContent = '—';
 $('advice').innerHTML = '<strong>Your results will appear here.</strong>Update the inputs above and tap Calculate My Attendance when you are ready.';
 $('recoveryText').textContent = 'Calculate your attendance first, then use the recovery planner when you want a recovery estimate.';
})();