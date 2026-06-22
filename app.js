let stato = {
    oggi: [], gtd: { inbox: [], casa: [], lavoro: [], pc: [], fuori: [] },
    eisenhower: { 1: [], 2: [], 3: [], 4: [] },
    timeblocks: [], okr: [], week12: [], week12Start: null, theme: 'dark',
    habits: [], recurring: [],
    stats: { history: {}, streak: 0, bestDay: 0, totalCompleted: 0 },
    categories: {
        gtd: [
            { id: 'inbox', name: 'Inbox', icon: '📥', color: '#6366f1' },
            { id: 'casa', name: 'Casa', icon: '🏠', color: '#10b981' },
            { id: 'lavoro', name: 'Lavoro', icon: '💼', color: '#f59e0b' },
            { id: 'pc', name: 'PC', icon: '💻', color: '#8b5cf6' },
            { id: 'fuori', name: 'Fuori', icon: '🚶', color: '#ec4899' }
        ],
        tb: [
            { id: 'lavoro', name: 'Lavoro', icon: '💼', color: '#6366f1' },
            { id: 'studio', name: 'Studio', icon: '📚', color: '#10b981' },
            { id: 'sport', name: 'Sport', icon: '🏃', color: '#f59e0b' },
            { id: 'personale', name: 'Personale', icon: '🏠', color: '#ec4899' },
            { id: 'riposo', name: 'Riposo', icon: '😴', color: '#94a3b8' }
        ]
    },
    meta: { created: new Date().toISOString(), lastBackup: null },
    events: [],
    calendarNotif: { enabled: false, advanceMin: 15, os: 'linux' }
};

function salva() { localStorage.setItem('lifePlanner', JSON.stringify(stato)); }

function carica() {
    const d = localStorage.getItem('lifePlanner');
    if (d) {
        const parsed = JSON.parse(d);
        stato = { ...stato, ...parsed };
        if (!stato.habits) stato.habits = [];
        if (!stato.recurring) stato.recurring = [];
        if (!stato.events) stato.events = [];
        if (!stato.calendarNotif) stato.calendarNotif = { enabled: false, advanceMin: 15, os: 'linux' };
        if (!stato.stats) stato.stats = { history: {}, streak: 0, bestDay: 0, totalCompleted: 0 };
        if (!stato.categories) stato.categories = {
            gtd: [{ id: 'inbox', name: 'Inbox', icon: '📥', color: '#6366f1' }, { id: 'casa', name: 'Casa', icon: '🏠', color: '#10b981' }, { id: 'lavoro', name: 'Lavoro', icon: '💼', color: '#f59e0b' }, { id: 'pc', name: 'PC', icon: '💻', color: '#8b5cf6' }, { id: 'fuori', name: 'Fuori', icon: '🚶', color: '#ec4899' }],
            tb: [{ id: 'lavoro', name: 'Lavoro', icon: '💼', color: '#6366f1' }, { id: 'studio', name: 'Studio', icon: '📚', color: '#10b981' }, { id: 'sport', name: 'Sport', icon: '🏃', color: '#f59e0b' }, { id: 'personale', name: 'Personale', icon: '🏠', color: '#ec4899' }, { id: 'riposo', name: 'Riposo', icon: '😴', color: '#94a3b8' }]
        };
        if (!stato.meta) stato.meta = { created: new Date().toISOString(), lastBackup: null };
    }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function oggiStr() { return new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); }
function oggiKey() { return new Date().toISOString().split('T')[0]; }

// ============ NAVIGAZIONE ============
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('view-' + tab.dataset.view).classList.add('active');
        if (tab.dataset.view === 'stats') renderStats();
        if (tab.dataset.view === 'settings') renderSettings();
        if (tab.dataset.view === 'calendar') { renderCalendar(); initCalendarSettings(); }
    });
});

// ============ TEMA ============
document.getElementById('btn-theme').addEventListener('click', () => {
    stato.theme = stato.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', stato.theme);
    document.getElementById('btn-theme').textContent = stato.theme === 'dark' ? '🌙' : '☀️';
    salva();
});

// ============ SEARCH ============
document.getElementById('btn-search').addEventListener('click', () => {
    const bar = document.getElementById('search-bar');
    bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    if (bar.style.display === 'flex') document.getElementById('search-input').focus();
});
document.getElementById('btn-close-search').addEventListener('click', () => {
    document.getElementById('search-bar').style.display = 'none';
    document.getElementById('search-input').value = '';
    renderAll();
});
document.getElementById('search-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.task-list li, .habit-card').forEach(li => {
        const text = li.textContent.toLowerCase();
        li.style.display = !q || text.includes(q) ? '' : 'none';
    });
});

// ============ CATEGORIE ============
function renderCatSelects() {
    const selOggi = document.getElementById('select-task-cat-oggi');
    selOggi.innerHTML = '<option value="">📁 Nessuna</option>';
    stato.categories.tb.forEach(c => {
        selOggi.innerHTML += `<option value="${c.id}">${c.icon} ${c.name}</option>`;
    });
    const selTb = document.getElementById('input-tb-categoria');
    selTb.innerHTML = '';
    stato.categories.tb.forEach(c => {
        selTb.innerHTML += `<option value="${c.id}">${c.icon} ${c.name}</option>`;
    });
}

function renderCatChips() {
    const listGtd = document.getElementById('cat-list-gtd');
    listGtd.innerHTML = '';
    stato.categories.gtd.forEach(c => {
        const chip = document.createElement('div');
        chip.className = 'cat-chip';
        chip.style.background = c.color;
        chip.innerHTML = `<span>${c.icon} ${c.name}</span><button class="cat-del" data-type="gtd" data-id="${c.id}">✕</button>`;
        listGtd.appendChild(chip);
    });
    listGtd.querySelectorAll('.cat-del').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (['inbox', 'casa', 'lavoro', 'pc', 'fuori'].includes(id)) {
                alert('Questa è una categoria di base, non può essere eliminata.');
                return;
            }
            if (confirm(`Eliminare la categoria "${id}"?`)) {
                stato.categories.gtd = stato.categories.gtd.filter(c => c.id !== id);
                salva(); renderCatChips(); renderGTD(); renderCatSelects();
            }
        });
    });

    const listTb = document.getElementById('cat-list-tb');
    listTb.innerHTML = '';
    stato.categories.tb.forEach(c => {
        const chip = document.createElement('div');
        chip.className = 'cat-chip';
        chip.style.background = c.color;
        chip.innerHTML = `<span>${c.icon} ${c.name}</span><button class="cat-del" data-type="tb" data-id="${c.id}">✕</button>`;
        listTb.appendChild(chip);
    });
    listTb.querySelectorAll('.cat-del').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (['lavoro', 'studio', 'sport', 'personale', 'riposo'].includes(id)) {
                alert('Questa è una categoria di base, non può essere eliminata.');
                return;
            }
            if (confirm(`Eliminare la categoria "${id}"?`)) {
                stato.categories.tb = stato.categories.tb.filter(c => c.id !== id);
                salva(); renderCatChips(); renderTimeblocks(); renderCatSelects();
            }
        });
    });
}

