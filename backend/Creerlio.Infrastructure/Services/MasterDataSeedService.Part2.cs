using Creerlio.Domain.Entities.MasterData;
using Creerlio.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Creerlio.Application.Services;

/// <summary>
/// Master Data Seeding - Part 2: Industries, Jobs, Education, Credentials
/// </summary>
public partial class MasterDataSeedService
{
    private async Task SeedIndustriesAsync()
    {
        if (_context.Industries.Any()) return;
        
        _logger.LogInformation("Seeding Industries...");
        
        var industries = new List<Industry>
        {
            new() { Name = "Accounting", Description = "Financial services and accounting", IconName = "calculator", SortOrder = 1 },
            new() { Name = "Administration & Office Support", Description = "Office and administrative roles", IconName = "clipboard", SortOrder = 2 },
            new() { Name = "Advertising, Arts & Media", Description = "Creative and media industries", IconName = "palette", SortOrder = 3 },
            new() { Name = "Banking & Financial Services", Description = "Banking and finance", IconName = "bank", SortOrder = 4 },
            new() { Name = "Call Centre & Customer Service", Description = "Customer support roles", IconName = "headset", SortOrder = 5 },
            new() { Name = "CEO & General Management", Description = "Executive leadership", IconName = "briefcase", SortOrder = 6 },
            new() { Name = "Community Services & Development", Description = "Social services", IconName = "users", SortOrder = 7 },
            new() { Name = "Construction", Description = "Building and construction", IconName = "hard-hat", SortOrder = 8 },
            new() { Name = "Consulting & Strategy", Description = "Business consulting", IconName = "lightbulb", SortOrder = 9 },
            new() { Name = "Design & Architecture", Description = "Design professions", IconName = "drafting-compass", SortOrder = 10 },
            new() { Name = "Education & Training", Description = "Teaching and education", IconName = "graduation-cap", SortOrder = 11 },
            new() { Name = "Engineering", Description = "Engineering disciplines", IconName = "cog", SortOrder = 12 },
            new() { Name = "Farming, Animals & Conservation", Description = "Agriculture and environment", IconName = "leaf", SortOrder = 13 },
            new() { Name = "Government & Defence", Description = "Public sector", IconName = "landmark", SortOrder = 14 },
            new() { Name = "Healthcare & Medical", Description = "Health services", IconName = "heart-pulse", SortOrder = 15 },
            new() { Name = "Hospitality & Tourism", Description = "Hotels, restaurants, travel", IconName = "hotel", SortOrder = 16 },
            new() { Name = "Human Resources & Recruitment", Description = "HR and recruitment", IconName = "user-plus", SortOrder = 17 },
            new() { Name = "Information & Communication Technology", Description = "IT and software", IconName = "laptop-code", SortOrder = 18 },
            new() { Name = "Insurance & Superannuation", Description = "Insurance industry", IconName = "shield", SortOrder = 19 },
            new() { Name = "Legal", Description = "Legal profession", IconName = "gavel", SortOrder = 20 },
            new() { Name = "Manufacturing, Transport & Logistics", Description = "Production and logistics", IconName = "truck", SortOrder = 21 },
            new() { Name = "Marketing & Communications", Description = "Marketing and PR", IconName = "megaphone", SortOrder = 22 },
            new() { Name = "Mining, Resources & Energy", Description = "Natural resources", IconName = "pickaxe", SortOrder = 23 },
            new() { Name = "Real Estate & Property", Description = "Property industry", IconName = "building", SortOrder = 24 },
            new() { Name = "Retail & Consumer Products", Description = "Retail sales", IconName = "shopping-cart", SortOrder = 25 },
            new() { Name = "Sales", Description = "Sales roles", IconName = "handshake", SortOrder = 26 },
            new() { Name = "Science & Technology", Description = "Scientific research", IconName = "flask", SortOrder = 27 },
            new() { Name = "Sport & Recreation", Description = "Sports and fitness", IconName = "dumbbell", SortOrder = 28 },
            new() { Name = "Trades & Services", Description = "Trade occupations", IconName = "wrench", SortOrder = 29 },
            new() { Name = "Transport & Logistics", Description = "Transport services", IconName = "truck-fast", SortOrder = 30 },
        };
        
        await _context.Industries.AddRangeAsync(industries);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {industries.Count} industries");
    }

