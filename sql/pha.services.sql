sa_make_object 'service', 'pha';

alter service pha
    type 'raw'
    authorization off user "dba"
    url on
    as call util.xml_for_http(pha.pha(http_variable('url')))
;


sa_make_object 'service', 'phaV2';

alter service pha
    type 'raw'
    authorization off user "dba"
    url on
    as call util.xml_for_http(pha.rolesV2())
;
