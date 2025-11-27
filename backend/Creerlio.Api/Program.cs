

using Creerlio.Api.Identity;
using Creerlio.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// Add JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// Add Identity
builder.Services.AddCreerlioIdentity(builder.Configuration);

// Add main application DbContext
builder.Services.AddDbContext<Creerlio.Infrastructure.CreerlioDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register repositories
builder.Services.AddScoped<Creerlio.Application.Interfaces.ITalentRepository, Creerlio.Infrastructure.Repositories.TalentRepository>();
builder.Services.AddScoped<Creerlio.Application.Interfaces.IBusinessRepository, Creerlio.Repositories.BusinessRepository>();
// Messaging and System repositories disabled for now
// builder.Services.AddScoped<Creerlio.Application.Interfaces.IMessagingRepository, Creerlio.Repositories.MessagingRepository>();
// builder.Services.AddScoped<Creerlio.Repositories.ISystemRepository, Creerlio.Repositories.SystemRepository>();

// Register services
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddHttpClient<Creerlio.Application.Interfaces.IFredAIService, Creerlio.Application.Services.FredAIService>();
builder.Services.AddScoped<Creerlio.Application.Interfaces.IFredAIService, Creerlio.Application.Services.FredAIService>();
builder.Services.AddScoped<Creerlio.Application.Services.MasterDataSeedService>();

// AI Resume Parsing Service (Master Plan Phase 2)
builder.Services.AddHttpClient<Creerlio.Application.Services.IResumeParsingService, Creerlio.Infrastructure.Services.ResumeParsingService>();
builder.Services.AddScoped<Creerlio.Application.Services.IResumeParsingService, Creerlio.Infrastructure.Services.ResumeParsingService>();

builder.Services.AddMemoryCache(); // For Master Data API caching

// Add controllers with JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Add CORS for GitHub Codespaces, Azure, and local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => 
        {
            Console.WriteLine($"🔍 CORS: Checking origin: {origin}");
            // Allow Azure App Services
            if (origin.Contains("azurewebsites.net"))
            {
                Console.WriteLine($"✅ CORS: Allowing Azure origin: {origin}");
                return true;
            }
            // Allow GitHub Codespaces domains
            if (origin.Contains("app.github.dev") || origin.Contains("github.dev"))
            {
                Console.WriteLine($"✅ CORS: Allowing GitHub Codespace origin: {origin}");
                return true;
            }
            // Allow localhost with any port
            if (origin.StartsWith("http://localhost") || origin.StartsWith("https://localhost"))
            {
                Console.WriteLine($"✅ CORS: Allowing localhost origin: {origin}");
                return true;
            }
            Console.WriteLine($"❌ CORS: Rejecting origin: {origin}");
            return false;
        })
        .AllowAnyMethod()
        .AllowAnyHeader()
        .WithExposedHeaders("*")
        .AllowCredentials();
    });
});

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- AUTOMATIC DATABASE MIGRATION AND SEED ---
// Temporarily disabled to diagnose connection issues
using (var scope = app.Services.CreateScope())
{
    try
    {
        Console.WriteLine("🔄 Running database migrations...");
        
        var identityDb = scope.ServiceProvider.GetRequiredService<Creerlio.Api.Identity.AppIdentityDbContext>();
        await identityDb.Database.MigrateAsync();
        Console.WriteLine("✅ Identity database migrated");

        var coreDb = scope.ServiceProvider.GetRequiredService<Creerlio.Infrastructure.CreerlioDbContext>();
        await coreDb.Database.MigrateAsync();
        Console.WriteLine("✅ Core database migrated");

        // Seed Master Data
        var masterDataSeeder = scope.ServiceProvider.GetRequiredService<Creerlio.Application.Services.MasterDataSeedService>();
        await masterDataSeeder.SeedAllDataAsync();
        Console.WriteLine("✅ Master data seeded successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database migration/seed error: {ex.Message}");
        // Don't stop the app - continue running
    }
}

// Test database connection
using (var scope = app.Services.CreateScope())
{
    try
    {
        Console.WriteLine("🔍 Testing database connection...");
        var coreDb = scope.ServiceProvider.GetRequiredService<Creerlio.Infrastructure.CreerlioDbContext>();
        var canConnect = await coreDb.Database.CanConnectAsync();
        
        if (canConnect)
        {
            Console.WriteLine("✅ SQLite database connected successfully!");
        }
        else
        {
            Console.WriteLine("⚠️  Cannot connect to database - check credentials in appsettings.json");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database connection error: {ex.Message}");
        Console.WriteLine("   Check SQLite database file at: /workspaces/creerlio-platform/backend/creerlio.db");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Disable HTTPS redirection in Codespaces
// app.UseHttpsRedirection();

// Enable CORS - MUST be before Authentication/Authorization
app.UseCors("AllowFrontend");

// Add middleware to log all requests for debugging
app.Use(async (context, next) =>
{
    Console.WriteLine($"📥 {context.Request.Method} {context.Request.Path} from {context.Request.Headers["Origin"]}");
    await next();
    Console.WriteLine($"📤 Response: {context.Response.StatusCode}");
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => "Creerlio API is running");
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
