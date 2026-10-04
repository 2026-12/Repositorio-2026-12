-- SOLO PARA DESARROLLO/PRUEBAS. Credenciales temporales: 123@misalud.go.cr / 123.
-- No usar en produccion. Inserta la cuenta solo si el correo aun no existe.
INSERT INTO SEG_USUARIO (CORREO, ID_AREA, HASH_CONTRASENA, ROL, ACTIVO)
SELECT '123@misalud.go.cr', NULL,
       'AQAAAAIAAYagAAAAEG5brT7aPXR5q1KNYc/hw2PdMEMto9Iuz5eqe3cHF8CnMm7oEKIoxXNB7Gs3Cuo9yQ==',
       'Administrador', 'S'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM SEG_USUARIO
  WHERE LOWER(TRIM(CORREO)) = '123@misalud.go.cr'
)
AND NOT EXISTS (
  SELECT 1
  FROM SEG_USUARIO
  WHERE UPPER(TRIM(ROL)) = 'ADMINISTRADOR'
);

COMMIT;
