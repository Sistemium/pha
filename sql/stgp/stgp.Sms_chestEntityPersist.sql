sa_make_object 'event', 'stgp.Sms_chestEntityPersist';

alter event [stgp.Sms_chestEntityPersist]
handler begin

    declare @now TS;
    declare @last TS;

    if EVENT_PARAMETER('NumActive') <> '1' then
        return;
    end if;

    set @now = now();

    set @last = ch.getSetPersistData ('stgp.Sms',@now);

    for c as c cursor for
        select
            string (trim(s.[text])) as @msg,
            isnull(s.mobileNumber,a.mobile_number) as @num
        from ch.PHASms () s
            join pha.Agent a on a.id = s.account
        where s.ts between @last and @now
            and isnull(@msg,'') <> ''
    do
        message 'stgp.Sms_chestEntityPersist sent: ',
            util.createSms(@num,@msg)
        ;
    end for;
    
    trigger event smsProcessor;

end;
