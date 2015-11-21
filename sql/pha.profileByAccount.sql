create or replace procedure pha.profileByAccount (
    @account IDREF
) begin

    declare @org string;

    select org into @org
    from pha.Agent
    where id = @account;

    with directRole as (
        select code, [data], ord
        from pha.accountDirectRole (@account)
    ), roleProfile as (
        select id, name, code
        from pha.profile
        where code in (
            select [data] from directRole
            where [code] = 'pha.profile'
        )
    )

    select id, name, code
    from pha.profile
    where not exists (
        select * from roleProfile
    ) and exists (
        select *
        from directRole
        where string (code,'/',@org) regexp profile.code
    )
    union select
        id, name, code
    from roleProfile

end;