document.getElementById('btn-add-cat-gtd').addEventListener('click', () => {
    const name = document.getElementById('input-new-cat-gtd').value.trim();
    const icon = document.getElementById('input-new-cat-gtd-icon').value.trim() || '📁';
    const color = document.getElementById('input-new-cat-gtd-color').value;
    if (!name) return;
    const id = 'cat-' + uid();
    stato.categories.gtd.push({ id, name, icon, color });
    document.getElementById('input-new-cat-gtd').value = '';
    document.getElementById('input-new-cat-gtd-icon').value = '';
    salva(); renderCatChips(); renderGTD(); renderCatSelects();
});

document.getElementById('btn-add-cat-tb').addEventListener('click', () => {
    const name = document.getElementById('input-new-cat-tb').value.trim();
    const icon = document.getElementById('input-new-cat-tb-icon').value.trim() || '📁';
    const color = document.getElementById('input-new-cat-tb-color').value;
    if (!name) return;
    const id = 'cat-' + uid();
    stato.categories.tb.push({ id, name, icon, color });
    document.getElementById('input-new-cat-tb').value = '';
    document.getElementById('input-new-cat-tb-icon').value = '';
    salva(); renderCatChips(); renderTimeblocks(); renderCatSelects();
});

// ============ HABITS ============
document.getElementById('btn-add-habit').addEventListener('click', () => {
    const name = document.getElementById('input-habit').value.trim();
    const freq = document.getElementById('select-habit-freq').value;
    if (!name) return;
    stato.habits.push({ id: uid(), name, freq, streak: 0, lastDone: null });
    document.getElementById('input-habit').value = '';
    salva(); renderHabits();
});

function renderHabits() {
    const grid = document.getElementById('habits-grid');
    grid.innerHTML = '';
    const today = oggiKey();
    stato.habits.forEach(h => {
        const doneToday = h.lastDone === today;
        const card = document.createElement('div');
        card.className = 'habit-card' + (doneToday ? ' done' : '');
        card.innerHTML = `
            <div class="habit-name">${h.freq === 'daily' ? '📅' : '📆'} ${h.name}</div>
            <div class="habit-streak">🔥 Streak: ${h.streak} giorni</div>
            <div class="habit-actions">
                <button class="btn-done">${doneToday ? '✅ Fatto' : '✓ Segna'}</button>
                <button class="btn-delete">🗑️</button>
            </div>`;
        card.querySelector('.btn-done').addEventListener('click', () => {
            if (!doneToday) { h.streak++; h.lastDone = today; aggiornaStats(); }
            else { h.streak = Math.max(0, h.streak - 1); h.lastDone = null; }
            salva(); renderHabits();
        });
        card.querySelector('.btn-delete').addEventListener('click', () => {
            stato.habits = stato.habits.filter(x => x.id !== h.id);
            salva(); renderHabits();
        });
        grid.appendChild(card);
    });
}

// ============ RECURRING ============
document.getElementById('btn-add-recurring').addEventListener('click', () => {
    const text = document.getElementById('input-recurring').value.trim();
    const time = document.getElementById('input-recurring-time').value;
    const freq = document.getElementById('select-recurring-freq').value;
    if (!text) return;
    stato.recurring.push({ id: uid(), text, time, freq, lastGenerated: null });
    document.getElementById('input-recurring').value = '';
    document.getElementById('input-recurring-time').value = '';
    salva(); renderRecurring(); generaRecurringOggi();
});

function generaRecurringOggi() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const todayKeyVal = oggiKey();
    stato.recurring.forEach(r => {
        let shouldGenerate = false;
        if (r.freq === 'daily') shouldGenerate = true;
        else if (r.freq === 'weekdays' && isWeekday) shouldGenerate = true;
        else if (r.freq === 'weekend' && isWeekend) shouldGenerate = true;
        else if (r.freq === 'weekly') {
            const last = r.lastGenerated ? new Date(r.lastGenerated) : null;
            if (!last || (today - last) >= 7 * 24 * 60 * 60 * 1000) shouldGenerate = true;
        }
        if (shouldGenerate && r.lastGenerated !== todayKeyVal) {
            const exists = stato.oggi.some(t => t.recurringId === r.id && t.date === todayKeyVal);
            if (!exists) {
                stato.oggi.push({ id: uid(), text: r.text, time: r.time, done: false, recurringId: r.id, date: todayKeyVal });
                r.lastGenerated = todayKeyVal;
            }
        }
    });
    salva();
}

function renderRecurring() {
    const lista = document.getElementById('lista-recurring');
    lista.innerHTML = '';
    const freqLabels = { daily: '📅 Giornaliero', weekdays: '💼 Lun-Ven', weekend: '🏖️ Weekend', weekly: '📆 Settimanale' };
    stato.recurring.forEach(r => {
        const li = document.createElement('li');
        li.className = 'recurring';
        li.innerHTML = `
            <span class="task-text">${r.text}</span>
            ${r.time ? `<span class="task-time">⏰ ${r.time}</span>` : ''}
            <span class="task-freq">${freqLabels[r.freq]}</span>
            <button class="btn-delete">🗑️</button>`;
        li.querySelector('.btn-delete').addEventListener('click', () => {
            stato.recurring = stato.recurring.filter(x => x.id !== r.id);
            salva(); renderRecurring();
        });
        lista.appendChild(li);
    });
}

// ============ TASK OGGI ============
document.getElementById('data-oggi').textContent = oggiStr();
document.getElementById('btn-add-oggi').addEventListener('click', () => {
    const text = document.getElementById('input-task-oggi').value.trim();
    const time = document.getElementById('input-time-oggi').value;
    const cat = document.getElementById('select-task-cat-oggi').value;
    if (!text) return;
    stato.oggi.push({ id: uid(), text, time, done: false, date: oggiKey(), category: cat });
    document.getElementById('input-task-oggi').value = '';
    document.getElementById('input-time-oggi').value = '';
    salva(); renderOggi();
});

