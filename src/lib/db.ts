import { sql } from '@vercel/postgres';

export async function getUsers() {
  const result = await sql`SELECT * FROM users`;
  return result.rows;
}

export async function getUserByEmail(email: string) {
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  return result.rows[0];
}

export async function getUserById(id: string) {
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  return result.rows[0];
}

export async function createUser(user: any) {
  const result = await sql`
    INSERT INTO users (id, email, password, name, role, approved, created_at)
    VALUES (${user.id}, ${user.email}, ${user.password}, ${user.name}, ${user.role}, ${user.approved}, ${user.createdAt})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateUser(id: string, updates: any) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
  
  const result = await sql`
    UPDATE users 
    SET ${sql.raw(setClause)}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0];
}

export async function getBoards() {
  const result = await sql`SELECT * FROM boards ORDER BY created_at DESC`;
  return result.rows;
}

export async function getBoardById(id: string) {
  const result = await sql`SELECT * FROM boards WHERE id = ${id}`;
  return result.rows[0];
}

export async function createBoard(board: any) {
  const result = await sql`
    INSERT INTO boards (id, name, created_at)
    VALUES (${board.id}, ${board.name}, ${board.createdAt})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getColumns(boardId: string) {
  const result = await sql`SELECT * FROM columns WHERE board_id = ${boardId} ORDER BY id`;
  return result.rows;
}

export async function createColumn(column: any) {
  const result = await sql`
    INSERT INTO columns (id, board_id, title)
    VALUES (${column.id}, ${column.boardId}, ${column.title})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getTasks(columnId: string) {
  const result = await sql`SELECT * FROM tasks WHERE column_id = ${columnId} ORDER BY created_at DESC`;
  return result.rows;
}

export async function createTask(task: any) {
  const result = await sql`
    INSERT INTO tasks (id, column_id, title, description, priority, due_date, created_at)
    VALUES (${task.id}, ${task.columnId}, ${task.title}, ${task.description}, ${task.priority}, ${task.dueDate}, ${new Date().toISOString()})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateTask(id: string, updates: any) {
  const fields = Object.keys(updates).filter(f => f !== 'id');
  const values = Object.values(updates).filter((_, i) => Object.keys(updates)[i] !== 'id');
  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
  
  const result = await sql`
    UPDATE tasks 
    SET ${sql.raw(setClause)}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteTask(id: string) {
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

export async function moveTask(taskId: string, targetColumnId: string) {
  const result = await sql`
    UPDATE tasks 
    SET column_id = ${targetColumnId}
    WHERE id = ${taskId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function getChannels() {
  const result = await sql`SELECT * FROM channels ORDER BY created_at DESC`;
  return result.rows;
}

export async function getChannelById(id: string) {
  const result = await sql`SELECT * FROM channels WHERE id = ${id}`;
  return result.rows[0];
}

export async function createChannel(channel: any) {
  const result = await sql`
    INSERT INTO channels (id, name, created_at)
    VALUES (${channel.id}, ${channel.name}, ${channel.createdAt})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getMessages(channelId: string) {
  const result = await sql`SELECT * FROM channel_messages WHERE channel_id = ${channelId} ORDER BY created_at ASC`;
  return result.rows;
}

export async function createMessage(message: any) {
  const result = await sql`
    INSERT INTO channel_messages (id, channel_id, text, sender, attachment, created_at)
    VALUES (${message.id}, ${message.channelId}, ${message.text}, ${message.sender}, ${message.attachment}, ${message.timestamp})
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteChannelMessage(messageId: string) {
  await sql`DELETE FROM channel_messages WHERE id = ${messageId}`;
}

export async function getPrivateMessages(userId: string) {
  const result = await sql`
    SELECT * FROM private_messages 
    WHERE sender_id = ${userId} OR receiver_id = ${userId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function createPrivateMessage(message: any) {
  const result = await sql`
    INSERT INTO private_messages (id, sender_id, receiver_id, text, attachment, created_at, read)
    VALUES (${message.id}, ${message.senderId}, ${message.receiverId}, ${message.text}, ${message.attachment}, ${message.timestamp}, ${message.read})
    RETURNING *
  `;
  return result.rows[0];
}

export async function deletePrivateMessage(messageId: string) {
  await sql`DELETE FROM private_messages WHERE id = ${messageId}`;
}
