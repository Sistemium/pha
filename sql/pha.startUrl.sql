create or replace function pha.startURL (
    @org STRING,
    @program STRING,
    @token STRING
) returns STRING
begin

    set @program = isnull(nullif(@program,''),'tp');

    if @org = 'un'  and @program regexp ('(^|.*[/])tp$') then
        return string (
            'https://system.unact.ru/s/iorders',
            '/?access-token=',
            @token
        );
    end if;

    return string (
        'https://', case
            when @program regexp ('(^|.*[/])tp$') then 'sistemium.com'
            else string ('api.sistemium.com/api', if @org = 'dr50' then '2' endif, '/v1')
        end,
        '/', @org,
        '/', @program,
        case
            when @program regexp ('(^|.*[/])tp$') then
                string ('/?access-token=',@token)
        end
    );

end;
