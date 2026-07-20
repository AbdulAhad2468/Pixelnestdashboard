# Sprint Board - 4-Column Kanban Board

A responsive 4-column Kanban sprint board built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **4 Columns**: To Do, In Progress, Review, Done
- **Drag and Drop**: Move tasks between columns using drag and drop
- **Responsive Design**: Works on mobile (1 column), tablet (2 columns), and desktop (4 columns)
- **Priority Levels**: Tasks have priority indicators (high, medium, low)
- **Modern UI**: Glassmorphism design with gradient background

## Installation

Due to PowerShell execution policy restrictions, you'll need to install dependencies manually:

1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Then run: `npm install`

Or use Command Prompt instead of PowerShell:
```cmd
npm install
```

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hooks** - State management

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── components/
    └── KanbanBoard.tsx
```
