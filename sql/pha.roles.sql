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
                select * from pha.Agent
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
                        from pha.accountRole (
                            Agent.id,
                            isnull(pha.agentBuildByUserAgent(@userAgent),0)
                        ) ar
                    )

                )
            )
        )
        into @result
        from pha.Agent
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
