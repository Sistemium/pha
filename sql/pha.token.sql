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
