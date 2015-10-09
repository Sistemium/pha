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

grant connect to pha;
grant dba to pha;


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

create or replace procedure pha.auth (
    @phone STRING
) begin

    declare @agent IDREF;
    declare @token IDREF;
    declare @smsAccount string;
    declare @fixedCode string;

    select top 1
        id, regexp_substr (info,'(?<=authcode=)([^ ]*|$)')
    into @agent, @fixedCode
    from bs.Agent
    where mobile_number = @phone
        and isDisabled = 0
    ;

    insert into pha.AccessToken with auto name
        select id as [agent]
            , isnull(
                @fixedCode,
                util.generateCode ()
            ) as [code]
            , hash(newid())+'@pha' as [token]
            , 3600*24*365 as [expiresIn]
            , dateadd(second, [expiresIn], now()) as [expiresAt]
        from bs.Agent
        where id = @agent
    ;

    set @token = @@identity;

    update bs.Agent set
        lastAuthSent = now()
    where id = @agent;

    set @smsAccount = util.getUserOption('pha.auth.sms.account');

    if @fixedCode is null and @smsAccount is not null then
        set @fixedCode = (
            select util.createSms (a.mobile_number, 'Код авторизации: '+[code])
            from bs.Agent a
                join pha.AccessToken t on t.agent = a.id
            where a.id = @agent and t.id = @token
        );
        trigger event smsProcessor;
    end if;

    select uuidtostr(t.xid) id,
            if @fixedCode is null and @smsAccount is null
                then t.code
            endif as [password]
        from bs.Agent a
        join pha.AccessToken t on t.agent = a.id
        where a.id = @agent and t.id = @token
    ;

end;


create or replace function pha.startURL (
    @org STRING,
    @program STRING,
    @token STRING
) returns STRING
begin

    set @program = isnull(nullif(@program,''),'tp');

    if @org = 'un'  and @program regexp ('(^|.*[/])tp$') then
        return string (
            'https://system.unact.ru/s/iorders',
            '/?access-token=',
            @token
        );
    end if;

    return string (
        'https://', case
            when @program regexp ('(^|.*[/])tp$') then 'sistemium.com'
            else string ('api.sistemium.com/api', if @org = 'dr50' then '2' endif, '/v1')
        end,
        '/', @org,
        '/', @program,
        case
            when @program regexp ('(^|.*[/])tp$') then
                string ('/?access-token=',@token)
        end
    );

end;


create or replace function pha.apiURL (
    @org STRING,
    @user_agent STRING default 'iSistemium'
) returns STRING
begin

    return string (
        'https://api.sistemium.com/api',
        if @org = 'dr50' then '2' endif,
        '/',
        if @user_agent like '%iSistemium%' then 'v1' else 'v3' endif,
        '/',
        @org
    );

end;

create or replace procedure pha.token (
    @id STRING,
    @password STRING,
    @user_agent STRING default isnull(util.HTTPVariableOrHeader('User-Agent'),'')
) begin

    declare @at IDREF;

    update pha.AccessToken set
        @at = id,
        code = null
    where xid = @id and code = @password;

    if @at is null then
        update pha.AccessToken set
            version = isnull(version,1) + 1
        where xid = @id
            and code is not null
            and version <= 3
        ;
        delete pha.AccessToken
        where xid = @id
            and version > 3
        ;
    end if;

    select
        a.id,
        pha.startURL (
            a.org,
            case
                when @user_agent like '%iSistemium%' then 'stc.entity'
                when a.program_url like 'http%' then ''
                else a.program_url
            end,
            t.token
        ) as redirect_uri,
        pha.apiURL (a.org,@user_agent) apiUrl,
        t.token,
        a.name
    from bs.Agent a
        join pha.AccessToken t
        on t.agent = a.id
    where t.id = @at;

end;


sa_make_object 'service', 'pha';

alter service pha
    type 'raw'
    authorization off user "dba"
    url on
    as call util.xml_for_http(pha.pha(http_variable('url')))
;


sa_make_object 'service', 'phaV2';

alter service pha
    type 'raw'
    authorization off user "dba"
    url on
    as call util.xml_for_http(pha.rolesV2())
;


create or replace function pha.pha (
    @url text,
    @token STRING default isnull(
        util.HTTPVariableOrHeader('authorization'),
        http_variable('access_token')
    )
) returns xml begin

    declare @result xml;

    set @result = case isnull(regexp_substr (@url,'^[^\/]*'),'roles')
        when 'roles' then
            pha.roles (@token)
        when 'logoff' then
            pha.logoff (@token)
    end;

    return @result;

end;


create or replace procedure pha.accountDirectRole (
    @account IDREF
) result (
    [code] text, [data] text, [ord] int
) begin

    declare @rolesInfo text;

    select list(roles)
    into @rolesInfo from (
        select
            trim(roles)
        from bs.Agent where id = @account
        union select
            trim(regexp_substr(info,'(?<=roles=)([^[:whitespace:]]*)'))
        from bs.Agent where id = @account
    ) as t (roles)
    where roles is not null
    ;

    select role as [code], [data], ord

    from pha.accountRole ar
    where ar.account = @account

    union select
        'stc', null, null

    union select
        [code], [data], null
    from openstring(value @rolesInfo)
    WITH (code STRING, data STRING)
    OPTION ( DELIMITED BY ':' ROW DELIMITED BY ',') AS p

    union select
        'salesman', string(salesman), null
    from bs.Agent
    where id = @account
        and salesman is not null

end;

