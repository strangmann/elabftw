-- Schema 85
-- add use_ssl ldap option
START TRANSACTION;
    INSERT INTO config (conf_name, conf_value) VALUES ('ldap_use_ssl', '0');
    UPDATE config SET conf_value = 85 WHERE conf_name = 'schema';
COMMIT;
