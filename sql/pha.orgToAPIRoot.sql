create or replace function pha.orgToAPIRoot (
    @name STRING default null
) returns STRING begin

    declare @result STRING;

    set @result = case @name
        when 'dev' then 'api2'
        when 'dr50' then 'api2'
        else 'api'
    end;

    return @result;

end;

