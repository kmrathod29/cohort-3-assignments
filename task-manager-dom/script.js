// ADD TASK FEATURE
const taskForm = document.querySelector(".task-form");

taskForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const titleInput = document.getElementById("task-title");
  const categorySelect = document.getElementById("task-category");

  const titleValue = titleInput.value.trim();
  const categoryValue = categorySelect.value;

  if (titleValue === "") {
    alert("Please type a task title first.");
    return;
  }

  const newId = Date.now();

  createTaskCard(titleValue, categoryValue, "pending", newId);

  titleInput.value = "";

  saveTasksToStorage();
  updateCounters();
});

function createTaskCard(title, category, status, id) {
  const taskList = document.getElementById("task-list");

  const emptyState = taskList.querySelector(".empty-state");
  if (emptyState) {
    emptyState.remove();
  }

  const card = document.createElement("article");
  card.classList.add("card", "task-card");

  card.setAttribute("data-id", id);
  card.setAttribute("data-status", status);
  card.setAttribute("data-category", category);

  if (status === "completed") {
    card.classList.add("completed");
  }

  const topRow = document.createElement("div");
  topRow.classList.add("task-card-top");

  const titleEl = document.createElement("h3");
  titleEl.classList.add("task-title-text");
  const titleText = document.createTextNode(title);
  titleEl.appendChild(titleText);

  const categoryBadge = document.createElement("span");
  categoryBadge.classList.add("badge", "badge-muted");
  categoryBadge.append(category);

  topRow.append(titleEl, categoryBadge);

  const actionsRow = document.createElement("div");
  actionsRow.classList.add("task-actions");

  const completeBtn = document.createElement("button");
  completeBtn.type = "button";
  completeBtn.classList.add("task-btn", "complete-btn");
  completeBtn.innerHTML = '<i class="ri-check-line"></i>';

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.classList.add("task-btn", "edit-btn");
  editBtn.innerHTML = '<i class="ri-edit-line"></i>';

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.classList.add("task-btn", "delete-btn");
  deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';

  actionsRow.append(completeBtn, editBtn, deleteBtn);

  card.append(topRow, actionsRow);
  taskList.appendChild(card);
}

function updateCounters() {
  const allTasks = document.querySelectorAll(".task-card");
  const completedTasks = document.querySelectorAll('.task-card[data-status="completed"]');

  const total = allTasks.length;
  const completed = completedTasks.length;
  const pending = total - completed;

  document.getElementById("total-tasks").textContent = total;
  document.getElementById("completed-tasks").textContent = completed;
  document.getElementById("pending-tasks").textContent = pending;
}


const taskListContainer = document.getElementById("task-list");

taskListContainer.addEventListener("click", function (e) {
  // find the task card that was clicked inside
  const clickedCard = e.target.closest(".task-card");
  if (!clickedCard) {
    return;
  }

  if (e.target.closest(".complete-btn")) {
    toggleComplete(clickedCard);
  }

  if (e.target.closest(".delete-btn")) {
    deleteTask(clickedCard);
  }

  if (e.target.closest(".edit-btn")) {
    editTask(clickedCard);
  }
});

function toggleComplete(card) {
  const currentStatus = card.getAttribute("data-status");

  if (currentStatus === "completed") {
    card.setAttribute("data-status", "pending");
    card.classList.remove("completed");
  } else {
    card.setAttribute("data-status", "completed");
    card.classList.add("completed");
  }

  saveTasksToStorage();
  updateCounters();
}

function deleteTask(card) {
  if (card.hasAttribute("data-id")) {
    console.log("Deleting task with id:", card.getAttribute("data-id"));
  }

  card.removeAttribute("data-status");

  card.remove();

  saveTasksToStorage();
  updateCounters();
  showEmptyStateIfNeeded();
}

function editTask(card) {
  const titleEl = card.querySelector(".task-title-text");

  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.classList.add("input", "edit-input");
  editInput.value = titleEl.textContent;

  titleEl.replaceWith(editInput);
  editInput.focus();

  let alreadyFinished = false;

  function finishEditing() {
    if (alreadyFinished) {
      return;
    }
    alreadyFinished = true;

    const newTitleEl = document.createElement("h3");
    newTitleEl.classList.add("task-title-text");
    newTitleEl.appendChild(document.createTextNode(editInput.value.trim() || "Untitled Task"));

    editInput.replaceWith(newTitleEl);

    saveTasksToStorage();
  }

  editInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      finishEditing();
    }
  });

  editInput.addEventListener("blur", finishEditing);
}

