// ============ HASH ============
function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return 'h_' + Math.abs(h).toString(36) + '_' + str.length;
}

// ============ STATO ============
var stato = {
    oggi: [],
    gtd: { inbox: [], casa: [], lavoro: [], pc: [], fuori: [] },
    eisenhower: { 1: [], 2: [], 3: [], 4: [] },
    timeblocks: [],
    okr: [],
    week12: [],
    week12Start: null,
    theme: 'dark',
    habits: [],
    recurring: [],
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
    calendarNotif: { enabled: false, advanceMin: 15, os: 'linux' },
    auth: {
        username: 'matteo',
        passwordHash: hash('3a%uwbK*5hGnX3'),
        rememberMe: false,
        timeoutMin: 4
    }
};

var sessione = {
    autenticato: false,
    lastActivity: Date.now(),
    timeoutId: null
};

// ID dell'evento attualmente in modifica (null = creazione nuovo)
var editingEventId = null;

function salva() {
    localStorage.setItem('lifePlanner', JSON.stringify(stato));
}

function carica() {
    var d = localStorage.getItem('lifePlanner');
    if (d) {
        try {
            var parsed = JSON.parse(d);
            var key;
            for (key in parsed) {
                if (parsed.hasOwnProperty(key)) {
                    stato[key] = parsed[key];
                }
            }
        } catch (e) {
            console.error('Errore caricamento:', e);
        }
        if (!stato.habits) stato.habits = [];
        if (!stato.recurring) stato.recurring = [];
        if (!stato.events) stato.events = [];
        if (!stato.calendarNotif) stato.calendarNotif = { enabled: false, advanceMin: 15, os: 'linux' };
        if (!stato.stats) stato.stats = { history: {}, streak: 0, bestDay: 0, totalCompleted: 0 };
        if (!stato.categories) {
            stato.categories = {
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
            };
        }
        if (!stato.meta) stato.meta = { created: new Date().toISOString(), lastBackup: null };
        if (!stato.auth) {
            stato.auth = {
                username: 'matteo',
                passwordHash: hash('3a%uwbK*5hGnX3'),
                rememberMe: false,
                timeoutMin: 4
            };
            salva();
        }
    }
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function oggiStr() {
    return new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function oggiKey() {
    return new Date().toISOString().split('T')[0];
}

// ============ AUTENTICAZIONE ============
function checkSession() {
    var savedSession = localStorage.getItem('lifePlanner_session');
    if (stato.auth.rememberMe && savedSession) {
        try {
            var s = JSON.parse(savedSession);
            if (s.valid && s.username === stato.auth.username) {
                sessione.autenticato = true;
                sessione.lastActivity = Date.now();
                nascondiLogin();
                avviaMonitorInattivita();
                return;
            }
        } catch (e) { }
    }
    mostraLogin();
}

function mostraLogin() {
    sessione.autenticato = false;
    fermaMonitorInattivita();
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-remember').checked = stato.auth.rememberMe;
    document.getElementById('login-error').textContent = '';
    setTimeout(function () {
        document.getElementById('login-user').focus();
    }, 100);
}

function nascondiLogin() {
    document.getElementById('login-overlay').style.display = 'none';
}

function tentaLogin(username, password, rememberMe) {
    var uOk = username === stato.auth.username;
    var pOk = hash(password) === stato.auth.passwordHash;
    if (uOk && pOk) {
        sessione.autenticato = true;
        sessione.lastActivity = Date.now();
        stato.auth.rememberMe = rememberMe;
        salva();
        if (rememberMe) {
            localStorage.setItem('lifePlanner_session', JSON.stringify({
                valid: true,
                username: username,
                created: Date.now()
            }));
        } else {
            localStorage.removeItem('lifePlanner_session');
        }
        nascondiLogin();
        avviaMonitorInattivita();
        return true;
    }
    return false;
}

function logout() {
    sessione.autenticato = false;
    localStorage.removeItem('lifePlanner_session');
    fermaMonitorInattivita();
    mostraLogin();
}

function aggiornaAttivita() {
    if (!sessione.autenticato) return;
    sessione.lastActivity = Date.now();
}

function avviaMonitorInattivita() {
    fermaMonitorInattivita();
    var timeoutMs = (stato.auth.timeoutMin || 0) * 60 * 1000;
    if (timeoutMs <= 0) return;
    sessione.timeoutId = setInterval(function () {
        var elapsed = Date.now() - sessione.lastActivity;
        if (elapsed >= timeoutMs) {
            if (stato.auth.rememberMe) return;
            alert('⏱️ Sessione scaduta per inattività (' + stato.auth.timeoutMin + ' min).\nInserisci nuovamente le credenziali.');
            mostraLogin();
        }
    }, 10000);
}

function fermaMonitorInattivita() {
    if (sessione.timeoutId) {
        clearInterval(sessione.timeoutId);
        sessione.timeoutId = null;
    }
}

['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, aggiornaAttivita, { passive: true });
});

document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var user = document.getElementById('login-user').value.trim();
    var pass = document.getElementById('login-pass').value;
    var remember = document.getElementById('login-remember').checked;
    if (!tentaLogin(user, pass, remember)) {
        document.getElementById('login-error').textContent = '❌ Username o password errati';
        document.getElementById('login-pass').value = '';
    }
});

document.getElementById('btn-logout').addEventListener('click', function () {
    if (confirm('🚪 Vuoi uscire dall\'applicazione?')) {
        logout();
    }
});

// ============ NAVIGAZIONE ============
document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById('view-' + tab.dataset.view).classList.add('active');
        if (tab.dataset.view === 'stats') renderStats();
        if (tab.dataset.view === 'settings') renderSettings();
        if (tab.dataset.view === 'calendar') { renderCalendar(); initCalendarSettings(); }
    });
});

// ============ TEMA ============
document.getElementById('btn-theme').addEventListener('click', function () {
    stato.theme = stato.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', stato.theme);
    document.getElementById('btn-theme').textContent = stato.theme === 'dark' ? '🌙' : '☀️';
    salva();
});

// ============ SEARCH ============
document.getElementById('btn-search').addEventListener('click', function () {
    var bar = document.getElementById('search-bar');
    bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    if (bar.style.display === 'flex') document.getElementById('search-input').focus();
});
document.getElementById('btn-close-search').addEventListener('click', function () {
    document.getElementById('search-bar').style.display = 'none';
    document.getElementById('search-input').value = '';
    renderAll();
});
document.getElementById('search-input').addEventListener('input', function (e) {
    var q = e.target.value.toLowerCase();
    document.querySelectorAll('.task-list li, .habit-card').forEach(function (li) {
        var text = li.textContent.toLowerCase();
        li.style.display = !q || text.indexOf(q) !== -1 ? '' : 'none';
    });
});

// ============ CATEGORIE ============
function renderCatSelects() {
    var selOggi = document.getElementById('select-task-cat-oggi');
    selOggi.innerHTML = '<option value="">📁 Nessuna</option>';
    stato.categories.tb.forEach(function (c) {
        selOggi.innerHTML += '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>';
    });
    var selTb = document.getElementById('input-tb-categoria');
    selTb.innerHTML = '';
    stato.categories.tb.forEach(function (c) {
        selTb.innerHTML += '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>';
    });
}

