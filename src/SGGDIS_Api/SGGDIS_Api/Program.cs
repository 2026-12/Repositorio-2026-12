using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Services;

// Punto de entrada de la API: aquí se configuran todos los servicios que la
// aplicación necesita antes de empezar a atender peticiones.
var builder = WebApplication.CreateBuilder(args);

// Habilita el uso de Controllers (los endpoints de la API) y de Swagger,
// que genera la página de documentación/pruebas de la API.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Conecta la aplicación a la base de datos Oracle usando la cadena de
// conexión "OracleDb" definida en la configuración (appsettings).
builder.Services.AddDbContext<SggdisDbContext>(options =>
    options.UseOracle(builder.Configuration.GetConnectionString("OracleDb")));

// Registra los servicios de negocio para que se puedan "inyectar" en los
// controllers (cada vez que se pide un ISeccionService, se entrega un SeccionService).
builder.Services.AddScoped<ISeccionService, SeccionService>();

builder.Services.AddScoped<IInspeccionService, InspeccionService>();

// Permite que el frontend (que corre en localhost:5173 durante desarrollo)
// pueda hacer peticiones a esta API sin ser bloqueado por el navegador.
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
        policy.WithOrigins("http://localhost:5173")
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

// Fuerza que todas las peticiones usen HTTPS.
app.UseHttpsRedirection();

// Aplica la política de CORS definida arriba.
app.UseCors("FrontendDev");

app.UseAuthorization();

// Conecta las rutas definidas en los Controllers con las peticiones que lleguen.
app.MapControllers();

app.Run();
