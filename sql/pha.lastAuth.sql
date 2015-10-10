create or replace procedure pha.lastAuth (
    @from TS default '2014-01-01'
) begin

    select a.id, a.name, a.org, max(t.lastAuth) lastAuth, count (*) tokensCount,
            list (distinct lastUserAgent) userAgents
        from bs.agent a join pha.accesstoken t on t.agent = a.id
    where t.lastAuth > @from
    group by a.id, a.name, a.org
    order by lastAuth desc

end;
