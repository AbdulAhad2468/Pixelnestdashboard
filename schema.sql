-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  approved BOOLEAN DEFAULT false,
  created_at TEXT DEFAULT now()::text
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TEXT DEFAULT now()::text
);

-- Columns table
CREATE TABLE IF NOT EXISTS columns (
  id VARCHAR(255) PRIMARY KEY,
  board_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY,
  column_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  due_date VARCHAR(50),
  created_at TEXT DEFAULT now()::text,
  updated_at TEXT DEFAULT now()::text,
  FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TEXT DEFAULT now()::text
);

-- Channel messages table
CREATE TABLE IF NOT EXISTS channel_messages (
  id VARCHAR(255) PRIMARY KEY,
  channel_id VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  sender VARCHAR(255) NOT NULL,
  attachment TEXT,
  created_at TEXT DEFAULT now()::text,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- Private messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id VARCHAR(255) PRIMARY KEY,
  sender_id VARCHAR(255) NOT NULL,
  receiver_id VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  attachment TEXT,
  read BOOLEAN DEFAULT false,
  created_at TEXT DEFAULT now()::text,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default users
INSERT INTO users (id, email, password, name, role, approved, created_at)
VALUES 
  ('1784658184837', 'abdulahad2086907@gmail.com', '020711', 'Abdul Ahad', 'admin', true, '2026-07-21T18:23:04.837Z'),
  ('1784713396157', 'pixelnestagcy@gmail.com', 'Jontipixel2024', 'Pixel Nest', 'admin', true, '2026-07-22T09:43:16.157Z'),
  ('1784809473910', 'admin123@owner.com', 'Jontigrid2024*', 'Development', 'admin', true, '2026-07-23T12:24:33.910Z')
ON CONFLICT (id) DO NOTHING;

-- Insert default board
INSERT INTO boards (id, name, created_at)
VALUES ('1', 'Sprint Board', '2026-07-20T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Insert default columns
INSERT INTO columns (id, board_id, title)
VALUES 
  ('todo', '1', 'To Do'),
  ('in-progress', '1', 'In Progress'),
  ('review', '1', 'Review'),
  ('done', '1', 'Done')
ON CONFLICT (id) DO NOTHING;

-- Insert default channels
INSERT INTO channels (id, name, created_at)
VALUES 
  ('general', 'general', '2026-07-20T00:00:00.000Z'),
  ('random', 'random', '2026-07-20T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
