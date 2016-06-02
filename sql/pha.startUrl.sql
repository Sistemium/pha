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
        case
            when @program = 'Entity' then ''
            when @program regexp ('(^|.*[/])tp$') then 'https://sistemium.com/'
            else string ('https://api.sistemium.com/', pha.orgToAPIRoot (@org), '/v1/')
        end,
        @org,
        '/', @program,
        case
            when @program regexp ('(^|.*[/])tp$') then
                string ('/?access-token=',@token)
        end
    );

end;
