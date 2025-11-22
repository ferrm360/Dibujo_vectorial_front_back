using System.Text;
using DrawingService.Services;
using DrawingService.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Logging;

IdentityModelEventSource.ShowPII = true;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDb"));

builder.Services.AddSingleton<DrawingsService>();
builder.Services.AddControllers();


var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();

if (jwtSettings == null || string.IsNullOrEmpty(jwtSettings.Key))
{
    throw new Exception("ERROR CRÍTICO: No se encontró la configuración 'Jwt' o la 'Key' es nula. Revisa tu docker-compose.yml");
}

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key));

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; 
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = key,
            
            ClockSkew = TimeSpan.Zero 
        };


        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authorization = context.Request.Headers["Authorization"].FirstOrDefault();

                if (!string.IsNullOrEmpty(authorization))
                {
                    if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        var tokenLimpio = authorization.Substring("Bearer ".Length).Trim();
                        
         
                        context.Token = tokenLimpio; 
                    }
                }
                return Task.CompletedTask;
            },

            OnAuthenticationFailed = context =>
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"🔴 ERROR CRÍTICO: {context.Exception.Message}");
                Console.ResetColor();
                return Task.CompletedTask;
            },
            
            OnTokenValidated = context =>
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"🟢 ÉXITO TOTAL. Usuario: {context.Principal?.Identity?.Name}");
                Console.ResetColor();
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

Console.WriteLine("DrawingService INICIADO (Versión con Debugging PII Activado)");

app.Run();