function renderOggi() {
    const lista = document.getElementById('lista-oggi');
    lista.innerHTML = '';
    const todayTasks = stato.oggi.filter(t => t.date === oggiKey() || !t.date);
    todayTasks.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    todayTasks.forEach(task => {
        const li = document.createElement('li');
        if (task.done) li.classList.add('done');
        if (task.recurringId) li.classList.add('recurring');
        const cat = stato.categories.tb.find(c => c.id === task.category);
        const catHtml = cat ? `<span class="task-cat" style="background:${cat.color}">${cat.icon} ${cat.name}</span>` : '';
        li.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            ${catHtml}${task.time ? `<span class="task-time">⏰ ${task.time}</span>` : ''}
            <button class="btn-delete">🗑️</button>`;
        li.querySelector('input').addEventListener('change', () => {
            task.done = !task.done;
            if (task.done) aggiornaStats();
            salva(); renderOggi();
        });
        li.querySelector('.btn-delete').addEventListener('click', () => {
            stato.oggi = stato.oggi.filter(t => t.id !== task.id);
            salva(); renderOggi();
        });
        lista.appendChild(li);
    });
    const done = todayTasks.filter(t => t.done).length;
    const total = todayTasks.length;
    const pct = total ? (done / total) * 100 : 0;
    document.getElementById('progress-oggi').style.width = pct + '%';
    document.getElementById('stats-oggi').textContent = `${done}/${total} completati`;
}

// ============ STATS ============
function aggiornaStats() {
    const today = oggiKey();
    if (!stato.stats.history[today]) stato.stats.history[today] = 0;
    stato.stats.history[today]++;
    stato.stats.totalCompleted++;
    if (stato.stats.history[today] > stato.stats.bestDay) stato.stats.bestDay = stato.stats.history[today];
    let streak = 0;
    const d = new Date();
    while (true) {
        const k = d.toISOString().split('T')[0];
        if (stato.stats.history[k] && stato.stats.history[k] > 0) { streak++; d.setDate(d.getDate() - 1); }
        else break;
    }
    stato.stats.streak = streak;
    salva();
}

function renderStats() {
    document.getElementById('stat-streak').textContent = stato.stats.streak;
    document.getElementById('stat-total').textContent = stato.stats.totalCompleted;
    document.getElementById('stat-best').textContent = stato.stats.bestDay;
    const todayTasks = stato.oggi.filter(t => t.date === oggiKey() || !t.date);
    const done = todayTasks.filter(t => t.done).length;
    const total = todayTasks.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('stat-today').textContent = pct + '%';
    drawWeekChart(); drawCategoriesChart(); drawHeatmap();
}

function drawWeekChart() {
    const canvas = document.getElementById('chart-week');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.toISOString().split('T')[0];
        days.push({ key: k, label: d.toLocaleDateString('it-IT', { weekday: 'short' }), count: stato.stats.history[k] || 0 });
    }
    const max = Math.max(1, ...days.map(d => d.count));
    const barW = (W - 80) / 7;
    const theme = stato.theme === 'dark' ? '#f1f5f9' : '#0f172a';
    const dim = stato.theme === 'dark' ? '#94a3b8' : '#64748b';
    ctx.fillStyle = dim; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    days.forEach((d, i) => {
        const x = 40 + i * barW + barW / 2;
        const barH = (d.count / max) * (H - 60);
        const y = H - 30 - barH;
        const grad = ctx.createLinearGradient(0, y, 0, H - 30);
        grad.addColorStop(0, '#6366f1'); grad.addColorStop(1, '#10b981');
        ctx.fillStyle = grad;
        ctx.fillRect(x - barW / 3, y, barW * 2 / 3, barH);
        ctx.fillStyle = theme; ctx.fillText(d.count, x, y - 5);
        ctx.fillStyle = dim; ctx.fillText(d.label, x, H - 10);
    });
}

function drawCategoriesChart() {
    const canvas = document.getElementById('chart-categories');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cats = {};
    stato.categories.tb.forEach(c => { cats[c.name] = stato.oggi.filter(t => t.category === c.id && t.done).length; });
    const entries = Object.entries(cats).filter(([_, v]) => v > 0);
    const total = entries.reduce((s, [_, v]) => s + v, 0);
    if (total === 0) {
        ctx.fillStyle = '#94a3b8'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Nessun dato disponibile', W / 2, H / 2); return;
    }
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];
    const cx = H / 2, cy = H / 2, r = H / 2 - 20;
    let startAngle = -Math.PI / 2;
    entries.forEach(([name, val], i) => {
        const angle = (val / total) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + angle); ctx.closePath();
        ctx.fillStyle = colors[i % colors.length]; ctx.fill();
        const mid = startAngle + angle / 2;
        const lx = cx + Math.cos(mid) * (r * 0.6);
        const ly = cy + Math.sin(mid) * (r * 0.6);
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${name} ${Math.round(val / total * 100)}%`, lx, ly);
        startAngle += angle;
    });
    ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    entries.forEach(([name, val], i) => {
        const y = 20 + i * 20;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(W - 150, y - 10, 12, 12);
        ctx.fillStyle = stato.theme === 'dark' ? '#f1f5f9' : '#0f172a';
        ctx.fillText(`${name}: ${val}`, W - 130, y);
    });
}

function drawHeatmap() {
    const hm = document.getElementById('heatmap');
    hm.innerHTML = '';
    for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.toISOString().split('T')[0];
        const count = stato.stats.history[k] || 0;
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        if (count >= 4) cell.classList.add('l4');
        else if (count >= 3) cell.classList.add('l3');
        else if (count >= 2) cell.classList.add('l2');
        else if (count >= 1) cell.classList.add('l1');
        cell.title = `${d.toLocaleDateString('it-IT')}: ${count} task`;
        hm.appendChild(cell);
    }
}

document.getElementById('btn-reset-stats').addEventListener('click', () => {
    if (confirm('Resettare tutte le statistiche?')) {
        stato.stats = { history: {}, streak: 0, bestDay: 0, totalCompleted: 0 };
        salva(); renderStats();
    }
});