function showEmptyStateIfNeeded() {
  const taskList = document.getElementById("task-list");
  const remainingTasks = taskList.querySelectorAll(".task-card");

  if (remainingTasks.length === 0) {
    const emptyCard = document.createElement("article");
    emptyCard.classList.add("card", "empty-state");

    const icon = document.createElement("i");
    icon.classList.add("ri-inbox-line", "empty-icon");

    const message = document.createElement("p");
    message.appendChild(document.createTextNode("No tasks available."));

    emptyCard.append(icon, message);
    taskList.appendChild(emptyCard);
  }
}


const searchInput = document.getElementById("task-search");
const categoryFilter = document.getElementById("category-filter");

searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);

function applyFilters() {
  const searchValue = searchInput.value.toLowerCase();
  const categoryValue = categoryFilter.value;

  const allTasks = document.querySelectorAll(".task-card");

  allTasks.forEach(function (task) {
    const titleText = task.querySelector(".task-title-text").textContent.toLowerCase();
    const taskCategory = task.dataset.category;

    const matchesSearch = titleText.includes(searchValue);
    const matchesCategory = categoryValue === "all" || taskCategory === categoryValue;

    if (matchesSearch && matchesCategory) {
      task.style.display = "";
    } else {
      task.style.display = "none";
    }
  });
}

const clearAllBtn = document.getElementById("clear-all");

clearAllBtn.addEventListener("click", function () {
  const sure = confirm("Are you sure you want to delete all tasks?");

  if (sure) {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    saveTasksToStorage();
    updateCounters();
    showEmptyStateIfNeeded();
  }
});

function saveTasksToStorage() {
  const allTasks = document.querySelectorAll(".task-card");
  const taskArray = [];

  allTasks.forEach(function (task) {
    taskArray.push({
      id: task.dataset.id,
      title: task.querySelector(".task-title-text").textContent,
      category: task.dataset.category,
      status: task.dataset.status,
    });
  });

  localStorage.setItem("domExplorerTasks", JSON.stringify(taskArray));
}

function loadTasksFromStorage() {
  const savedTasks = localStorage.getItem("domExplorerTasks");

  if (!savedTasks) {
    return;
  }

  const taskArray = JSON.parse(savedTasks);

  taskArray.forEach(function (taskData) {
    createTaskCard(taskData.title, taskData.category, taskData.status, taskData.id);
  });

  updateCounters();
}

loadTasksFromStorage();

const themeToggleBtn = document.querySelector(".theme-toggle");

themeToggleBtn.addEventListener("click", function () {
  const html = document.documentElement;

  if (html.dataset.theme === "light") {
    html.dataset.theme = "dark";
  } else {
    html.dataset.theme = "light";
  }

  const icon = themeToggleBtn.querySelector("i");
  icon.classList.toggle("ri-moon-line");
  icon.classList.toggle("ri-sun-line");

  localStorage.setItem("domExplorerTheme", html.dataset.theme);
});

const savedTheme = localStorage.getItem("domExplorerTheme");
if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
}


// EVENT PROPAGATION DEMO (Bubbling + Capturing)

const grandparentBox = document.querySelector(".prop-grandparent");
const parentBox = document.querySelector(".prop-parent");
const childButton = document.querySelector(".prop-child");

// BUBBLING (default): event starts at the target and goes UP
// expected console order -> Child, Parent, Grandparent
childButton.addEventListener("click", function () {
  console.log("BUBBLING -> Child");
});

parentBox.addEventListener("click", function () {
  console.log("BUBBLING -> Parent");
});

grandparentBox.addEventListener("click", function () {
  console.log("BUBBLING -> Grandparent");
});

// CAPTURING: event starts at the top and goes DOWN to the target
// the "true" at the end is what turns capturing on
// expected console order -> Grandparent, Parent, Child
grandparentBox.addEventListener(
  "click",
  function () {
    console.log("CAPTURING -> Grandparent");
  },
  true
);

parentBox.addEventListener(
  "click",
  function () {
    console.log("CAPTURING -> Parent");
  },
  true
);

childButton.addEventListener(
  "click",
  function () {
    console.log("CAPTURING -> Child");
  },
  true
);


// ATTRIBUTES VS PROPERTIES DEMO
// type something in the "Task Title" field above and watch the console

const demoInput = document.getElementById("task-title");

demoInput.addEventListener("input", function () {
  // input.value = the PROPERTY = the live value as the user types
  const propertyValue = demoInput.value;

  // getAttribute("value") = the ATTRIBUTE = the value written in the HTML
  // this input has no value="..." in the HTML, so this stays null
  const attributeValue = demoInput.getAttribute("value");

  console.log("PROPERTY (input.value):", propertyValue);
  console.log("ATTRIBUTE (getAttribute):", attributeValue);
});