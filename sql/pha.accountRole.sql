create or replace procedure pha.accountRole (
    @account IDREF,
    @agentBuild int default 0
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
        join pha.profile p on p.id = ar.profile
    where ar.profile in (
            select id from pha.profileByAccount (@account)
        ) and not exists (
            select * from directRole
            where  code = ar.role
        ) and @agentBuild >= isnull(p.minBuild,0)
        and @agentBuild >= isnull(ar.minBuild,0)
        and (@agentBuild <= p.maxBuild or p.maxBuild is null)
        and (@agentBuild <= ar.maxBuild or ar.maxBuild is null)
        and (ar.rolesRe is null or exists (
            select * from directRole where code regexp ar.rolesRe
        ))

end;