// ============ AI ============
function aiRispondi(domanda) {
    const q = domanda.toLowerCase();
    const todayTasks = stato.oggi.filter(t => t.date === oggiKey() || !t.date);
    const done = todayTasks.filter(t => t.done).length;
    const todo = todayTasks.filter(t => !t.done);
    const streak = stato.stats.streak;
    const total = stato.stats.totalCompleted;
    const history = stato.stats.history;
    const days = Object.keys(history).sort().slice(-7);
    const avgLast7 = days.length ? Math.round(days.reduce((s, k) => s + history[k], 0) / days.length) : 0;
    let risposta = '';
    if (q.includes('cosa dovrei fare') || q.includes('priorità') || q.includes('ora')) {
        if (todo.length === 0) risposta = '🎉 <b>Ottimo!</b> Nessun task in sospeso. Puoi rilassarti o pianificare domani.';
        else {
            const urgenti = stato.eisenhower[1].filter(t => !t.done);
            if (urgenti.length > 0) risposta = `🔥 <b>Priorità massima:</b> "${urgenti[0].text}"<br><br>💡 Usa la tecnica del pomodoro (25 min focus + 5 min pausa).`;
            else risposta = `📋 Inizia da: <b>"${todo[0].text}"</b><br><br>💡 Fai il task più difficile quando hai più energia.`;
        }
    } else if (q.includes('analizz') || q.includes('produttività')) {
        risposta = `📊 <b>Analisi:</b><br>✅ Task totali: <b>${total}</b><br>🔥 Streak: <b>${streak} giorni</b><br>📈 Media 7 giorni: <b>${avgLast7} task/giorno</b><br>🏆 Record: <b>${stato.stats.bestDay}</b><br><br>`;
        if (streak >= 7) risposta += '🎉 <b>Wow!</b> Streak di ' + streak + ' giorni!';
        else if (streak >= 3) risposta += '💪 <b>Bene!</b> Stai costruendo una buona abitudine.';
        else if (total > 0) risposta += '🌱 <b>Ottimo inizio!</b> Punta a 7 giorni di streak.';
        else risposta += '🚀 <b>Inizia!</b> Completa il tuo primo task oggi.';
    } else if (q.includes('consiglio')) {
        const consigli = [
            '🎯 <b>Regola dei 2 minuti:</b> se un task richiede meno di 2 minuti, fallo subito.',
            '⏱️ <b>Pomodoro:</b> 25 min focus + 5 min pausa. Dopo 4 cicli, pausa lunga.',
            '🐸 <b>Eat the Frog:</b> fai il task più difficile per primo.',
            '📝 <b>Regola 1-3-5:</b> ogni giorno: 1 task grande, 3 medi, 5 piccoli.',
            '📵 <b>Elimina distrazioni:</b> telefono in un\'altra stanza durante il focus.',
            '💤 <b>Riposo = produttività:</b> dormire bene migliora focus e creatività.'
        ];
        risposta = consigli[Math.floor(Math.random() * consigli.length)];
    } else if (q.includes('motiv') || q.includes('ispir')) {
        const frasi = [
            '🔥 "Il segreto per andare avanti è iniziare." - Mark Twight',
            '💪 "Non contare i giorni, fai che i contino." - Muhammad Ali',
            '🚀 "Ogni esperto è stato un principiante. Non mollare!"',
            '⭐ "Il successo è la somma di piccoli sforzi ripetuti giorno dopo giorno."',
            '🎯 "La disciplina è il ponte tra obiettivi e risultati." - Jim Rohn',
            '💎 "I diamanti si formano sotto pressione. Anche tu!"'
        ];
        risposta = frasi[Math.floor(Math.random() * frasi.length)] + `<br><br>Hai già completato <b>${total} task</b>. Immagina cosa puoi fare oggi!`;
    } else if (q.includes('pattern') || q.includes('abitudin')) {
        risposta = `🔍 <b>I tuoi pattern:</b><br>`;
        const habits = stato.habits;
        if (habits.length > 0) {
            risposta += `📌 <b>${habits.length} abitudini</b> tracciate:<br>`;
            habits.forEach(h => { risposta += `• ${h.name}: 🔥 ${h.streak} giorni<br>`; });
        } else risposta += `📌 Nessuna abitudine tracciata.<br>`;
        risposta += `<br>Media 7 giorni: <b>${avgLast7} task/giorno</b>`;
        if (avgLast7 >= 5) risposta += `<br><br>🎉 <b>Sei molto produttivo!</b>`;
        else if (avgLast7 >= 2) risposta += `<br><br>💪 <b>Buon ritmo!</b> Punta a 5 task/giorno.`;
        else risposta += `<br><br>🌱 <b>Puoi migliorare!</b> Inizia con 2-3 task al giorno.`;
    } else if (q.includes('ciao') || q.includes('salve')) {
        risposta = `Ciao! 👋 Hai <b>${todo.length} task</b> in sospeso e streak di <b>${streak} giorni</b>. Come posso aiutarti?`;
    } else if (q.includes('grazie')) {
        risposta = 'Prego! 😊 Continua così, stai facendo un ottimo lavoro! 💪';
    } else {
        risposta = `🤔 Prova a chiedermi:<br>• "Cosa dovrei fare ora?"<br>• "Analizza la mia produttività"<br>• "Dammi un consiglio"<br>• "Motivami!"`;
    }
    return risposta;
}

function aggiungiMessaggioAI(testo, isUser = false) {
    const chat = document.getElementById('ai-chat');
    const msg = document.createElement('div');
    msg.className = 'ai-message' + (isUser ? ' user' : '');
    msg.innerHTML = `<div class="ai-avatar">${isUser ? '👤' : '🤖'}</div><div class="ai-text">${testo}</div>`;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

function inviaAI() {
    const input = document.getElementById('ai-input');
    const q = input.value.trim();
    if (!q) return;
    aggiungiMessaggioAI(q, true);
    input.value = '';
    setTimeout(() => { aggiungiMessaggioAI(aiRispondi(q)); }, 500);
}

document.getElementById('btn-ai-send').addEventListener('click', inviaAI);
document.getElementById('ai-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') inviaAI(); });
document.querySelectorAll('.ai-quick').forEach(btn => {
    btn.addEventListener('click', () => { document.getElementById('ai-input').value = btn.dataset.q; inviaAI(); });
});

// ============ GTD ============
document.getElementById('btn-add-gtd').addEventListener('click', () => {
    const text = document.getElementById('input-gtd').value.trim();
    if (!text) return;
    stato.gtd.inbox.push({ id: uid(), text });
    document.getElementById('input-gtd').value = '';
    salva(); renderGTD();
});

