create or replace function pha.agentBuildByUserAgent(
    @userAgent string
) returns int begin

    declare @result string;

    set @result = regexp_substr(regexp_substr(@userAgent,'[^ ]*'),'[0-9]*$');

    return @result;

end;
