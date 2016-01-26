create or replace function pha.apiURL (
    @org STRING,
    @user_agent STRING default 'iSistemium'
) returns STRING
begin

    return string (
        'https://api.sistemium.com/',
        pha.orgToAPIRoot (@org),
        '/',
        if @user_agent like '%iSistemium%' then 'v1' else 'v3' endif,
        '/',
        @org
    );

end;
