// ================================================================
// PRODUCTIVITY DASHBOARD — script.js
// ================================================================


// ================================================================
// DATE · TIME · GREETING · DYNAMIC BACKGROUND
// ================================================================

const greetingEl  = document.getElementById("greeting");
const dateEl      = document.getElementById("current-date");
const timeEl      = document.getElementById("current-time");

function updateDateTime() {
  const now  = new Date();
  const hour = now.getHours();

  // "Sunday, July 6, 2026"
  const dateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  dateEl.textContent = now.toLocaleDateString("en-US", dateOptions);

  // HH:MM:SS with leading zeros
  const hh = String(hour).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  timeEl.textContent = `${hh}:${mm}:${ss}`;

  // greeting message based on the current hour
  if (hour >= 5 && hour < 12) {
    greetingEl.textContent = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    greetingEl.textContent = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    greetingEl.textContent = "Good Evening";
  } else {
    greetingEl.textContent = "Good Night";
  }

  // CSS reads data-bg on <body> to apply a matching gradient tint
  if (hour >= 5 && hour < 12) {
    document.body.dataset.bg = "morning";
  } else if (hour >= 12 && hour < 18) {
    document.body.dataset.bg = "afternoon";
  } else if (hour >= 18 && hour < 22) {
    document.body.dataset.bg = "evening";
  } else {
    document.body.dataset.bg = "night";
  }
}

// call once immediately so the page isn't blank for the first second
updateDateTime();
setInterval(updateDateTime, 1000);


// ================================================================
// THEME TOGGLE
// ================================================================

const themeBtn = document.querySelector(".theme-toggle");

// apply the saved theme BEFORE the rest of the page renders
// so there is no flash of the wrong theme on load
const savedTheme = localStorage.getItem("pd-theme");
if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (savedTheme === "light") {
    themeBtn.querySelector("i").classList.replace("ri-moon-line", "ri-sun-line");
  }
}

themeBtn.addEventListener("click", function () {
  const html = document.documentElement;
  const icon = themeBtn.querySelector("i");

  // classList lets us toggle both the attribute and the icon in one click
  if (html.getAttribute("data-theme") === "light") {
    html.setAttribute("data-theme", "dark");
    icon.classList.replace("ri-sun-line", "ri-moon-line");
    localStorage.setItem("pd-theme", "dark");
  } else {
    html.setAttribute("data-theme", "light");
    icon.classList.replace("ri-moon-line", "ri-sun-line");
    localStorage.setItem("pd-theme", "light");
  }
});


// ================================================================
// DASHBOARD NAVIGATION
// ================================================================

// flag so we only auto-fetch a quote on the first open
let motivationLoaded = false;

const activeViewKey = "pd-active-view";
const dashboardSection = document.getElementById("dashboard");
const featureViews = document.querySelectorAll(".feature-view");
const featureGrid = document.querySelector(".feature-grid");

function setActiveView(viewName, persist = true) {
  const normalizedView = viewName || "dashboard";
  const targetView = document.getElementById(normalizedView);

  if (!targetView) return;

  dashboardSection.classList.toggle("hidden", normalizedView !== "dashboard");
  featureViews.forEach(function (view) {
    view.classList.toggle("hidden", view.id !== normalizedView);
  });

  if (persist) {
    localStorage.setItem(activeViewKey, normalizedView);
  }

  if (normalizedView === "planner") {
    highlightCurrentSlot();
  }

  if (normalizedView === "motivation" && !motivationLoaded) {
    motivationLoaded = true;
    fetchQuote();
  }
}

function restoreActiveView() {
  const savedView = localStorage.getItem(activeViewKey);
  if (savedView && document.getElementById(savedView)) {
    setActiveView(savedView, true);
  } else {
    setActiveView("dashboard", false);
  }
}

// event delegation — one listener for all 6 feature cards
featureGrid.addEventListener("click", function (e) {
  const card = e.target.closest(".feature-card");
  if (!card) return;

  setActiveView(card.dataset.feature);
});

// every back button hides the current feature and returns to the dashboard
const backButtons = document.querySelectorAll(".back-btn");

backButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    setActiveView("dashboard");
  });
});

restoreActiveView();


// ================================================================
// TODO LIST
// ================================================================

// each task: { id: number, text: string, completed: bool, important: bool }
let tasks = [];

const todoForm   = document.getElementById("todo-form");
const todoInput  = document.getElementById("todo-input");
const todoList   = document.getElementById("todo-list");
let activeFilter = "all";

todoForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const text = todoInput.value.trim();
  if (text === "") return;

  // build a new task object and push it to the array
  tasks.push({
    id:        Date.now(),
    text:      text,
    completed: false,
    important: false
  });

  todoInput.value = "";
  saveTasks();
  renderTodos();
  updateTodoBadge();
});

// ---- event delegation ----
// instead of putting listeners on every task button,
// we put ONE listener on the whole list container
todoList.addEventListener("click", function (e) {
  const item = e.target.closest(".todo-item");
  if (!item) return;

  const id = Number(item.dataset.id);

  if (e.target.closest(".todo-checkbox"))   toggleTaskDone(id);
  if (e.target.closest(".todo-star-btn"))   toggleTaskStar(id);
  if (e.target.closest(".todo-delete-btn")) deleteTask(id);
});

function toggleTaskDone(id) {
  // map returns a new array — we never mutate the old one
  tasks = tasks.map(function (t) {
    return t.id === id ? { ...t, completed: !t.completed } : t;
  });
  saveTasks();
  renderTodos();
  updateTodoBadge();
}

function toggleTaskStar(id) {
  tasks = tasks.map(function (t) {
    return t.id === id ? { ...t, important: !t.important } : t;
  });
  saveTasks();
  renderTodos();
}

function deleteTask(id) {
  // filter returns a new array without the deleted task
  tasks = tasks.filter(function (t) { return t.id !== id; });
  saveTasks();
  renderTodos();
  updateTodoBadge();
}

function renderTodos() {
  // decide which subset of tasks to show
  let visible = tasks;
  if (activeFilter === "active")    visible = tasks.filter(function (t) { return !t.completed; });
  if (activeFilter === "completed") visible = tasks.filter(function (t) { return t.completed; });
  if (activeFilter === "important") visible = tasks.filter(function (t) { return t.important; });

  todoList.innerHTML = "";

  if (visible.length === 0) {
    todoList.innerHTML = `
      <li class="empty-state">
        <i class="ri-inbox-line"></i>
        <p>Nothing here. Add a task above!</p>
      </li>`;
    return;
  }

  visible.forEach(function (task) {
    const li = document.createElement("li");
    li.classList.add("todo-item");

    // data-id is what event delegation uses to identify which task was clicked
    li.dataset.id = task.id;
    if (task.completed) li.classList.add("completed");
    if (task.important) li.classList.add("important");

    li.innerHTML = `
      <button class="todo-checkbox" type="button">
        ${task.completed ? '<i class="ri-check-line"></i>' : ""}
      </button>
      <span class="todo-text">${task.text}</span>
      <div class="todo-actions">
        <button class="todo-btn todo-star-btn ${task.important ? "starred" : ""}" type="button">
          <i class="${task.important ? "ri-star-fill" : "ri-star-line"}"></i>
        </button>
        <button class="todo-btn todo-delete-btn" type="button">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>`;

    todoList.appendChild(li);
  });
}

// ---- filter tabs ----
const filterTabs = document.querySelectorAll(".filter-tab");

filterTabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    filterTabs.forEach(function (t) { t.classList.remove("active"); });
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    renderTodos();
  });
});