function renderGTD() {
    const container = document.getElementById('gtd-contesti');
    container.innerHTML = '';
    stato.categories.gtd.forEach(ctx => {
        const id = ctx.id;
        if (!stato.gtd[id]) stato.gtd[id] = [];
        const div = document.createElement('div');
        div.className = 'contesto';
        div.style.borderTop = `4px solid ${ctx.color}`;
        div.innerHTML = `<h3>${ctx.icon} ${ctx.name} <span class="count" id="count-${id}">0</span></h3><ul class="task-list" id="lista-${id}"></ul>`;
        container.appendChild(div);
        const lista = document.getElementById('lista-' + id);
        document.getElementById('count-' + id).textContent = stato.gtd[id].length;
        stato.gtd[id].forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="task-text">${task.text}</span>
                <select class="ctx-select">
                    <option value="">Sposta...</option>
                    ${stato.categories.gtd.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                </select>
                <button class="btn-delete">🗑️</button>`;
            li.querySelector('.ctx-select').addEventListener('change', (e) => {
                const newCtx = e.target.value;
                if (newCtx && newCtx !== id) {
                    stato.gtd[newCtx].push(task);
                    stato.gtd[id] = stato.gtd[id].filter(t => t.id !== task.id);
                    salva(); renderGTD();
                }
            });
            li.querySelector('.btn-delete').addEventListener('click', () => {
                stato.gtd[id] = stato.gtd[id].filter(t => t.id !== task.id);
                salva(); renderGTD();
            });
            lista.appendChild(li);
        });
    });
}

// ============ EISENHOWER ============
document.querySelectorAll('.add-mini button').forEach(btn => {
    btn.addEventListener('click', () => {
        const q = btn.dataset.quadrante;
        const input = btn.previousElementSibling;
        const text = input.value.trim();
        if (!text) return;
        stato.eisenhower[q].push({ id: uid(), text, done: false });
        input.value = '';
        salva(); renderEisenhower();
    });
});

function renderEisenhower() {
    [1, 2, 3, 4].forEach(q => {
        const lista = document.getElementById('lista-q' + q);
        lista.innerHTML = '';
        stato.eisenhower[q].forEach(task => {
            const li = document.createElement('li');
            if (task.done) li.classList.add('done');
            li.innerHTML = `
                <input type="checkbox" ${task.done ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <button class="btn-delete">🗑️</button>`;
            li.querySelector('input').addEventListener('change', () => {
                task.done = !task.done;
                if (task.done) aggiornaStats();
                salva(); renderEisenhower();
            });
            li.querySelector('.btn-delete').addEventListener('click', () => {
                stato.eisenhower[q] = stato.eisenhower[q].filter(t => t.id !== task.id);
                salva(); renderEisenhower();
            });
            lista.appendChild(li);
        });
    });
}

// ============ TIME BLOCKING ============
document.getElementById('btn-add-tb').addEventListener('click', () => {
    const start = document.getElementById('input-tb-start').value;
    const end = document.getElementById('input-tb-end').value;
    const attivita = document.getElementById('input-tb-attivita').value.trim();
    const categoria = document.getElementById('input-tb-categoria').value;
    if (!start || !end || !attivita) return;
    stato.timeblocks.push({ id: uid(), start, end, attivita, categoria });
    document.getElementById('input-tb-start').value = '';
    document.getElementById('input-tb-end').value = '';
    document.getElementById('input-tb-attivita').value = '';
    salva(); renderTimeblocks();
});

function renderTimeblocks() {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    stato.timeblocks.sort((a, b) => a.start.localeCompare(b.start));
    stato.timeblocks.forEach(tb => {
        const cat = stato.categories.tb.find(c => c.id === tb.categoria);
        const color = cat ? cat.color : '#6366f1';
        const div = document.createElement('div');
        div.className = 'time-block';
        div.style.borderLeftColor = color;
        div.style.background = color + '20';
        div.innerHTML = `
            <div class="time">${tb.start} - ${tb.end}</div>
            <div class="attivita">${cat ? cat.icon + ' ' : ''}${tb.attivita}</div>
            <button class="btn-delete">🗑️</button>`;
        div.querySelector('.btn-delete').addEventListener('click', () => {
            stato.timeblocks = stato.timeblocks.filter(t => t.id !== tb.id);
            salva(); renderTimeblocks();
        });
        timeline.appendChild(div);
    });
}

// ============ OKR ============
document.getElementById('btn-add-okr').addEventListener('click', () => { document.getElementById('modal-okr').classList.add('active'); });
document.getElementById('btn-cancel-okr').addEventListener('click', () => { document.getElementById('modal-okr').classList.remove('active'); });
document.getElementById('btn-save-okr').addEventListener('click', () => {
    const titolo = document.getElementById('okr-titolo').value.trim();
    const kr1 = document.getElementById('okr-kr1').value.trim();
    const kr2 = document.getElementById('okr-kr2').value.trim();
    const kr3 = document.getElementById('okr-kr3').value.trim();
    if (!titolo) return;
    stato.okr.push({ id: uid(), titolo, keyResults: [{ text: kr1, done: false }, { text: kr2, done: false }, { text: kr3, done: false }].filter(kr => kr.text) });
    ['okr-titolo', 'okr-kr1', 'okr-kr2', 'okr-kr3'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('modal-okr').classList.remove('active');
    salva(); renderOKR();
});

function renderOKR() {
    const lista = document.getElementById('lista-okr');
    lista.innerHTML = '';
    stato.okr.forEach(okr => {
        const card = document.createElement('div');
        card.className = 'okr-card';
        const done = okr.keyResults.filter(kr => kr.done).length;
        const total = okr.keyResults.length;
        const pct = total ? (done / total) * 100 : 0;
        card.innerHTML = `
            <h3>${okr.titolo}</h3>
            <div class="progress-bar"><div class="progress" style="width:${pct}%"></div></div>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">${done}/${total} Key Results</p>
            ${okr.keyResults.map((kr, i) => `<div class="kr-item"><input type="checkbox" ${kr.done ? 'checked' : ''}><span>${kr.text}</span></div>`).join('')}
            <button class="btn-delete" style="margin-top:10px;">🗑️ Elimina</button>`;
        card.querySelectorAll('.kr-item input').forEach((cb, i) => {
            cb.addEventListener('change', () => { okr.keyResults[i].done = cb.checked; salva(); renderOKR(); });
        });
        card.querySelector('.btn-delete').addEventListener('click', () => {
            stato.okr = stato.okr.filter(o => o.id !== okr.id);
            salva(); renderOKR();
        });
        lista.appendChild(card);
    });
}

// ============ 12 WEEK ============
function init12Week() { if (!stato.week12Start) { stato.week12Start = new Date().toISOString(); salva(); } }

function calcolaSettimana() {
    const start = new Date(stato.week12Start);
    const now = new Date();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return { week: Math.min(12, Math.floor(diffDays / 7) + 1), pct: Math.min(100, (diffDays / 84) * 100), start };
}

document.getElementById('btn-add-12w').addEventListener('click', () => {
    const text = prompt('Obiettivo per le prossime 12 settimane:');
    if (!text) return;
    stato.week12.push({ id: uid(), text, done: false });
    salva(); render12W();
});

function render12W() {
    const { week, pct, start } = calcolaSettimana();
    document.getElementById('week-current').textContent = week;
    const end = new Date(start); end.setDate(end.getDate() + 83);
    document.getElementById('week-dates').textContent = `${start.toLocaleDateString('it-IT')} → ${end.toLocaleDateString('it-IT')}`;
    document.getElementById('progress-12w').style.width = pct + '%';
    document.getElementById('week-percent').textContent = Math.round(pct) + '%';
    const lista = document.getElementById('lista-12w');
    lista.innerHTML = '';
    stato.week12.forEach(task => {
        const li = document.createElement('li');
        if (task.done) li.classList.add('done');
        li.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="btn-delete">🗑️</button>`;
        li.querySelector('input').addEventListener('change', () => {
            task.done = !task.done;
            if (task.done) aggiornaStats();
            salva(); render12W();
        });
        li.querySelector('.btn-delete').addEventListener('click', () => {
            stato.week12 = stato.week12.filter(t => t.id !== task.id);
            salva(); render12W();
        });
        lista.appendChild(li);
    });
}

// ============ CALENDARIO & EVENTI ============
let calendarDate = new Date();

function detectOS() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'macos';
    return 'linux';
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('calendar-title');
    if (!grid || !title) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = calendarDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    title.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Rimuovi solo le celle, mantieni i day-name
    grid.querySelectorAll('.calendar-cell').forEach(c => c.remove());

    const firstDay = new Date(year, month, 1);
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKeyVal = oggiKey();

    for (let i = 0; i < startWeekday; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-cell empty';
        grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayEvents = stato.events.filter(e => e.date === dateKey);
        const cell = document.createElement('div');
        cell.className = 'calendar-cell' + (dateKey === todayKeyVal ? ' today' : '') + (dayEvents.length ? ' has-events' : '');
        cell.innerHTML = `
            <div class="cell-day">${d}</div>
            ${dayEvents.slice(0, 3).map(e => `
                <div class="cell-event" style="background:${e.color || '#6366f1'}" title="${e.time || ''} ${e.title}">
                    ${e.time ? e.time + ' ' : ''}${e.title}
                </div>
            `).join('')}
            ${dayEvents.length > 3 ? `<div class="cell-more">+${dayEvents.length - 3} altri</div>` : ''}
        `;
        cell.addEventListener('click', () => {
            document.getElementById('input-event-date').value = dateKey;
            document.getElementById('modal-event').classList.add('active');
        });
        grid.appendChild(cell);
    }

    renderUpcomingEvents();
}

function renderUpcomingEvents() {
    const lista = document.getElementById('upcoming-events');
    if (!lista) return;
    lista.innerHTML = '';
    const now = new Date();
    const todayStr = now.toDateString();
    const upcoming = stato.events
        .filter(e => new Date(e.date + 'T' + (e.time || '23:59')) >= new Date(todayStr))
        .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
        .slice(0, 10);

    if (upcoming.length === 0) {
        lista.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;">Nessun evento programmato</p>';
        return;
    }

    upcoming.forEach(e => {
        const evDate = new Date(e.date + 'T' + (e.time || '00:00'));
        const diffMs = evDate - new Date(todayStr);
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        let when = evDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
        if (e.time) when += ' ⏰ ' + e.time;
        if (diffDays === 0) when += ' (OGGI)';
        else if (diffDays === 1) when += ' (domani)';
        else if (diffDays > 1 && diffDays <= 7) when += ` (tra ${diffDays} giorni)`;

        const li = document.createElement('div');
        li.className = 'upcoming-event';
        li.style.borderLeftColor = e.color || '#6366f1';
        li.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:600;">${e.title}</div>
                <div style="font-size:12px;color:var(--text-dim);">${when}</div>
                ${e.description ? `<div style="font-size:12px;margin-top:4px;">${e.description}</div>` : ''}
            </div>
            <button class="btn-delete">🗑️</button>
        `;
        li.querySelector('.btn-delete').addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (confirm(`Eliminare l'evento "${e.title}"?`)) {
                stato.events = stato.events.filter(x => x.id !== e.id);
                salva();
                renderCalendar();
            }
        });
        lista.appendChild(li);
    });
}