create or replace procedure pha.profileByAccount (
    @account IDREF
) begin

    declare @org string;

    select org into @org
    from bs.Agent
    where id = @account;

    with directRole as (
        select code, [data], ord
        from pha.accountDirectRole (@account)
    ), roleProfile as (
        select id, name, code
        from pha.profile
        where code in (
            select [data] from directRole
            where [code] = 'pha.profile'
        )
    )

    select id, name, code
    from pha.profile
    where not exists (
        select * from roleProfile
    ) and exists (
        select *
        from directRole
        where string (code,'/',@org) regexp profile.code
    )
    union select
        id, name, code
    from roleProfile

end;


create or replace procedure pha.accountRole (
    @account IDREF
) begin

    with directRole as (
        select code, [data], ord
        from pha.accountDirectRole (@account)
    )

    select code, [data], ord
    from directRole

    union select
        role as [code], [data], ord
    from pha.profileRole ar
    where ar.profile in (
        select id from pha.profileByAccount (@account)
    ) and not exists (
        select * from directRole
        where  code = ar.role
    )

end;


create or replace function pha.logoff (
    @token STRING default isnull(util.HTTPVariableOrHeader('authorization'),http_variable('access_token'))
) returns xml
begin

    declare @account IDREF;
    declare @result xml;
    declare @xid GUID;

    set @xid = newid ();

    insert into pha.log with auto name select
        'logoff' as service,
        @xid as xid,
        @token as code,
        isnull(
            util.HTTPVariableOrHeader('x-real-ip'),
            connection_property('ClientNodeAddress')
        ) as callerIP
    ;

    update pha.AccessToken
        set
            @account = agent,
            expiresAt = now(),
            @result = xmlconcat(
                xmlelement('account',
                    (select xmlforest(name) from bs.Agent where id = AccessToken.agent)
                ),
                xmlelement('roles',xmlelement('role', xmlelement('code','logged-off')))
            )
        where token = @token
            and expiresAt > now()
    ;

    set @result = xmlelement(
        'response',
        xmlattributes('http://unact.net/xml/oauth' as xmlns),
        isnull (@result,
            xmlelement('error','Not authorized')
        )
    );

    update pha.log set
        response = @result,
        account = @account
    where
        xid = @xid
    ;

    return @result;

end;


create or replace function pha.roles (
    @token STRING default isnull(
        util.HTTPVariableOrHeader('authorization'),
        http_variable('access_token')
    ),
    @userAgent STRING default isnull(
        http_variable('user_agent'),
        util.HTTPVariableOrHeader('User-Agent')
    )
) returns xml
begin

    declare @result xml;
    declare @agent IDREF;
    declare @expiresAt timestamp;
    declare @xid GUID;
    declare @expiresIn int;

    set @xid = newid ();

    insert into pha.log with auto name
    select
        'roles' as service,
        @xid as xid,
        @token as code,
        @userAgent as userAgent,
        isnull(
            util.HTTPVariableOrHeader('x-real-ip'),
            connection_property('ClientNodeAddress')
        ) as callerIP
    ;


    update pha.AccessToken
        set
            @agent = agent,
            @expiresAt = expiresAt,
            lastUserAgent = @userAgent,
            lastAuth = now(),
            @expiresIn = datediff(second,now (),expiresAt)
        where token = @token
            and expiresAt > now()
            and not exists (
                select * from bs.Agent
                where id = AccessToken.agent
                    and isDisabled = 1
            )
    ;

    select
        xmlconcat(
            xmlelement('account', xmlforest(
                coalesce(
                    regexp_substr(Agent.info,'(?<=username=)([^[:whitespace:]]*)'),
                    Agent.billing_name,
                    string(Agent.id)
                ) as [code],
                Agent.name,
                isnull(
                    regexp_substr(Agent.info,'(?<=email=)([^[:whitespace:]]*)'),
                    Agent.email
                ) as [email],
                Agent.mobile_number as [mobile-number],
                Agent.org as [org],
                Agent.xid as [authId]
            )),
            xmlelement('token', xmlforest(
                @expiresAt as [expiresAt],
                @expiresIn as [expiresIn]
            )),
            xmlelement('roles',
                xmlconcat(

                    xmlelement('role', xmlelement('code','authenticated')),

                    if Agent.program_url is not null then
                        xmlelement('role', xmlelement('code','program-url'), xmlelement('data',Agent.program_url))
                    end if,

                    (
                        select xmlagg(
                            xmlelement('role',xmlforest([code],[data]))
                            order by ar.code, ar.ord asc
                        )
                        from pha.accountRole (Agent.id) ar
                    )

                )
            )
        )
        into @result
        from bs.Agent
        where id = @agent
            and isDisabled = 0
    ;

    set @result = isnull (@result,
        xmlelement('error','Not authorized')
    );

    set @result = xmlelement(
        'response',
        xmlattributes('http://unact.net/xml/oauth' as xmlns),
        @result
    );

    update pha.log set
        response = @result,
        account = @agent
    where
        xid = @xid
    ;

    return @result;

end;


merge into pha.AccessToken
    using with auto name (
        select
            id as agent, [password] as code, token,
            3600*24*365 as expiresIn,
            dateadd(second, [expiresIn], lastAuthSent) expiresAt
        from bs.Agent
        where token is not null and code is not null and lastAuthSent is not null
    ) as t
    on t.agent = AccessToken.agent and t.token = AccessToken.token
    when not matched then insert
;

create or replace procedure pha.lastAuth (
    @from TS default '2014-01-01'
) begin

    select a.id, a.name, a.org, max(t.lastAuth) lastAuth, count (*) tokensCount,
            list (distinct lastUserAgent) userAgents
        from bs.agent a join pha.accesstoken t on t.agent = a.id
    where t.lastAuth > @from
    group by a.id, a.name, a.org
    order by lastAuth desc

end;