function saveTasks() {
  localStorage.setItem("pd-tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem("pd-tasks");
  if (!saved) return;
  tasks = JSON.parse(saved);
  renderTodos();
  updateTodoBadge();
}

function updateTodoBadge() {
  const badge = document.getElementById("todo-badge");
  badge.textContent = tasks.length === 1 ? "1 task" : `${tasks.length} tasks`;
}

loadTasks();


// ================================================================
// DAILY PLANNER
// ================================================================

const plannerGrid = document.getElementById("planner-grid");

// save a slot's value the moment the user types (event delegation on the grid)
plannerGrid.addEventListener("input", function (e) {
  if (!e.target.classList.contains("planner-input")) return;

  const slot = e.target.closest(".planner-slot");
  const hour = slot.dataset.hour;
  const val  = e.target.value;

  if (val.trim() === "") {
    localStorage.removeItem(`pd-slot-${hour}`);
  } else {
    localStorage.setItem(`pd-slot-${hour}`, val);
  }
});

function loadPlannerData() {
  // go through every slot in the HTML and fill it from storage
  document.querySelectorAll(".planner-slot").forEach(function (slot) {
    const saved = localStorage.getItem(`pd-slot-${slot.dataset.hour}`);
    if (saved) {
      slot.querySelector(".planner-input").value = saved;
    }
  });
}

function highlightCurrentSlot() {
  const hour = new Date().getHours();

  // remove stale highlights first
  document.querySelectorAll(".planner-slot.current-hour").forEach(function (s) {
    s.classList.remove("current-hour");
  });

  // our planner covers 6 AM (hour 6) → 11 PM (hour 23)
  if (hour >= 6 && hour <= 23) {
    const activeSlot = document.querySelector(`.planner-slot[data-hour="${hour}"]`);
    if (activeSlot) {
      activeSlot.classList.add("current-hour");
      // scroll it gently into view so the user sees today's slot first
      activeSlot.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
}

loadPlannerData();


// ================================================================
// MOTIVATION QUOTE
// ================================================================

const quoteTextEl   = document.getElementById("quote-text");
const quoteAuthorEl = document.getElementById("quote-author");
const newQuoteBtn   = document.getElementById("new-quote-btn");

// dummyjson.com is free, requires no API key, and is CORS-friendly
async function fetchQuote() {
  // show a loading state so the card doesn't look broken while we wait
  quoteTextEl.innerHTML = "<p>Fetching a quote…</p>";
  quoteAuthorEl.textContent = "";
  newQuoteBtn.disabled = true;

  try {
    const response = await fetch("https://dummyjson.com/quotes/random");
    const data     = await response.json();

    quoteTextEl.innerHTML       = `<p>${data.quote}</p>`;
    quoteAuthorEl.textContent   = `— ${data.author}`;
  } catch (err) {
    // show a friendly message if the network call fails
    quoteTextEl.innerHTML     = "<p>Could not load a quote. Check your connection and try again.</p>";
    quoteAuthorEl.textContent = "";
    console.error("Quote API error:", err);
  } finally {
    // always re-enable the button, success or failure
    newQuoteBtn.disabled = false;
  }
}

newQuoteBtn.addEventListener("click", fetchQuote);


// ================================================================
// POMODORO TIMER
// ================================================================

let timerInterval = null;    // null = not running; otherwise holds the setInterval id
let timeLeft      = 25 * 60; // seconds remaining in the current session
let totalTime     = 25 * 60; // total seconds for the active mode
let isRunning     = false;

const timerDisplay  = document.getElementById("timer-display");
const sessionLabel  = document.getElementById("session-label");
const startBtn      = document.getElementById("start-btn");
const pauseBtn      = document.getElementById("pause-btn");
const resetBtn      = document.getElementById("reset-btn");
const ringFill      = document.getElementById("timer-ring-fill");

// circumference of the SVG ring: 2 × π × r = 2 × 3.14159 × 54 ≈ 339.3
const RING_CIRC = 339.3;

// turn a raw number of seconds into a "MM:SS" string
function formatTime(totalSecs) {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timeLeft);

  // stroke-dashoffset drains the SVG ring as time runs out
  // when timeLeft = totalTime → offset = 0 (full ring)
  // when timeLeft = 0         → offset = RING_CIRC (empty ring)
  const elapsed = 1 - timeLeft / totalTime;
  ringFill.style.strokeDashoffset = elapsed * RING_CIRC;
}

// called every second while the timer is running
function tick() {
  timeLeft--;
  updateTimerDisplay();

  if (timeLeft <= 0) {
    // stop the interval so it doesn't keep firing
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning     = false;

    startBtn.disabled = false;
    pauseBtn.disabled = true;

    alert("Session complete! Time for a break.");
    resetTimer();
  }
}

startBtn.addEventListener("click", function () {
  // guard: never start a second interval if one is already running
  if (isRunning) return;

  isRunning         = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;

  timerInterval = setInterval(tick, 1000);
});

pauseBtn.addEventListener("click", function () {
  if (!isRunning) return;

  clearInterval(timerInterval);
  timerInterval = null;
  isRunning     = false;

  startBtn.disabled = false;
  pauseBtn.disabled = true;
});

function resetTimer() {
  // always clear the interval first to avoid two timers running at once
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning     = false;
  timeLeft      = totalTime;

  startBtn.disabled = false;
  pauseBtn.disabled = true;

  updateTimerDisplay();
}

resetBtn.addEventListener("click", resetTimer);

// mode buttons switch between Work · Long Break · Short Break
const modeButtons = document.querySelectorAll(".mode-btn");

modeButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    modeButtons.forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");

    const minutes = Number(btn.dataset.minutes);

    if (minutes === 25) {
      sessionLabel.textContent = "Work Session";
    } else if (minutes === 15) {
      sessionLabel.textContent = "Long Break";
    } else {
      sessionLabel.textContent = "Short Break";
    }

    // update totalTime and reset so the display reflects the new mode
    totalTime = minutes * 60;
    timeLeft  = totalTime;
    resetTimer();
  });
});