document.getElementById('btn-cal-prev').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('btn-cal-next').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
});
document.getElementById('btn-cal-today').addEventListener('click', () => {
    calendarDate = new Date();
    renderCalendar();
});

document.getElementById('btn-add-event').addEventListener('click', () => {
    document.getElementById('input-event-date').value = oggiKey();
    document.getElementById('modal-event').classList.add('active');
});
document.getElementById('btn-cancel-event').addEventListener('click', () => {
    document.getElementById('modal-event').classList.remove('active');
});
document.getElementById('btn-save-event').addEventListener('click', () => {
    const title = document.getElementById('input-event-title').value.trim();
    const date = document.getElementById('input-event-date').value;
    const time = document.getElementById('input-event-time').value;
    const duration = document.getElementById('input-event-duration').value || 60;
    const description = document.getElementById('input-event-desc').value.trim();
    const color = document.getElementById('input-event-color').value;
    const notifyBefore = document.getElementById('input-event-notify').value || 0;

    if (!title || !date) {
        alert('⚠️ Titolo e data sono obbligatori');
        return;
    }

    stato.events.push({
        id: uid(), title, date, time, duration: parseInt(duration),
        description, color, notifyBefore: parseInt(notifyBefore),
        created: new Date().toISOString()
    });

    ['input-event-title', 'input-event-time', 'input-event-desc'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('input-event-duration').value = 60;
    document.getElementById('input-event-notify').value = 15;

    document.getElementById('modal-event').classList.remove('active');
    salva();
    renderCalendar();

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📅 Evento creato', {
            body: `${title}${time ? ' alle ' + time : ''} il ${new Date(date).toLocaleDateString('it-IT')}`
        });
    }
});

function initCalendarSettings() {
    const osSelect = document.getElementById('select-notif-os');
    const advanceInput = document.getElementById('input-notif-advance');
    const osLabel = document.getElementById('detected-os');
    if (osSelect) {
        const detected = detectOS();
        osSelect.value = stato.calendarNotif.os || detected;
        if (osLabel) {
            const labels = { linux: '🐧 Linux', macos: '🍎 macOS', windows: '🪟 Windows' };
            osLabel.textContent = labels[detected] + ' (rilevato)';
        }
        osSelect.onchange = () => {
            stato.calendarNotif.os = osSelect.value;
            salva();
        };
    }
    if (advanceInput) {
        advanceInput.value = stato.calendarNotif.advanceMin || 15;
        advanceInput.onchange = () => {
            stato.calendarNotif.advanceMin = parseInt(advanceInput.value) || 15;
            salva();
        };
    }
}

function generaScriptNotifiche() {
    const os = stato.calendarNotif.os || detectOS();
    const events = stato.events.filter(e => e.time);
    const advance = stato.calendarNotif.advanceMin || 15;
    let script = '', filename = '';

    if (os === 'linux') {
        filename = 'notifiche-lifeplanner.sh';
        script = `#!/bin/bash
# 🔔 Life Planner - Script notifiche Linux
# Generato: ${new Date().toLocaleString('it-IT')}
# Crontab: */5 * * * * /percorso/a/notifiche-lifeplanner.sh

DATA_DIR="$HOME/.lifeplanner"
mkdir -p "$DATA_DIR"
SENT_FILE="$DATA_DIR/.sent_events"
touch "$SENT_FILE"

NOW=$(date +%s)

${events.map(e => {
            const safeTitle = e.title.replace(/"/g, '\\"').replace(/`/g, '');
            return `# Evento: ${safeTitle}
EVENT_TS=$(date -d "${e.date} ${e.time}" +%s 2>/dev/null)
if [ -n "$EVENT_TS" ]; then
    DIFF=$(( (EVENT_TS - NOW) / 60 ))
    if [ "$DIFF" -le ${advance} ] && [ "$DIFF" -ge 0 ]; then
        KEY="${e.date}_${e.time}"
        if ! grep -q "^$KEY$" "$SENT_FILE"; then
            notify-send "📅 Life Planner" "${safeTitle} tra $DIFF minuti" -u critical -i appointment-soon
            echo "$KEY" >> "$SENT_FILE"
        fi
    fi
fi`;
        }).join('\n\n')}

