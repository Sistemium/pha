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
                    (select xmlforest(name) from pha.Agent where id = AccessToken.agent)
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