    private async Task SeedJobCategoriesAsync()
    {
        if (_context.JobCategories.Any()) return;
        
        _logger.LogInformation("Seeding Job Categories...");
        
        var accounting = await _context.Industries.FirstAsync(i => i.Name == "Accounting");
        var construction = await _context.Industries.FirstAsync(i => i.Name == "Construction");
        var healthcare = await _context.Industries.FirstAsync(i => i.Name == "Healthcare & Medical");
        var ict = await _context.Industries.FirstAsync(i => i.Name == "Information & Communication Technology");
        var hospitality = await _context.Industries.FirstAsync(i => i.Name == "Hospitality & Tourism");
        
        var categories = new List<JobCategory>
        {
            // Accounting (16 types)
            new() { Name = "Accounts Officers/Clerks", IndustryId = accounting.Id, SortOrder = 1 },
            new() { Name = "Accounts Payable", IndustryId = accounting.Id, SortOrder = 2 },
            new() { Name = "Accounts Receivable", IndustryId = accounting.Id, SortOrder = 3 },
            new() { Name = "Audit - Internal", IndustryId = accounting.Id, SortOrder = 4 },
            new() { Name = "Audit - External", IndustryId = accounting.Id, SortOrder = 5 },
            new() { Name = "Bookkeeping & Small Practice Accounting", IndustryId = accounting.Id, SortOrder = 6 },
            new() { Name = "Business Services & Corporate Advisory", IndustryId = accounting.Id, SortOrder = 7 },
            new() { Name = "Company Secretaries", IndustryId = accounting.Id, SortOrder = 8 },
            new() { Name = "Financial Accounting & Reporting", IndustryId = accounting.Id, SortOrder = 9 },
            new() { Name = "Financial Managers & Controllers", IndustryId = accounting.Id, SortOrder = 10 },
            new() { Name = "Forensic Accounting", IndustryId = accounting.Id, SortOrder = 11 },
            new() { Name = "Insolvency & Corporate Recovery", IndustryId = accounting.Id, SortOrder = 12 },
            new() { Name = "Management Accounting & Budgeting", IndustryId = accounting.Id, SortOrder = 13 },
            new() { Name = "Payroll", IndustryId = accounting.Id, SortOrder = 14 },
            new() { Name = "Taxation", IndustryId = accounting.Id, SortOrder = 15 },
            new() { Name = "Treasury", IndustryId = accounting.Id, SortOrder = 16 },
            
            // Construction (25+ specializations)
            new() { Name = "Air Conditioning & Refrigeration", IndustryId = construction.Id, SortOrder = 1 },
            new() { Name = "Bricklaying", IndustryId = construction.Id, SortOrder = 2 },
            new() { Name = "Building Surveyors & Inspectors", IndustryId = construction.Id, SortOrder = 3 },
            new() { Name = "Carpentry & Cabinet Making", IndustryId = construction.Id, SortOrder = 4 },
            new() { Name = "Civil Engineering", IndustryId = construction.Id, SortOrder = 5 },
            new() { Name = "Concreting", IndustryId = construction.Id, SortOrder = 6 },
            new() { Name = "Electrical", IndustryId = construction.Id, SortOrder = 7 },
            new() { Name = "Estimating", IndustryId = construction.Id, SortOrder = 8 },
            new() { Name = "Foremen/Supervisors", IndustryId = construction.Id, SortOrder = 9 },
            new() { Name = "Health, Safety & Environment", IndustryId = construction.Id, SortOrder = 10 },
            new() { Name = "Landscaping", IndustryId = construction.Id, SortOrder = 11 },
            new() { Name = "Painting & Decorating", IndustryId = construction.Id, SortOrder = 12 },
            new() { Name = "Plant & Machinery Operators", IndustryId = construction.Id, SortOrder = 13 },
            new() { Name = "Plumbing", IndustryId = construction.Id, SortOrder = 14 },
            new() { Name = "Project Management", IndustryId = construction.Id, SortOrder = 15 },
            new() { Name = "Roofing", IndustryId = construction.Id, SortOrder = 16 },
            new() { Name = "Scaffolding", IndustryId = construction.Id, SortOrder = 17 },
            new() { Name = "Site Management", IndustryId = construction.Id, SortOrder = 18 },
            new() { Name = "Surveying", IndustryId = construction.Id, SortOrder = 19 },
            new() { Name = "Tiling & Stone Laying", IndustryId = construction.Id, SortOrder = 20 },
            
            // Healthcare (23 specializations)
            new() { Name = "Aged & Disability Support", IndustryId = healthcare.Id, SortOrder = 1 },
            new() { Name = "Ambulance/Paramedics", IndustryId = healthcare.Id, SortOrder = 2 },
            new() { Name = "Chiropractic & Osteopathic", IndustryId = healthcare.Id, SortOrder = 3 },
            new() { Name = "Clinical/Medical Research", IndustryId = healthcare.Id, SortOrder = 4 },
            new() { Name = "Dental", IndustryId = healthcare.Id, SortOrder = 5 },
            new() { Name = "Dieticians", IndustryId = healthcare.Id, SortOrder = 6 },
            new() { Name = "General Practitioners", IndustryId = healthcare.Id, SortOrder = 7 },
            new() { Name = "Hospital Pharmacy", IndustryId = healthcare.Id, SortOrder = 8 },
            new() { Name = "Massage Therapy", IndustryId = healthcare.Id, SortOrder = 9 },
            new() { Name = "Medical Administration", IndustryId = healthcare.Id, SortOrder = 10 },
            new() { Name = "Medical Imaging", IndustryId = healthcare.Id, SortOrder = 11 },
            new() { Name = "Mental Health", IndustryId = healthcare.Id, SortOrder = 12 },
            new() { Name = "Nursing - A&E, Critical Care & ICU", IndustryId = healthcare.Id, SortOrder = 13 },
            new() { Name = "Nursing - Aged Care", IndustryId = healthcare.Id, SortOrder = 14 },
            new() { Name = "Nursing - General Medical & Surgical", IndustryId = healthcare.Id, SortOrder = 15 },
            new() { Name = "Nursing - Paediatric & NICU", IndustryId = healthcare.Id, SortOrder = 16 },
            new() { Name = "Occupational Therapy", IndustryId = healthcare.Id, SortOrder = 17 },
            new() { Name = "Optometry", IndustryId = healthcare.Id, SortOrder = 18 },
            new() { Name = "Pharmacy", IndustryId = healthcare.Id, SortOrder = 19 },
            new() { Name = "Physiotherapy", IndustryId = healthcare.Id, SortOrder = 20 },
            new() { Name = "Psychology", IndustryId = healthcare.Id, SortOrder = 21 },
            new() { Name = "Speech Therapy", IndustryId = healthcare.Id, SortOrder = 22 },
            new() { Name = "Specialists - Medical", IndustryId = healthcare.Id, SortOrder = 23 },
            
            // ICT (26 specializations)
            new() { Name = "Analysis & Reporting", IndustryId = ict.Id, SortOrder = 1 },
            new() { Name = "Architects", IndustryId = ict.Id, SortOrder = 2 },
            new() { Name = "Business/Systems Analysts", IndustryId = ict.Id, SortOrder = 3 },
            new() { Name = "Cloud Computing", IndustryId = ict.Id, SortOrder = 4 },
            new() { Name = "Computer Operators", IndustryId = ict.Id, SortOrder = 5 },
            new() { Name = "Consultants", IndustryId = ict.Id, SortOrder = 6 },
            new() { Name = "Cyber Security", IndustryId = ict.Id, SortOrder = 7 },
            new() { Name = "Database Development & Administration", IndustryId = ict.Id, SortOrder = 8 },
            new() { Name = "Developers/Programmers", IndustryId = ict.Id, SortOrder = 9 },
            new() { Name = "DevOps", IndustryId = ict.Id, SortOrder = 10 },
            new() { Name = "Engineering - Hardware", IndustryId = ict.Id, SortOrder = 11 },
            new() { Name = "Engineering - Network", IndustryId = ict.Id, SortOrder = 12 },
            new() { Name = "Engineering - Software", IndustryId = ict.Id, SortOrder = 13 },
            new() { Name = "Help Desk & IT Support", IndustryId = ict.Id, SortOrder = 14 },
            new() { Name = "Management", IndustryId = ict.Id, SortOrder = 15 },
            new() { Name = "Mobile Development", IndustryId = ict.Id, SortOrder = 16 },
            new() { Name = "Networks & Systems Administration", IndustryId = ict.Id, SortOrder = 17 },
            new() { Name = "Product Management", IndustryId = ict.Id, SortOrder = 18 },
            new() { Name = "Programme & Project Management", IndustryId = ict.Id, SortOrder = 19 },
            new() { Name = "Quality Assurance & Testing", IndustryId = ict.Id, SortOrder = 20 },
            new() { Name = "Sales - Pre & Post", IndustryId = ict.Id, SortOrder = 21 },
            new() { Name = "SAP", IndustryId = ict.Id, SortOrder = 22 },
            new() { Name = "Security", IndustryId = ict.Id, SortOrder = 23 },
            new() { Name = "Telecommunications", IndustryId = ict.Id, SortOrder = 24 },
            new() { Name = "Web Development & Production", IndustryId = ict.Id, SortOrder = 25 },
            new() { Name = "Artificial Intelligence & Machine Learning", IndustryId = ict.Id, SortOrder = 26 },
            
            // Hospitality & Tourism (15 roles)
            new() { Name = "Bar & Beverage Staff", IndustryId = hospitality.Id, SortOrder = 1 },
            new() { Name = "Chefs/Cooks", IndustryId = hospitality.Id, SortOrder = 2 },
            new() { Name = "Front Office & Guest Services", IndustryId = hospitality.Id, SortOrder = 3 },
            new() { Name = "Gaming", IndustryId = hospitality.Id, SortOrder = 4 },
            new() { Name = "Housekeeping", IndustryId = hospitality.Id, SortOrder = 5 },
            new() { Name = "Kitchen & Sandwich Hands", IndustryId = hospitality.Id, SortOrder = 6 },
            new() { Name = "Management - Accommodation & Facilities", IndustryId = hospitality.Id, SortOrder = 7 },
            new() { Name = "Management - Events", IndustryId = hospitality.Id, SortOrder = 8 },
            new() { Name = "Management - Food & Beverage", IndustryId = hospitality.Id, SortOrder = 9 },
            new() { Name = "Management - Hotel & Resort", IndustryId = hospitality.Id, SortOrder = 10 },
            new() { Name = "Management - Pubs & Clubs", IndustryId = hospitality.Id, SortOrder = 11 },
            new() { Name = "Reservations", IndustryId = hospitality.Id, SortOrder = 12 },
            new() { Name = "Tour Guides", IndustryId = hospitality.Id, SortOrder = 13 },
            new() { Name = "Travel Agents/Consultants", IndustryId = hospitality.Id, SortOrder = 14 },
            new() { Name = "Waiting Staff", IndustryId = hospitality.Id, SortOrder = 15 },
        };
        
        await _context.JobCategories.AddRangeAsync(categories);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {categories.Count} job categories");
    }

