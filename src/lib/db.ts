import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const BOARDS_FILE = path.join(DATA_DIR, "boards.json");
const CHANNELS_FILE = path.join(DATA_DIR, "channels.json");
const MESSAGES_FILE = path.join(DATA_DIR, "private-messages.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(file: string, defaultValue: any = []) {
  ensureDataDir();
  if (!fs.existsSync(file)) {
    writeJson(file, defaultValue);
    return defaultValue;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return defaultValue;
  }
}

function writeJson(file: string, data: any) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function initDefaultUsers() {
  const users = readJson(USERS_FILE, []);
  if (users.length === 0) {
    writeJson(USERS_FILE, [
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
    ]);
  }
}

function initDefaultBoards() {
  const boards = readJson(BOARDS_FILE, []);
  if (boards.length === 0) {
    writeJson(BOARDS_FILE, [
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
    ]);
  }
}

function initDefaultChannels() {
  const channels = readJson(CHANNELS_FILE, []);
  if (channels.length === 0) {
    writeJson(CHANNELS_FILE, [
      { id: "general", name: "general", messages: [] },
      { id: "random", name: "random", messages: [] }
    ]);
  }
}

function initAll() {
  initDefaultUsers();
  initDefaultBoards();
  initDefaultChannels();
  readJson(MESSAGES_FILE, []);
}

initAll();

export async function getUsers() {
  return readJson(USERS_FILE, []);
}

export async function getUserByEmail(email: string) {
  const users = readJson(USERS_FILE, []);
  return users.find((u: any) => u.email === email);
}

export async function getUserById(id: string) {
  const users = readJson(USERS_FILE, []);
  return users.find((u: any) => u.id === id);
}

export async function createUser(user: any) {
  const users = readJson(USERS_FILE, []);
  users.push(user);
  writeJson(USERS_FILE, users);
  return user;
}

export async function updateUser(id: string, updates: any) {
  const users = readJson(USERS_FILE, []);
  const index = users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    writeJson(USERS_FILE, users);
    return users[index];
  }
  return null;
}

export async function getBoards() {
  return readJson(BOARDS_FILE, []);
}

export async function getBoardById(id: string) {
  const boards = readJson(BOARDS_FILE, []);
  return boards.find((b: any) => b.id === id);
}

export async function createBoard(board: any) {
  const boards = readJson(BOARDS_FILE, []);
  boards.push({ ...board, columns: [] });
  writeJson(BOARDS_FILE, boards);
  return board;
}

export async function getColumns(boardId: string) {
  const board = await getBoardById(boardId);
  return board?.columns || [];
}

export async function createColumn(column: any) {
  const boards = readJson(BOARDS_FILE, []);
  const board = boards.find((b: any) => b.id === column.boardId);
  if (board) {
    board.columns.push({ id: column.id, title: column.title, tasks: [] });
    writeJson(BOARDS_FILE, boards);
  }
  return column;
}

export async function getTasks(columnId: string) {
  const boards = readJson(BOARDS_FILE, []);
  for (const board of boards) {
    for (const column of board.columns) {
      if (column.id === columnId) return column.tasks || [];
    }
  }
  return [];
}

export async function createTask(task: any) {
  const boards = readJson(BOARDS_FILE, []);
  for (const board of boards) {
    for (const column of board.columns) {
      if (column.id === task.columnId) {
        column.tasks.push(task);
        writeJson(BOARDS_FILE, boards);
        return task;
      }
    }
  }
  return task;
}

export async function updateTask(id: string, updates: any) {
  const boards = readJson(BOARDS_FILE, []);
  for (const board of boards) {
    for (const column of board.columns) {
      const task = column.tasks.find((t: any) => t.id === id);
      if (task) {
        Object.assign(task, updates);
        writeJson(BOARDS_FILE, boards);
        return task;
      }
    }
  }
  return null;
}

export async function deleteTask(id: string) {
  const boards = readJson(BOARDS_FILE, []);
  for (const board of boards) {
    for (const column of board.columns) {
      const index = column.tasks.findIndex((t: any) => t.id === id);
      if (index !== -1) {
        column.tasks.splice(index, 1);
        writeJson(BOARDS_FILE, boards);
        return;
      }
    }
  }
}

export async function moveTask(taskId: string, targetColumnId: string) {
  const boards = readJson(BOARDS_FILE, []);
  let task = null;
  for (const board of boards) {
    for (const column of board.columns) {
      const index = column.tasks.findIndex((t: any) => t.id === taskId);
      if (index !== -1) {
        task = column.tasks.splice(index, 1)[0];
        break;
      }
    }
    if (task) break;
  }
  if (task) {
    for (const board of boards) {
      for (const column of board.columns) {
        if (column.id === targetColumnId) {
          column.tasks.push(task);
          writeJson(BOARDS_FILE, boards);
          return task;
        }
      }
    }
  }
  return null;
}

export async function getChannels() {
  return readJson(CHANNELS_FILE, []);
}

export async function getChannelById(id: string) {
  const channels = readJson(CHANNELS_FILE, []);
  return channels.find((c: any) => c.id === id);
}

export async function createChannel(channel: any) {
  const channels = readJson(CHANNELS_FILE, []);
  channels.push({ ...channel, messages: [] });
  writeJson(CHANNELS_FILE, channels);
  return channel;
}

export async function getMessages(channelId: string) {
  const channels = readJson(CHANNELS_FILE, []);
  const channel = channels.find((c: any) => c.id === channelId);
  return channel?.messages || [];
}

export async function createMessage(message: any) {
  const channels = readJson(CHANNELS_FILE, []);
  const channel = channels.find((c: any) => c.id === message.channelId);
  if (channel) {
    channel.messages.push({
      id: message.id,
      text: message.text,
      sender: message.sender,
      timestamp: message.timestamp,
      attachment: message.attachment
    });
    writeJson(CHANNELS_FILE, channels);
  }
  return message;
}

export async function deleteChannelMessage(messageId: string) {
  const channels = readJson(CHANNELS_FILE, []);
  for (const channel of channels) {
    const index = channel.messages.findIndex((m: any) => m.id === messageId);
    if (index !== -1) {
      channel.messages.splice(index, 1);
      writeJson(CHANNELS_FILE, channels);
      return;
    }
  }
}

export async function getPrivateMessages(userId: string) {
  const messages = readJson(MESSAGES_FILE, []);
  return messages.filter((msg: any) => msg.senderId === userId || msg.receiverId === userId);
}

export async function createPrivateMessage(message: any) {
  const messages = readJson(MESSAGES_FILE, []);
  messages.push(message);
  writeJson(MESSAGES_FILE, messages);
  return message;
}

export async function deletePrivateMessage(messageId: string) {
  const messages = readJson(MESSAGES_FILE, []);
  const index = messages.findIndex((m: any) => m.id === messageId);
  if (index !== -1) {
    messages.splice(index, 1);
    writeJson(MESSAGES_FILE, messages);
  }
}
