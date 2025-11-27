using Creerlio.Domain.Entities.MasterData;
using Creerlio.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Creerlio.Application.Services;

/// <summary>
/// Rolls Royce Master Data Seeding Service - Seeds 1000+ records from specification
/// </summary>
public partial class MasterDataSeedService
{
    private readonly CreerlioDbContext _context;
    private readonly ILogger<MasterDataSeedService> _logger;

    public MasterDataSeedService(CreerlioDbContext context, ILogger<MasterDataSeedService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAllDataAsync()
    {
        _logger.LogInformation("🌱 Starting Rolls Royce Master Data Seeding...");
        
        await SeedCountriesAsync();
        await SeedStatesAsync();
        await SeedCitiesAsync();
        await SeedIndustriesAsync();
        await SeedJobCategoriesAsync();
        await SeedUniversitiesAsync();
        await SeedTAFEInstitutesAsync();
        await SeedEducationLevelsAsync();
        await SeedCredentialTypesAsync();
        await SeedVisaTypesAsync();
        await SeedSkillDefinitionsAsync();
        await SeedEmploymentTypesAsync();
        await SeedWorkArrangementsAsync();
        
        _logger.LogInformation("✅ Master Data Seeding Complete!");
    }

    private async Task SeedCountriesAsync()
    {
        if (_context.Countries.Any()) return;
        
        _logger.LogInformation("Seeding Countries...");
        
        var countries = new List<Country>
        {
            // Primary Markets
            new() { Name = "Australia", Code = "AUS", Code2 = "AU", IsEmploymentMarket = true, IsMigrationMarket = true, SortOrder = 1 },
            new() { Name = "New Zealand", Code = "NZL", Code2 = "NZ", IsEmploymentMarket = true, IsMigrationMarket = true, SortOrder = 2 },
            
            // Major Employment Markets
            new() { Name = "United Kingdom", Code = "GBR", Code2 = "GB", IsEmploymentMarket = true, SortOrder = 3 },
            new() { Name = "United States", Code = "USA", Code2 = "US", IsEmploymentMarket = true, SortOrder = 4 },
            new() { Name = "Canada", Code = "CAN", Code2 = "CA", IsEmploymentMarket = true, SortOrder = 5 },
            new() { Name = "Singapore", Code = "SGP", Code2 = "SG", IsEmploymentMarket = true, SortOrder = 6 },
            new() { Name = "United Arab Emirates", Code = "ARE", Code2 = "AE", IsEmploymentMarket = true, SortOrder = 7 },
            
            // Migration Source Countries
            new() { Name = "India", Code = "IND", Code2 = "IN", IsMigrationMarket = true, SortOrder = 8 },
            new() { Name = "Philippines", Code = "PHL", Code2 = "PH", IsMigrationMarket = true, SortOrder = 9 },
            new() { Name = "China", Code = "CHN", Code2 = "CN", IsMigrationMarket = true, SortOrder = 10 },
            new() { Name = "Vietnam", Code = "VNM", Code2 = "VN", IsMigrationMarket = true, SortOrder = 11 },
            new() { Name = "Nepal", Code = "NPL", Code2 = "NP", IsMigrationMarket = true, SortOrder = 12 },
            new() { Name = "Pakistan", Code = "PAK", Code2 = "PK", IsMigrationMarket = true, SortOrder = 13 },
            new() { Name = "Bangladesh", Code = "BGD", Code2 = "BD", IsMigrationMarket = true, SortOrder = 14 },
            new() { Name = "Sri Lanka", Code = "LKA", Code2 = "LK", IsMigrationMarket = true, SortOrder = 15 },
            
            // Europe
            new() { Name = "Ireland", Code = "IRL", Code2 = "IE", IsEmploymentMarket = true, SortOrder = 16 },
            new() { Name = "Germany", Code = "DEU", Code2 = "DE", IsEmploymentMarket = true, SortOrder = 17 },
            new() { Name = "France", Code = "FRA", Code2 = "FR", IsEmploymentMarket = true, SortOrder = 18 },
            new() { Name = "Italy", Code = "ITA", Code2 = "IT", IsMigrationMarket = true, SortOrder = 19 },
            new() { Name = "Spain", Code = "ESP", Code2 = "ES", IsMigrationMarket = true, SortOrder = 20 },
            new() { Name = "Netherlands", Code = "NLD", Code2 = "NL", IsEmploymentMarket = true, SortOrder = 21 },
            new() { Name = "Switzerland", Code = "CHE", Code2 = "CH", IsEmploymentMarket = true, SortOrder = 22 },
            
            // Asia-Pacific
            new() { Name = "Japan", Code = "JPN", Code2 = "JP", IsEmploymentMarket = true, SortOrder = 23 },
            new() { Name = "South Korea", Code = "KOR", Code2 = "KR", IsEmploymentMarket = true, SortOrder = 24 },
            new() { Name = "Hong Kong", Code = "HKG", Code2 = "HK", IsEmploymentMarket = true, SortOrder = 25 },
            new() { Name = "Malaysia", Code = "MYS", Code2 = "MY", IsMigrationMarket = true, SortOrder = 26 },
            new() { Name = "Thailand", Code = "THA", Code2 = "TH", IsMigrationMarket = true, SortOrder = 27 },
            new() { Name = "Indonesia", Code = "IDN", Code2 = "ID", IsMigrationMarket = true, SortOrder = 28 },
            
            // Africa & Middle East
            new() { Name = "South Africa", Code = "ZAF", Code2 = "ZA", IsMigrationMarket = true, SortOrder = 29 },
            new() { Name = "Zimbabwe", Code = "ZWE", Code2 = "ZW", IsMigrationMarket = true, SortOrder = 30 },
            new() { Name = "Kenya", Code = "KEN", Code2 = "KE", IsMigrationMarket = true, SortOrder = 31 },
            new() { Name = "Saudi Arabia", Code = "SAU", Code2 = "SA", IsEmploymentMarket = true, SortOrder = 32 },
            new() { Name = "Qatar", Code = "QAT", Code2 = "QA", IsEmploymentMarket = true, SortOrder = 33 },
            
            // Americas
            new() { Name = "Brazil", Code = "BRA", Code2 = "BR", IsMigrationMarket = true, SortOrder = 34 },
            new() { Name = "Argentina", Code = "ARG", Code2 = "AR", IsMigrationMarket = true, SortOrder = 35 },
            new() { Name = "Chile", Code = "CHL", Code2 = "CL", IsMigrationMarket = true, SortOrder = 36 },
            new() { Name = "Mexico", Code = "MEX", Code2 = "MX", IsMigrationMarket = true, SortOrder = 37 },
        };
        
        await _context.Countries.AddRangeAsync(countries);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {countries.Count} countries");
    }

    private async Task SeedStatesAsync()
    {
        if (_context.States.Any()) return;
        
        _logger.LogInformation("Seeding States...");
        
        var australia = await _context.Countries.FirstAsync(c => c.Code == "AUS");
        
        var states = new List<State>
        {
            new() { Name = "New South Wales", Code = "NSW", CountryId = australia.Id, SortOrder = 1 },
            new() { Name = "Victoria", Code = "VIC", CountryId = australia.Id, SortOrder = 2 },
            new() { Name = "Queensland", Code = "QLD", CountryId = australia.Id, SortOrder = 3 },
            new() { Name = "Western Australia", Code = "WA", CountryId = australia.Id, SortOrder = 4 },
            new() { Name = "South Australia", Code = "SA", CountryId = australia.Id, SortOrder = 5 },
            new() { Name = "Tasmania", Code = "TAS", CountryId = australia.Id, SortOrder = 6 },
            new() { Name = "Australian Capital Territory", Code = "ACT", CountryId = australia.Id, SortOrder = 7 },
            new() { Name = "Northern Territory", Code = "NT", CountryId = australia.Id, SortOrder = 8 },
        };
        
        await _context.States.AddRangeAsync(states);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {states.Count} states");
    }

    private async Task SeedCitiesAsync()
    {
        if (_context.Cities.Any()) return;
        
        _logger.LogInformation("Seeding Cities...");
        
        var nsw = await _context.States.FirstAsync(s => s.Code == "NSW");
        var vic = await _context.States.FirstAsync(s => s.Code == "VIC");
        var qld = await _context.States.FirstAsync(s => s.Code == "QLD");
        var wa = await _context.States.FirstAsync(s => s.Code == "WA");
        var sa = await _context.States.FirstAsync(s => s.Code == "SA");
        var tas = await _context.States.FirstAsync(s => s.Code == "TAS");
        var act = await _context.States.FirstAsync(s => s.Code == "ACT");
        var nt = await _context.States.FirstAsync(s => s.Code == "NT");
        
        var cities = new List<City>
        {
            // NSW
            new() { Name = "Sydney", StateId = nsw.Id, Postcode = "2000", Latitude = -33.8688, Longitude = 151.2093, IsCapital = true, IsMajorCity = true, Population = 5312000, SortOrder = 1 },
            new() { Name = "Newcastle", StateId = nsw.Id, Postcode = "2300", Latitude = -32.9283, Longitude = 151.7817, IsMajorCity = true, Population = 322000, SortOrder = 2 },
            new() { Name = "Wollongong", StateId = nsw.Id, Postcode = "2500", Latitude = -34.4278, Longitude = 150.8931, IsMajorCity = true, Population = 302000, SortOrder = 3 },
            new() { Name = "Central Coast", StateId = nsw.Id, Postcode = "2250", Latitude = -33.4297, Longitude = 151.3418, Population = 340000, SortOrder = 4 },
            new() { Name = "Parramatta", StateId = nsw.Id, Postcode = "2150", Latitude = -33.8151, Longitude = 150.9989, Population = 250000, SortOrder = 5 },
            new() { Name = "Penrith", StateId = nsw.Id, Postcode = "2750", Latitude = -33.7507, Longitude = 150.6942, Population = 210000, SortOrder = 6 },
            new() { Name = "Coffs Harbour", StateId = nsw.Id, Postcode = "2450", Latitude = -30.2986, Longitude = 153.1162, Population = 72000, SortOrder = 7 },
            new() { Name = "Albury", StateId = nsw.Id, Postcode = "2640", Latitude = -36.0803, Longitude = 146.9163, Population = 54000, SortOrder = 8 },
            new() { Name = "Wagga Wagga", StateId = nsw.Id, Postcode = "2650", Latitude = -35.1082, Longitude = 147.3598, Population = 56000, SortOrder = 9 },
            new() { Name = "Port Macquarie", StateId = nsw.Id, Postcode = "2444", Latitude = -31.4309, Longitude = 152.9091, Population = 48000, SortOrder = 10 },
            
            // VIC
            new() { Name = "Melbourne", StateId = vic.Id, Postcode = "3000", Latitude = -37.8136, Longitude = 144.9631, IsCapital = true, IsMajorCity = true, Population = 5078000, SortOrder = 1 },
            new() { Name = "Geelong", StateId = vic.Id, Postcode = "3220", Latitude = -38.1499, Longitude = 144.3617, IsMajorCity = true, Population = 268000, SortOrder = 2 },
            new() { Name = "Ballarat", StateId = vic.Id, Postcode = "3350", Latitude = -37.5622, Longitude = 143.8503, Population = 109000, SortOrder = 3 },
            new() { Name = "Bendigo", StateId = vic.Id, Postcode = "3550", Latitude = -36.7570, Longitude = 144.2794, Population = 103000, SortOrder = 4 },
            new() { Name = "Shepparton", StateId = vic.Id, Postcode = "3630", Latitude = -36.3800, Longitude = 145.3986, Population = 51000, SortOrder = 5 },
            new() { Name = "Mildura", StateId = vic.Id, Postcode = "3500", Latitude = -34.1889, Longitude = 142.1583, Population = 35000, SortOrder = 6 },
            new() { Name = "Warrnambool", StateId = vic.Id, Postcode = "3280", Latitude = -38.3826, Longitude = 142.4869, Population = 35000, SortOrder = 7 },
            new() { Name = "Wodonga", StateId = vic.Id, Postcode = "3690", Latitude = -36.1217, Longitude = 146.8881, Population = 40000, SortOrder = 8 },
            
            // QLD
            new() { Name = "Brisbane", StateId = qld.Id, Postcode = "4000", Latitude = -27.4698, Longitude = 153.0251, IsCapital = true, IsMajorCity = true, Population = 2560000, SortOrder = 1 },
            new() { Name = "Gold Coast", StateId = qld.Id, Postcode = "4217", Latitude = -28.0167, Longitude = 153.4000, IsMajorCity = true, Population = 679000, SortOrder = 2 },
            new() { Name = "Sunshine Coast", StateId = qld.Id, Postcode = "4558", Latitude = -26.6500, Longitude = 153.0667, IsMajorCity = true, Population = 333000, SortOrder = 3 },
            new() { Name = "Townsville", StateId = qld.Id, Postcode = "4810", Latitude = -19.2590, Longitude = 146.8169, IsMajorCity = true, Population = 180000, SortOrder = 4 },
            new() { Name = "Cairns", StateId = qld.Id, Postcode = "4870", Latitude = -16.9186, Longitude = 145.7781, IsMajorCity = true, Population = 153000, SortOrder = 5 },
            new() { Name = "Toowoomba", StateId = qld.Id, Postcode = "4350", Latitude = -27.5598, Longitude = 151.9507, Population = 138000, SortOrder = 6 },
            new() { Name = "Mackay", StateId = qld.Id, Postcode = "4740", Latitude = -21.1430, Longitude = 149.1861, Population = 80000, SortOrder = 7 },
            new() { Name = "Rockhampton", StateId = qld.Id, Postcode = "4700", Latitude = -23.3780, Longitude = 150.5133, Population = 80000, SortOrder = 8 },
            new() { Name = "Bundaberg", StateId = qld.Id, Postcode = "4670", Latitude = -24.8661, Longitude = 152.3489, Population = 71000, SortOrder = 9 },
            new() { Name = "Hervey Bay", StateId = qld.Id, Postcode = "4655", Latitude = -25.2887, Longitude = 152.8702, Population = 55000, SortOrder = 10 },
            
            // WA
            new() { Name = "Perth", StateId = wa.Id, Postcode = "6000", Latitude = -31.9505, Longitude = 115.8605, IsCapital = true, IsMajorCity = true, Population = 2125000, SortOrder = 1 },
            new() { Name = "Mandurah", StateId = wa.Id, Postcode = "6210", Latitude = -32.5269, Longitude = 115.7217, Population = 90000, SortOrder = 2 },
            new() { Name = "Bunbury", StateId = wa.Id, Postcode = "6230", Latitude = -33.3272, Longitude = 115.6376, Population = 75000, SortOrder = 3 },
            new() { Name = "Geraldton", StateId = wa.Id, Postcode = "6530", Latitude = -28.7774, Longitude = 114.6144, Population = 39000, SortOrder = 4 },
            new() { Name = "Kalgoorlie", StateId = wa.Id, Postcode = "6430", Latitude = -30.7489, Longitude = 121.4658, Population = 30000, SortOrder = 5 },
            new() { Name = "Albany", StateId = wa.Id, Postcode = "6330", Latitude = -35.0269, Longitude = 117.8839, Population = 36000, SortOrder = 6 },
            
            // SA
            new() { Name = "Adelaide", StateId = sa.Id, Postcode = "5000", Latitude = -34.9285, Longitude = 138.6007, IsCapital = true, IsMajorCity = true, Population = 1376000, SortOrder = 1 },
            new() { Name = "Mount Gambier", StateId = sa.Id, Postcode = "5290", Latitude = -37.8283, Longitude = 140.7831, Population = 29000, SortOrder = 2 },
            new() { Name = "Whyalla", StateId = sa.Id, Postcode = "5600", Latitude = -33.0333, Longitude = 137.5667, Population = 22000, SortOrder = 3 },
            new() { Name = "Murray Bridge", StateId = sa.Id, Postcode = "5253", Latitude = -35.1194, Longitude = 139.2742, Population = 21000, SortOrder = 4 },
            
            // TAS
            new() { Name = "Hobart", StateId = tas.Id, Postcode = "7000", Latitude = -42.8821, Longitude = 147.3272, IsCapital = true, IsMajorCity = true, Population = 240000, SortOrder = 1 },
            new() { Name = "Launceston", StateId = tas.Id, Postcode = "7250", Latitude = -41.4332, Longitude = 147.1441, IsMajorCity = true, Population = 87000, SortOrder = 2 },
            new() { Name = "Devonport", StateId = tas.Id, Postcode = "7310", Latitude = -41.1789, Longitude = 146.3500, Population = 27000, SortOrder = 3 },
            new() { Name = "Burnie", StateId = tas.Id, Postcode = "7320", Latitude = -41.0519, Longitude = 145.9028, Population = 20000, SortOrder = 4 },
            
            // ACT
            new() { Name = "Canberra", StateId = act.Id, Postcode = "2600", Latitude = -35.2809, Longitude = 149.1300, IsCapital = true, IsMajorCity = true, Population = 456000, SortOrder = 1 },
            
            // NT
            new() { Name = "Darwin", StateId = nt.Id, Postcode = "0800", Latitude = -12.4634, Longitude = 130.8456, IsCapital = true, IsMajorCity = true, Population = 148000, SortOrder = 1 },
            new() { Name = "Alice Springs", StateId = nt.Id, Postcode = "0870", Latitude = -23.6980, Longitude = 133.8807, Population = 26000, SortOrder = 2 },
            new() { Name = "Palmerston", StateId = nt.Id, Postcode = "0830", Latitude = -12.4811, Longitude = 130.9831, Population = 33000, SortOrder = 3 },
        };
        
        await _context.Cities.AddRangeAsync(cities);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {cities.Count} cities");
    }
}