    private async Task SeedUniversitiesAsync()
    {
        if (_context.Universities.Any()) return;
        
        _logger.LogInformation("Seeding Universities...");
        
        var universities = new List<University>
        {
            // NSW
            new() { Name = "University of Sydney", Abbreviation = "USYD", City = "Sydney", StateCode = "NSW", WebsiteUrl = "https://sydney.edu.au", IsGroupOfEight = true },
            new() { Name = "University of New South Wales", Abbreviation = "UNSW", City = "Sydney", StateCode = "NSW", WebsiteUrl = "https://unsw.edu.au", IsGroupOfEight = true },
            new() { Name = "Macquarie University", Abbreviation = "MQ", City = "Sydney", StateCode = "NSW", WebsiteUrl = "https://mq.edu.au" },
            new() { Name = "University of Technology Sydney", Abbreviation = "UTS", City = "Sydney", StateCode = "NSW", WebsiteUrl = "https://uts.edu.au" },
            new() { Name = "Western Sydney University", Abbreviation = "WSU", City = "Sydney", StateCode = "NSW", WebsiteUrl = "https://westernsydney.edu.au" },
            new() { Name = "University of Newcastle", Abbreviation = "UON", City = "Newcastle", StateCode = "NSW", WebsiteUrl = "https://newcastle.edu.au" },
            new() { Name = "University of Wollongong", Abbreviation = "UOW", City = "Wollongong", StateCode = "NSW", WebsiteUrl = "https://uow.edu.au" },
            new() { Name = "Charles Sturt University", Abbreviation = "CSU", City = "Bathurst", StateCode = "NSW", WebsiteUrl = "https://csu.edu.au" },
            new() { Name = "Southern Cross University", Abbreviation = "SCU", City = "Lismore", StateCode = "NSW", WebsiteUrl = "https://scu.edu.au" },
            new() { Name = "University of New England", Abbreviation = "UNE", City = "Armidale", StateCode = "NSW", WebsiteUrl = "https://une.edu.au" },
            
            // VIC
            new() { Name = "University of Melbourne", Abbreviation = "UniMelb", City = "Melbourne", StateCode = "VIC", WebsiteUrl = "https://unimelb.edu.au", IsGroupOfEight = true },
            new() { Name = "Monash University", Abbreviation = "Monash", City = "Melbourne", StateCode = "VIC", WebsiteUrl = "https://monash.edu", IsGroupOfEight = true },
            new() { Name = "RMIT University", Abbreviation = "RMIT", City = "Melbourne", StateCode = "VIC", WebsiteUrl = "https://rmit.edu.au" },
            new() { Name = "Deakin University", Abbreviation = "Deakin", City = "Melbourne", StateCode = "VIC", WebsiteUrl = "https://deakin.edu.au" },
            new() { Name = "La Trobe University", Abbreviation = "La Trobe", City = "Melbourne", StateCode = "VIC", WebsiteUrl = "https://latrobe.edu.au" },
            new() { Name = "Swinburne University of Technology", Abbreviation = "Swinburne", City = "Melbourne", StateCode = "VIC", WebsiteUrl = "https://swinburne.edu.au" },
            new() { Name = "Victoria University", Abbreviation = "VU", City = "Melbourne", StateCode = "VIC", WebsiteUrl = "https://vu.edu.au" },
            new() { Name = "Federation University Australia", Abbreviation = "FedUni", City = "Ballarat", StateCode = "VIC", WebsiteUrl = "https://federation.edu.au" },
            
            // QLD
            new() { Name = "University of Queensland", Abbreviation = "UQ", City = "Brisbane", StateCode = "QLD", WebsiteUrl = "https://uq.edu.au", IsGroupOfEight = true },
            new() { Name = "Queensland University of Technology", Abbreviation = "QUT", City = "Brisbane", StateCode = "QLD", WebsiteUrl = "https://qut.edu.au" },
            new() { Name = "Griffith University", Abbreviation = "Griffith", City = "Brisbane", StateCode = "QLD", WebsiteUrl = "https://griffith.edu.au" },
            new() { Name = "Bond University", Abbreviation = "Bond", City = "Gold Coast", StateCode = "QLD", WebsiteUrl = "https://bond.edu.au" },
            new() { Name = "James Cook University", Abbreviation = "JCU", City = "Townsville", StateCode = "QLD", WebsiteUrl = "https://jcu.edu.au" },
            new() { Name = "Central Queensland University", Abbreviation = "CQU", City = "Rockhampton", StateCode = "QLD", WebsiteUrl = "https://cqu.edu.au" },
            new() { Name = "University of Southern Queensland", Abbreviation = "USQ", City = "Toowoomba", StateCode = "QLD", WebsiteUrl = "https://usq.edu.au" },
            new() { Name = "University of the Sunshine Coast", Abbreviation = "USC", City = "Sunshine Coast", StateCode = "QLD", WebsiteUrl = "https://usc.edu.au" },
            
            // WA
            new() { Name = "University of Western Australia", Abbreviation = "UWA", City = "Perth", StateCode = "WA", WebsiteUrl = "https://uwa.edu.au", IsGroupOfEight = true },
            new() { Name = "Curtin University", Abbreviation = "Curtin", City = "Perth", StateCode = "WA", WebsiteUrl = "https://curtin.edu.au" },
            new() { Name = "Murdoch University", Abbreviation = "Murdoch", City = "Perth", StateCode = "WA", WebsiteUrl = "https://murdoch.edu.au" },
            new() { Name = "Edith Cowan University", Abbreviation = "ECU", City = "Perth", StateCode = "WA", WebsiteUrl = "https://ecu.edu.au" },
            
            // SA
            new() { Name = "University of Adelaide", Abbreviation = "UofA", City = "Adelaide", StateCode = "SA", WebsiteUrl = "https://adelaide.edu.au", IsGroupOfEight = true },
            new() { Name = "University of South Australia", Abbreviation = "UniSA", City = "Adelaide", StateCode = "SA", WebsiteUrl = "https://unisa.edu.au" },
            new() { Name = "Flinders University", Abbreviation = "Flinders", City = "Adelaide", StateCode = "SA", WebsiteUrl = "https://flinders.edu.au" },
            
            // TAS
            new() { Name = "University of Tasmania", Abbreviation = "UTAS", City = "Hobart", StateCode = "TAS", WebsiteUrl = "https://utas.edu.au" },
            
            // ACT
            new() { Name = "Australian National University", Abbreviation = "ANU", City = "Canberra", StateCode = "ACT", WebsiteUrl = "https://anu.edu.au", IsGroupOfEight = true },
            new() { Name = "University of Canberra", Abbreviation = "UC", City = "Canberra", StateCode = "ACT", WebsiteUrl = "https://canberra.edu.au" },
            
            // NT
            new() { Name = "Charles Darwin University", Abbreviation = "CDU", City = "Darwin", StateCode = "NT", WebsiteUrl = "https://cdu.edu.au" },
        };
        
        await _context.Universities.AddRangeAsync(universities);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {universities.Count} universities");
    }

