create or replace function pha.apiURL (
    @org STRING,
    @user_agent STRING default 'iSistemium'
) returns STRING
begin

    declare @version int;
    declare @res string;

    set @version = isnull(pha.agentBuildByUserAgent (http_decode(@user_agent)),0);

    set @res =
        if @version > 200 then
            string (
                'https://socket',
                if @org in ('dr50','dev') then '2' else '' endif,
                '.sistemium.com/socket.io-client'
            )
        else
            string (
                'https://api.sistemium.com/',
                pha.orgToAPIRoot (@org),
                '/',
                if @user_agent like '%iSis%' then 'v1' else 'v3' endif,
                '/',
                @org
            )
        endif
    ;

    return @res;

end;
