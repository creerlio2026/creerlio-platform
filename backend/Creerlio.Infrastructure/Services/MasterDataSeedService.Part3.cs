using Creerlio.Domain.Entities.MasterData;
using Creerlio.Infrastructure;
using Microsoft.Extensions.Logging;

namespace Creerlio.Application.Services;

/// <summary>
/// Master Data Seeding - Part 3: Education Levels, Credentials, Visas, Skills
/// </summary>
public partial class MasterDataSeedService
{
    private async Task SeedEducationLevelsAsync()
    {
        if (_context.EducationLevels.Any()) return;
        
        _logger.LogInformation("Seeding Education Levels...");
        
        var levels = new List<EducationLevel>
        {
            new() { Name = "Certificate I", Code = "AQF1", Level = 1, Description = "Basic introductory skills", SortOrder = 1 },
            new() { Name = "Certificate II", Code = "AQF2", Level = 2, Description = "Basic vocational skills", SortOrder = 2 },
            new() { Name = "Certificate III", Code = "AQF3", Level = 3, Description = "Trade/vocational qualifications", SortOrder = 3 },
            new() { Name = "Certificate IV", Code = "AQF4", Level = 4, Description = "Supervisor/technical roles", SortOrder = 4 },
            new() { Name = "Diploma", Code = "AQF5", Level = 5, Description = "Advanced skills and knowledge", SortOrder = 5 },
            new() { Name = "Advanced Diploma", Code = "AQF6", Level = 6, Description = "Specialist/management roles", SortOrder = 6 },
            new() { Name = "Associate Degree", Code = "AQF6", Level = 6, Description = "Para-professional work", SortOrder = 7 },
            new() { Name = "Bachelor Degree", Code = "AQF7", Level = 7, Description = "Undergraduate degree", SortOrder = 8 },
            new() { Name = "Bachelor Honours Degree", Code = "AQF8", Level = 8, Description = "Higher level undergraduate", SortOrder = 9 },
            new() { Name = "Graduate Certificate", Code = "AQF8", Level = 8, Description = "Postgraduate certificate", SortOrder = 10 },
            new() { Name = "Graduate Diploma", Code = "AQF8", Level = 8, Description = "Postgraduate diploma", SortOrder = 11 },
            new() { Name = "Master Degree (Coursework)", Code = "AQF9", Level = 9, Description = "Postgraduate masters", SortOrder = 12 },
            new() { Name = "Master Degree (Research)", Code = "AQF9", Level = 9, Description = "Research masters", SortOrder = 13 },
            new() { Name = "Doctoral Degree", Code = "AQF10", Level = 10, Description = "PhD and research doctorate", SortOrder = 14 },
            new() { Name = "Higher Doctorate", Code = "AQF10+", Level = 11, Description = "Advanced doctoral qualifications", SortOrder = 15 },
            new() { Name = "Secondary School - Year 10", Code = "YR10", Level = 0, Description = "School completion", SortOrder = 16 },
            new() { Name = "Secondary School - Year 12", Code = "YR12", Level = 0, Description = "High school completion", SortOrder = 17 },
        };
        
        await _context.EducationLevels.AddRangeAsync(levels);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {levels.Count} education levels");
    }