function renderCatChips() {
    var listGtd = document.getElementById('cat-list-gtd');
    listGtd.innerHTML = '';
    stato.categories.gtd.forEach(function (c) {
        var chip = document.createElement('div');
        chip.className = 'cat-chip';
        chip.style.background = c.color;
        chip.innerHTML = '<span>' + c.icon + ' ' + c.name + '</span><button class="cat-del" data-type="gtd" data-id="' + c.id + '">✕</button>';
        listGtd.appendChild(chip);
    });
    listGtd.querySelectorAll('.cat-del').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = btn.dataset.id;
            if (['inbox', 'casa', 'lavoro', 'pc', 'fuori'].indexOf(id) !== -1) {
                alert('Questa è una categoria di base, non può essere eliminata.');
                return;
            }
            if (confirm('Eliminare la categoria "' + id + '"?')) {
                stato.categories.gtd = stato.categories.gtd.filter(function (c) { return c.id !== id; });
                salva();
                renderCatChips();
                renderGTD();
                renderCatSelects();
            }
        });
    });

    var listTb = document.getElementById('cat-list-tb');
    listTb.innerHTML = '';
    stato.categories.tb.forEach(function (c) {
        var chip = document.createElement('div');
        chip.className = 'cat-chip';
        chip.style.background = c.color;
        chip.innerHTML = '<span>' + c.icon + ' ' + c.name + '</span><button class="cat-del" data-type="tb" data-id="' + c.id + '">✕</button>';
        listTb.appendChild(chip);
    });
    listTb.querySelectorAll('.cat-del').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = btn.dataset.id;
            if (['lavoro', 'studio', 'sport', 'personale', 'riposo'].indexOf(id) !== -1) {
                alert('Questa è una categoria di base, non può essere eliminata.');
                return;
            }
            if (confirm('Eliminare la categoria "' + id + '"?')) {
                stato.categories.tb = stato.categories.tb.filter(function (c) { return c.id !== id; });
                salva();
                renderCatChips();
                renderTimeblocks();
                renderCatSelects();
            }
        });
    });
}

document.getElementById('btn-add-cat-gtd').addEventListener('click', function () {
    var name = document.getElementById('input-new-cat-gtd').value.trim();
    var icon = document.getElementById('input-new-cat-gtd-icon').value.trim() || '📁';
    var color = document.getElementById('input-new-cat-gtd-color').value;
    if (!name) return;
    var id = 'cat-' + uid();
    stato.categories.gtd.push({ id: id, name: name, icon: icon, color: color });
    document.getElementById('input-new-cat-gtd').value = '';
    document.getElementById('input-new-cat-gtd-icon').value = '';
    salva();
    renderCatChips();
    renderGTD();
    renderCatSelects();
});

document.getElementById('btn-add-cat-tb').addEventListener('click', function () {
    var name = document.getElementById('input-new-cat-tb').value.trim();
    var icon = document.getElementById('input-new-cat-tb-icon').value.trim() || '📁';
    var color = document.getElementById('input-new-cat-tb-color').value;
    if (!name) return;
    var id = 'cat-' + uid();
    stato.categories.tb.push({ id: id, name: name, icon: icon, color: color });
    document.getElementById('input-new-cat-tb').value = '';
    document.getElementById('input-new-cat-tb-icon').value = '';
    salva();
    renderCatChips();
    renderTimeblocks();
    renderCatSelects();
});

// ============ HABITS ============
document.getElementById('btn-add-habit').addEventListener('click', function () {
    var name = document.getElementById('input-habit').value.trim();
    var freq = document.getElementById('select-habit-freq').value;
    if (!name) return;
    stato.habits.push({ id: uid(), name: name, freq: freq, streak: 0, lastDone: null });
    document.getElementById('input-habit').value = '';
    salva();
    renderHabits();
});

function renderHabits() {
    var grid = document.getElementById('habits-grid');
    grid.innerHTML = '';
    var today = oggiKey();
    stato.habits.forEach(function (h) {
        var doneToday = h.lastDone === today;
        var card = document.createElement('div');
        card.className = 'habit-card' + (doneToday ? ' done' : '');
        card.innerHTML = '<div class="habit-name">' + (h.freq === 'daily' ? '📅' : '📆') + ' ' + h.name + '</div><div class="habit-streak">🔥 Streak: ' + h.streak + ' giorni</div><div class="habit-actions"><button class="btn-done">' + (doneToday ? '✅ Fatto' : '✓ Segna') + '</button><button class="btn-delete">🗑️</button></div>';
        card.querySelector('.btn-done').addEventListener('click', function () {
            if (!doneToday) { h.streak++; h.lastDone = today; aggiornaStats(); }
            else { h.streak = Math.max(0, h.streak - 1); h.lastDone = null; }
            salva();
            renderHabits();
        });
        card.querySelector('.btn-delete').addEventListener('click', function () {
            stato.habits = stato.habits.filter(function (x) { return x.id !== h.id; });
            salva();
            renderHabits();
        });
        grid.appendChild(card);
    });
}

// ============ RECURRING ============
document.getElementById('btn-add-recurring').addEventListener('click', function () {
    var text = document.getElementById('input-recurring').value.trim();
    var time = document.getElementById('input-recurring-time').value;
    var freq = document.getElementById('select-recurring-freq').value;
    if (!text) return;
    stato.recurring.push({ id: uid(), text: text, time: time, freq: freq, lastGenerated: null });
    document.getElementById('input-recurring').value = '';
    document.getElementById('input-recurring-time').value = '';
    salva();
    renderRecurring();
    generaRecurringOggi();
});

function generaRecurringOggi() {
    var today = new Date();
    var dayOfWeek = today.getDay();
    var isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    var todayKeyVal = oggiKey();
    stato.recurring.forEach(function (r) {
        var shouldGenerate = false;
        if (r.freq === 'daily') shouldGenerate = true;
        else if (r.freq === 'weekdays' && isWeekday) shouldGenerate = true;
        else if (r.freq === 'weekend' && isWeekend) shouldGenerate = true;
        else if (r.freq === 'weekly') {
            var last = r.lastGenerated ? new Date(r.lastGenerated) : null;
            if (!last || (today - last) >= 7 * 24 * 60 * 60 * 1000) shouldGenerate = true;
        }
        if (shouldGenerate && r.lastGenerated !== todayKeyVal) {
            var exists = stato.oggi.some(function (t) { return t.recurringId === r.id && t.date === todayKeyVal; });
            if (!exists) {
                stato.oggi.push({ id: uid(), text: r.text, time: r.time, done: false, recurringId: r.id, date: todayKeyVal });
                r.lastGenerated = todayKeyVal;
            }
        }
    });
    salva();
}

function renderRecurring() {
    var lista = document.getElementById('lista-recurring');
    lista.innerHTML = '';
    var freqLabels = { daily: '📅 Giornaliero', weekdays: '💼 Lun-Ven', weekend: '🏖️ Weekend', weekly: '📆 Settimanale' };
    stato.recurring.forEach(function (r) {
        var li = document.createElement('li');
        li.className = 'recurring';
        li.innerHTML = '<span class="task-text">' + r.text + '</span>' + (r.time ? '<span class="task-time">⏰ ' + r.time + '</span>' : '') + '<span class="task-freq">' + freqLabels[r.freq] + '</span><button class="btn-delete">🗑️</button>';
        li.querySelector('.btn-delete').addEventListener('click', function () {
            stato.recurring = stato.recurring.filter(function (x) { return x.id !== r.id; });
            salva();
            renderRecurring();
        });
        lista.appendChild(li);
    });
}

// ============ TASK OGGI ============
document.getElementById('data-oggi').textContent = oggiStr();
document.getElementById('btn-add-oggi').addEventListener('click', function () {
    var text = document.getElementById('input-task-oggi').value.trim();
    var time = document.getElementById('input-time-oggi').value;
    var cat = document.getElementById('select-task-cat-oggi').value;
    if (!text) return;
    stato.oggi.push({ id: uid(), text: text, time: time, done: false, date: oggiKey(), category: cat });
    document.getElementById('input-task-oggi').value = '';
    document.getElementById('input-time-oggi').value = '';
    salva();
    renderOggi();
});

