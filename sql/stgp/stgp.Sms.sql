/*

    ch.defineProperties 'text,text';
    
    ch.defineEntity 'PHASms',
        'text:mobileNumber',
        'account,bs.Agent'
    ;
    
    ch.createSp 'PHASms', 'stgp.Sms', 'ch';

*/


create or replace procedure stgp.Sms (
    @UACToken STRING default util.HTTPVariableOrHeader ()
) begin



end;
