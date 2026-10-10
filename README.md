# Smart Campus — Student Task Manager

A responsive student dashboard for organizing coursework, tracking due dates, and keeping small tasks visible. This first version runs entirely in the browser: it has no backend, account, or database.

## Features

- Create tasks with a title, course, priority, and due date.
- Mark tasks complete or delete them.
- Search task titles and course names, and filter by status or due date.
- View task totals, due-today work, and completed tasks at a glance.
- Switch between light and dark appearance.
- Use a responsive layout on desktop and mobile, with keyboard-accessible controls.
- Keep tasks and the chosen theme in browser `localStorage` between visits.
- See helpful empty states and validation when a task name is missing.

## Technologies

- HTML5 for the page structure and accessible form controls.
- CSS3 for the visual design, responsive layout, and dark theme.
- Vanilla JavaScript for task actions, filtering, validation, and rendering.
- `localStorage` for saving data in the user's browser.

There is no server or database in this version. Tasks are saved only in the current browser's local storage for this site. They are not synced between devices or browser profiles, and clearing the browser's site data can remove them.

## Run the project

1. Open `index.html` in a modern browser. No build step or package installation is needed.
2. Select **Add a task**, enter a task name, and save it.
3. Try completing a task, searching, changing the filter, and switching appearance. Refresh the page to check that saved tasks remain.

You can also serve this folder with any local static-file server if you prefer testing on a local web address. The project does not require a particular editor extension or server.

## Project files

```text
smart-campus/
├── index.html   # Page structure, dashboard content, and task form
├── style.css    # Colors, layout, responsive rules, and dark appearance
├── script.js    # Task behavior, rendering, filters, and localStorage
├── README.md    # Project guide and run instructions
└── .gitignore   # Common operating-system generated files to ignore
```

## How the files work together

The browser starts with `index.html`. Its stylesheet link loads `style.css`, which controls how the content looks at different screen sizes. Its deferred script link loads `script.js` after the HTML has been parsed; JavaScript listens for form, filter, and button actions, then updates the page and saves task data in `localStorage`.