function renderOggi() {
    var lista = document.getElementById('lista-oggi');
    lista.innerHTML = '';
    var todayTasks = stato.oggi.filter(function (t) { return t.date === oggiKey() || !t.date; });
    todayTasks.sort(function (a, b) { return (a.time || '').localeCompare(b.time || ''); });
    todayTasks.forEach(function (task) {
        var li = document.createElement('li');
        if (task.done) li.classList.add('done');
        if (task.recurringId) li.classList.add('recurring');
        var cat = stato.categories.tb.find(function (c) { return c.id === task.category; });
        var catHtml = cat ? '<span class="task-cat" style="background:' + cat.color + '">' + cat.icon + ' ' + cat.name + '</span>' : '';
        li.innerHTML = '<input type="checkbox" ' + (task.done ? 'checked' : '') + '><span class="task-text">' + task.text + '</span>' + catHtml + (task.time ? '<span class="task-time">⏰ ' + task.time + '</span>' : '') + '<button class="btn-delete">🗑️</button>';
        li.querySelector('input').addEventListener('change', function () {
            task.done = !task.done;
            if (task.done) aggiornaStats();
            salva();
            renderOggi();
        });
        li.querySelector('.btn-delete').addEventListener('click', function () {
            stato.oggi = stato.oggi.filter(function (t) { return t.id !== task.id; });
            salva();
            renderOggi();
        });
        lista.appendChild(li);
    });
    var done = todayTasks.filter(function (t) { return t.done; }).length;
    var total = todayTasks.length;
    var pct = total ? (done / total) * 100 : 0;
    document.getElementById('progress-oggi').style.width = pct + '%';
    document.getElementById('stats-oggi').textContent = done + '/' + total + ' completati';
}

// ============ STATS ============
function aggiornaStats() {
    var today = oggiKey();
    if (!stato.stats.history[today]) stato.stats.history[today] = 0;
    stato.stats.history[today]++;
    stato.stats.totalCompleted++;
    if (stato.stats.history[today] > stato.stats.bestDay) stato.stats.bestDay = stato.stats.history[today];
    var streak = 0;
    var d = new Date();
    while (true) {
        var k = d.toISOString().split('T')[0];
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
    var todayTasks = stato.oggi.filter(function (t) { return t.date === oggiKey() || !t.date; });
    var done = todayTasks.filter(function (t) { return t.done; }).length;
    var total = todayTasks.length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('stat-today').textContent = pct + '%';
    drawWeekChart();
    drawCategoriesChart();
    drawHeatmap();
}

function drawWeekChart() {
    var canvas = document.getElementById('chart-week');
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var days = [];
    for (var i = 6; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        var k = d.toISOString().split('T')[0];
        days.push({ key: k, label: d.toLocaleDateString('it-IT', { weekday: 'short' }), count: stato.stats.history[k] || 0 });
    }
    var max = Math.max.apply(null, [1].concat(days.map(function (d) { return d.count; })));
    var barW = (W - 80) / 7;
    var theme = stato.theme === 'dark' ? '#f1f5f9' : '#0f172a';
    var dim = stato.theme === 'dark' ? '#94a3b8' : '#64748b';
    ctx.fillStyle = dim;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    days.forEach(function (d, i) {
        var x = 40 + i * barW + barW / 2;
        var barH = (d.count / max) * (H - 60);
        var y = H - 30 - barH;
        var grad = ctx.createLinearGradient(0, y, 0, H - 30);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#10b981');
        ctx.fillStyle = grad;
        ctx.fillRect(x - barW / 3, y, barW * 2 / 3, barH);
        ctx.fillStyle = theme;
        ctx.fillText(d.count, x, y - 5);
        ctx.fillStyle = dim;
        ctx.fillText(d.label, x, H - 10);
    });
}

function drawCategoriesChart() {
    var canvas = document.getElementById('chart-categories');
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var cats = {};
    stato.categories.tb.forEach(function (c) {
        cats[c.name] = stato.oggi.filter(function (t) { return t.category === c.id && t.done; }).length;
    });
    var entries = Object.keys(cats).filter(function (k) { return cats[k] > 0; }).map(function (k) { return [k, cats[k]]; });
    var total = entries.reduce(function (s, entry) { return s + entry[1]; }, 0);
    if (total === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nessun dato disponibile', W / 2, H / 2);
        return;
    }
    var colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];
    var cx = H / 2, cy = H / 2, r = H / 2 - 20;
    var startAngle = -Math.PI / 2;
    entries.forEach(function (entry, i) {
        var name = entry[0];
        var val = entry[1];
        var angle = (val / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        var mid = startAngle + angle / 2;
        var lx = cx + Math.cos(mid) * (r * 0.6);
        var ly = cy + Math.sin(mid) * (r * 0.6);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name + ' ' + Math.round(val / total * 100) + '%', lx, ly);
        startAngle += angle;
    });
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    entries.forEach(function (entry, i) {
        var name = entry[0];
        var val = entry[1];
        var y = 20 + i * 20;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(W - 150, y - 10, 12, 12);
        ctx.fillStyle = stato.theme === 'dark' ? '#f1f5f9' : '#0f172a';
        ctx.fillText(name + ': ' + val, W - 130, y);
    });
}

function drawHeatmap() {
    var hm = document.getElementById('heatmap');
    hm.innerHTML = '';
    for (var i = 29; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        var k = d.toISOString().split('T')[0];
        var count = stato.stats.history[k] || 0;
        var cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        if (count >= 4) cell.classList.add('l4');
        else if (count >= 3) cell.classList.add('l3');
        else if (count >= 2) cell.classList.add('l2');
        else if (count >= 1) cell.classList.add('l1');
        cell.title = d.toLocaleDateString('it-IT') + ': ' + count + ' task';
        hm.appendChild(cell);
    }
}

document.getElementById('btn-reset-stats').addEventListener('click', function () {
    if (confirm('Resettare tutte le statistiche?')) {
        stato.stats = { history: {}, streak: 0, bestDay: 0, totalCompleted: 0 };
        salva();
        renderStats();
    }
});

// ============ AI ============
function aiRispondi(domanda) {
    var q = domanda.toLowerCase();
    var todayTasks = stato.oggi.filter(function (t) { return t.date === oggiKey() || !t.date; });
    var todo = todayTasks.filter(function (t) { return !t.done; });
    var streak = stato.stats.streak;
    var total = stato.stats.totalCompleted;
    var history = stato.stats.history;
    var days = Object.keys(history).sort().slice(-7);
    var avgLast7 = days.length ? Math.round(days.reduce(function (s, k) { return s + history[k]; }, 0) / days.length) : 0;
    var risposta = '';
    if (q.indexOf('cosa dovrei fare') !== -1 || q.indexOf('priorità') !== -1 || q.indexOf('ora') !== -1) {
        if (todo.length === 0) risposta = '🎉 <b>Ottimo!</b> Nessun task in sospeso. Puoi rilassarti o pianificare domani.';
        else {
            var urgenti = stato.eisenhower[1].filter(function (t) { return !t.done; });
            if (urgenti.length > 0) risposta = '🔥 <b>Priorità massima:</b> "' + urgenti[0].text + '"<br><br>💡 Usa la tecnica del pomodoro (25 min focus + 5 min pausa).';
            else risposta = '📋 Inizia da: <b>"' + todo[0].text + '"</b><br><br>💡 Fai il task più difficile quando hai più energia.';
        }
    } else if (q.indexOf('analizz') !== -1 || q.indexOf('produttività') !== -1) {
        risposta = '📊 <b>Analisi:</b><br>✅ Task totali: <b>' + total + '</b><br>🔥 Streak: <b>' + streak + ' giorni</b><br>📈 Media 7 giorni: <b>' + avgLast7 + ' task/giorno</b><br>🏆 Record: <b>' + stato.stats.bestDay + '</b><br><br>';
        if (streak >= 7) risposta += '🎉 <b>Wow!</b> Streak di ' + streak + ' giorni!';
        else if (streak >= 3) risposta += '💪 <b>Bene!</b> Stai costruendo una buona abitudine.';
        else if (total > 0) risposta += '🌱 <b>Ottimo inizio!</b> Punta a 7 giorni di streak.';
        else risposta += '🚀 <b>Inizia!</b> Completa il tuo primo task oggi.';
    } else if (q.indexOf('consiglio') !== -1) {
        var consigli = [
            '🎯 <b>Regola dei 2 minuti:</b> se un task richiede meno di 2 minuti, fallo subito.',
            '⏱️ <b>Pomodoro:</b> 25 min focus + 5 min pausa. Dopo 4 cicli, pausa lunga.',
            '🐸 <b>Eat the Frog:</b> fai il task più difficile per primo.',
            '📝 <b>Regola 1-3-5:</b> ogni giorno: 1 task grande, 3 medi, 5 piccoli.',
            '📵 <b>Elimina distrazioni:</b> telefono in un\'altra stanza durante il focus.',
            '💤 <b>Riposo = produttività:</b> dormire bene migliora focus e creatività.'
        ];
        risposta = consigli[Math.floor(Math.random() * consigli.length)];
    } else if (q.indexOf('motiv') !== -1 || q.indexOf('ispir') !== -1) {
        var frasi = [
            '🔥 "Il segreto per andare avanti è iniziare." - Mark Twight',
            '💪 "Non contare i giorni, fai che i contino." - Muhammad Ali',
            '🚀 "Ogni esperto è stato un principiante. Non mollare!"',
            '⭐ "Il successo è la somma di piccoli sforzi ripetuti giorno dopo giorno."',
            '🎯 "La disciplina è il ponte tra obiettivi e risultati." - Jim Rohn',
            '💎 "I diamanti si formano sotto pressione. Anche tu!"'
        ];
        risposta = frasi[Math.floor(Math.random() * frasi.length)] + '<br><br>Hai già completato <b>' + total + ' task</b>. Immagina cosa puoi fare oggi!';
    } else if (q.indexOf('pattern') !== -1 || q.indexOf('abitudin') !== -1) {
        risposta = '🔍 <b>I tuoi pattern:</b><br>';
        var habits = stato.habits;
        if (habits.length > 0) {
            risposta += '📌 <b>' + habits.length + ' abitudini</b> tracciate:<br>';
            habits.forEach(function (h) { risposta += '• ' + h.name + ': 🔥 ' + h.streak + ' giorni<br>'; });
        } else risposta += '📌 Nessuna abitudine tracciata.<br>';
        risposta += '<br>Media 7 giorni: <b>' + avgLast7 + ' task/giorno</b>';
        if (avgLast7 >= 5) risposta += '<br><br>🎉 <b>Sei molto produttivo!</b>';
        else if (avgLast7 >= 2) risposta += '<br><br>💪 <b>Buon ritmo!</b> Punta a 5 task/giorno.';
        else risposta += '<br><br>🌱 <b>Puoi migliorare!</b> Inizia con 2-3 task al giorno.';
    } else if (q.indexOf('ciao') !== -1 || q.indexOf('salve') !== -1) {
        risposta = 'Ciao! 👋 Hai <b>' + todo.length + ' task</b> in sospeso e streak di <b>' + streak + ' giorni</b>. Come posso aiutarti?';
    } else if (q.indexOf('grazie') !== -1) {
        risposta = 'Prego! 😊 Continua così, stai facendo un ottimo lavoro! 💪';
    } else {
        risposta = '🤔 Prova a chiedermi:<br>• "Cosa dovrei fare ora?"<br>• "Analizza la mia produttività"<br>• "Dammi un consiglio"<br>• "Motivami!"';
    }
    return risposta;
}

