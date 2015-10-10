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
