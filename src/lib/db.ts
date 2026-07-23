import fs from "fs";
import path from "path";
import { sql } from "@vercel/postgres";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const BOARDS_FILE = path.join(DATA_DIR, "boards.json");
const CHANNELS_FILE = path.join(DATA_DIR, "channels.json");
const MESSAGES_FILE = path.join(DATA_DIR, "private-messages.json");

function isPostgres() {
  return !!process.env.POSTGRES_URL || !!process.env.DATABASE_URL;
}

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
        password: "Jontipixel2024.",
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
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, email, password, name, role, approved, created_at as "createdAt" FROM users`;
    return rows.map((u: any) => ({ ...u, createdAt: u.createdAt || u.created_at }));
  }
  return readJson(USERS_FILE, []);
}

export async function getUserByEmail(email: string) {
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, email, password, name, role, approved, created_at as "createdAt" FROM users WHERE email = ${email}`;
    const u = rows[0];
    if (u) u.createdAt = u.createdAt || u.created_at;
    return u;
  }
  const users = readJson(USERS_FILE, []);
  return users.find((u: any) => u.email === email);
}

export async function getUserById(id: string) {
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, email, password, name, role, approved, created_at as "createdAt" FROM users WHERE id = ${id}`;
    const u = rows[0];
    if (u) u.createdAt = u.createdAt || u.created_at;
    return u;
  }
  const users = readJson(USERS_FILE, []);
  return users.find((u: any) => u.id === id);
}

export async function createUser(user: any) {
  if (isPostgres()) {
    const createdAt = user.createdAt || new Date().toISOString();
    await sql`INSERT INTO users (id, email, password, name, role, approved, created_at) VALUES (${user.id}, ${user.email}, ${user.password}, ${user.name}, ${user.role || 'member'}, ${user.approved || false}, ${createdAt})`;
    return { ...user, createdAt };
  }
  const users = readJson(USERS_FILE, []);
  users.push(user);
  writeJson(USERS_FILE, users);
  return user;
}

export async function updateUser(id: string, updates: any) {
  if (isPostgres()) {
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(updates)) {
      const pgKey = key === 'createdAt' ? 'created_at' : key;
      sets.push(`${pgKey} = $${i}`);
      values.push(value);
      i++;
    }
    if (sets.length === 0) return await getUserById(id);
    values.push(id);
    const query = `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, email, password, name, role, approved, created_at as "createdAt"`;
    const { rows } = await sql.query(query, values);
    const u = rows[0];
    if (u) u.createdAt = u.createdAt || u.created_at;
    return u || null;
  }
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
  if (isPostgres()) {
    const { rows: boardRows } = await sql`SELECT id, name, created_at as "createdAt" FROM boards`;
    const { rows: columnRows } = await sql`SELECT id, board_id as "boardId", title FROM columns`;
    const { rows: taskRows } = await sql`SELECT id, column_id as "columnId", title, description, priority, due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt" FROM tasks`;
    return boardRows.map((board: any) => ({
      ...board,
      columns: columnRows.filter((c: any) => c.boardId === board.id).map((column: any) => ({
        ...column,
        tasks: taskRows.filter((t: any) => t.columnId === column.id).map((t: any) => ({ ...t, createdAt: t.createdAt || t.created_at, updatedAt: t.updatedAt || t.updated_at }))
      }))
    }));
  }
  return readJson(BOARDS_FILE, []);
}

export async function getBoardById(id: string) {
  if (isPostgres()) {
    const boards = await getBoards();
    return boards.find((b: any) => b.id === id);
  }
  const boards = readJson(BOARDS_FILE, []);
  return boards.find((b: any) => b.id === id);
}

export async function createBoard(board: any) {
  if (isPostgres()) {
    const createdAt = board.createdAt || new Date().toISOString();
    await sql`INSERT INTO boards (id, name, created_at) VALUES (${board.id}, ${board.name}, ${createdAt})`;
    if (board.columns && board.columns.length > 0) {
      for (const col of board.columns) {
        await sql`INSERT INTO columns (id, board_id, title) VALUES (${col.id}, ${board.id}, ${col.title})`;
      }
    }
    return { ...board, createdAt, columns: board.columns || [] };
  }
  const boards = readJson(BOARDS_FILE, []);
  boards.push({ ...board, columns: [] });
  writeJson(BOARDS_FILE, boards);
  return board;
}

export async function getColumns(boardId: string) {
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, board_id as "boardId", title FROM columns WHERE board_id = ${boardId}`;
    return rows;
  }
  const board = await getBoardById(boardId);
  return board?.columns || [];
}

export async function deleteBoard(id: string) {
  if (isPostgres()) {
    await sql`DELETE FROM boards WHERE id = ${id}`;
    return;
  }
  const boards = readJson(BOARDS_FILE, []);
  const filtered = boards.filter((b: any) => b.id !== id);
  writeJson(BOARDS_FILE, filtered);
}

export async function createColumn(column: any) {
  if (isPostgres()) {
    await sql`INSERT INTO columns (id, board_id, title) VALUES (${column.id}, ${column.boardId}, ${column.title})`;
    return { ...column, tasks: [] };
  }
  const boards = readJson(BOARDS_FILE, []);
  const board = boards.find((b: any) => b.id === column.boardId);
  if (board) {
    board.columns.push({ id: column.id, title: column.title, tasks: [] });
    writeJson(BOARDS_FILE, boards);
  }
  return column;
}

export async function getTasks(columnId: string) {
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, column_id as "columnId", title, description, priority, due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt" FROM tasks WHERE column_id = ${columnId}`;
    return rows.map((t: any) => ({ ...t, createdAt: t.createdAt || t.created_at, updatedAt: t.updatedAt || t.updated_at }));
  }
  const boards = readJson(BOARDS_FILE, []);
  for (const board of boards) {
    for (const column of board.columns) {
      if (column.id === columnId) return column.tasks || [];
    }
  }
  return [];
}

