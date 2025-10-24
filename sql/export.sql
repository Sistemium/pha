select util.jsonObject(string(
    util.jsonString('name', name), ',',
    util.jsonInt('minBuild', minbuild), ',',
    util.jsonInt('maxBuild', maxbuild), ',',
    util.jsonString('id', lower(xid)), ',',
    util.jsonString('rolesRe', regexp_substr(code, '[^/]*')), ',',
    util.jsonString('orgRe', regexp_substr(code, regexp_substr(code, '[^/]*$'))), ',',
    string('"roles":', util.jsonArray((select list(util.jsonObject(string(
        util.jsonString('role', role), ',',
        util.jsonInt('ord', ord), ',',
        util.jsonInt('minBuild', minBuild), ',',
        util.jsonInt('maxBuild', maxBuild), ',',
        util.jsonString('rolesRe', rolesRe), ',',
        string('"data":', data)
    ))) from pha.profileRole where profile = profile.id))), ',',
    string('"cts":{"$date":"', replace(cts, ' ', 'T'), 'Z"}')
))
from pha.profile;

output to c:\temp\pha.profile.txt quote '' encoding 'utf-8' delimited by '\x09';

select util.jsonObject(string(
    util.jsonString('name', name), ',',
    util.jsonString('mobileNumber', mobile_number), ',',
    util.jsonInt('num', id), ',',
    util.jsonString('id', lower(xid)), ',',
    util.jsonInt('salesman', salesman), ',',
    util.jsonString('countryCode', '7'), ',',
    util.jsonString('email', email), ',',
    util.jsonString('info', info), ',',
    util.jsonString('stringRoles', roles), ',',

    string('"roles":', util.jsonObject((
      select list(string ('"', code, '":', data)) from (
        select
          code,
          if count (*) > 1 then
            util.jsonArray(list(jsonData order by ord))
          else
            list (jsonData)
          endif as data
        from (
          select role as code,
            ord,
            case
              when data is null then 'true'
              when data regexp '[0-9]+' then data
              when data regexp '\[.*\]' or data regexp '\{.*\}' then data
              else string ('"', data, '"')
            end as jsonData
          from pha.accountRole where account = a.id
        ) as ar
        group by code
      ) as tr
    )), ','),

    util.jsonString('org', org), ',',
    util.jsonBoolean('isDisabled', isDisabled), ',',
    if exists (select * from [pha].[accessToken] where [agent] = [a].[id] and lastAuth is not null) then
        string('"lastAuth":{"$date":"', replace((select max([lastAuth]) from [pha].[accessToken] where [agent] = [a].[id]), ' ', 'T'), 'Z"}', ',')
    endif,
    string('"cts":{"$date":"', replace(cts, ' ', 'T'), 'Z"}')
))
from pha.agent a;

output to c:\temp\pha.agent.txt quote '' encoding 'utf-8' delimited by '\x09';

select util.jsonObject(string(
    util.jsonString('token', token), ',',
    util.jsonString('lastUserAgent', lastUserAgent), ',',
    util.jsonString('id', lower(xid)), ',',
    util.jsonString('accountId', (select lower(xid) from pha.Agent where id = agent)), ',',
    string('"expiresAt":{"$date":"', replace(expiresAt, ' ', 'T'), 'Z"}'), ', ',
    if lastAuth is not null then
        string('"lastAuth":{"$date":"', replace(lastAuth, ' ', 'T'), 'Z"},')
    endif,
    string('"cts":{"$date":"', replace(cts, ' ', 'T'), 'Z"}')
))
from pha.AccessToken
where expiresAt > today() - 30
    and not exists (select * from pha.Agent where id = agent and isDisabled = 1);

output to c:\temp\pha.accessToken.txt quote '' encoding 'utf-8' delimited by '\x09';