// show the initial 25:00 state as soon as the page loads
updateTimerDisplay();


// ================================================================
// WEATHER WIDGET
// ================================================================

// Using Open-Meteo (https://open-meteo.com) — free, no API key needed.
// Step 1: Geocoding API converts a city name into lat/lon.
// Step 2: Forecast API fetches current conditions for those coordinates.

const weatherForm   = document.getElementById("weather-form");
const cityInput     = document.getElementById("city-input");
const geoBtn        = document.getElementById("geo-btn");
const weatherDisplay = document.getElementById("weather-display");

weatherForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city === "") return;
  searchByCity(city);
});

// "My Location" button uses the browser's built-in Geolocation API
geoBtn.addEventListener("click", function () {
  if (!navigator.geolocation) {
    showWeatherError("Geolocation is not supported by your browser.");
    return;
  }

  showWeatherLoading();

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      // success: hand the coordinates straight to the weather fetcher
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, "Your Location");
    },
    function () {
      showWeatherError("Location access was denied. Try searching by city name.");
    }
  );
});

async function searchByCity(cityName) {
  showWeatherLoading();

  try {
    // step 1 — turn the city name into lat/lon
    const geoUrl  = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const geoRes  = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      showWeatherError(`No results found for "${cityName}". Try a different spelling.`);
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // step 2 — fetch the actual weather using those coordinates
    await fetchWeatherByCoords(latitude, longitude, `${name}, ${country}`);

  } catch (err) {
    showWeatherError("Could not load weather. Check your connection and try again.");
    console.error("Geocoding error:", err);
  }
}