    private async Task SeedCredentialTypesAsync()
    {
        if (_context.CredentialTypes.Any()) return;
        
        _logger.LogInformation("Seeding Credential Types...");
        
        var credentials = new List<CredentialType>
        {
            // Construction & Building (50+ credentials from spec)
            new() { Name = "White Card (General Construction Induction)", Category = "Construction", SubCategory = "Building", Description = "Mandatory safety induction for construction", RequiresRenewal = false, IssuingAuthority = "SafeWork", SortOrder = 1 },
            new() { Name = "Working at Heights", Category = "Construction", SubCategory = "Building", Description = "High-risk work licence", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 2 },
            new() { Name = "Confined Space Entry", Category = "Construction", SubCategory = "Building", Description = "High-risk work licence", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 3 },
            new() { Name = "Forklift Licence (LF)", Category = "Construction", SubCategory = "Plant", Description = "Forklift operator licence", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 4 },
            new() { Name = "Elevated Work Platform (EWP) <11m", Category = "Construction", SubCategory = "Plant", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 5 },
            new() { Name = "Elevated Work Platform (EWP) >11m", Category = "Construction", SubCategory = "Plant", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 6 },
            new() { Name = "Scaffolding - Basic", Category = "Construction", SubCategory = "Scaffolding", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 7 },
            new() { Name = "Rigging - Basic (RB)", Category = "Construction", SubCategory = "Rigging", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 8 },
            new() { Name = "Rigging - Intermediate (RI)", Category = "Construction", SubCategory = "Rigging", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 9 },
            new() { Name = "Rigging - Advanced (RA)", Category = "Construction", SubCategory = "Rigging", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 10 },
            new() { Name = "Dogging (DG)", Category = "Construction", SubCategory = "Rigging", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "SafeWork", SortOrder = 11 },
            new() { Name = "Electrical Licence - A Grade", Category = "Construction", SubCategory = "Electrical", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Electrical Safety Office", SortOrder = 12 },
            new() { Name = "Plumbing Licence - General", Category = "Construction", SubCategory = "Plumbing", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Plumbing Board", SortOrder = 13 },
            new() { Name = "Builder's Licence - Class 1", Category = "Construction", SubCategory = "Building", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Building Commission", SortOrder = 14 },
            
            // Transport & Logistics
            new() { Name = "Car Licence (C Class)", Category = "Transport", SubCategory = "Driving", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Roads Authority", SortOrder = 15 },
            new() { Name = "Light Rigid (LR)", Category = "Transport", SubCategory = "Driving", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Roads Authority", SortOrder = 16 },
            new() { Name = "Medium Rigid (MR)", Category = "Transport", SubCategory = "Driving", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Roads Authority", SortOrder = 17 },
            new() { Name = "Heavy Rigid (HR)", Category = "Transport", SubCategory = "Driving", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Roads Authority", SortOrder = 18 },
            new() { Name = "Heavy Combination (HC)", Category = "Transport", SubCategory = "Driving", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Roads Authority", SortOrder = 19 },
            new() { Name = "Multi Combination (MC)", Category = "Transport", SubCategory = "Driving", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Roads Authority", SortOrder = 20 },
            new() { Name = "Dangerous Goods Licence", Category = "Transport", SubCategory = "Driving", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Transport Authority", SortOrder = 21 },
            
            // Healthcare & Medical
            new() { Name = "AHPRA Registration - Medical Practitioner", Category = "Healthcare", SubCategory = "Medical", Description = "Medical doctor registration", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "AHPRA", VerificationUrl = "https://www.ahpra.gov.au", SortOrder = 22 },
            new() { Name = "AHPRA Registration - Registered Nurse", Category = "Healthcare", SubCategory = "Nursing", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "AHPRA", VerificationUrl = "https://www.ahpra.gov.au", SortOrder = 23 },
            new() { Name = "AHPRA Registration - Enrolled Nurse", Category = "Healthcare", SubCategory = "Nursing", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "AHPRA", VerificationUrl = "https://www.ahpra.gov.au", SortOrder = 24 },
            new() { Name = "AHPRA Registration - Physiotherapist", Category = "Healthcare", SubCategory = "Allied Health", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "AHPRA", VerificationUrl = "https://www.ahpra.gov.au", SortOrder = 25 },
            new() { Name = "AHPRA Registration - Pharmacist", Category = "Healthcare", SubCategory = "Pharmacy", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "AHPRA", VerificationUrl = "https://www.ahpra.gov.au", SortOrder = 26 },
            new() { Name = "CPR & First Aid Certificate", Category = "Healthcare", SubCategory = "First Aid", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "RTO", SortOrder = 27 },
            new() { Name = "Mental Health First Aid", Category = "Healthcare", SubCategory = "First Aid", RequiresRenewal = true, RenewalMonths = 36, IssuingAuthority = "MHFA Australia", SortOrder = 28 },
            new() { Name = "NDIS Worker Screening Check", Category = "Healthcare", SubCategory = "Screening", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "NDIS Commission", SortOrder = 29 },
            new() { Name = "Working With Children Check", Category = "Healthcare", SubCategory = "Screening", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "State Government", SortOrder = 30 },
            
            // Hospitality & Food Services
            new() { Name = "Responsible Service of Alcohol (RSA)", Category = "Hospitality", SubCategory = "Licensing", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "State Liquor Authority", SortOrder = 31 },
            new() { Name = "Responsible Conduct of Gambling (RCG)", Category = "Hospitality", SubCategory = "Licensing", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Gaming Authority", SortOrder = 32 },
            new() { Name = "Food Safety Supervisor Certificate", Category = "Hospitality", SubCategory = "Food Safety", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "RTO", SortOrder = 33 },
            new() { Name = "Food Handler Certificate", Category = "Hospitality", SubCategory = "Food Safety", RequiresRenewal = false, IssuingAuthority = "RTO", SortOrder = 34 },
            
            // IT & Security
            new() { Name = "AWS Certified Solutions Architect - Associate", Category = "IT", SubCategory = "Cloud", RequiresRenewal = true, RenewalMonths = 36, IssuingAuthority = "Amazon Web Services", SortOrder = 35 },
            new() { Name = "Microsoft Certified: Azure Administrator", Category = "IT", SubCategory = "Cloud", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "Microsoft", SortOrder = 36 },
            new() { Name = "Cisco CCNA", Category = "IT", SubCategory = "Networking", RequiresRenewal = true, RenewalMonths = 36, IssuingAuthority = "Cisco", SortOrder = 37 },
            new() { Name = "CompTIA Security+", Category = "IT", SubCategory = "Security", RequiresRenewal = true, RenewalMonths = 36, IssuingAuthority = "CompTIA", SortOrder = 38 },
            new() { Name = "CISSP", Category = "IT", SubCategory = "Security", RequiresRenewal = true, RenewalMonths = 36, IssuingAuthority = "(ISC)²", SortOrder = 39 },
            
            // Security
            new() { Name = "Security Licence - Class 1", Category = "Security", SubCategory = "Licensing", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Police Licensing", SortOrder = 40 },
            new() { Name = "Crowd Controller Licence", Category = "Security", SubCategory = "Licensing", RequiresRenewal = true, RenewalMonths = 60, IssuingAuthority = "Police Licensing", SortOrder = 41 },
            new() { Name = "National Police Certificate", Category = "Security", SubCategory = "Screening", RequiresRenewal = false, IssuingAuthority = "Australian Federal Police", SortOrder = 42 },
            
            // Education
            new() { Name = "VIT Registration (Victoria)", Category = "Education", SubCategory = "Teaching", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "VIT", SortOrder = 43 },
            new() { Name = "TESOL / CELTA", Category = "Education", SubCategory = "Teaching", RequiresRenewal = false, IssuingAuthority = "Cambridge English", SortOrder = 44 },
            
            // Finance & Accounting
            new() { Name = "CPA Australia", Category = "Finance", SubCategory = "Accounting", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "CPA Australia", SortOrder = 45 },
            new() { Name = "Chartered Accountants ANZ (CA ANZ)", Category = "Finance", SubCategory = "Accounting", RequiresRenewal = true, RenewalMonths = 12, IssuingAuthority = "CA ANZ", SortOrder = 46 },
            new() { Name = "RG146 Compliance", Category = "Finance", SubCategory = "Financial Services", RequiresRenewal = false, IssuingAuthority = "ASIC", SortOrder = 47 },
            
            // Real Estate
            new() { Name = "Real Estate Agent Licence (Full)", Category = "Real Estate", SubCategory = "Licensing", RequiresRenewal = true, RenewalMonths = 36, IssuingAuthority = "Fair Trading", SortOrder = 48 },
            new() { Name = "Real Estate Agent - Sales Representative", Category = "Real Estate", SubCategory = "Licensing", RequiresRenewal = true, RenewalMonths = 36, IssuingAuthority = "Fair Trading", SortOrder = 49 },
            
            // Fitness
            new() { Name = "Certificate III in Fitness", Category = "Fitness", SubCategory = "Personal Training", RequiresRenewal = false, IssuingAuthority = "RTO", SortOrder = 50 },
            new() { Name = "Certificate IV in Fitness", Category = "Fitness", SubCategory = "Personal Training", RequiresRenewal = false, IssuingAuthority = "RTO", SortOrder = 51 },
        };
        
        await _context.CredentialTypes.AddRangeAsync(credentials);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {credentials.Count} credential types");
    }

    private async Task SeedVisaTypesAsync()
    {
        if (_context.VisaTypes.Any()) return;
        
        _logger.LogInformation("Seeding Visa Types...");
        
        var visas = new List<VisaType>
        {
            // Citizenship & Permanent Residence
            new() { Name = "Australian Citizen", SubclassCode = "N/A", Category = "Citizenship", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 1 },
            new() { Name = "Permanent Resident", SubclassCode = "N/A", Category = "Permanent", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 2 },
            new() { Name = "New Zealand Citizen (SCV 444)", SubclassCode = "444", Category = "Special", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 3 },
            
            // Skilled Migration
            new() { Name = "Skilled Independent Visa", SubclassCode = "189", Category = "Skilled", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 4 },
            new() { Name = "Skilled Nominated Visa", SubclassCode = "190", Category = "Skilled", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 5 },
            new() { Name = "Skilled Work Regional Visa (Provisional)", SubclassCode = "491", Category = "Skilled", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 6 },
            new() { Name = "Skilled Employer Sponsored Regional (Provisional)", SubclassCode = "494", Category = "Skilled", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 7 },
            
            // Employer-Sponsored
            new() { Name = "Temporary Skill Shortage (TSS)", SubclassCode = "482", Category = "Employer-Sponsored", HasFullWorkRights = true, AllowsEmployerSponsorship = true, PathwayToPermanentResidence = true, SortOrder = 8 },
            new() { Name = "Employer Nomination Scheme (ENS)", SubclassCode = "186", Category = "Employer-Sponsored", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 9 },
            new() { Name = "Regional Sponsored Migration Scheme", SubclassCode = "187", Category = "Employer-Sponsored", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 10 },
            
            // Student Visas
            new() { Name = "Student Visa", SubclassCode = "500", Category = "Student", HasLimitedWorkRights = true, WorkHoursPerWeekLimit = 48, PathwayToPermanentResidence = false, SortOrder = 11 },
            new() { Name = "Temporary Graduate Visa - Graduate Work Stream", SubclassCode = "485", Category = "Graduate", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 12 },
            new() { Name = "Temporary Graduate Visa - Post-Study Work Stream", SubclassCode = "485", Category = "Graduate", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 13 },
            new() { Name = "Student Guardian Visa", SubclassCode = "590", Category = "Student", HasLimitedWorkRights = true, WorkHoursPerWeekLimit = 20, PathwayToPermanentResidence = false, SortOrder = 14 },
            
            // Working Holiday
            new() { Name = "Working Holiday Visa", SubclassCode = "417", Category = "Working Holiday", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 15 },
            new() { Name = "Work and Holiday Visa", SubclassCode = "462", Category = "Working Holiday", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 16 },
            
            // Business & Investment
            new() { Name = "Business Innovation and Investment (Provisional)", SubclassCode = "188", Category = "Business", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 17 },
            new() { Name = "Business Innovation and Investment (Permanent)", SubclassCode = "888", Category = "Business", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 18 },
            
            // Temporary & Specialty
            new() { Name = "Temporary Work (Short Stay Specialist)", SubclassCode = "400", Category = "Temporary", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 19 },
            new() { Name = "Temporary Work (International Relations)", SubclassCode = "403", Category = "Temporary", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 20 },
            new() { Name = "Training Visa", SubclassCode = "407", Category = "Training", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 21 },
            new() { Name = "Temporary Activity Visa", SubclassCode = "408", Category = "Temporary", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 22 },
            new() { Name = "Skilled - Recognized Graduate Visa", SubclassCode = "476", Category = "Graduate", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 23 },
            
            // Partner & Family
            new() { Name = "Partner Visa (Onshore)", SubclassCode = "820/801", Category = "Partner", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 24 },
            new() { Name = "Partner Visa (Offshore)", SubclassCode = "309/100", Category = "Partner", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 25 },
            new() { Name = "New Zealand Citizen Family Relationship", SubclassCode = "461", Category = "Family", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 26 },
            
            // Distinguished Talent
            new() { Name = "Distinguished Talent Visa", SubclassCode = "858", Category = "Distinguished Talent", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 27 },
            new() { Name = "Global Talent Visa", SubclassCode = "858", Category = "Distinguished Talent", HasFullWorkRights = true, PathwayToPermanentResidence = true, SortOrder = 28 },
            
            // Bridging Visas
            new() { Name = "Bridging Visa A (with work rights)", SubclassCode = "BVA", Category = "Bridging", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 29 },
            new() { Name = "Bridging Visa B (with work rights)", SubclassCode = "BVB", Category = "Bridging", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 30 },
            new() { Name = "Bridging Visa C (with work rights)", SubclassCode = "BVC", Category = "Bridging", HasFullWorkRights = true, PathwayToPermanentResidence = false, SortOrder = 31 },
            
            // No Work Rights
            new() { Name = "Tourist Visa - No work rights", SubclassCode = "600", Category = "Visitor", HasFullWorkRights = false, HasLimitedWorkRights = false, PathwayToPermanentResidence = false, SortOrder = 32 },
            new() { Name = "Visitor Visa - No work rights", SubclassCode = "651", Category = "Visitor", HasFullWorkRights = false, HasLimitedWorkRights = false, PathwayToPermanentResidence = false, SortOrder = 33 },
        };
        
        await _context.VisaTypes.AddRangeAsync(visas);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {visas.Count} visa types");
    }

    private async Task SeedSkillDefinitionsAsync()
    {
        if (_context.SkillDefinitions.Any()) return;
        
        _logger.LogInformation("Seeding Skill Definitions...");
        
        var skills = new List<SkillDefinition>
        {
            // Soft Skills (20+)
            new() { Name = "Communication", Category = "Soft", Description = "Effective verbal and written communication", SortOrder = 1 },
            new() { Name = "Teamwork", Category = "Soft", Aliases = new List<string> { "Collaboration", "Team Player" }, SortOrder = 2 },
            new() { Name = "Leadership", Category = "Soft", Description = "Ability to lead and motivate teams", SortOrder = 3 },
            new() { Name = "Problem Solving", Category = "Soft", Aliases = new List<string> { "Critical Thinking" }, SortOrder = 4 },
            new() { Name = "Time Management", Category = "Soft", Aliases = new List<string> { "Organizational Skills" }, SortOrder = 5 },
            new() { Name = "Adaptability", Category = "Soft", Aliases = new List<string> { "Flexibility" }, SortOrder = 6 },
            new() { Name = "Customer Service", Category = "Soft", SortOrder = 7 },
            new() { Name = "Attention to Detail", Category = "Soft", SortOrder = 8 },
            new() { Name = "Emotional Intelligence", Category = "Soft", Aliases = new List<string> { "EQ" }, SortOrder = 9 },
            new() { Name = "Negotiation", Category = "Soft", SortOrder = 10 },
            
            // Technical Skills - Programming
            new() { Name = "Python", Category = "Technical", SubCategory = "Programming", Description = "Python programming language", RelatedSkills = new List<string> { "Django", "Flask", "FastAPI" }, SortOrder = 11 },
            new() { Name = "JavaScript", Category = "Technical", SubCategory = "Programming", Aliases = new List<string> { "JS" }, RelatedSkills = new List<string> { "TypeScript", "Node.js", "React" }, SortOrder = 12 },
            new() { Name = "TypeScript", Category = "Technical", SubCategory = "Programming", Aliases = new List<string> { "TS" }, RelatedSkills = new List<string> { "JavaScript", "React", "Angular" }, SortOrder = 13 },
            new() { Name = "Java", Category = "Technical", SubCategory = "Programming", RelatedSkills = new List<string> { "Spring Boot", "Maven" }, SortOrder = 14 },
            new() { Name = "C#", Category = "Technical", SubCategory = "Programming", Aliases = new List<string> { "C-Sharp", "CSharp" }, RelatedSkills = new List<string> { ".NET", "ASP.NET" }, SortOrder = 15 },
            new() { Name = "C++", Category = "Technical", SubCategory = "Programming", SortOrder = 16 },
            new() { Name = "Ruby", Category = "Technical", SubCategory = "Programming", RelatedSkills = new List<string> { "Ruby on Rails" }, SortOrder = 17 },
            new() { Name = "PHP", Category = "Technical", SubCategory = "Programming", RelatedSkills = new List<string> { "Laravel", "WordPress" }, SortOrder = 18 },
            new() { Name = "Go", Category = "Technical", SubCategory = "Programming", Aliases = new List<string> { "Golang" }, SortOrder = 19 },
            new() { Name = "Rust", Category = "Technical", SubCategory = "Programming", SortOrder = 20 },
            
            // Web Development
            new() { Name = "React", Category = "Technical", SubCategory = "Web Development", RelatedSkills = new List<string> { "JavaScript", "TypeScript", "Next.js" }, SortOrder = 21 },
            new() { Name = "Angular", Category = "Technical", SubCategory = "Web Development", RelatedSkills = new List<string> { "TypeScript" }, SortOrder = 22 },
            new() { Name = "Vue.js", Category = "Technical", SubCategory = "Web Development", Aliases = new List<string> { "Vue" }, SortOrder = 23 },
            new() { Name = "Node.js", Category = "Technical", SubCategory = "Web Development", Aliases = new List<string> { "Node", "NodeJS" }, RelatedSkills = new List<string> { "JavaScript", "Express.js" }, SortOrder = 24 },
            new() { Name = "HTML", Category = "Technical", SubCategory = "Web Development", Aliases = new List<string> { "HTML5" }, SortOrder = 25 },
            new() { Name = "CSS", Category = "Technical", SubCategory = "Web Development", Aliases = new List<string> { "CSS3" }, RelatedSkills = new List<string> { "Sass", "Tailwind" }, SortOrder = 26 },
            
            // Cloud & DevOps
            new() { Name = "AWS", Category = "Technical", SubCategory = "Cloud", Aliases = new List<string> { "Amazon Web Services" }, RelatedSkills = new List<string> { "EC2", "S3", "Lambda" }, SortOrder = 27 },
            new() { Name = "Azure", Category = "Technical", SubCategory = "Cloud", Aliases = new List<string> { "Microsoft Azure" }, SortOrder = 28 },
            new() { Name = "Google Cloud", Category = "Technical", SubCategory = "Cloud", Aliases = new List<string> { "GCP", "Google Cloud Platform" }, SortOrder = 29 },
            new() { Name = "Docker", Category = "Technical", SubCategory = "DevOps", RelatedSkills = new List<string> { "Kubernetes", "Containerization" }, SortOrder = 30 },
            new() { Name = "Kubernetes", Category = "Technical", SubCategory = "DevOps", Aliases = new List<string> { "K8s" }, RelatedSkills = new List<string> { "Docker" }, SortOrder = 31 },
            new() { Name = "CI/CD", Category = "Technical", SubCategory = "DevOps", Description = "Continuous Integration/Deployment", RelatedSkills = new List<string> { "Jenkins", "GitLab CI" }, SortOrder = 32 },
            
            // Databases
            new() { Name = "SQL", Category = "Technical", SubCategory = "Database", RelatedSkills = new List<string> { "MySQL", "PostgreSQL" }, SortOrder = 33 },
            new() { Name = "PostgreSQL", Category = "Technical", SubCategory = "Database", Aliases = new List<string> { "Postgres" }, SortOrder = 34 },
            new() { Name = "MongoDB", Category = "Technical", SubCategory = "Database", Aliases = new List<string> { "Mongo" }, SortOrder = 35 },
            new() { Name = "MySQL", Category = "Technical", SubCategory = "Database", SortOrder = 36 },
            
            // Trade Skills (20+)
            new() { Name = "Welding", Category = "Trade", SubCategory = "Metal Work", Description = "TIG, MIG, Stick welding", SortOrder = 37 },
            new() { Name = "Electrical Installation", Category = "Trade", SubCategory = "Electrical", SortOrder = 38 },
            new() { Name = "Plumbing", Category = "Trade", SubCategory = "Plumbing", SortOrder = 39 },
            new() { Name = "Carpentry", Category = "Trade", SubCategory = "Woodwork", SortOrder = 40 },
            new() { Name = "Bricklaying", Category = "Trade", SubCategory = "Masonry", SortOrder = 41 },
            new() { Name = "Painting & Decorating", Category = "Trade", SubCategory = "Finishing", SortOrder = 42 },
            new() { Name = "HVAC Installation", Category = "Trade", SubCategory = "HVAC", Aliases = new List<string> { "Air Conditioning", "Refrigeration" }, SortOrder = 43 },
            new() { Name = "Automotive Repair", Category = "Trade", SubCategory = "Automotive", SortOrder = 44 },
        };
        
        await _context.SkillDefinitions.AddRangeAsync(skills);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {skills.Count} skill definitions");
    }

    private async Task SeedEmploymentTypesAsync()
    {
        if (_context.EmploymentTypes.Any()) return;
        
        _logger.LogInformation("Seeding Employment Types...");
        
        var types = new List<EmploymentType>
        {
            new() { Name = "Full-time", Description = "Permanent full-time position", SortOrder = 1 },
            new() { Name = "Part-time", Description = "Regular part-time hours", SortOrder = 2 },
            new() { Name = "Casual", Description = "Flexible casual work", SortOrder = 3 },
            new() { Name = "Contract/Temp", Description = "Fixed-term contract", SortOrder = 4 },
            new() { Name = "Apprenticeship", Description = "Trade apprenticeship", SortOrder = 5 },
            new() { Name = "Traineeship", Description = "Vocational traineeship", SortOrder = 6 },
            new() { Name = "Internship", Description = "Professional internship", SortOrder = 7 },
            new() { Name = "Graduate Program", Description = "Graduate development program", SortOrder = 8 },
            new() { Name = "Work Experience", Description = "Unpaid work experience", SortOrder = 9 },
            new() { Name = "Volunteer", Description = "Voluntary work", SortOrder = 10 },
            new() { Name = "Seasonal", Description = "Seasonal employment", SortOrder = 11 },
        };
        
        await _context.EmploymentTypes.AddRangeAsync(types);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {types.Count} employment types");
    }

    private async Task SeedWorkArrangementsAsync()
    {
        if (_context.WorkArrangements.Any()) return;
        
        _logger.LogInformation("Seeding Work Arrangements...");
        
        var arrangements = new List<WorkArrangement>
        {
            new() { Name = "On-site", Description = "Work from office/site", SortOrder = 1 },
            new() { Name = "Remote", Description = "Work from home", SortOrder = 2 },
            new() { Name = "Hybrid", Description = "Mix of on-site and remote", SortOrder = 3 },
            new() { Name = "FIFO", Description = "Fly-in fly-out", SortOrder = 4 },
            new() { Name = "DIDO", Description = "Drive-in drive-out", SortOrder = 5 },
        };
        
        await _context.WorkArrangements.AddRangeAsync(arrangements);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {arrangements.Count} work arrangements");
    }
}
