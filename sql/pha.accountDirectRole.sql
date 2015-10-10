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
