using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Security;
using SGGDIS_Api.Services;
using SGGDIS_Api.Services.OrdenesSanitarias;
using SGGDIS_Api.Services.Ubicaciones;

// Punto de entrada de la API: aquí se configuran todos los servicios que la
// aplicación necesita antes de empezar a atender peticiones.
var builder = WebApplication.CreateBuilder(args);

// Habilita el uso de Controllers (los endpoints de la API) y de Swagger,
// que genera la página de documentación/pruebas de la API.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
if (Encoding.UTF8.GetByteCount(jwtOptions.SigningKey) < 32 || string.IsNullOrWhiteSpace(jwtOptions.Issuer) || string.IsNullOrWhiteSpace(jwtOptions.Audience))
{
    throw new InvalidOperationException("Configure Jwt:Issuer, Jwt:Audience y una Jwt:SigningKey de al menos 32 bytes mediante secretos o variables de entorno.");
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "email",
            RoleClaimType = "role"
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var db = context.HttpContext.RequestServices.GetRequiredService<SggdisDbContext>();
                var sessionId = context.Principal?.FindFirst("session_id")?.Value;
                var userId = context.Principal?.FindFirst("sub")?.Value;
                if (!int.TryParse(sessionId, out var parsedSessionId) || !int.TryParse(userId, out var parsedUserId))
                {
                    context.Fail("El token no contiene una sesión válida.");
                    return;
                }

                var session = await db.Sesiones.AsNoTracking().SingleOrDefaultAsync(item =>
                    item.IdSesion == parsedSessionId && item.IdUsuario == parsedUserId &&
                    item.FechaRevocacion == null && item.FechaExpiracion > DateTime.UtcNow);
                var user = await db.Usuarios.AsNoTracking().SingleOrDefaultAsync(item =>
                    item.IdUsuario == parsedUserId && item.Activo == "S");
                
                var areaIdToken = context.Principal?.FindFirst("area_id")?.Value ?? string.Empty;
                var areaIdUser = user?.IdArea?.ToString() ?? string.Empty;
                
                if (session is null || user is null || user.Rol != context.Principal?.FindFirst("role")?.Value || areaIdUser != areaIdToken)
                {
                    context.Fail("La sesión no es válida o ha finalizado.");
                }
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 50,
            Window = TimeSpan.FromMinutes(15),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("register", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromHours(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});

// Conecta la aplicación a la base de datos Oracle usando la cadena de
// conexión "OracleDb" definida en la configuración (appsettings).
builder.Services.AddDbContext<SggdisDbContext>(options =>
    options.UseOracle(builder.Configuration.GetConnectionString("OracleDb")));

// Registra los servicios de negocio para que se puedan "inyectar" en los
// controllers (cada vez que se pide un ISeccionService, se entrega un SeccionService).
builder.Services.AddScoped<ISeccionService, SeccionService>();

builder.Services.AddScoped<IInspeccionService, InspeccionService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<SegUsuario>, PasswordHasher<SegUsuario>>();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

// Registra el servicio encargado de la lógica de negocio de las Órdenes Sanitarias.
builder.Services.AddScoped<IOrdenSanitariaService, OrdenSanitariaService>();

// Registra el servicio encargado de consultar provincias, cantones y distritos.
builder.Services.AddScoped<IUbicacionService, UbicacionService>();

builder.Services.AddScoped<IActaGeneralService, ActaGeneralService>();
// Permite que el frontend (que corre en localhost:5173 durante desarrollo)
// pueda hacer peticiones a esta API sin ser bloqueado por el navegador.
builder.Services.AddCors(options =>
{
    var origins = builder.Configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:5173", "http://127.0.0.1:5173"];
    options.AddPolicy("FrontendDev", policy =>
        policy.WithOrigins(origins)
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Solo en ambiente de desarrollo se habilita la página de Swagger.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseRouting();
app.UseCors("FrontendDev");

app.Use(async (context, next) =>
{
    if (context.Request.Method != HttpMethods.Options)
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["Referrer-Policy"] = "no-referrer";
    }
    await next();
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    await DesarrolloUsuarioSeeder.CrearUsuarioSiConfiguradoAsync(app.Services, app.Configuration);
}

// Conecta las rutas definidas en los Controllers con las peticiones que lleguen.
app.MapControllers();

await app.RunAsync();