export async function createTask(task: any) {
  if (isPostgres()) {
    const createdAt = task.createdAt || new Date().toISOString();
    await sql`INSERT INTO tasks (id, column_id, title, description, priority, due_date, created_at, updated_at) VALUES (${task.id}, ${task.columnId}, ${task.title}, ${task.description || ''}, ${task.priority || 'medium'}, ${task.dueDate || null}, ${createdAt}, ${createdAt})`;
    return { ...task, createdAt, updatedAt: createdAt };
  }
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
  if (isPostgres()) {
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    const fieldMap: any = { columnId: 'column_id', dueDate: 'due_date', createdAt: 'created_at', updatedAt: 'updated_at' };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        sets.push(`${fieldMap[key] || key} = $${i}`);
        values.push(value);
        i++;
      }
    }
    if (sets.length === 0) return null;
    sets.push(`updated_at = $${i}`);
    values.push(new Date().toISOString());
    i++;
    values.push(id);
    const query = `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, column_id as "columnId", title, description, priority, due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"`;
    const { rows } = await sql.query(query, values);
    const t = rows[0];
    if (t) {
      t.createdAt = t.createdAt || t.created_at;
      t.updatedAt = t.updatedAt || t.updated_at;
    }
    return t || null;
  }
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
  if (isPostgres()) {
    await sql`DELETE FROM tasks WHERE id = ${id}`;
    return;
  }
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
  if (isPostgres()) {
    const now = new Date().toISOString();
    const { rows } = await sql`UPDATE tasks SET column_id = ${targetColumnId}, updated_at = ${now} WHERE id = ${taskId} RETURNING id, column_id as "columnId", title, description, priority, due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"`;
    const t = rows[0];
    if (t) {
      t.createdAt = t.createdAt || t.created_at;
      t.updatedAt = t.updatedAt || t.updated_at;
    }
    return t || null;
  }
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
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, name, created_at as "createdAt" FROM channels`;
    return rows;
  }
  return readJson(CHANNELS_FILE, []);
}

export async function getChannelById(id: string) {
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, name, created_at as "createdAt" FROM channels WHERE id = ${id}`;
    return rows[0];
  }
  const channels = readJson(CHANNELS_FILE, []);
  return channels.find((c: any) => c.id === id);
}

export async function createChannel(channel: any) {
  if (isPostgres()) {
    const createdAt = channel.createdAt || new Date().toISOString();
    await sql`INSERT INTO channels (id, name, created_at) VALUES (${channel.id}, ${channel.name}, ${createdAt})`;
    return { ...channel, createdAt, messages: [] };
  }
  const channels = readJson(CHANNELS_FILE, []);
  channels.push({ ...channel, messages: [] });
  writeJson(CHANNELS_FILE, channels);
  return channel;
}

export async function getMessages(channelId: string) {
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, channel_id as "channelId", text, sender, attachment, created_at as "createdAt" FROM channel_messages WHERE channel_id = ${channelId} ORDER BY created_at`;
    return rows.map((m: any) => ({ ...m, createdAt: m.createdAt || m.created_at }));
  }
  const channels = readJson(CHANNELS_FILE, []);
  const channel = channels.find((c: any) => c.id === channelId);
  return channel?.messages || [];
}

export async function createMessage(message: any) {
  if (isPostgres()) {
    const createdAt = message.timestamp || new Date().toISOString();
    await sql`INSERT INTO channel_messages (id, channel_id, text, sender, attachment, created_at) VALUES (${message.id}, ${message.channelId}, ${message.text}, ${message.sender}, ${message.attachment || null}, ${createdAt})`;
    return { ...message, createdAt };
  }
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
  if (isPostgres()) {
    await sql`DELETE FROM channel_messages WHERE id = ${messageId}`;
    return;
  }
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
  if (isPostgres()) {
    const { rows } = await sql`SELECT id, sender_id as "senderId", receiver_id as "receiverId", text, attachment, read, created_at as "createdAt" FROM private_messages WHERE sender_id = ${userId} OR receiver_id = ${userId} ORDER BY created_at`;
    return rows.map((m: any) => ({ ...m, createdAt: m.createdAt || m.created_at }));
  }
  const messages = readJson(MESSAGES_FILE, []);
  return messages.filter((msg: any) => msg.senderId === userId || msg.receiverId === userId);
}

export async function createPrivateMessage(message: any) {
  if (isPostgres()) {
    const createdAt = message.timestamp || new Date().toISOString();
    await sql`INSERT INTO private_messages (id, sender_id, receiver_id, text, attachment, read, created_at) VALUES (${message.id}, ${message.senderId}, ${message.receiverId}, ${message.text}, ${message.attachment || null}, ${message.read || false}, ${createdAt})`;
    return { ...message, createdAt };
  }
  const messages = readJson(MESSAGES_FILE, []);
  messages.push(message);
  writeJson(MESSAGES_FILE, messages);
  return message;
}

export async function deletePrivateMessage(messageId: string) {
  if (isPostgres()) {
    await sql`DELETE FROM private_messages WHERE id = ${messageId}`;
    return;
  }
  const messages = readJson(MESSAGES_FILE, []);
  const index = messages.findIndex((m: any) => m.id === messageId);
  if (index !== -1) {
    messages.splice(index, 1);
    writeJson(MESSAGES_FILE, messages);
  }
}