function aggiungiMessaggioAI(testo, isUser) {
    if (isUser === undefined) isUser = false;
    var chat = document.getElementById('ai-chat');
    var msg = document.createElement('div');
    msg.className = 'ai-message' + (isUser ? ' user' : '');
    msg.innerHTML = '<div class="ai-avatar">' + (isUser ? '👤' : '🤖') + '</div><div class="ai-text">' + testo + '</div>';
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

function inviaAI() {
    var input = document.getElementById('ai-input');
    var q = input.value.trim();
    if (!q) return;
    aggiungiMessaggioAI(q, true);
    input.value = '';
    setTimeout(function () { aggiungiMessaggioAI(aiRispondi(q)); }, 500);
}

document.getElementById('btn-ai-send').addEventListener('click', inviaAI);
document.getElementById('ai-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') inviaAI();
});
document.querySelectorAll('.ai-quick').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.getElementById('ai-input').value = btn.dataset.q;
        inviaAI();
    });
});

// ============ GTD ============
document.getElementById('btn-add-gtd').addEventListener('click', function () {
    var text = document.getElementById('input-gtd').value.trim();
    if (!text) return;
    stato.gtd.inbox.push({ id: uid(), text: text });
    document.getElementById('input-gtd').value = '';
    salva();
    renderGTD();
});

function renderGTD() {
    var container = document.getElementById('gtd-contesti');
    container.innerHTML = '';
    stato.categories.gtd.forEach(function (ctx) {
        var id = ctx.id;
        if (!stato.gtd[id]) stato.gtd[id] = [];
        var div = document.createElement('div');
        div.className = 'contesto';
        div.style.borderTop = '4px solid ' + ctx.color;
        div.innerHTML = '<h3>' + ctx.icon + ' ' + ctx.name + ' <span class="count" id="count-' + id + '">0</span></h3><ul class="task-list" id="lista-' + id + '"></ul>';
        container.appendChild(div);
        var lista = document.getElementById('lista-' + id);
        document.getElementById('count-' + id).textContent = stato.gtd[id].length;
        stato.gtd[id].forEach(function (task) {
            var li = document.createElement('li');
            var options = '<option value="">Sposta...</option>';
            stato.categories.gtd.forEach(function (c) {
                options += '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>';
            });
            li.innerHTML = '<span class="task-text">' + task.text + '</span><select class="ctx-select">' + options + '</select><button class="btn-delete">🗑️</button>';
            li.querySelector('.ctx-select').addEventListener('change', function (e) {
                var newCtx = e.target.value;
                if (newCtx && newCtx !== id) {
                    stato.gtd[newCtx].push(task);
                    stato.gtd[id] = stato.gtd[id].filter(function (t) { return t.id !== task.id; });
                    salva();
                    renderGTD();
                }
            });
            li.querySelector('.btn-delete').addEventListener('click', function () {
                stato.gtd[id] = stato.gtd[id].filter(function (t) { return t.id !== task.id; });
                salva();
                renderGTD();
            });
            lista.appendChild(li);
        });
    });
}

// ============ EISENHOWER ============
document.querySelectorAll('.add-mini button').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var q = btn.dataset.quadrante;
        var input = btn.previousElementSibling;
        var text = input.value.trim();
        if (!text) return;
        stato.eisenhower[q].push({ id: uid(), text: text, done: false });
        input.value = '';
        salva();
        renderEisenhower();
    });
});

function renderEisenhower() {
    [1, 2, 3, 4].forEach(function (q) {
        var lista = document.getElementById('lista-q' + q);
        lista.innerHTML = '';
        stato.eisenhower[q].forEach(function (task) {
            var li = document.createElement('li');
            if (task.done) li.classList.add('done');
            li.innerHTML = '<input type="checkbox" ' + (task.done ? 'checked' : '') + '><span class="task-text">' + task.text + '</span><button class="btn-delete">🗑️</button>';
            li.querySelector('input').addEventListener('change', function () {
                task.done = !task.done;
                if (task.done) aggiornaStats();
                salva();
                renderEisenhower();
            });
            li.querySelector('.btn-delete').addEventListener('click', function () {
                stato.eisenhower[q] = stato.eisenhower[q].filter(function (t) { return t.id !== task.id; });
                salva();
                renderEisenhower();
            });
            lista.appendChild(li);
        });
    });
}

// ============ TIME BLOCKING ============
document.getElementById('btn-add-tb').addEventListener('click', function () {
    var start = document.getElementById('input-tb-start').value;
    var end = document.getElementById('input-tb-end').value;
    var attivita = document.getElementById('input-tb-attivita').value.trim();
    var categoria = document.getElementById('input-tb-categoria').value;
    if (!start || !end || !attivita) return;
    stato.timeblocks.push({ id: uid(), start: start, end: end, attivita: attivita, categoria: categoria });
    document.getElementById('input-tb-start').value = '';
    document.getElementById('input-tb-end').value = '';
    document.getElementById('input-tb-attivita').value = '';
    salva();
    renderTimeblocks();
});

