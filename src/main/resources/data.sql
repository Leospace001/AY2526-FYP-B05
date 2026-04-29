INSERT INTO users (firstname, lastname, username, email, password, is_admin, is_active)
SELECT 'TAI', 'MAN', 'leospace', 'leospace@example.com', '$2a$10$7K3g8u9y5XqvV0oDqJQe2e1h1Y6X5QbQw1x6sV8b3J5pQ1tB5H8wK', false, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'leospace');

INSERT INTO users (firstname, lastname, username, email, password, is_admin, is_active)
SELECT 'Andy', 'Test', 'andy', 'andy@test.com', '$2y$10$ItLHCB6YQDrRQscqmLqHjukqD6YA0go2o2i5mLvG6RcouLHzH9rBC', false, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'andy');
