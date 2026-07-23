import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function initializeUsers() {
  const USERS_FILE = path.join(DATA_DIR, "users.json");
  
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      {
        id: "1784658184837",
        email: "abdulahad2086907@gmail.com",
        password: "020711",
        name: "Abdul Ahad",
        role: "admin",
        createdAt: new Date().toISOString(),
        approved: true
      },
      {
        id: "1784713396157",
        email: "pixelnestagcy@gmail.com",
        password: "Jontipixel2024",
        name: "Pixel Nest",
        role: "admin",
        createdAt: new Date().toISOString(),
        approved: true
      },
      {
        id: "1784809473910",
        email: "admin123@owner.com",
        password: "Jontigrid2024*",
        name: "Development",
        role: "admin",
        approved: true,
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

export function initializeBoards() {
  const BOARDS_FILE = path.join(DATA_DIR, "boards.json");
  
  if (!fs.existsSync(BOARDS_FILE)) {
    const defaultBoards = [
      {
        id: "1",
        name: "Sprint Board",
        columns: [
          { id: "todo", title: "To Do", tasks: [] },
          { id: "in-progress", title: "In Progress", tasks: [] },
          { id: "review", title: "Review", tasks: [] },
          { id: "done", title: "Done", tasks: [] }
        ]
      }
    ];
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(defaultBoards, null, 2));
  }
}

export function initializeChannels() {
  const CHANNELS_FILE = path.join(DATA_DIR, "channels.json");
  
  if (!fs.existsSync(CHANNELS_FILE)) {
    const defaultChannels = [
      {
        id: "general",
        name: "general",
        messages: []
      },
      {
        id: "random",
        name: "random",
        messages: []
      }
    ];
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(defaultChannels, null, 2));
  }
}

export function initializePrivateMessages() {
  const MESSAGES_FILE = path.join(DATA_DIR, "private-messages.json");
  
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
  }
}

export function initializeAllData() {
  ensureDataDirectory();
  initializeUsers();
  initializeBoards();
  initializeChannels();
  initializePrivateMessages();
}
