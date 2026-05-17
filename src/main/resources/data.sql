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
        'USER',
        'USER',
        NULL
    )ON CONFLICT (id) DO NOTHING;;

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
        '$2a$10$3kxNOT4bNjb.qlujNjHiW.ZcfygUxTC5.Asmjrn8Ga6WvKktKOiMi',
        'admin'
    ) ON CONFLICT (username) DO NOTHING;