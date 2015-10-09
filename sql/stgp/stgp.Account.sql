/*

    ch.defineProperties 'mobileNumber,string:org,string:info,string:email,string:roles,string';
    
    ch.defineEntity 'PHAAccount',
        'name:mobileNumber:org:info:email',
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
        mobile_number as mobileNumber,
        org,
        info,
        email,
        roles
    from bs.Agent

end;
