using Microsoft.EntityFrameworkCore;
using Creerlio.Domain.Entities;
using Creerlio.Domain.Entities.MasterData;
using System.Text.Json;
using DomainApplication = Creerlio.Domain.Entities.Application;

namespace Creerlio.Infrastructure;

/// <summary>
/// Complete CreerlioDbContext - Rolls Royce edition with all comprehensive platform entities
/// </summary>
public class CreerlioDbContext : DbContext
{
    public CreerlioDbContext(DbContextOptions<CreerlioDbContext> options) : base(options) {}

    // ========== MASTER DATA TABLES ==========
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<State> States => Set<State>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<Industry> Industries => Set<Industry>();
    public DbSet<JobCategory> JobCategories => Set<JobCategory>();
    public DbSet<University> Universities => Set<University>();
    public DbSet<TAFEInstitute> TAFEInstitutes => Set<TAFEInstitute>();
    public DbSet<EducationLevel> EducationLevels => Set<EducationLevel>();
    public DbSet<CredentialType> CredentialTypes => Set<CredentialType>();
    public DbSet<VisaType> VisaTypes => Set<VisaType>();
    public DbSet<SkillDefinition> SkillDefinitions => Set<SkillDefinition>();
    public DbSet<EmploymentType> EmploymentTypes => Set<EmploymentType>();
    public DbSet<WorkArrangement> WorkArrangements => Set<WorkArrangement>();
    
    // ========== COMPREHENSIVE PLATFORM ENTITIES ==========
    
    // Talent Profile System
    public DbSet<TalentProfile> TalentProfiles => Set<TalentProfile>();
    public DbSet<PersonalInformation> PersonalInformation => Set<PersonalInformation>();
    public DbSet<WorkExperience> WorkExperiences => Set<WorkExperience>();
    public DbSet<Education> Educations => Set<Education>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<Certification> Certifications => Set<Certification>();
    public DbSet<PortfolioItem> PortfolioItems => Set<PortfolioItem>();
    public DbSet<Award> Awards => Set<Award>();
    public DbSet<Reference> References => Set<Reference>();
    public DbSet<CareerPreferences> CareerPreferences => Set<CareerPreferences>();
    public DbSet<PrivacySettings> PrivacySettings => Set<PrivacySettings>();
    public DbSet<VerificationStatus> VerificationStatuses => Set<VerificationStatus>();
    
    // Portfolio Template System
    public DbSet<PortfolioTemplate> PortfolioTemplates => Set<PortfolioTemplate>();
    public DbSet<TemplateDesign> TemplateDesigns => Set<TemplateDesign>();
    public DbSet<PortfolioSection> PortfolioSections => Set<PortfolioSection>();
    public DbSet<PortfolioSharing> PortfolioSharings => Set<PortfolioSharing>();
    public DbSet<BusinessAccess> BusinessAccesses => Set<BusinessAccess>();
    
    // Business Profile System
    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();
    public DbSet<BusinessInformation> BusinessInformation => Set<BusinessInformation>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<FranchiseSettings> FranchiseSettings => Set<FranchiseSettings>();
    public DbSet<BrandGuidelines> BrandGuidelines => Set<BrandGuidelines>();
    public DbSet<BusinessVerification> BusinessVerifications => Set<BusinessVerification>();
    public DbSet<SubscriptionInfo> SubscriptionInfos => Set<SubscriptionInfo>();
    public DbSet<TeamMemberRating> TeamMemberRatings => Set<TeamMemberRating>();
    public DbSet<MarketIntelligence> MarketIntelligences => Set<MarketIntelligence>();
    public DbSet<CompetitorActivity> CompetitorActivities => Set<CompetitorActivity>();
    public DbSet<ReputationMetrics> ReputationMetrics => Set<ReputationMetrics>();
    
    // Job Posting & ATS
    public DbSet<JobPosting> JobPostings => Set<JobPosting>();
    public DbSet<DomainApplication> Applications => Set<DomainApplication>();
    public DbSet<ApplicationNote> ApplicationNotes => Set<ApplicationNote>();
    public DbSet<ApplicationActivity> ApplicationActivities => Set<ApplicationActivity>();
    public DbSet<Interview> Interviews => Set<Interview>();
    
    // Business Intelligence
    public DbSet<BusinessIntelligenceReport> BusinessIntelligenceReports => Set<BusinessIntelligenceReport>();
    public DbSet<OpportunityAlert> OpportunityAlerts => Set<OpportunityAlert>();
    public DbSet<RecruitmentAnalytics> RecruitmentAnalytics => Set<RecruitmentAnalytics>();
    
