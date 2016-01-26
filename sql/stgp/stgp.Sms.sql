/*

    ch.defineProperties 'text,text';
    
    ch.defineEntity 'Sms',
        'text:mobileNumber',
        'account,pha.Agent'
    ;
    
    ch.createTable 'Sms', 'pha', 0, 0;

    alter table pha.Sms add foreign key ([util.sms])
        references util.smsMessage
    ;

    alter table pha.Sms modify mobileNumber not null;
    alter table pha.Sms modify [text] not null;
    alter table pha.Sms modify [account] not null;


create or replace trigger pha_Sms_bI
    before insert
    order 100 on pha.Sms
    referencing new as inserted
    for each row
begin

    set inserted.[util.sms] = util.createSms(
        inserted.mobileNumber,
        inserted.[text]
--        @originator STRING default null,
--        @account STRING default util.getUserOption('utilSms.defaultAccount')
    );

end;

create or replace trigger pha_Sms_aI
    after insert
    order 100 on pha.Sms
    referencing new as inserted
    for each statement
begin

    trigger event [smsProcessor];

end;

*/