-- insert a predefined admin account
-- username: admin
-- password: P@ssw0rd

SELECT setval('role_id_seq', (SELECT MAX(id) FROM role));

INSERT INTO
    users (
        email,
        firstname,
        is_active,
        age,
        phone,
        lastname,
        password,
        username
    )
VALUES
    (
        'admin@mail.com',
        'leospce001',
        True,
        25,
        22222222,
        'leoadmin',
        '$2a$10$vmv94mzW3R9Ehr/5cGIddeIOZIUBKZzec44IpGeuydWtx6ahYHLMe',
        'admin'
    ),
    (
        'testing@mail.com',
        'testing',
        True,
        20,
        88888888,
        'leoadmin',
        '$2a$10$vmv94mzW3R9Ehr/5cGIddeIOZIUBKZzec44IpGeuydWtx6ahYHLMe',
        'testing'
    ) ON CONFLICT (username) DO NOTHING;

INSERT INTO
    role(
        created_at,
        description,
        name,
        is_active,
        updated_at,
        created_by
    )
VALUES
    (
        '2026-05-17 06:46:31.781564',
        'ROLE_ADMIN',
        'ROLE_ADMIN',
        True,
        NULL,
        1
    ),
    (
        '2026-05-17 06:46:31.781564',
        'ROLE_USER',
        'ROLE_USER',
        True,
        NULL,
        1
    ) ON CONFLICT (name) DO NOTHING;

INSERT INTO
    "user_role_assignments" (
        "active",
        "assigned_date",
        "role_id",
        "user_id"
    )
VALUES
    (
        '1',
        '2026-05-17 09:37:35.24627',
        1,
        1
    ),
    (
        '1',
        '2026-05-17 09:37:35.24627',
        2,
        1
    ),
    (
        '1',
        '2026-05-17 09:37:35.24627',
        2,
        2
    ) ON CONFLICT (id) DO NOTHING;