async function fetchWeatherByCoords(lat, lon, locationLabel) {
  try {
    const url = [
      `https://api.open-meteo.com/v1/forecast`,
      `?latitude=${lat}&longitude=${lon}`,
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code`,
      `&wind_speed_unit=kmh&timezone=auto`
    ].join("");

    const res  = await fetch(url);
    const data = await res.json();
    const c    = data.current;

    displayWeather({
      location:    locationLabel,
      temp:        Math.round(c.temperature_2m),
      feelsLike:   Math.round(c.apparent_temperature),
      humidity:    c.relative_humidity_2m,
      windSpeed:   Math.round(c.wind_speed_10m),
      weatherCode: c.weather_code
    });

  } catch (err) {
    showWeatherError("Weather data could not be loaded. Please try again.");
    console.error("Weather fetch error:", err);
  }
}

function displayWeather(d) {
  const icon = getWeatherIcon(d.weatherCode);
  const desc = getWeatherDescription(d.weatherCode);

  weatherDisplay.innerHTML = `
    <article class="card weather-main">
      <p class="weather-location">
        <i class="ri-map-pin-2-line"></i> ${d.location}
      </p>
      <p class="weather-condition-desc">${desc}</p>
      <div class="weather-mid">
        <h2 class="weather-temp">${d.temp}°C</h2>
        <i class="${icon} weather-icon-large"></i>
      </div>
      <div class="weather-details">
        <div class="weather-detail">
          <i class="ri-drop-line"></i>
          <span>${d.humidity}%</span>
          <small>Humidity</small>
        </div>
        <div class="weather-detail">
          <i class="ri-wind-line"></i>
          <span>${d.windSpeed} km/h</span>
          <small>Wind</small>
        </div>
        <div class="weather-detail">
          <i class="ri-temp-hot-line"></i>
          <span>${d.feelsLike}°C</span>
          <small>Feels Like</small>
        </div>
      </div>
    </article>`;
}

function showWeatherLoading() {
  weatherDisplay.innerHTML = `
    <article class="card weather-placeholder">
      <i class="ri-loader-4-line"></i>
      <p>Loading weather data…</p>
    </article>`;
}

function showWeatherError(msg) {
  weatherDisplay.innerHTML = `
    <article class="card weather-placeholder">
      <i class="ri-error-warning-line"></i>
      <p>${msg}</p>
    </article>`;
}

// Open-Meteo weather codes → Remix Icon class names
function getWeatherIcon(code) {
  if (code === 0 || code === 1)                                    return "ri-sun-line";
  if (code === 2)                                                  return "ri-sun-cloudy-line";
  if (code === 3)                                                  return "ri-cloudy-line";
  if (code === 45 || code === 48)                                  return "ri-mist-line";
  if (code >= 51 && code <= 57)                                    return "ri-drizzle-line";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))   return "ri-rainy-line";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))   return "ri-snowy-line";
  if (code >= 95)                                                  return "ri-flashlight-line";
  return "ri-cloudy-line";
}

// Open-Meteo weather codes → human-readable description
function getWeatherDescription(code) {
  if (code === 0)                 return "Clear Sky";
  if (code === 1)                 return "Mostly Clear";
  if (code === 2)                 return "Partly Cloudy";
  if (code === 3)                 return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 55)   return "Drizzle";
  if (code === 56 || code === 57) return "Freezing Drizzle";
  if (code >= 61 && code <= 65)   return "Rain";
  if (code === 66 || code === 67) return "Freezing Rain";
  if (code >= 71 && code <= 77)   return "Snowfall";
  if (code >= 80 && code <= 82)   return "Rain Showers";
  if (code >= 85 && code <= 86)   return "Snow Showers";
  if (code === 95)                return "Thunderstorm";
  if (code === 96 || code === 99) return "Thunderstorm with Hail";
  return "Unknown Condition";
}


// ================================================================
// DAILY GOALS
// ================================================================

// each goal: { id: number, text: string, completed: bool }
let goals = [];

const goalsForm  = document.getElementById("goals-form");
const goalInput  = document.getElementById("goal-input");
const goalsList  = document.getElementById("goals-list");

goalsForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const text = goalInput.value.trim();
  if (text === "") return;

  goals.push({
    id:        Date.now(),
    text:      text,
    completed: false
  });

  goalInput.value = "";
  saveGoals();
  renderGoals();
  updateGoalsProgress();
  updateGoalsBadge();
});

// event delegation — one listener for complete + delete on every goal row
goalsList.addEventListener("click", function (e) {
  const item = e.target.closest(".goal-item");
  if (!item) return;

  const id = Number(item.dataset.id);

  if (e.target.closest(".goal-checkbox"))    toggleGoalDone(id);
  if (e.target.closest(".goal-delete-btn"))  deleteGoal(id);
});

function toggleGoalDone(id) {
  goals = goals.map(function (g) {
    return g.id === id ? { ...g, completed: !g.completed } : g;
  });
  saveGoals();
  renderGoals();
  updateGoalsProgress();
  updateGoalsBadge();
}

function deleteGoal(id) {
  goals = goals.filter(function (g) { return g.id !== id; });
  saveGoals();
  renderGoals();
  updateGoalsProgress();
  updateGoalsBadge();
}

function renderGoals() {
  goalsList.innerHTML = "";

  if (goals.length === 0) {
    goalsList.innerHTML = `
      <li class="empty-state">
        <i class="ri-focus-3-line"></i>
        <p>No goals yet. Add one above to get started!</p>
      </li>`;
    return;
  }

  goals.forEach(function (goal) {
    const li = document.createElement("li");
    li.classList.add("goal-item");
    li.dataset.id = goal.id;

    if (goal.completed) li.classList.add("completed");

    li.innerHTML = `
      <button class="goal-checkbox" type="button">
        ${goal.completed ? '<i class="ri-check-line"></i>' : ""}
      </button>
      <span class="goal-text">${goal.text}</span>
      <button class="goal-delete-btn" type="button">
        <i class="ri-delete-bin-line"></i>
      </button>`;

    goalsList.appendChild(li);
  });
}

function updateGoalsProgress() {
  const done  = goals.filter(function (g) { return g.completed; }).length;
  const total = goals.length;

  // update the "X of Y completed" text
  document.getElementById("goals-progress").textContent = `${done} of ${total} completed`;

  // widen the progress bar to match the completion percentage
  const pct = total === 0 ? 0 : (done / total) * 100;
  document.getElementById("goals-bar").style.width = `${pct}%`;
}

function saveGoals() {
  localStorage.setItem("pd-goals", JSON.stringify(goals));
}

function loadGoals() {
  const saved = localStorage.getItem("pd-goals");
  if (!saved) return;
  goals = JSON.parse(saved);
  renderGoals();
  updateGoalsProgress();
  updateGoalsBadge();
}

function updateGoalsBadge() {
  const badge = document.getElementById("goals-badge");
  badge.textContent = goals.length === 1 ? "1 goal" : `${goals.length} goals`;
}

loadGoals();
