# Repositorio-2026-12
Respositorio del proyecto Sistema De Guias De Inspecciones Sanitarias


Repositorio-2026-12\src\SGGDIS_Api\SGGDIS_Api
dotnet user-secrets init

dotnet user-secrets set "Jwt:Issuer" "sggdis-api"
dotnet user-secrets set "Jwt:Audience" "sggdis-web"
dotnet user-secrets set "Jwt:SigningKey" "SGGDIS-Dev-Key-2024-MinisterioSalud-Costa-Rica"
