create or replace procedure pha.accountRole (
    @account IDREF
) begin

    with directRole as (
        select code, [data], ord
        from pha.accountDirectRole (@account)
    )

    select code, [data], ord
    from directRole

    union select
        role as [code], [data], ord
    from pha.profileRole ar
    where ar.profile in (
        select id from pha.profileByAccount (@account)
    ) and not exists (
        select * from directRole
        where  code = ar.role
    )

end;
