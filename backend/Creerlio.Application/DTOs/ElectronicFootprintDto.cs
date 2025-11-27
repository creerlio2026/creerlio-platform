namespace Creerlio.Application.DTOs;

/// <summary>
/// Complete electronic footprint for a person
/// Master Plan: News, social media, GitHub, publications, awards
/// </summary>
public class ElectronicFootprintDto
{
    public Guid TalentProfileId { get; set; }
    public DateTime LastScanned { get; set; } = DateTime.UtcNow;
    
    // Reputation Score
    public ReputationScoreDto ReputationScore { get; set; } = new();
    
    // Footprint Components
    public List<NewsMentionDto> NewsMentions { get; set; } = new();
    public SocialMediaFootprintDto SocialMedia { get; set; } = new();
    public GitHubActivityDto? GitHubActivity { get; set; }
    public List<PublicationDto> Publications { get; set; } = new();
    public List<AwardRecognitionDto> Awards { get; set; } = new();
    
    // Summary Statistics
    public int TotalMentions { get; set; }
    public int PositiveMentions { get; set; }
    public int NeutralMentions { get; set; }
    public int NegativeMentions { get; set; }
    public int TotalPublications { get; set; }
    public int TotalAwards { get; set; }
    
    // Trends
    public string ActivityTrend { get; set; } = string.Empty; // Increasing, Stable, Decreasing
    public int MentionsLastMonth { get; set; }
    public int MentionsLastYear { get; set; }
}

public class NewsMentionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public string Sentiment { get; set; } = string.Empty; // Positive, Neutral, Negative
    public double RelevanceScore { get; set; } // 0-100%
    public List<string> Topics { get; set; } = new();
}

public class SocialMediaFootprintDto
{
    public Dictionary<string, SocialMediaProfileDto> Profiles { get; set; } = new();
    public int TotalFollowers { get; set; }
    public int TotalPosts { get; set; }
    public double EngagementRate { get; set; }
    public DateTime LastActive { get; set; }
}

public class SocialMediaProfileDto
{
    public string Platform { get; set; } = string.Empty; // LinkedIn, Twitter, etc.
    public string ProfileUrl { get; set; } = string.Empty;
    public int Followers { get; set; }
    public int Following { get; set; }
    public int Posts { get; set; }
    public bool IsVerified { get; set; }
    public DateTime LastUpdated { get; set; }
    public List<RecentPostDto> RecentPosts { get; set; } = new();
}

public class RecentPostDto
{
    public string Content { get; set; } = string.Empty;
    public DateTime PostedAt { get; set; }
    public int Likes { get; set; }
    public int Shares { get; set; }
    public int Comments { get; set; }
}

public class GitHubActivityDto
{
    public string Username { get; set; } = string.Empty;
    public string ProfileUrl { get; set; } = string.Empty;
    public int PublicRepos { get; set; }
    public int Followers { get; set; }
    public int Following { get; set; }
    public int TotalStars { get; set; }
    public int TotalCommits { get; set; }
    public List<string> TopLanguages { get; set; } = new();
    public List<GitHubRepoDto> TopRepositories { get; set; } = new();
    public int ContributionsLastYear { get; set; }
    public DateTime LastActiveDate { get; set; }
}

public class GitHubRepoDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int Stars { get; set; }
    public int Forks { get; set; }
    public string Language { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
}

public class PublicationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Article, Paper, Talk, Interview
    public string Publisher { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public List<string> CoAuthors { get; set; } = new();
    public List<string> Topics { get; set; } = new();
    public int Citations { get; set; }
}

public class AwardRecognitionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string VerificationUrl { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
}

public class ReputationScoreDto
{
    public double OverallScore { get; set; } // 0-100
    public string ReputationLevel { get; set; } = string.Empty; // Excellent, Good, Fair, Building
    
    // Score Breakdown
    public double OnlinePresenceScore { get; set; }
    public double ProfessionalImpactScore { get; set; }
    public double SocialInfluenceScore { get; set; }
    public double CredibilityScore { get; set; }
    
    // Contributing Factors
    public int TotalNewsMentions { get; set; }
    public int PositiveSentimentCount { get; set; }
    public int PublicationsCount { get; set; }
    public int AwardsCount { get; set; }
    public int SocialMediaFollowers { get; set; }
    
    // Insights
    public List<string> Strengths { get; set; } = new();
    public List<string> ImprovementAreas { get; set; } = new();
}

public class FootprintAlertDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty; // NewMention, SocialActivity, GitHubContribution, Award
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public string Sentiment { get; set; } = string.Empty;
    public bool IsRead { get; set; }
}