function renderTimeblocks() {
    var timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    stato.timeblocks.sort(function (a, b) { return a.start.localeCompare(b.start); });
    stato.timeblocks.forEach(function (tb) {
        var cat = stato.categories.tb.find(function (c) { return c.id === tb.categoria; });
        var color = cat ? cat.color : '#6366f1';
        var div = document.createElement('div');
        div.className = 'time-block';
        div.style.borderLeftColor = color;
        div.style.background = color + '20';
        div.innerHTML = '<div class="time">' + tb.start + ' - ' + tb.end + '</div><div class="attivita">' + (cat ? cat.icon + ' ' : '') + tb.attivita + '</div><button class="btn-delete">🗑️</button>';
        div.querySelector('.btn-delete').addEventListener('click', function () {
            stato.timeblocks = stato.timeblocks.filter(function (t) { return t.id !== tb.id; });
            salva();
            renderTimeblocks();
        });
        timeline.appendChild(div);
    });
}

// ============ OKR ============
document.getElementById('btn-add-okr').addEventListener('click', function () {
    document.getElementById('modal-okr').classList.add('active');
});
document.getElementById('btn-cancel-okr').addEventListener('click', function () {
    document.getElementById('modal-okr').classList.remove('active');
});
document.getElementById('btn-save-okr').addEventListener('click', function () {
    var titolo = document.getElementById('okr-titolo').value.trim();
    var kr1 = document.getElementById('okr-kr1').value.trim();
    var kr2 = document.getElementById('okr-kr2').value.trim();
    var kr3 = document.getElementById('okr-kr3').value.trim();
    if (!titolo) return;
    var krs = [];
    if (kr1) krs.push({ text: kr1, done: false });
    if (kr2) krs.push({ text: kr2, done: false });
    if (kr3) krs.push({ text: kr3, done: false });
    stato.okr.push({ id: uid(), titolo: titolo, keyResults: krs });
    document.getElementById('okr-titolo').value = '';
    document.getElementById('okr-kr1').value = '';
    document.getElementById('okr-kr2').value = '';
    document.getElementById('okr-kr3').value = '';
    document.getElementById('modal-okr').classList.remove('active');
    salva();
    renderOKR();
});

function renderOKR() {
    var lista = document.getElementById('lista-okr');
    lista.innerHTML = '';
    stato.okr.forEach(function (okr) {
        var card = document.createElement('div');
        card.className = 'okr-card';
        var done = okr.keyResults.filter(function (kr) { return kr.done; }).length;
        var total = okr.keyResults.length;
        var pct = total ? (done / total) * 100 : 0;
        var html = '<h3>' + okr.titolo + '</h3><div class="progress-bar"><div class="progress" style="width:' + pct + '%"></div></div><p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">' + done + '/' + total + ' Key Results</p>';
        okr.keyResults.forEach(function (kr, i) {
            html += '<div class="kr-item"><input type="checkbox" ' + (kr.done ? 'checked' : '') + ' data-i="' + i + '"><span>' + kr.text + '</span></div>';
        });
        html += '<button class="btn-delete" style="margin-top:10px;">🗑️ Elimina</button>';
        card.innerHTML = html;
        card.querySelectorAll('.kr-item input').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var i = parseInt(cb.dataset.i);
                okr.keyResults[i].done = cb.checked;
                salva();
                renderOKR();
            });
        });
        card.querySelector('.btn-delete').addEventListener('click', function () {
            stato.okr = stato.okr.filter(function (o) { return o.id !== okr.id; });
            salva();
            renderOKR();
        });
        lista.appendChild(card);
    });
}

// ============ 12 WEEK ============
function init12Week() {
    if (!stato.week12Start) {
        stato.week12Start = new Date().toISOString();
        salva();
    }
}

function calcolaSettimana() {
    var start = new Date(stato.week12Start);
    var now = new Date();
    var diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return {
        week: Math.min(12, Math.floor(diffDays / 7) + 1),
        pct: Math.min(100, (diffDays / 84) * 100),
        start: start
    };
}

document.getElementById('btn-add-12w').addEventListener('click', function () {
    var text = prompt('Obiettivo per le prossime 12 settimane:');
    if (!text) return;
    stato.week12.push({ id: uid(), text: text, done: false });
    salva();
    render12W();
});

function render12W() {
    var weekData = calcolaSettimana();
    var week = weekData.week;
    var pct = weekData.pct;
    var start = weekData.start;
    document.getElementById('week-current').textContent = week;
    var end = new Date(start);
    end.setDate(end.getDate() + 83);
    document.getElementById('week-dates').textContent = start.toLocaleDateString('it-IT') + ' → ' + end.toLocaleDateString('it-IT');
    document.getElementById('progress-12w').style.width = pct + '%';
    document.getElementById('week-percent').textContent = Math.round(pct) + '%';
    var lista = document.getElementById('lista-12w');
    lista.innerHTML = '';
    stato.week12.forEach(function (task) {
        var li = document.createElement('li');
        if (task.done) li.classList.add('done');
        li.innerHTML = '<input type="checkbox" ' + (task.done ? 'checked' : '') + '><span class="task-text">' + task.text + '</span><button class="btn-delete">🗑️</button>';
        li.querySelector('input').addEventListener('change', function () {
            task.done = !task.done;
            if (task.done) aggiornaStats();
            salva();
            render12W();
        });
        li.querySelector('.btn-delete').addEventListener('click', function () {
            stato.week12 = stato.week12.filter(function (t) { return t.id !== task.id; });
            salva();
            render12W();
        });
        lista.appendChild(li);
    });
}

// ============ CALENDARIO & EVENTI ============
var calendarDate = new Date();

function detectOS() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('win') !== -1) return 'windows';
    if (ua.indexOf('mac') !== -1) return 'macos';
    return 'linux';
}

// ============ GESTIONE MODAL EVENTO (NUOVO/MODIFICA) ============
function resetEventModal() {
    editingEventId = null;
    var modalTitle = document.getElementById('modal-event-title');
    if (modalTitle) modalTitle.textContent = '📅 Nuovo Evento';
    document.getElementById('input-event-title').value = '';
    document.getElementById('input-event-date').value = oggiKey();
    document.getElementById('input-event-time').value = '';
    document.getElementById('input-event-duration').value = 60;
    document.getElementById('input-event-desc').value = '';
    document.getElementById('input-event-color').value = '#6366f1';
    document.getElementById('input-event-notify').value = 15;
    var btnDelete = document.getElementById('btn-delete-event');
    if (btnDelete) btnDelete.style.display = 'none';
}

function apriModalModificaEvento(eventId) {
    var ev = stato.events.find(function (e) { return e.id === eventId; });
    if (!ev) return;

    editingEventId = eventId;
    var modalTitle = document.getElementById('modal-event-title');
    if (modalTitle) modalTitle.textContent = '✏️ Modifica Evento';
    document.getElementById('input-event-title').value = ev.title || '';
    document.getElementById('input-event-date').value = ev.date || '';
    document.getElementById('input-event-time').value = ev.time || '';
    document.getElementById('input-event-duration').value = ev.duration || 60;
    document.getElementById('input-event-desc').value = ev.description || '';
    document.getElementById('input-event-color').value = ev.color || '#6366f1';
    document.getElementById('input-event-notify').value = ev.notifyBefore !== undefined ? ev.notifyBefore : 15;
    var btnDelete = document.getElementById('btn-delete-event');
    if (btnDelete) btnDelete.style.display = 'inline-block';
    document.getElementById('modal-event').classList.add('active');
}