# Pulizia vecchi record (>1 giorno)
find "$SENT_FILE" -mtime +1 -delete 2>/dev/null
echo "✅ Controllo completato: $(date)"
`;
    } else if (os === 'macos') {
        filename = 'notifiche-lifeplanner.sh';
        script = `#!/bin/bash
# 🔔 Life Planner - Script notifiche macOS
# Generato: ${new Date().toLocaleString('it-IT')}

DATA_DIR="$HOME/.lifeplanner"
mkdir -p "$DATA_DIR"
SENT_FILE="$DATA_DIR/.sent_events"
touch "$SENT_FILE"

NOW=$(date +%s)

${events.map(e => {
            const safeTitle = e.title.replace(/"/g, '\\"').replace(/`/g, '');
            return `EVENT_TS=$(date -j -f "%Y-%m-%d %H:%M" "${e.date} ${e.time}" +%s 2>/dev/null)
if [ -n "$EVENT_TS" ]; then
    DIFF=$(( (EVENT_TS - NOW) / 60 ))
    if [ "$DIFF" -le ${advance} ] && [ "$DIFF" -ge 0 ]; then
        KEY="${e.date}_${e.time}"
        if ! grep -q "^$KEY$" "$SENT_FILE"; then
            osascript -e 'display notification "${safeTitle} tra '"$DIFF"' minuti" with title "📅 Life Planner" sound name "Glass"'
            echo "$KEY" >> "$SENT_FILE"
        fi
    fi
fi`;
        }).join('\n\n')}

echo "✅ Controllo completato: $(date)"
`;
    } else {
        filename = 'notifiche-lifeplanner.ps1';
        script = `# 🔔 Life Planner - Script notifiche Windows PowerShell
# Generato: ${new Date().toLocaleString('it-IT')}
# Esegui: powershell -ExecutionPolicy Bypass -File notifiche-lifeplanner.ps1

$DataDir = "$env:USERPROFILE\\.lifeplanner"
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
$SentFile = "$DataDir\\.sent_events.txt"
if (!(Test-Path $SentFile)) { New-Item $SentFile -ItemType File | Out-Null }
$sent = Get-Content $SentFile -ErrorAction SilentlyContinue
$now = Get-Date
$advance = ${advance}

function Send-Notif($title, $msg) {
    Add-Type -AssemblyName System.Windows.Forms
    $n = New-Object System.Windows.Forms.NotifyIcon
    $n.Icon = [System.Drawing.SystemIcons]::Information
    $n.Visible = $true
    $n.BalloonTipTitle = $title
    $n.BalloonTipText = $msg
    $n.ShowBalloonTip(5000)
    Start-Sleep -Milliseconds 100
    $n.Dispose()
}

${events.map(e => {
            const safeTitle = e.title.replace(/"/g, '`"');
            return `$evDate = [DateTime]::Parse("${e.date} ${e.time}")
$diff = [math]::Floor(($evDate - $now).TotalMinutes)
$key = "${e.date}_${e.time}"
if ($diff -le $advance -and $diff -ge 0 -and $sent -notcontains $key) {
    Send-Notif "📅 Life Planner" "${safeTitle} tra $diff minuti"
    Add-Content $SentFile $key
}`;
        }).join('\n\n')}

Write-Host "✅ Controllo completato: $(Get-Date)"
`;
    }

    return { script, filename };
}

function downloadScriptNotifiche() {
    const { script, filename } = generaScriptNotifiche();
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    const os = stato.calendarNotif.os || detectOS();
    let istruzioni = '✅ Script scaricato!\n\n';
    if (os === 'linux' || os === 'macos') {
        istruzioni += `📋 Per renderlo eseguibile:\nchmod +x ${filename}\n\n`;
        istruzioni += `📋 Per eseguirlo ogni 5 minuti (crontab):\ncrontab -e\n`;
        istruzioni += `Aggiungi: */5 * * * * /percorso/a/${filename}\n`;
    } else {
        istruzioni += `📋 Per eseguirlo con Task Scheduler di Windows:\n`;
        istruzioni += `1. Apri "Utilità di pianificazione"\n`;
        istruzioni += `2. Crea attività base → avvia ${filename} ogni 5 minuti\n`;
    }
    alert(istruzioni);
}

function copyCrontabCommand() {
    const os = stato.calendarNotif.os || detectOS();
    let cmd = '';
    if (os === 'linux' || os === 'macos') {
        cmd = `*/5 * * * * $HOME/notifiche-lifeplanner.sh >> $HOME/.lifeplanner/cron.log 2>&1`;
    } else {
        cmd = `powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\notifiche-lifeplanner.ps1"`;
    }
    navigator.clipboard.writeText(cmd).then(() => {
        alert('✅ Comando copiato negli appunti!\n\n' + cmd);
    }).catch(() => {
        prompt('Copia questo comando:', cmd);
    });
}

document.getElementById('btn-download-notif-script').addEventListener('click', downloadScriptNotifiche);
document.getElementById('btn-copy-crontab').addEventListener('click', copyCrontabCommand);

// ============ SETTINGS ============
function renderSettings() {
    const json = JSON.stringify(stato);
    const sizeKB = (new Blob([json]).size / 1024).toFixed(2);
    document.getElementById('data-size').textContent = sizeKB + ' KB';
    document.getElementById('data-created').textContent = new Date(stato.meta.created).toLocaleDateString('it-IT');
    document.getElementById('data-last-backup').textContent = stato.meta.lastBackup ? new Date(stato.meta.lastBackup).toLocaleString('it-IT') : 'Mai';
    let totalTasks = stato.oggi.length + Object.values(stato.gtd).reduce((s, a) => s + a.length, 0) +
        Object.values(stato.eisenhower).reduce((s, a) => s + a.length, 0) +
        stato.timeblocks.length + stato.week12.length + stato.events.length;
    document.getElementById('data-tasks-count').textContent = totalTasks;

    const notifStatus = document.getElementById('notif-status');
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            notifStatus.textContent = '✅ Attive';
            notifStatus.classList.add('active');
        } else if (Notification.permission === 'denied') {
            notifStatus.textContent = '❌ Bloccate';
        } else {
            notifStatus.textContent = '⚪ Non attive';
        }
    } else {
        notifStatus.textContent = '❌ Non supportate';
    }
    renderCatChips();
}

