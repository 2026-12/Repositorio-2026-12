-- Elimina unicamente el administrador temporal 123@misalud.go.cr / 123.
-- La condicion por hash evita borrar una cuenta homonima con otra contrasena.
DELETE FROM SEG_SESION
WHERE ID_USUARIO IN (
  SELECT ID_USUARIO
  FROM SEG_USUARIO
  WHERE LOWER(TRIM(CORREO)) = '123@misalud.go.cr'
    AND HASH_CONTRASENA = 'AQAAAAIAAYagAAAAEG5brT7aPXR5q1KNYc/hw2PdMEMto9Iuz5eqe3cHF8CnMm7oEKIoxXNB7Gs3Cuo9yQ=='
);

DELETE FROM SEG_USUARIO
WHERE LOWER(TRIM(CORREO)) = '123@misalud.go.cr'
  AND HASH_CONTRASENA = 'AQAAAAIAAYagAAAAEG5brT7aPXR5q1KNYc/hw2PdMEMto9Iuz5eqe3cHF8CnMm7oEKIoxXNB7Gs3Cuo9yQ==';

COMMIT;
