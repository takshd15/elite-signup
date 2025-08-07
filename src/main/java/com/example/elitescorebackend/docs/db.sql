create table users_auth
(
    user_id       integer default nextval('users_auth_user_id_seq'::regclass) not null
        primary key,
    username      varchar                                                     not null,
    password_hash varchar                                                     not null,
    role          varchar,
    email         varchar
);

create table forgot_password_table
(
    id              integer default nextval('forgot_password_table_id_seq'::regclass) not null
        primary key,
    user_id         integer                                                           not null
        constraint user_id_fk
            references users_auth,
    token           varchar                                                           not null,
    expiration_date varchar                                                           not null
);

create table jwt_revocation
(
    jti        text                    not null
        primary key,
    revoked_at timestamp default now() not null
);

create table auth_code_table
(
    user_id         integer                  not null
        constraint user_id_fk
            references users_auth,
    expiration_date timestamp with time zone not null,
    created_at      timestamp with time zone not null,
    used            boolean                  not null,
    request_ip      varchar                  not null,
    code            integer                  not null,
    primary key (code, user_id, created_at)
);

create table user_profile_info
(
    user_id_serial       bigint                                                        not null
        constraint profile_info_pkey
            primary key
        constraint profile_info_user_id_serial_fkey
            references users_auth
            on delete cascade,
    phone_number         varchar(20),
    first_name           varchar(100)                                                  not null,
    last_name            varchar(100)                                                  not null,
    bio                  text,
    resume               text,
    growth_score         integer                  default 0                            not null,
    xp_points            integer                  default 0                            not null,
    achievements         jsonb                    default '[]'::jsonb                  not null,
    active_challenge     integer,
    challenges_completed integer                  default 0                            not null,
    visibility           varchar                  default 'public'::profile_visibility not null,
    created_at           timestamp with time zone default now()                        not null,
    updated_at           timestamp with time zone default now()                        not null,
    followers_count      integer                  default 0                            not null,
    following_count      integer                  default 0                            not null
);

create trigger set_updated_at
    before update
    on user_profile_info
    for each row
execute procedure trg_set_updated_at();

create table oauth_accounts
(
    id               bigserial
        primary key,
    user_id          bigint                                 not null
        references users_auth
            on delete cascade,
    provider         varchar(50)                            not null,
    provider_user_id varchar(255)                           not null,
    access_token     text,
    refresh_token    text,
    token_expires_at timestamp with time zone,
    created_at       timestamp with time zone default now() not null,
    updated_at       timestamp with time zone default now() not null,
    unique (provider, provider_user_id)
);

create index idx_oauth_user
    on oauth_accounts (user_id);

create trigger oauth_accounts_updated_at
    before update
    on oauth_accounts
    for each row
execute procedure update_timestamp();

create table user_follows
(
    follower_id bigint                                 not null
        references users_auth
            on delete cascade,
    followee_id bigint                                 not null
        references users_auth
            on delete cascade,
    created_at  timestamp with time zone default now() not null,
    primary key (follower_id, followee_id)
);

create table pre_users_info
(
    id    integer default nextval('presingup_id_seq'::regclass) not null,
    email varchar                                               not null,
    name  varchar                                               not null,
    primary key (id, email, name)
);



create index idx_user_follows_by_follower
    on user_follows (follower_id);

create index idx_user_follows_by_followee
    on user_follows (followee_id);

create trigger trg_user_follows_counts
    after insert or delete
    on user_follows
    for each row
execute procedure trg_user_follows_count();

create function revoke_jwt(p_jti text) returns void
    language plpgsql
as
$$
BEGIN
    INSERT INTO jwt_revocation(jti, revoked_at)
    VALUES (p_jti, now())
    ON CONFLICT (jti) DO
        UPDATE SET revoked_at = EXCLUDED.revoked_at;


END;
$$;

create function trg_set_updated_at() returns trigger
    language plpgsql
as
$$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

create function update_timestamp() returns trigger
    language plpgsql
as
$$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

create function trg_user_follows_count() returns trigger
    language plpgsql
as
$$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_profile_info
        SET followers_count  = followers_count  + 1
        WHERE user_id_serial = NEW.followee_id;

        UPDATE user_profile_info
        SET following_count  = following_count  + 1
        WHERE user_id_serial = NEW.follower_id;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_profile_info
        SET followers_count  = followers_count  - 1
        WHERE user_id_serial = OLD.followee_id;

        UPDATE user_profile_info
        SET following_count  = following_count  - 1
        WHERE user_id_serial = OLD.follower_id;
    END IF;

    RETURN NEW;
END;
$$;

create sequence forgot_password_table_id_seq;

alter sequence forgot_password_table_id_seq owned by forgot_password_table.id;

create sequence users_auth_user_id_seq;

alter sequence users_auth_user_id_seq owned by users_auth.user_id;

create sequence oauth_accounts_id_seq;

alter sequence oauth_accounts_id_seq owned by oauth_accounts.id;

create sequence presingup_id_seq;

alter sequence presingup_id_seq owned by pre_users_info.id;

