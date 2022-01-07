drop table user;
create table user
(
    id text,
    address text,
    token text,
    username text,
    last_name text,
    first_name text,
    total_request int,
    amount int,
    PRIMARY KEY (id, address, token)
);
create index idx_user_id on user (id);
create index idx_user_address on user (address);
create index idx_user_token on user (token);
