sa_make_object 'event', 'stgp.Account_chestEntityPersist';

alter event [stgp.Account_chestEntityPersist]
handler begin

    declare @now TS;
    declare @last TS;

    if EVENT_PARAMETER('NumActive') <> '1' then
        return;
    end if;

    set @now = now();
    set @last = ch.getSetPersistData ('stgp.Account',@now);

    merge into bs.Agent sp
        using with auto name (
            select xid, author, 1 as version,
                name,
                org,
                info,
                mobileNumber as mobile_number,
                email,
                roles
            from ch.PHAAccount ()
            where ts between @last and @now
        ) as d on d.xid = sp.xid
    when not matched and ch.isEntityRemoved(d.xid) = 0
        then insert
    when matched and xmlforest (
        d.name, d.email, d.info,
        d.org, d.mobile_number, d.roles
    ) <> xmlforest (
        sp.name, sp.email, sp.info,
        sp.org, sp.mobile_number, sp.roles
    ) then update set
        name = d.name, email = d.email, info = d.info,
        org = d.org, mobile_number = d.mobile_number,
        roles = d.roles,
        version = sp.version + 1
    ;

    message current database, '.stgp.Account_chestEntityPersist merged bs.Agent rows: ',
        @@rowcount, ', ms: ', datediff (ms,@now,now())
    ;

end;