function renderCalendar() {
    var grid = document.getElementById('calendar-grid');
    var title = document.getElementById('calendar-title');
    if (!grid || !title) return;

    var year = calendarDate.getFullYear();
    var month = calendarDate.getMonth();
    var monthName = calendarDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    title.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    var cells = grid.querySelectorAll('.calendar-cell');
    for (var i = 0; i < cells.length; i++) cells[i].remove();

    var firstDay = new Date(year, month, 1);
    var startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var todayKeyVal = oggiKey();

    for (var i = 0; i < startWeekday; i++) {
        var empty = document.createElement('div');
        empty.className = 'calendar-cell empty';
        grid.appendChild(empty);
    }

    for (var d = 1; d <= daysInMonth; d++) {
        var dateKey = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var dayEvents = stato.events.filter(function (e) { return e.date === dateKey; });
        var cell = document.createElement('div');
        cell.className = 'calendar-cell' + (dateKey === todayKeyVal ? ' today' : '') + (dayEvents.length ? ' has-events' : '');
        var cellHTML = '<div class="cell-day">' + d + '</div>';
        dayEvents.slice(0, 3).forEach(function (e) {
            cellHTML += '<div class="cell-event" data-event-id="' + e.id + '" style="background:' + (e.color || '#6366f1') + '" title="' + (e.time || '') + ' ' + e.title + '">' + (e.time ? e.time + ' ' : '') + e.title + '</div>';
        });
        if (dayEvents.length > 3) {
            cellHTML += '<div class="cell-more">+' + (dayEvents.length - 3) + ' altri</div>';
        }
        cell.innerHTML = cellHTML;

        // Click sulla cella (giorno)
        cell.addEventListener('click', function (ev) {
            // Se il click è su un evento esistente, non aprire nuovo evento
            if (ev.target.classList.contains('cell-event')) return;
            resetEventModal();
            document.getElementById('input-event-date').value = dateKey;
            document.getElementById('modal-event').classList.add('active');
        });

        // Click diretto sugli eventi nel calendario
        cell.querySelectorAll('.cell-event').forEach(function (evDiv) {
            evDiv.addEventListener('click', function (ev) {
                ev.stopPropagation();
                var eventId = evDiv.getAttribute('data-event-id');
                if (eventId) apriModalModificaEvento(eventId);
            });
        });

        grid.appendChild(cell);
    }

    renderUpcomingEvents();
}

