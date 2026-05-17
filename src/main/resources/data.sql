-- insert a predefined admin account
-- username: admin
-- password: P@ssw0rd
INSERT INTO
    "role" (
        "id",
        "created_at",
        "description",
        "name",
        "updated_at"
    )
VALUES
    (
        1,
        '2026-05-17 06:46:31.781564',
        'ROLE_ADMIN',
        'ROLE_ADMIN',
        NULL
    ),
    (
        2,
        '2026-05-17 06:46:31.781564',
        'ROLE_USER',
        'ROLE_USER',
        NULL
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    users (
        email,
        firstname,
        is_active,
        is_admin,
        lastname,
        password,
        username
    )
VALUES
    (
        'admin@mail.com',
        'leospce001',
        True,
        True,
        'leoadmin',
        '$2a$10$vmv94mzW3R9Ehr/5cGIddeIOZIUBKZzec44IpGeuydWtx6ahYHLMe',
        'admin'
    ) ON CONFLICT (username) DO NOTHING;

INSERT INTO
    "user_role_assignments" (
        "id",
        "active",
        "assigned_date",
        "removed_date",
        "role_id",
        "user_id"
    )
VALUES
    (
        1,
        '1',
        '2026-05-17 09:37:35.24627',
        '2026-05-17 09:37:35.246281',
        1,
        1
    )