    // Career Pathway Planning
    public DbSet<CareerPathway> CareerPathways => Set<CareerPathway>();
    public DbSet<PathwayStep> PathwaySteps => Set<PathwayStep>();
    public DbSet<PathwayResource> PathwayResources => Set<PathwayResource>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<SkillGapAnalysis> SkillGapAnalyses => Set<SkillGapAnalysis>();
    public DbSet<SkillGap> SkillGaps => Set<SkillGap>();
    public DbSet<PathwayRecommendation> PathwayRecommendations => Set<PathwayRecommendation>();
    
    // AI Matching
    public DbSet<JobMatch> JobMatches => Set<JobMatch>();
    public DbSet<MatchBreakdown> MatchBreakdowns => Set<MatchBreakdown>();
    public DbSet<SkillMatch> SkillMatches => Set<SkillMatch>();
    
    // Electronic Footprint
    public DbSet<ElectronicFootprint> ElectronicFootprints => Set<ElectronicFootprint>();
    public DbSet<NewsMention> NewsMentions => Set<NewsMention>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<GitHubActivity> GitHubActivities => Set<GitHubActivity>();
    public DbSet<Publication> Publications => Set<Publication>();
    public DbSet<SpeakingEngagement> SpeakingEngagements => Set<SpeakingEngagement>();
    public DbSet<AwardRecognition> AwardRecognitions => Set<AwardRecognition>();
    public DbSet<FootprintAlert> FootprintAlerts => Set<FootprintAlert>();
    
    // Credential Verification
    public DbSet<CredentialVerification> CredentialVerifications => Set<CredentialVerification>();
    public DbSet<VerificationSource> VerificationSources => Set<VerificationSource>();
    
    // Search & Discovery
    public DbSet<SavedSearch> SavedSearches => Set<SavedSearch>();
    public DbSet<SearchCriteria> SearchCriterias => Set<SearchCriteria>();
    public DbSet<TalentPool> TalentPools => Set<TalentPool>();
    