    private async Task SeedTAFEInstitutesAsync()
    {
        if (_context.TAFEInstitutes.Any()) return;
        
        _logger.LogInformation("Seeding TAFE Institutes...");
        
        var tafes = new List<TAFEInstitute>
        {
            // NSW
            new() { Name = "TAFE NSW", StateCode = "NSW", WebsiteUrl = "https://tafensw.edu.au" },
            new() { Name = "TAFE Digital", StateCode = "NSW", WebsiteUrl = "https://tafedigital.edu.au" },
            
            // VIC
            new() { Name = "Box Hill Institute", StateCode = "VIC", WebsiteUrl = "https://boxhill.edu.au" },
            new() { Name = "Chisholm Institute", StateCode = "VIC", WebsiteUrl = "https://chisholm.edu.au" },
            new() { Name = "Holmesglen Institute", StateCode = "VIC", WebsiteUrl = "https://holmesglen.edu.au" },
            new() { Name = "Kangan Institute", StateCode = "VIC", WebsiteUrl = "https://kangan.edu.au" },
            new() { Name = "Melbourne Polytechnic", StateCode = "VIC", WebsiteUrl = "https://melbournepolytechnic.edu.au" },
            new() { Name = "RMIT TAFE", StateCode = "VIC", WebsiteUrl = "https://rmit.edu.au/study-with-us/levels-of-study/tafe-courses" },
            new() { Name = "Swinburne TAFE", StateCode = "VIC", WebsiteUrl = "https://swinburne.edu.au/study/tafe" },
            new() { Name = "William Angliss Institute", StateCode = "VIC", WebsiteUrl = "https://angliss.edu.au" },
            
            // QLD
            new() { Name = "TAFE Queensland", StateCode = "QLD", WebsiteUrl = "https://tafeqld.edu.au" },
            
            // WA
            new() { Name = "North Metropolitan TAFE", StateCode = "WA", WebsiteUrl = "https://northmetrotafe.wa.edu.au" },
            new() { Name = "South Metropolitan TAFE", StateCode = "WA", WebsiteUrl = "https://southmetrotafe.wa.edu.au" },
            new() { Name = "South Regional TAFE", StateCode = "WA", WebsiteUrl = "https://southregionaltafe.wa.edu.au" },
            new() { Name = "North Regional TAFE", StateCode = "WA", WebsiteUrl = "https://northregionaltafe.wa.edu.au" },
            new() { Name = "Central Regional TAFE", StateCode = "WA", WebsiteUrl = "https://centralregionaltafe.wa.edu.au" },
            
            // SA
            new() { Name = "TAFE SA", StateCode = "SA", WebsiteUrl = "https://tafesa.edu.au" },
            
            // TAS
            new() { Name = "TasTAFE", StateCode = "TAS", WebsiteUrl = "https://tastafe.tas.edu.au" },
            
            // ACT
            new() { Name = "Canberra Institute of Technology", StateCode = "ACT", WebsiteUrl = "https://cit.edu.au" },
            
            // NT
            new() { Name = "Charles Darwin University - VET", StateCode = "NT", WebsiteUrl = "https://cdu.edu.au/vet" },
        };
        
        await _context.TAFEInstitutes.AddRangeAsync(tafes);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {tafes.Count} TAFE institutes");
    }
}