function renderUpcomingEvents() {
    var lista = document.getElementById('upcoming-events');
    if (!lista) return;
    lista.innerHTML = '';
    var now = new Date();
    var todayStr = now.toDateString();
    var upcoming = stato.events.filter(function (e) {
        return new Date(e.date + 'T' + (e.time || '23:59')) >= new Date(todayStr);
    }).sort(function (a, b) {
        return (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
    }).slice(0, 10);

    if (upcoming.length === 0) {
        lista.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;">Nessun evento programmato</p>';
        return;
    }

    upcoming.forEach(function (e) {
        var evDate = new Date(e.date + 'T' + (e.time || '00:00'));
        var diffMs = evDate - new Date(todayStr);
        var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        var when = evDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
        if (e.time) when += ' ⏰ ' + e.time;
        if (diffDays === 0) when += ' (OGGI)';
        else if (diffDays === 1) when += ' (domani)';
        else if (diffDays > 1 && diffDays <= 7) when += ' (tra ' + diffDays + ' giorni)';

        var li = document.createElement('div');
        li.className = 'upcoming-event';
        li.style.borderLeftColor = e.color || '#6366f1';
        li.innerHTML = '<div style="flex:1;cursor:pointer;" class="event-info"><div style="font-weight:600;">' + e.title + '</div><div style="font-size:12px;color:var(--text-dim);">' + when + '</div>' + (e.description ? '<div style="font-size:12px;margin-top:4px;">' + e.description + '</div>' : '') + '</div><div class="upcoming-event-actions"><button class="btn-edit" title="Modifica">✏️</button><button class="btn-delete" title="Elimina">🗑️</button></div>';

        // Click su info evento → modifica
        li.querySelector('.event-info').addEventListener('click', function () {
            apriModalModificaEvento(e.id);
        });

        // Click su modifica
        li.querySelector('.btn-edit').addEventListener('click', function (ev) {
            ev.stopPropagation();
            apriModalModificaEvento(e.id);
        });

        // Click su elimina
        li.querySelector('.btn-delete').addEventListener('click', function (ev) {
            ev.stopPropagation();
            if (confirm('🗑️ Eliminare l\'evento "' + e.title + '"?')) {
                stato.events = stato.events.filter(function (x) { return x.id !== e.id; });
                salva();
                renderCalendar();
            }
        });

        lista.appendChild(li);
    });
}

document.getElementById('btn-cal-prev').addEventListener('click', function () {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('btn-cal-next').addEventListener('click', function () {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
});
document.getElementById('btn-cal-today').addEventListener('click', function () {
    calendarDate = new Date();
    renderCalendar();
});

// Click su "+ Nuovo Evento" → reset e apertura modal
document.getElementById('btn-add-event').addEventListener('click', function () {
    resetEventModal();
    document.getElementById('modal-event').classList.add('active');
});

// Annulla → chiude modal e resetta
document.getElementById('btn-cancel-event').addEventListener('click', function () {
    resetEventModal();
    document.getElementById('modal-event').classList.remove('active');
});

// Elimina evento (solo in modalità modifica)
document.getElementById('btn-delete-event').addEventListener('click', function () {
    if (!editingEventId) return;
    var ev = stato.events.find(function (e) { return e.id === editingEventId; });
    if (!ev) return;
    if (confirm('🗑️ Eliminare definitivamente l\'evento "' + ev.title + '"?')) {
        stato.events = stato.events.filter(function (x) { return x.id !== editingEventId; });
        salva();
        resetEventModal();
        document.getElementById('modal-event').classList.remove('active');
        renderCalendar();
    }
});

// Salva evento (crea nuovo O aggiorna esistente)
document.getElementById('btn-save-event').addEventListener('click', function () {
    var title = document.getElementById('input-event-title').value.trim();
    var date = document.getElementById('input-event-date').value;
    var time = document.getElementById('input-event-time').value;
    var duration = document.getElementById('input-event-duration').value || 60;
    var description = document.getElementById('input-event-desc').value.trim();
    var color = document.getElementById('input-event-color').value;
    var notifyBefore = document.getElementById('input-event-notify').value || 0;

    if (!title || !date) {
        alert('⚠️ Titolo e data sono obbligatori');
        return;
    }

    if (editingEventId) {
        // MODIFICA evento esistente
        var ev = stato.events.find(function (e) { return e.id === editingEventId; });
        if (ev) {
            ev.title = title;
            ev.date = date;
            ev.time = time;
            ev.duration = parseInt(duration);
            ev.description = description;
            ev.color = color;
            ev.notifyBefore = parseInt(notifyBefore);
        }
    } else {
        // CREAZIONE nuovo evento
        stato.events.push({
            id: uid(),
            title: title,
            date: date,
            time: time,
            duration: parseInt(duration),
            description: description,
            color: color,
            notifyBefore: parseInt(notifyBefore),
            created: new Date().toISOString()
        });
    }

    resetEventModal();
    document.getElementById('modal-event').classList.remove('active');
    salva();
    renderCalendar();

    if ('Notification' in window && Notification.permission === 'granted') {
        var msg = editingEventId ? '📅 Evento modificato' : '📅 Evento creato';
        new Notification(msg, {
            body: title + (time ? ' alle ' + time : '') + ' il ' + new Date(date).toLocaleDateString('it-IT')
        });
    }
});

function initCalendarSettings() {
    var osSelect = document.getElementById('select-notif-os');
    var advanceInput = document.getElementById('input-notif-advance');
    var osLabel = document.getElementById('detected-os');
    if (osSelect) {
        var detected = detectOS();
        osSelect.value = stato.calendarNotif.os || detected;
        if (osLabel) {
            var labels = { linux: '🐧 Linux', macos: '🍎 macOS', windows: '🪟 Windows' };
            osLabel.textContent = labels[detected] + ' (rilevato)';
        }
        osSelect.onchange = function () {
            stato.calendarNotif.os = osSelect.value;
            salva();
        };
    }
    if (advanceInput) {
        advanceInput.value = stato.calendarNotif.advanceMin || 15;
        advanceInput.onchange = function () {
            stato.calendarNotif.advanceMin = parseInt(advanceInput.value) || 15;
            salva();
        };
    }
}

function generaScriptNotifiche() {
    var os = stato.calendarNotif.os || detectOS();
    var events = stato.events.filter(function (e) { return e.time; });
    var advance = stato.calendarNotif.advanceMin || 15;
    var script = '', filename = '';

    if (os === 'linux') {
        filename = 'notifiche-lifeplanner.sh';
        var eventBlocks = '';
        events.forEach(function (e) {
            var safeTitle = e.title.replace(/"/g, '\\"').replace(/`/g, '');
            eventBlocks += '# Evento: ' + safeTitle + '\nEVENT_TS=$(date -d "' + e.date + ' ' + e.time + '" +%s 2>/dev/null)\nif [ -n "$EVENT_TS" ]; then\n    DIFF=$(( (EVENT_TS - NOW) / 60 ))\n    if [ "$DIFF" -le ' + advance + ' ] && [ "$DIFF" -ge 0 ]; then\n        KEY="' + e.date + '_' + e.time + '"\n        if ! grep -q "^$KEY$" "$SENT_FILE"; then\n            notify-send "📅 Life Planner" "' + safeTitle + ' tra $DIFF minuti" -u critical -i appointment-soon\n            echo "$KEY" >> "$SENT_FILE"\n        fi\n    fi\nfi\n\n';
        });
        script = '#!/bin/bash\n# Life Planner - Script notifiche Linux\nDATA_DIR="$HOME/.lifeplanner"\nmkdir -p "$DATA_DIR"\nSENT_FILE="$DATA_DIR/.sent_events"\ntouch "$SENT_FILE"\nNOW=$(date +%s)\n\n' + eventBlocks + 'find "$SENT_FILE" -mtime +1 -delete 2>/dev/null\necho "✅ Controllo completato: $(date)"\n';
    } else if (os === 'macos') {
        filename = 'notifiche-lifeplanner.sh';
        var eventBlocksMac = '';
        events.forEach(function (e) {
            var safeTitle = e.title.replace(/"/g, '\\"').replace(/`/g, '');
            eventBlocksMac += 'EVENT_TS=$(date -j -f "%Y-%m-%d %H:%M" "' + e.date + ' ' + e.time + '" +%s 2>/dev/null)\nif [ -n "$EVENT_TS" ]; then\n    DIFF=$(( (EVENT_TS - NOW) / 60 ))\n    if [ "$DIFF" -le ' + advance + ' ] && [ "$DIFF" -ge 0 ]; then\n        KEY="' + e.date + '_' + e.time + '"\n        if ! grep -q "^$KEY$" "$SENT_FILE"; then\n            osascript -e \'display notification "' + safeTitle + ' tra \'"$DIFF"\' minuti" with title "Life Planner" sound name "Glass"\'\n            echo "$KEY" >> "$SENT_FILE"\n        fi\n    fi\nfi\n\n';
        });
        script = '#!/bin/bash\n# Life Planner - Script notifiche macOS\nDATA_DIR="$HOME/.lifeplanner"\nmkdir -p "$DATA_DIR"\nSENT_FILE="$DATA_DIR/.sent_events"\ntouch "$SENT_FILE"\nNOW=$(date +%s)\n\n' + eventBlocksMac + 'echo "✅ Controllo completato: $(date)"\n';
    } else {
        filename = 'notifiche-lifeplanner.ps1';
        var eventBlocksWin = '';
        events.forEach(function (e) {
            var safeTitle = e.title.replace(/"/g, '`"');
            eventBlocksWin += '$evDate = [DateTime]::Parse("' + e.date + ' ' + e.time + '")\n$diff = [math]::Floor(($evDate - $now).TotalMinutes)\n$key = "' + e.date + '_' + e.time + '"\nif ($diff -le ' + advance + ' -and $diff -ge 0 -and $sent -notcontains $key) {\n    Send-Notif "Life Planner" "' + safeTitle + ' tra $diff minuti"\n    Add-Content $SentFile $key\n}\n\n';
        });
        script = '# Life Planner - Script notifiche Windows PowerShell\n$DataDir = "$env:USERPROFILE\\.lifeplanner"\nNew-Item -ItemType Directory -Force -Path $DataDir | Out-Null\n$SentFile = "$DataDir\\.sent_events.txt"\nif (!(Test-Path $SentFile)) { New-Item $SentFile -ItemType File | Out-Null }\n$sent = Get-Content $SentFile -ErrorAction SilentlyContinue\n$now = Get-Date\n$advance = ' + advance + '\n\nfunction Send-Notif($title, $msg) {\n    Add-Type -AssemblyName System.Windows.Forms\n    $n = New-Object System.Windows.Forms.NotifyIcon\n    $n.Icon = [System.Drawing.SystemIcons]::Information\n    $n.Visible = $true\n    $n.BalloonTipTitle = $title\n    $n.BalloonTipText = $msg\n    $n.ShowBalloonTip(5000)\n    Start-Sleep -Milliseconds 100\n    $n.Dispose()\n}\n\n' + eventBlocksWin + 'Write-Host "✅ Controllo completato: $(Get-Date)"\n';
    }

    return { script: script, filename: filename };
}

function downloadScriptNotifiche() {
    var result = generaScriptNotifiche();
    var script = result.script;
    var filename = result.filename;
    var blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    var os = stato.calendarNotif.os || detectOS();
    var istruzioni = '✅ Script scaricato!\n\n';
    if (os === 'linux' || os === 'macos') {
        istruzioni += '📋 Per renderlo eseguibile:\nchmod +x ' + filename + '\n\n';
        istruzioni += '📋 Per eseguirlo ogni 5 minuti (crontab):\ncrontab -e\n';
        istruzioni += 'Aggiungi: */5 * * * * /percorso/a/' + filename + '\n';
    } else {
        istruzioni += '📋 Per eseguirlo con Task Scheduler di Windows:\n';
        istruzioni += '1. Apri "Utilità di pianificazione"\n';
        istruzioni += '2. Crea attività base → avvia ' + filename + ' ogni 5 minuti\n';
    }
    alert(istruzioni);
}

function copyCrontabCommand() {
    var os = stato.calendarNotif.os || detectOS();
    var cmd = '';
    if (os === 'linux' || os === 'macos') {
        cmd = '*/5 * * * * $HOME/notifiche-lifeplanner.sh >> $HOME/.lifeplanner/cron.log 2>&1';
    } else {
        cmd = 'powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\notifiche-lifeplanner.ps1"';
    }
    navigator.clipboard.writeText(cmd).then(function () {
        alert('✅ Comando copiato negli appunti!\n\n' + cmd);
    }).catch(function () {
        prompt('Copia questo comando:', cmd);
    });
}

document.getElementById('btn-download-notif-script').addEventListener('click', downloadScriptNotifiche);
document.getElementById('btn-copy-crontab').addEventListener('click', copyCrontabCommand);

// ============ SETTINGS SICUREZZA ============
function renderSecuritySettings() {
    document.getElementById('sec-username').value = stato.auth.username || 'matteo';
    document.getElementById('sec-remember').checked = stato.auth.rememberMe || false;
    document.getElementById('sec-timeout').value = stato.auth.timeoutMin !== undefined ? stato.auth.timeoutMin : 4;
    document.getElementById('sec-newpass').value = '';
    document.getElementById('sec-newpass2').value = '';
}

document.getElementById('btn-save-security').addEventListener('click', function () {
    var newUser = document.getElementById('sec-username').value.trim();
    var newPass = document.getElementById('sec-newpass').value;
    var newPass2 = document.getElementById('sec-newpass2').value;
    var remember = document.getElementById('sec-remember').checked;
    var timeout = parseInt(document.getElementById('sec-timeout').value) || 0;

    if (!newUser) {
        alert('❌ Username non può essere vuoto');
        return;
    }
    if (newPass && newPass !== newPass2) {
        alert('❌ Le password non coincidono');
        return;
    }
    if (newPass && newPass.length < 3) {
        alert('❌ Password troppo corta (minimo 3 caratteri)');
        return;
    }

    stato.auth.username = newUser;
    if (newPass) {
        stato.auth.passwordHash = hash(newPass);
    }
    stato.auth.rememberMe = remember;
    stato.auth.timeoutMin = timeout;
    salva();

    if (remember) {
        localStorage.setItem('lifePlanner_session', JSON.stringify({
            valid: true,
            username: newUser,
            created: Date.now()
        }));
    } else {
        localStorage.removeItem('lifePlanner_session');
    }

    if (sessione.autenticato) {
        avviaMonitorInattivita();
    }

    alert('✅ Impostazioni di sicurezza salvate!\n\n👤 Username: ' + newUser + '\n🔓 Rimani connesso: ' + (remember ? 'SÌ' : 'NO') + '\n⏱️ Timeout: ' + (timeout === 0 ? 'disattivato' : timeout + ' minuti'));
});

// ============ RENDER SETTINGS ============
function renderSettings() {
    var json = JSON.stringify(stato);
    var sizeKB = (new Blob([json]).size / 1024).toFixed(2);
    document.getElementById('data-size').textContent = sizeKB + ' KB';
    document.getElementById('data-created').textContent = new Date(stato.meta.created).toLocaleDateString('it-IT');
    document.getElementById('data-last-backup').textContent = stato.meta.lastBackup ? new Date(stato.meta.lastBackup).toLocaleString('it-IT') : 'Mai';
    var totalTasks = stato.oggi.length + Object.values(stato.gtd).reduce(function (s, a) { return s + a.length; }, 0) +
        Object.values(stato.eisenhower).reduce(function (s, a) { return s + a.length; }, 0) +
        stato.timeblocks.length + stato.week12.length + stato.events.length;
    document.getElementById('data-tasks-count').textContent = totalTasks;

    var notifStatus = document.getElementById('notif-status');
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
    renderSecuritySettings();
}

document.getElementById('btn-export-json').addEventListener('click', function () {
    var data = JSON.stringify(stato, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'life-planner-backup-' + oggiKey() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    stato.meta.lastBackup = new Date().toISOString();
    salva();
    alert('✅ Backup completato! Dimensione: ' + (new Blob([data]).size / 1024).toFixed(2) + ' KB');
});

document.getElementById('btn-export-quick').addEventListener('click', function () {
    document.getElementById('btn-export-json').click();
});

document.getElementById('btn-export-md').addEventListener('click', function () {
    var md = '# Life Planner - Backup ' + oggiKey() + '\n\n';
    md += '## 📅 Task di oggi\n\n';
    stato.oggi.forEach(function (t) {
        md += '- [' + (t.done ? 'x' : ' ') + '] ' + t.text + (t.time ? ' ⏰ ' + t.time : '') + '\n';
    });
    md += '\n## 📥 GTD\n\n';
    stato.categories.gtd.forEach(function (ctx) {
        if (stato.gtd[ctx.id] && stato.gtd[ctx.id].length > 0) {
            md += '### ' + ctx.icon + ' ' + ctx.name + '\n\n';
            stato.gtd[ctx.id].forEach(function (t) {
                md += '- ' + t.text + '\n';
            });
        }
    });
    md += '\n## ⚡ Eisenhower\n\n';
    [1, 2, 3, 4].forEach(function (q) {
        var labels = { 1: '🔥 FAI ORA', 2: '📅 PIANIFICA', 3: '👥 DELEGA', 4: '🗑️ ELIMINA' };
        md += '### ' + labels[q] + '\n\n';
        stato.eisenhower[q].forEach(function (t) {
            md += '- [' + (t.done ? 'x' : ' ') + '] ' + t.text + '\n';
        });
    });
    md += '\n## 🎯 OKR\n\n';
    stato.okr.forEach(function (o) {
        md += '### ' + o.titolo + '\n\n';
        o.keyResults.forEach(function (kr) {
            md += '- [' + (kr.done ? 'x' : ' ') + '] ' + kr.text + '\n';
        });
    });
    md += '\n## 🔥 12 Week Year\n\n';
    stato.week12.forEach(function (t) {
        md += '- [' + (t.done ? 'x' : ' ') + '] ' + t.text + '\n';
    });
    md += '\n## 🔁 Abitudini\n\n';
    stato.habits.forEach(function (h) {
        md += '- ' + h.name + ' (🔥 ' + h.streak + ' giorni)\n';
    });
    md += '\n## 📆 Eventi\n\n';
    stato.events.forEach(function (e) {
        md += '- **' + e.title + '** - ' + e.date + (e.time ? ' ' + e.time : '') + '\n';
        if (e.description) md += '  ' + e.description + '\n';
    });
    var blob = new Blob([md], { type: 'text/markdown' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'life-planner-' + oggiKey() + '.md';
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Export Markdown completato!');
});

document.getElementById('btn-export-csv').addEventListener('click', function () {
    var csv = 'Tipo;Testo;Completato;Data/Ora;Categoria\n';
    stato.oggi.forEach(function (t) {
        var cat = stato.categories.tb.find(function (c) { return c.id === t.category; });
        csv += 'Oggi;"' + t.text + '";' + (t.done ? 'Sì' : 'No') + ';' + (t.time || '') + ';' + (cat ? cat.name : '') + '\n';
    });
    stato.categories.gtd.forEach(function (ctx) {
        stato.gtd[ctx.id].forEach(function (t) {
            csv += 'GTD-' + ctx.name + ';"' + t.text + '";No;;\n';
        });
    });
    [1, 2, 3, 4].forEach(function (q) {
        var labels = { 1: 'Q1-Fai ora', 2: 'Q2-Pianifica', 3: 'Q3-Delega', 4: 'Q4-Elimina' };
        stato.eisenhower[q].forEach(function (t) {
            csv += labels[q] + ';"' + t.text + '";' + (t.done ? 'Sì' : 'No') + ';;\n';
        });
    });
    stato.habits.forEach(function (h) {
        csv += 'Abitudine;"' + h.name + '";No;;Streak: ' + h.streak + '\n';
    });
    stato.events.forEach(function (e) {
        csv += 'Evento;"' + e.title + '";No;' + e.date + ' ' + (e.time || '') + ';\n';
    });
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'life-planner-' + oggiKey() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Export CSV completato! Apribile con Excel/Google Sheets.');
});

document.getElementById('btn-auto-backup').addEventListener('click', function () {
    var data = JSON.stringify(stato);
    localStorage.setItem('lifePlanner_autoBackup', data);
    localStorage.setItem('lifePlanner_autoBackup_date', new Date().toISOString());
    stato.meta.lastBackup = new Date().toISOString();
    salva();
    alert('✅ Backup automatico salvato nel browser!');
    renderSettings();
});

document.getElementById('btn-import-json').addEventListener('click', function () {
    document.getElementById('file-import2').click();
});
document.getElementById('file-import2').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!confirm('⚠️ Questo sostituirà tutti i dati attuali. Continuare?')) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
        try {
            stato = JSON.parse(ev.target.result);
            salva();
            alert('✅ Dati importati con successo!');
            location.reload();
        } catch (err) {
            alert('❌ File non valido!');
        }
    };
    reader.readAsText(file);
});

document.getElementById('btn-clear-today').addEventListener('click', function () {
    if (confirm('⚠️ Cancellare tutti i task di oggi?')) {
        var todayKeyVal = oggiKey();
        stato.oggi = stato.oggi.filter(function (t) { return t.date !== todayKeyVal; });
        salva();
        renderOggi();
        alert('✅ Task di oggi cancellati.');
    }
});

document.getElementById('btn-clear-all').addEventListener('click', function () {
    if (confirm('⚠️ CANCELLARE TUTTI I DATI? Questa azione è irreversibile!')) {
        if (confirm('Sei davvero sicuro? Perdi tutto!')) {
            localStorage.removeItem('lifePlanner');
            localStorage.removeItem('lifePlanner_session');
            location.reload();
        }
    }
});

document.getElementById('btn-reset-app').addEventListener('click', function () {
    if (confirm('⚠️ Reset completo dell\'app? Tutti i dati saranno persi.')) {
        if (confirm('Ultima conferma: procedere?')) {
            localStorage.clear();
            location.reload();
        }
    }
});

document.getElementById('btn-enable-notif').addEventListener('click', function () {
    if (!('Notification' in window)) {
        alert('❌ Il tuo browser non supporta le notifiche.');
        return;
    }
    Notification.requestPermission().then(function (permission) {
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
    renderOggi();
    renderGTD();
    renderEisenhower();
    renderTimeblocks();
    renderOKR();
    render12W();
    renderHabits();
    renderRecurring();
    renderCatSelects();
}

// ============ INIT ============
carica();
document.documentElement.setAttribute('data-theme', stato.theme);
document.getElementById('btn-theme').textContent = stato.theme === 'dark' ? '🌙' : '☀️';
init12Week();
generaRecurringOggi();
renderAll();

// Avvio autenticazione
checkSession();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () { });
}