    // Messaging & Notifications
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // ========== CONFIGURE LIST<STRING> AND LIST<INT> PROPERTIES FOR POSTGRESQL ==========
        var jsonOptions = new JsonSerializerOptions();
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(List<string>))
                {
                    property.SetColumnType("jsonb");
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<List<string>, string>(
                        v => JsonSerializer.Serialize(v, jsonOptions),
                        v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>()));
                }
                else if (property.ClrType == typeof(List<int>))
                {
                    property.SetColumnType("jsonb");
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<List<int>, string>(
                        v => JsonSerializer.Serialize(v, jsonOptions),
                        v => JsonSerializer.Deserialize<List<int>>(v, jsonOptions) ?? new List<int>()));
                }
                else if (property.ClrType == typeof(List<Guid>))
                {
                    property.SetColumnType("jsonb");
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<List<Guid>, string>(
                        v => JsonSerializer.Serialize(v, jsonOptions),
                        v => JsonSerializer.Deserialize<List<Guid>>(v, jsonOptions) ?? new List<Guid>()));
                }
            }
        }
        
        // ========== MASTER DATA INDEXES ==========
        modelBuilder.Entity<Country>().HasIndex(e => e.Name).IsUnique();
        modelBuilder.Entity<Country>().HasIndex(e => e.Code);
        modelBuilder.Entity<State>().HasIndex(e => new { e.CountryId, e.Code }).IsUnique();
        modelBuilder.Entity<State>().HasIndex(e => e.Name);
        modelBuilder.Entity<City>().HasIndex(e => new { e.StateId, e.Name });
        modelBuilder.Entity<City>().HasIndex(e => e.Postcode);
        modelBuilder.Entity<City>().HasIndex(e => new { e.Latitude, e.Longitude }); // For spatial queries
        modelBuilder.Entity<Industry>().HasIndex(e => e.Name).IsUnique();
        modelBuilder.Entity<JobCategory>().HasIndex(e => new { e.IndustryId, e.Name });
        modelBuilder.Entity<University>().HasIndex(e => e.Name).IsUnique();
        modelBuilder.Entity<TAFEInstitute>().HasIndex(e => e.Name);
        modelBuilder.Entity<CredentialType>().HasIndex(e => new { e.Category, e.Name });
        modelBuilder.Entity<VisaType>().HasIndex(e => e.SubclassCode);
        modelBuilder.Entity<SkillDefinition>().HasIndex(e => new { e.Category, e.Name });
        
        // ========== MASTER DATA JSON COLUMNS ==========
        // List<string> properties already configured globally above
        
        // ========== COMPOSITE KEYS ==========
        modelBuilder.Entity<SkillGapAnalysis>().HasKey(e => e.PathwayId);
        modelBuilder.Entity<SkillGap>().HasKey(e => new { e.PathwayId, e.SkillName });
        modelBuilder.Entity<MatchBreakdown>().HasKey(e => e.MatchId);
        modelBuilder.Entity<SkillMatch>().HasKey(e => new { e.MatchId, e.SkillName });
        modelBuilder.Entity<VerificationSource>().HasKey(e => new { e.VerificationId, e.Source });
        modelBuilder.Entity<SearchCriteria>().HasKey(e => new { e.SavedSearchId, e.TalentPoolId });
        
        // ========== DECIMAL PRECISION ==========
        modelBuilder.Entity<CareerPathway>().Property(e => e.EstimatedCost).HasPrecision(18, 2);
        modelBuilder.Entity<PathwayResource>().Property(e => e.Cost).HasPrecision(18, 2);
        modelBuilder.Entity<JobPosting>().Property(e => e.MinSalary).HasPrecision(18, 2);
        modelBuilder.Entity<JobPosting>().Property(e => e.MaxSalary).HasPrecision(18, 2);
        modelBuilder.Entity<RecruitmentAnalytics>().Property(e => e.AverageCostPerHire).HasPrecision(18, 2);
        modelBuilder.Entity<ReputationMetrics>().Property(e => e.OverallScore).HasPrecision(5, 2);
        modelBuilder.Entity<SearchCriteria>().Property(e => e.MinSalary).HasPrecision(18, 2);
        modelBuilder.Entity<SearchCriteria>().Property(e => e.MaxSalary).HasPrecision(18, 2);
        
        // ========== INDEXES FOR PERFORMANCE ==========
        modelBuilder.Entity<TalentProfile>().HasIndex(e => e.UserId).IsUnique();
        modelBuilder.Entity<BusinessProfile>().HasIndex(e => e.UserId).IsUnique();
        modelBuilder.Entity<JobMatch>().HasIndex(e => new { e.TalentProfileId, e.JobPostingId }).IsUnique();
        modelBuilder.Entity<JobMatch>().HasIndex(e => new { e.TalentProfileId, e.MatchScore });
        modelBuilder.Entity<ElectronicFootprint>().HasIndex(e => e.TalentProfileId).IsUnique();
        modelBuilder.Entity<DomainApplication>().HasIndex(e => new { e.JobPostingId, e.Status });
        modelBuilder.Entity<DomainApplication>().HasIndex(e => e.TalentProfileId);
        modelBuilder.Entity<JobPosting>().HasIndex(e => new { e.BusinessProfileId, e.Status });
        modelBuilder.Entity<CareerPathway>().HasIndex(e => e.TalentProfileId);
        modelBuilder.Entity<SavedSearch>().HasIndex(e => e.TalentProfileId);
        modelBuilder.Entity<TalentPool>().HasIndex(e => e.BusinessProfileId);
        
        // ========== JSON COLUMNS (SQLite uses TEXT) ==========
        // Dictionary<string, string> properties need JSON conversion
        modelBuilder.Entity<ApplicationActivity>()
            .Property(e => e.Metadata)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, string>());
        
        modelBuilder.Entity<VerificationSource>()
            .Property(e => e.VerifiedData)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, string>());
        
        modelBuilder.Entity<Location>()
            .Property(e => e.CustomSettings)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, object>());
        
        // MarketIntelligence Dictionary properties
        modelBuilder.Entity<MarketIntelligence>()
            .Property(e => e.SkillDemand)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, int>());
        
        modelBuilder.Entity<MarketIntelligence>()
            .Property(e => e.SalaryTrends)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<Dictionary<string, decimal>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, decimal>());
        
        modelBuilder.Entity<MarketIntelligence>()
            .Property(e => e.TalentAvailability)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, int>());
        
        // ReputationMetrics Dictionary property
        modelBuilder.Entity<ReputationMetrics>()
            .Property(e => e.SentimentBreakdown)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, jsonOptions) ?? new Dictionary<string, int>());
        
        // RecruitmentAnalytics Dictionary properties
        modelBuilder.Entity<RecruitmentAnalytics>()
            .Property(e => e.ApplicationsBySource)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, jsonOptions) ?? new Dictionary<string, int>());
        
        modelBuilder.Entity<RecruitmentAnalytics>()
            .Property(e => e.HiresBySource)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, jsonOptions) ?? new Dictionary<string, int>());
        
        modelBuilder.Entity<RecruitmentAnalytics>()
            .Property(e => e.DiversityMetrics)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, double>>(v, jsonOptions) ?? new Dictionary<string, double>());
        
        modelBuilder.Entity<RecruitmentAnalytics>()
            .Property(e => e.IndustryBenchmarks)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, double>>(v, jsonOptions) ?? new Dictionary<string, double>());
        
        // BrandGuidelines.CommunicationTemplates (now that it's an entity with ID)
        modelBuilder.Entity<BrandGuidelines>()
            .Property(e => e.CommunicationTemplates)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, jsonOptions) ?? new Dictionary<string, string>());
        
        // Configure cascade delete behavior to avoid circular references in SQL Server
        // BusinessProfile has many relationships that could cause circular cascade paths
        foreach (var relationship in modelBuilder.Model.GetEntityTypes()
            .SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}
