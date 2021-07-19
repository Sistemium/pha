create or replace function pha.orgByUserAgent(@userAgent STRING, @info STRING)
 returns xml
begin

    declare @res STRING;
    declare @agentName STRING;

    set @agentName = regexp_substr(@userAgent, '[^/]+');

    if @agentName is null then
        return null;
    end if;

    set @res = regexp_substr(@info, string('(?<=', @agentName, 'Org=)[^ ]+'));

    return @res;

end;
