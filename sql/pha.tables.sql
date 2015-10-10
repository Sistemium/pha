grant connect to pha;
grant dba to pha;

create global temporary table if not exists pha.log (

    service varchar (32),

    code varchar(1024),
    account int,
    response xml,
    userAgent text,

    callerIP varchar(128) default connection_property('ClientNodeAddress'),

    id ID, xid GUID, ts TS, cts CTS,
    unique (xid), primary key (id)

)  not transactional share by all;

comment on table pha.log is 'pha log, garbageCollected'
;

create table if not exists bs.Agent (

    [id]  ID

    , name STRING not null
    , [password] STRING
    , mobile_number STRING
    , billing_name STRING
    , lastAuthSent timestamp
    , token STRING
    , program_url STRING
    , org STRING
    , info text
    , isDisabled BOOL
    , email string
    , roles string

    , salesman IDREF null

    , primary key ( id )
    , version int default 1
    , author IDREF
    , [isPhantom]  BOOL
    , [xid]  GUID
    , [ts]  TS
    , [cts]  CTS

    , unique ( xid )

);

create unique index bs_Agent_token on bs.Agent (token);
create unique index bs_Agent_mobile_number on bs.Agent (mobile_number);

create table if not exists pha.AccessToken (

    not null foreign key (agent) references bs.Agent on delete cascade,

    code varchar (128),
    token varchar (128),
    expiresIn integer,
    expiresAt timestamp,
    lastAuth timestamp,
    lastUserAgent STRING,

    version int default 1,

    id integer default autoincrement,
    cts datetime default current timestamp,
    ts datetime default timestamp,

    xid uniqueidentifier default newid(),

    unique (token),
    unique (xid),
    primary key (id)

);


create table pha.accountRole(

    not null foreign key(account) references bs.agent,

    role STRING not null,
    data STRING,

    ord int,

    id ID, xid GUID,
    cts CTS, ts TS,

    unique (xid),
    primary key (id)

);

create table pha.profile(

    name STRING not null,
    code STRING not null,

    id ID, xid GUID,
    cts CTS, ts TS,

    unique (xid),
    unique (code),
    primary key (id)

);

create table pha.profileRole(

    not null foreign key(profile) references pha.profile,

    role STRING not null,
    data STRING,

    ord int,

    id ID, xid GUID,
    cts CTS, ts TS,

    unique (xid),
    primary key (id)

);
