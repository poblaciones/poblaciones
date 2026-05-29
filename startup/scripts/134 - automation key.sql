-- Tabla de API keys para la autenticación de la API de automatización.
--
-- Nunca se almacena el key en texto plano; solo su hash SHA-256.
-- El key en texto plano se genera en el ABM de usuarios y se entrega al usuario
-- una única vez. Ver el snippet en ApiKeyHelper.php para la lógica de generación.

CREATE TABLE `user_key` (
    `key_id`          INT          NOT NULL AUTO_INCREMENT,
    `key_hash`    CHAR(64)     NOT NULL COMMENT 'SHA-256 del key en texto plano (hex)',
    `key_user_id`  int NOT NULL COMMENT 'Usuario',
    `key_description` VARCHAR(200)     NULL COMMENT 'Descripción legible del uso del key',
    `key_active`      TINYINT(1)   NOT NULL DEFAULT 1,
    `key_created_at`  DATETIME     NOT NULL,
    `key_last_used`   DATETIME         NULL,

    PRIMARY KEY (`key_id`),
    UNIQUE KEY `uk_key_hash` (`key_hash`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `user_key`
ADD INDEX `fk_user_key_idx` (`key_user_id` ASC);
;
ALTER TABLE `user_key`
ADD CONSTRAINT `fk_user_key`
  FOREIGN KEY (`key_user_id`)
  REFERENCES `user` (`usr_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

UPDATE version SET ver_value = '134' WHERE ver_name = 'DB';