document.getElementById('btn-export-json').addEventListener('click', () => {
    const data = JSON.stringify(stato, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-planner-backup-${oggiKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    stato.meta.lastBackup = new Date().toISOString();
    salva();
    alert('✅ Backup completato! Dimensione: ' + (new Blob([data]).size / 1024).toFixed(2) + ' KB');
});

document.getElementById('btn-export-quick').addEventListener('click', () => {
    document.getElementById('btn-export-json').click();
});

document.getElementById('btn-export-md').addEventListener('click', () => {
    let md = `# Life Planner - Backup ${oggiKey()}\n\n`;
    md += `## 📅 Task di oggi\n\n`;
    stato.oggi.forEach(t => { md += `- [${t.done ? 'x' : ' '}] ${t.text}${t.time ? ' ⏰ ' + t.time : ''}\n`; });
    md += `\n## 📥 GTD\n\n`;
    stato.categories.gtd.forEach(ctx => {
        if (stato.gtd[ctx.id] && stato.gtd[ctx.id].length > 0) {
            md += `### ${ctx.icon} ${ctx.name}\n\n`;
            stato.gtd[ctx.id].forEach(t => { md += `- ${t.text}\n`; });
        }
    });
    md += `\n## ⚡ Eisenhower\n\n`;
    [1, 2, 3, 4].forEach(q => {
        const labels = { 1: '🔥 FAI ORA', 2: '📅 PIANIFICA', 3: '👥 DELEGA', 4: '🗑️ ELIMINA' };
        md += `### ${labels[q]}\n\n`;
        stato.eisenhower[q].forEach(t => { md += `- [${t.done ? 'x' : ' '}] ${t.text}\n`; });
    });
    md += `\n## 🎯 OKR\n\n`;
    stato.okr.forEach(o => {
        md += `### ${o.titolo}\n\n`;
        o.keyResults.forEach(kr => { md += `- [${kr.done ? 'x' : ' '}] ${kr.text}\n`; });
    });
    md += `\n## 🔥 12 Week Year\n\n`;
    stato.week12.forEach(t => { md += `- [${t.done ? 'x' : ' '}] ${t.text}\n`; });
    md += `\n## 🔁 Abitudini\n\n`;
    stato.habits.forEach(h => { md += `- ${h.name} (🔥 ${h.streak} giorni)\n`; });
    md += `\n## 📆 Eventi\n\n`;
    stato.events.forEach(e => {
        md += `- **${e.title}** - ${e.date}${e.time ? ' ' + e.time : ''}\n`;
        if (e.description) md += `  ${e.description}\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-planner-${oggiKey()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Export Markdown completato!');
});

document.getElementById('btn-export-csv').addEventListener('click', () => {
    let csv = 'Tipo;Testo;Completato;Data/Ora;Categoria\n';
    stato.oggi.forEach(t => {
        const cat = stato.categories.tb.find(c => c.id === t.category);
        csv += `Oggi;"${t.text}";${t.done ? 'Sì' : 'No'};${t.time || ''};${cat ? cat.name : ''}\n`;
    });
    stato.categories.gtd.forEach(ctx => {
        stato.gtd[ctx.id].forEach(t => {
            csv += `GTD-${ctx.name};"${t.text}";No;;\n`;
        });
    });
    [1, 2, 3, 4].forEach(q => {
        const labels = { 1: 'Q1-Fai ora', 2: 'Q2-Pianifica', 3: 'Q3-Delega', 4: 'Q4-Elimina' };
        stato.eisenhower[q].forEach(t => {
            csv += `${labels[q]};"${t.text}";${t.done ? 'Sì' : 'No'};;\n`;
        });
    });
    stato.habits.forEach(h => {
        csv += `Abitudine;"${h.name}";No;;Streak: ${h.streak}\n`;
    });
    stato.events.forEach(e => {
        csv += `Evento;"${e.title}";No;${e.date} ${e.time || ''};\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-planner-${oggiKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Export CSV completato! Apribile con Excel/Google Sheets.');
});

document.getElementById('btn-auto-backup').addEventListener('click', () => {
    const data = JSON.stringify(stato);
    localStorage.setItem('lifePlanner_autoBackup', data);
    localStorage.setItem('lifePlanner_autoBackup_date', new Date().toISOString());
    stato.meta.lastBackup = new Date().toISOString();
    salva();
    alert('✅ Backup automatico salvato nel browser!');
    renderSettings();
});

document.getElementById('btn-import-json').addEventListener('click', () => { document.getElementById('file-import2').click(); });
document.getElementById('file-import2').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('⚠️ Questo sostituirà tutti i dati attuali. Continuare?')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            stato = JSON.parse(ev.target.result);
            salva();
            alert('✅ Dati importati con successo!');
            location.reload();
        } catch (err) { alert('❌ File non valido!'); }
    };
    reader.readAsText(file);
});

document.getElementById('btn-clear-today').addEventListener('click', () => {
    if (confirm('⚠️ Cancellare tutti i task di oggi?')) {
        const todayKeyVal = oggiKey();
        stato.oggi = stato.oggi.filter(t => t.date !== todayKeyVal);
        salva(); renderOggi();
        alert('✅ Task di oggi cancellati.');
    }
});

document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (confirm('⚠️ CANCELLARE TUTTI I DATI? Questa azione è irreversibile!')) {
        if (confirm('Sei davvero sicuro? Perdi tutto!')) {
            localStorage.removeItem('lifePlanner');
            location.reload();
        }
    }
});

document.getElementById('btn-reset-app').addEventListener('click', () => {
    if (confirm('⚠️ Reset completo dell\'app? Tutti i dati saranno persi.')) {
        if (confirm('Ultima conferma: procedere?')) {
            localStorage.clear();
            location.reload();
        }
    }
});

document.getElementById('btn-enable-notif').addEventListener('click', () => {
    if (!('Notification' in window)) {
        alert('❌ Il tuo browser non supporta le notifiche.');
        return;
    }
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            new Notification('🎯 Life Planner', { body: 'Notifiche attivate con successo!' });
            alert('✅ Notifiche attivate!');
            renderSettings();
        } else {
            alert('❌ Permesso negato. Abilita le notifiche nelle impostazioni del browser.');
        }
    });
});

// ============ RENDER ALL ============
function renderAll() {
    renderOggi(); renderGTD(); renderEisenhower();
    renderTimeblocks(); renderOKR(); render12W();
    renderHabits(); renderRecurring();
    renderCatSelects();
}

// ============ INIT ============
carica();
document.documentElement.setAttribute('data-theme', stato.theme);
document.getElementById('btn-theme').textContent = stato.theme === 'dark' ? '🌙' : '☀️';
init12Week();
generaRecurringOggi();
renderAll();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
}