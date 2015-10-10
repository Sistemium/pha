create or replace procedure pha.auth (
    @phone STRING
) begin

    declare @agent IDREF;
    declare @token IDREF;
    declare @smsAccount string;
    declare @fixedCode string;

    select top 1
        id, regexp_substr (info,'(?<=authcode=)([^ ]*|$)')
    into @agent, @fixedCode
    from bs.Agent
    where mobile_number = @phone
        and isDisabled = 0
    ;

    insert into pha.AccessToken with auto name
        select id as [agent]
            , isnull(
                @fixedCode,
                util.generateCode ()
            ) as [code]
            , hash(newid())+'@pha' as [token]
            , 3600*24*365 as [expiresIn]
            , dateadd(second, [expiresIn], now()) as [expiresAt]
        from bs.Agent
        where id = @agent
    ;

    set @token = @@identity;

    update bs.Agent set
        lastAuthSent = now()
    where id = @agent;

    set @smsAccount = util.getUserOption('pha.auth.sms.account');

    if @fixedCode is null and @smsAccount is not null then
        set @fixedCode = (
            select util.createSms (a.mobile_number, 'Код авторизации: '+[code])
            from bs.Agent a
                join pha.AccessToken t on t.agent = a.id
            where a.id = @agent and t.id = @token
        );
        trigger event smsProcessor;
    end if;

    select uuidtostr(t.xid) id,
            if @fixedCode is null and @smsAccount is null
                then t.code
            endif as [password]
        from bs.Agent a
        join pha.AccessToken t on t.agent = a.id
        where a.id = @agent and t.id = @token
    ;

end;
