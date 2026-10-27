// GPT 6 Luna użyta do refaktoryzacji kodu na mniejsze metody i poprawy nazewnictwa
class Todo {
    constructor() {
        this.list = document.querySelector("#task-list");
        this.form = document.querySelector("#add-task-form");
        this.textInput = document.querySelector("#new-task-text");
        this.dateInput = document.querySelector("#new-task-date");
        this.searchInput = document.querySelector("#search-input");

        this.tasks = this.loadTasks();
        this.term = "";

        this.bindEvents();
        this.draw();
    }

    loadTasks() {
        const savedTasks = localStorage.getItem("todo-tasks");

        return savedTasks
            ? JSON.parse(savedTasks)
            : [
                { id: 1, text: "Przeczytać instrukcję", due: "", done: false }
            ];
    }

    save() {
        localStorage.setItem("todo-tasks", JSON.stringify(this.tasks));
    }

    bindEvents() {
        this.form.addEventListener("submit", event => {
            event.preventDefault();

            if (this.add(this.textInput.value, this.dateInput.value)) {
                this.form.reset();
            }
        });

        this.searchInput.addEventListener("input", () => {
            const term = this.searchInput.value.trim();
            this.term = term.length >= 2 ? term : "";
            this.draw();
        });
    }

    getFilteredTasks() {
        return this.tasks.filter(task =>
            task.text.toLowerCase().includes(this.term.toLowerCase())
        );
    }

    draw() {
        this.list.replaceChildren();

        for (const task of this.getFilteredTasks()) {
            this.list.append(this.createTaskElement(task));
        }
    }

    createTaskElement(task) {
        const item = document.createElement("li");
        item.dataset.id = task.id;

        const checkbox = this.createCheckbox(task);
        const info = this.createTaskInfo(task);
        const removeButton = this.createDeleteButton(task);

        item.addEventListener("click", event => {
            if (event.target.closest(".delete-task, .task-done, input")) {
                return;
            }

            this.edit(task.id);
        });

        item.append(checkbox, info, removeButton);
        return item;
    }

    createCheckbox(task) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-done";
        checkbox.checked = task.done;
        checkbox.setAttribute("aria-label", "Oznacz jako wykonane");

        checkbox.addEventListener("change", () => {
            task.done = checkbox.checked;
            this.save();
        });

        return checkbox;
    }

    createTaskInfo(task) {
        const info = document.createElement("div");
        info.className = "task-info";

        info.append(this.createTaskText(task));

        if (task.due) {
            const date = document.createElement("time");
            date.dateTime = task.due;
            date.textContent = new Date(task.due).toLocaleString("pl-PL", {
                dateStyle: "medium",
                timeStyle: "short"
            });

            info.append(date);
        }

        return info;
    }

    createTaskText(task) {
        const text = document.createElement("span");
        text.className = "task-text";

        const start = task.text.toLowerCase().indexOf(this.term.toLowerCase());

        if (!this.term || start === -1) {
            text.textContent = task.text;
            return text;
        }

        const before = task.text.slice(0, start);
        const match = task.text.slice(start, start + this.term.length);
        const after = task.text.slice(start + this.term.length);

        const mark = document.createElement("mark");
        mark.textContent = match;

        text.append(before, mark, after);
        return text;
    }

    createDeleteButton(task) {
        const button = document.createElement("button");
        button.className = "delete-task";
        button.type = "button";
        button.textContent = "×";
        button.setAttribute("aria-label", "Usuń zadanie");

        button.addEventListener("click", () => {
            this.remove(task.id);
        });

        return button;
    }

    isValidTask(text, due) {
        if (text.length < 3 || text.length > 255) {
            alert("Treść zadania musi mieć od 3 do 255 znaków.");
            return false;
        }

        if (due && new Date(due) <= new Date()) {
            alert("Termin musi być w przyszłości.");
            return false;
        }

        return true;
    }

    add(text, due) {
        const cleanText = text.trim();

        if (!this.isValidTask(cleanText, due)) {
            return false;
        }

        this.tasks.push({
            id: Date.now(),
            text: cleanText,
            due,
            done: false
        });

        this.save();
        this.draw();
        return true;
    }

    edit(id) {
        const task = this.tasks.find(task => task.id === id);

        const item = Array.from(this.list.children).find(
            item => Number(item.dataset.id) === id
        );

        if (!task || !item || item.classList.contains("editing")) {
            return;
        }

        item.classList.add("editing");

        const info = item.querySelector(".task-info");

        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "edit-text";
        textInput.value = task.text;

        const dateInput = document.createElement("input");
        dateInput.type = "datetime-local";
        dateInput.className = "edit-date";
        dateInput.value = task.due;

        info.replaceChildren(textInput, dateInput);

        const saveOnOutsideClick = event => {
            if (item.contains(event.target)) {
                return;
            }

            if (!this.tasks.some(currentTask => currentTask.id === id)) {
                document.removeEventListener("click", saveOnOutsideClick, true);
                return;
            }

            const newText = textInput.value.trim();
            const newDue = dateInput.value;

            if (!this.isValidTask(newText, newDue)) {
                if (newText.length < 3 || newText.length > 255) {
                    textInput.focus();
                } else {
                    dateInput.focus();
                }
                return;
            }

            document.removeEventListener("click", saveOnOutsideClick, true);

            task.text = newText;
            task.due = newDue;

            this.save();
            this.draw();
        };

        setTimeout(() => {
            document.addEventListener("click", saveOnOutsideClick, true);
        }, 0);
    }

    remove(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.save();
        this.draw();
    }
}

document.todo = new Todo();