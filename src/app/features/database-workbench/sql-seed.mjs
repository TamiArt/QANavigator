export const SQL_TRAINER_SEED_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT
);
INSERT INTO users (id, email, first_name, last_name, status, created_at) VALUES
  (1, 'anna@example.com', 'Анна', 'Иванова', 'active', '2026-01-12'),
  (2, 'boris@example.com', 'Борис', 'Петров', 'active', '2026-02-03'),
  (3, 'elena@example.com', 'Елена', NULL, 'blocked', '2026-02-18'),
  (4, 'dmitry@example.com', 'Дмитрий', 'Сидоров', 'active', '2026-03-01'),
  (5, 'qa@example.com', 'QA', NULL, 'pending', NULL);

CREATE TABLE Student (
  student_id INTEGER PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  score NUMERIC,
  is_active INTEGER
);
INSERT INTO Student (student_id, first_name, last_name, score, is_active) VALUES
  (1, 'Anna', 'Smith', 90, 1),
  (2, 'Anna', 'Brown', 85, 1),
  (3, 'John', 'Taylor', 78, 0),
  (4, 'Maria', 'Jones', 92, 1),
  (5, NULL, 'Unknown', NULL, NULL),
  (6, 'Anna', 'Wilson', 88, 0);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total NUMERIC,
  status TEXT,
  created_at TEXT
);
INSERT INTO orders (id, user_id, total, status, created_at) VALUES
  (101, 1, 120.50, 'paid', '2026-03-02'),
  (102, 1, 80.00, 'pending', '2026-03-04'),
  (103, 2, 240.00, 'paid', '2026-03-05'),
  (104, 2, NULL, 'cancelled', '2026-03-07'),
  (105, 3, 55.00, 'paid', '2026-03-08'),
  (106, NULL, 15.00, 'pending', '2026-03-10');

CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  amount NUMERIC,
  state TEXT
);
INSERT INTO payments (id, order_id, amount, state) VALUES
  (1, 101, 120.50, 'settled'),
  (2, 103, 240.00, 'settled'),
  (3, 105, NULL, 'waiting');

CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC,
  publisher_id INTEGER
);
INSERT INTO book (id, author, title, amount, publisher_id) VALUES
  (1, 'Лев Толстой', 'Война и мир', 950.00, 1),
  (2, 'Лев Толстой', 'Анна Каренина', 720.00, 1),
  (3, 'Фёдор Достоевский', 'Преступление и наказание', 680.00, 2),
  (4, 'Фёдор Достоевский', 'Идиот', 610.00, 2),
  (5, 'Антон Чехов', 'Рассказы', 430.00, 3),
  (6, 'Антон Чехов', 'Палата № 6', NULL, 3),
  (7, 'Александр Пушкин', 'Евгений Онегин', 500.00, NULL);

CREATE TABLE books (
  book_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);
INSERT INTO books (book_id, author, title, quantity) VALUES
  (1, 'Лев Толстой', 'Война и мир', 3),
  (1, 'Лев Толстой', 'Война и мир', 2),
  (2, 'Лев Толстой', 'Анна Каренина', 4),
  (3, 'Фёдор Достоевский', 'Идиот', 1),
  (3, 'Фёдор Достоевский', 'Идиот', 2),
  (4, 'Антон Чехов', 'Рассказы', 5);

CREATE TABLE authors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT
);
INSERT INTO authors (id, name, country) VALUES
  (1, 'Лев Толстой', 'Россия'),
  (2, 'Фёдор Достоевский', 'Россия'),
  (3, 'Антон Чехов', 'Россия'),
  (4, 'Jane Austen', 'UK');

CREATE TABLE publishers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT INTO publishers (id, name) VALUES
  (1, 'Классика'),
  (2, 'Литература'),
  (3, 'Рассказы');

CREATE TABLE stock (
  id INTEGER PRIMARY KEY,
  book_id INTEGER,
  quantity INTEGER
);
INSERT INTO stock (id, book_id, quantity) VALUES
  (1, 1, 12),
  (2, 2, 7),
  (3, 3, 4),
  (4, NULL, 0);
`;
