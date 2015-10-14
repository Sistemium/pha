/*

    ch.defineProperties 'mobileNumber,string:org,string:info,string:email,string:roles,string:isDisabled,BOOL,0';
    
    ch.defineEntity 'PHAAccount',
        'name:mobileNumber:org:info:email:roles:isDisabled',
        ''
    ;
    
    ch.createSp 'PHAAccount', 'stgp.Account', 'ch';

*/

create or replace procedure stgp.Account (
    @UACToken STRING default util.HTTPVariableOrHeader ()
) begin

    select id, xid, ts, cts,
        id as code,
        name,
        substring(mobile_number,2) as mobileNumber,
        org,
        info,
        email,
        roles,
        isnull(isDisabled,0) as isDisabled,
        (select max(lastAuth) from pha.accesstoken where agent = agent.id) as lastAuth
    from bs.Agent

end;
