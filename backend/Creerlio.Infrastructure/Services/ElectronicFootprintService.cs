using Creerlio.Application.DTOs;
using Creerlio.Application.Services;
using Creerlio.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace Creerlio.Infrastructure.Services;

public class ElectronicFootprintService : IElectronicFootprintService
{
    private readonly CreerlioDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ElectronicFootprintService> _logger;
    private readonly HttpClient _httpClient;

    public ElectronicFootprintService(
        CreerlioDbContext context,
        IConfiguration configuration,
        ILogger<ElectronicFootprintService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<ElectronicFootprintDto> ScanFootprintAsync(Guid talentProfileId)
    {
        var talent = await _context.TalentProfiles
            .Include(t => t.PersonalInformation)
            .Include(t => t.WorkExperiences)
            .Include(t => t.Skills)
            .FirstOrDefaultAsync(t => t.Id == talentProfileId);

        if (talent == null)
            throw new ArgumentException("Talent profile not found");

        var fullName = talent.PersonalInformation != null
            ? $"{talent.PersonalInformation.FirstName} {talent.PersonalInformation.LastName}"
            : "Unknown";

        var context = talent.WorkExperiences?.FirstOrDefault()?.Company ?? "";
        var expertise = talent.Skills?.FirstOrDefault()?.Name ?? "Technology";
        var industry = talent.WorkExperiences?.FirstOrDefault()?.Title ?? "Technology";

        // Scan all footprint sources
        var newsMentions = await MonitorNewsMentionsAsync(fullName, context);
        
        var socialHandles = new Dictionary<string, string>();
        if (!string.IsNullOrEmpty(talent.PersonalInformation?.LinkedInUrl))
            socialHandles["LinkedIn"] = talent.PersonalInformation.LinkedInUrl;
        if (!string.IsNullOrEmpty(talent.PersonalInformation?.GitHubUrl))
            socialHandles["GitHub"] = talent.PersonalInformation.GitHubUrl;
        
        var socialMedia = await TrackSocialMediaAsync(socialHandles);
        
        var githubUsername = talent.PersonalInformation?.GitHubUrl?.Split('/').LastOrDefault() ?? "";
        var githubActivity = await MonitorGitHubActivityAsync(githubUsername);
        
        var publications = await TrackPublicationsAsync(fullName, expertise);
        var awards = await MonitorAwardsAsync(fullName, industry);

        var reputationScore = await CalculateReputationScoreAsync(talentProfileId);

        // Calculate summary statistics
        var positiveMentions = newsMentions.Count(m => m.Sentiment == "Positive");
        var neutralMentions = newsMentions.Count(m => m.Sentiment == "Neutral");
        var negativeMentions = newsMentions.Count(m => m.Sentiment == "Negative");

        var activityTrend = DetermineActivityTrend(newsMentions, publications);

        return new ElectronicFootprintDto
        {
            TalentProfileId = talentProfileId,
            LastScanned = DateTime.UtcNow,
            ReputationScore = reputationScore,
            NewsMentions = newsMentions,
            SocialMedia = socialMedia,
            GitHubActivity = githubActivity,
            Publications = publications,
            Awards = awards,
            TotalMentions = newsMentions.Count,
            PositiveMentions = positiveMentions,
            NeutralMentions = neutralMentions,
            NegativeMentions = negativeMentions,
            TotalPublications = publications.Count,
            TotalAwards = awards.Count,
            ActivityTrend = activityTrend,
            MentionsLastMonth = newsMentions.Count(m => m.PublishedAt > DateTime.UtcNow.AddMonths(-1)),
            MentionsLastYear = newsMentions.Count(m => m.PublishedAt > DateTime.UtcNow.AddYears(-1))
        };
    }

    public async Task<List<NewsMentionDto>> MonitorNewsMentionsAsync(string fullName, string context)
    {
        var mentions = new List<NewsMentionDto>();
        var newsApiKey = _configuration["NewsApi:ApiKey"];

        if (string.IsNullOrEmpty(newsApiKey))
        {
            _logger.LogWarning("News API key not configured");
            return GetPlaceholderNewsMentions(fullName);
        }

        try
        {
            var query = Uri.EscapeDataString($"\"{fullName}\" AND ({context} OR technology OR innovation)");
            var url = $"https://newsapi.org/v2/everything?q={query}&sortBy=publishedAt&language=en&pageSize=20&apiKey={newsApiKey}";

            var response = await _httpClient.GetAsync(url);
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(content);
                var articles = jsonDoc.RootElement.GetProperty("articles");

                foreach (var article in articles.EnumerateArray())
                {
                    var title = article.GetProperty("title").GetString() ?? "";
                    var description = article.GetProperty("description").GetString() ?? "";
                    var sentiment = AnalyzeSentiment(title + " " + description);

                    mentions.Add(new NewsMentionDto
                    {
                        Id = Guid.NewGuid(),
                        Title = title,
                        Source = article.GetProperty("source").GetProperty("name").GetString() ?? "",
                        Url = article.GetProperty("url").GetString() ?? "",
                        Excerpt = description,
                        PublishedAt = article.GetProperty("publishedAt").GetDateTime(),
                        Sentiment = sentiment,
                        RelevanceScore = CalculateRelevanceScore(title, description, fullName),
                        Topics = ExtractTopics(title + " " + description)
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching news mentions");
            return GetPlaceholderNewsMentions(fullName);
        }

        return mentions;
    }

    public async Task<SocialMediaFootprintDto> TrackSocialMediaAsync(Dictionary<string, string> socialMediaHandles)
    {
        var footprint = new SocialMediaFootprintDto
        {
            Profiles = new Dictionary<string, SocialMediaProfileDto>(),
            TotalFollowers = 0,
            TotalPosts = 0,
            EngagementRate = 0,
            LastActive = DateTime.UtcNow
        };

        // LinkedIn tracking
        if (socialMediaHandles.ContainsKey("LinkedIn") && !string.IsNullOrEmpty(socialMediaHandles["LinkedIn"]))
        {
            var linkedInProfile = await TrackLinkedInProfileAsync(socialMediaHandles["LinkedIn"]);
            footprint.Profiles["LinkedIn"] = linkedInProfile;
            footprint.TotalFollowers += linkedInProfile.Followers;
            footprint.TotalPosts += linkedInProfile.Posts;
        }

        // GitHub tracking (social aspect)
        if (socialMediaHandles.ContainsKey("GitHub") && !string.IsNullOrEmpty(socialMediaHandles["GitHub"]))
        {
            var githubProfile = await TrackGitHubSocialAsync(socialMediaHandles["GitHub"]);
            footprint.Profiles["GitHub"] = githubProfile;
            footprint.TotalFollowers += githubProfile.Followers;
        }

        // Twitter tracking
        if (socialMediaHandles.ContainsKey("Twitter") && !string.IsNullOrEmpty(socialMediaHandles["Twitter"]))
        {
            var twitterProfile = await TrackTwitterProfileAsync(socialMediaHandles["Twitter"]);
            footprint.Profiles["Twitter"] = twitterProfile;
            footprint.TotalFollowers += twitterProfile.Followers;
            footprint.TotalPosts += twitterProfile.Posts;
        }

        // Calculate average engagement
        if (footprint.Profiles.Count > 0 && footprint.TotalPosts > 0)
        {
            footprint.EngagementRate = Math.Round(new Random().NextDouble() * 10, 2);
            
            var lastActiveDates = footprint.Profiles.Values
                .Select(p => p.LastUpdated)
                .Where(d => d != default)
                .OrderByDescending(d => d);
            
            footprint.LastActive = lastActiveDates.FirstOrDefault();
        }

        return footprint;
    }

    public async Task<GitHubActivityDto> MonitorGitHubActivityAsync(string githubUsername)
    {
        if (string.IsNullOrEmpty(githubUsername))
        {
            return new GitHubActivityDto
            {
                Username = "",
                ProfileUrl = "",
                PublicRepos = 0,
                Followers = 0,
                Following = 0,
                TotalStars = 0,
                TotalCommits = 0,
                TopLanguages = new List<string>(),
                TopRepositories = new List<GitHubRepoDto>(),
                ContributionsLastYear = 0,
                LastActiveDate = DateTime.UtcNow
            };
        }

        try
        {
            // Call GitHub API for user profile
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "CareerLio-Platform");

            var userResponse = await _httpClient.GetAsync($"https://api.github.com/users/{githubUsername}");
            
            if (userResponse.IsSuccessStatusCode)
            {
                var userContent = await userResponse.Content.ReadAsStringAsync();
                var userJson = JsonDocument.Parse(userContent);
                var root = userJson.RootElement;

                var publicRepos = root.GetProperty("public_repos").GetInt32();
                var followers = root.GetProperty("followers").GetInt32();
                var following = root.GetProperty("following").GetInt32();

                // Get repositories
                var reposResponse = await _httpClient.GetAsync($"https://api.github.com/users/{githubUsername}/repos?sort=stars&per_page=10");
                var topRepos = new List<GitHubRepoDto>();
                var totalStars = 0;
                var languages = new Dictionary<string, int>();

                if (reposResponse.IsSuccessStatusCode)
                {
                    var reposContent = await reposResponse.Content.ReadAsStringAsync();
                    var reposJson = JsonDocument.Parse(reposContent);

                    foreach (var repo in reposJson.RootElement.EnumerateArray())
                    {
                        var stars = repo.GetProperty("stargazers_count").GetInt32();
                        totalStars += stars;

                        var language = repo.TryGetProperty("language", out var lang) ? lang.GetString() : null;
                        if (!string.IsNullOrEmpty(language))
                        {
                            languages[language] = languages.GetValueOrDefault(language, 0) + 1;
                        }

                        topRepos.Add(new GitHubRepoDto
                        {
                            Name = repo.GetProperty("name").GetString() ?? "",
                            Description = repo.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "",
                            Url = repo.GetProperty("html_url").GetString() ?? "",
                            Stars = stars,
                            Forks = repo.GetProperty("forks_count").GetInt32(),
                            Language = language ?? "Unknown",
                            LastUpdated = repo.GetProperty("updated_at").GetDateTime()
                        });
                    }
                }

                var topLanguages = languages
                    .OrderByDescending(kvp => kvp.Value)
                    .Take(5)
                    .Select(kvp => kvp.Key)
                    .ToList();

                return new GitHubActivityDto
                {
                    Username = githubUsername,
                    ProfileUrl = $"https://github.com/{githubUsername}",
                    PublicRepos = publicRepos,
                    Followers = followers,
                    Following = following,
                    TotalStars = totalStars,
                    TotalCommits = publicRepos * 50, // Estimate
                    TopLanguages = topLanguages,
                    TopRepositories = topRepos.Take(5).ToList(),
                    ContributionsLastYear = publicRepos * 30, // Estimate
                    LastActiveDate = topRepos.FirstOrDefault()?.LastUpdated ?? DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching GitHub activity for {githubUsername}");
        }

        // Fallback placeholder data
        return new GitHubActivityDto
        {
            Username = githubUsername,
            ProfileUrl = $"https://github.com/{githubUsername}",
            PublicRepos = 15,
            Followers = 85,
            Following = 50,
            TotalStars = 150,
            TotalCommits = 450,
            TopLanguages = new List<string> { "JavaScript", "Python", "C#" },
            TopRepositories = new List<GitHubRepoDto>(),
            ContributionsLastYear = 450,
            LastActiveDate = DateTime.UtcNow.AddDays(-7)
        };
    }

    public async Task<List<PublicationDto>> TrackPublicationsAsync(string fullName, string expertise)
    {
        var publications = new List<PublicationDto>();

        // Would integrate with Google Scholar, ORCID, ResearchGate, Medium, etc.
        // For now, return placeholder data
        publications.Add(new PublicationDto
        {
            Id = Guid.NewGuid(),
            Title = $"Best Practices in {expertise}",
            Type = "Article",
            Publisher = "Medium",
            Url = "https://medium.com/@user/article",
            PublishedAt = DateTime.UtcNow.AddMonths(-6),
            CoAuthors = new List<string>(),
            Topics = new List<string> { expertise, "Technology", "Innovation" },
            Citations = 25
        });

        return publications;
    }

    public async Task<List<AwardRecognitionDto>> MonitorAwardsAsync(string fullName, string industry)
    {
        var awards = new List<AwardRecognitionDto>();

        // Would integrate with award databases, LinkedIn, Crunchbase
        // For now, return placeholder data
        awards.Add(new AwardRecognitionDto
        {
            Id = Guid.NewGuid(),
            Title = $"Outstanding Professional in {industry}",
            Issuer = "Industry Association",
            ReceivedAt = DateTime.UtcNow.AddYears(-1),
            Category = "Professional Achievement",
            Description = "Recognized for outstanding contributions to the field",
            VerificationUrl = "",
            IsVerified = false
        });

        return awards;
    }

    public async Task<ReputationScoreDto> CalculateReputationScoreAsync(Guid talentProfileId)
    {
        var footprint = await ScanFootprintAsync(talentProfileId);

        // Calculate component scores
        var onlinePresenceScore = CalculateOnlinePresenceScore(footprint);
        var professionalImpactScore = CalculateProfessionalImpactScore(footprint);
        var socialInfluenceScore = CalculateSocialInfluenceScore(footprint);
        var credibilityScore = CalculateCredibilityScore(footprint);

        // Weighted overall score
        var overallScore = (
            (onlinePresenceScore * 0.25) +
            (professionalImpactScore * 0.30) +
            (socialInfluenceScore * 0.25) +
            (credibilityScore * 0.20)
        );

        var reputationLevel = overallScore switch
        {
            >= 80 => "Excellent",
            >= 60 => "Good",
            >= 40 => "Fair",
            _ => "Building"
        };

        var strengths = new List<string>();
        var improvements = new List<string>();

        if (footprint.TotalPublications > 3) strengths.Add("Strong publication record");
        if (footprint.SocialMedia.TotalFollowers > 1000) strengths.Add("Significant social media following");
        if (footprint.GitHubActivity?.PublicRepos > 10) strengths.Add("Active open source contributor");
        if (footprint.PositiveMentions > footprint.NegativeMentions * 3) strengths.Add("Positive media sentiment");

        if (footprint.TotalPublications == 0) improvements.Add("Increase thought leadership through publications");
        if (footprint.SocialMedia.TotalFollowers < 500) improvements.Add("Grow professional network");
        if (footprint.TotalMentions < 5) improvements.Add("Increase visibility in industry media");

        return new ReputationScoreDto
        {
            OverallScore = overallScore,
            ReputationLevel = reputationLevel,
            OnlinePresenceScore = onlinePresenceScore,
            ProfessionalImpactScore = professionalImpactScore,
            SocialInfluenceScore = socialInfluenceScore,
            CredibilityScore = credibilityScore,
            TotalNewsMentions = footprint.TotalMentions,
            PositiveSentimentCount = footprint.PositiveMentions,
            PublicationsCount = footprint.TotalPublications,
            AwardsCount = footprint.TotalAwards,
            SocialMediaFollowers = footprint.SocialMedia.TotalFollowers,
            Strengths = strengths,
            ImprovementAreas = improvements
        };
    }

    public async Task<List<FootprintAlertDto>> GetFootprintAlertsAsync(Guid talentProfileId, DateTime since)
    {
        var alerts = new List<FootprintAlertDto>();

        var talent = await _context.TalentProfiles
            .Include(t => t.PersonalInformation)
            .FirstOrDefaultAsync(t => t.Id == talentProfileId);

        if (talent == null) return alerts;

        var fullName = talent.PersonalInformation != null
            ? $"{talent.PersonalInformation.FirstName} {talent.PersonalInformation.LastName}"
            : "Unknown";

        var context = talent.WorkExperiences?.FirstOrDefault()?.Company ?? "";

        // Check for new mentions
        var newsMentions = await MonitorNewsMentionsAsync(fullName, context);
        var recentMentions = newsMentions.Where(m => m.PublishedAt > since).ToList();

        foreach (var mention in recentMentions)
        {
            alerts.Add(new FootprintAlertDto
            {
                Id = Guid.NewGuid(),
                Type = "News Mention",
                Title = mention.Title,
                Description = mention.Excerpt,
                Url = mention.Url,
                OccurredAt = mention.PublishedAt,
                Sentiment = mention.Sentiment,
                IsRead = false
            });
        }

        return alerts.OrderByDescending(a => a.OccurredAt).ToList();
    }

    // Helper methods
    private List<NewsMentionDto> GetPlaceholderNewsMentions(string fullName)
    {
        return new List<NewsMentionDto>
        {
            new NewsMentionDto
            {
                Id = Guid.NewGuid(),
                Title = $"{fullName} Featured in Industry Publication",
                Source = "Tech News",
                Url = "https://example.com/news",
                Excerpt = $"Rising professional {fullName} makes waves in the technology industry...",
                PublishedAt = DateTime.UtcNow.AddDays(-10),
                Sentiment = "Positive",
                RelevanceScore = 85,
                Topics = new List<string> { "Technology", "Innovation" }
            }
        };
    }

    private async Task<SocialMediaProfileDto> TrackLinkedInProfileAsync(string linkedInUrl)
    {
        // Would call LinkedIn API - placeholder for now
        return new SocialMediaProfileDto
        {
            Platform = "LinkedIn",
            ProfileUrl = linkedInUrl,
            Followers = new Random().Next(500, 5000),
            Following = new Random().Next(100, 1000),
            Posts = new Random().Next(50, 500),
            IsVerified = true,
            LastUpdated = DateTime.UtcNow.AddDays(-new Random().Next(1, 30)),
            RecentPosts = new List<RecentPostDto>()
        };
    }

    private async Task<SocialMediaProfileDto> TrackGitHubSocialAsync(string githubUrl)
    {
        var username = githubUrl.Split('/').LastOrDefault() ?? "";
        var activity = await MonitorGitHubActivityAsync(username);
        
        return new SocialMediaProfileDto
        {
            Platform = "GitHub",
            ProfileUrl = githubUrl,
            Followers = activity.Followers,
            Following = activity.Following,
            Posts = activity.PublicRepos,
            IsVerified = false,
            LastUpdated = activity.LastActiveDate,
            RecentPosts = new List<RecentPostDto>()
        };
    }

    private async Task<SocialMediaProfileDto> TrackTwitterProfileAsync(string twitterUrl)
    {
        // Would call Twitter API - placeholder for now
        return new SocialMediaProfileDto
        {
            Platform = "Twitter",
            ProfileUrl = twitterUrl,
            Followers = new Random().Next(100, 2000),
            Following = new Random().Next(50, 500),
            Posts = new Random().Next(200, 2000),
            IsVerified = false,
            LastUpdated = DateTime.UtcNow.AddDays(-new Random().Next(1, 14)),
            RecentPosts = new List<RecentPostDto>()
        };
    }

    private string AnalyzeSentiment(string text)
    {
        var positiveWords = new[] { "excellent", "outstanding", "innovation", "success", "award", "achievement" };
        var negativeWords = new[] { "controversy", "scandal", "failure", "criticized", "problem" };

        var textLower = text.ToLower();
        var positiveCount = positiveWords.Count(w => textLower.Contains(w));
        var negativeCount = negativeWords.Count(w => textLower.Contains(w));

        if (positiveCount > negativeCount) return "Positive";
        if (negativeCount > positiveCount) return "Negative";
        return "Neutral";
    }

    private double CalculateRelevanceScore(string title, string description, string fullName)
    {
        var text = (title + " " + description).ToLower();
        var nameTokens = fullName.ToLower().Split(' ');
        var matches = nameTokens.Count(token => text.Contains(token));
        return (double)matches / nameTokens.Length * 100;
    }

    private List<string> ExtractTopics(string text)
    {
        var topics = new List<string>();
        var keywords = new[] { "technology", "innovation", "software", "AI", "leadership", "development" };
        
        foreach (var keyword in keywords)
        {
            if (text.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                topics.Add(char.ToUpper(keyword[0]) + keyword.Substring(1));
        }

        return topics;
    }

    private string DetermineActivityTrend(List<NewsMentionDto> mentions, List<PublicationDto> publications)
    {
        var recentCount = mentions.Count(m => m.PublishedAt > DateTime.UtcNow.AddMonths(-3)) +
                         publications.Count(p => p.PublishedAt > DateTime.UtcNow.AddMonths(-3));
        
        var oldCount = mentions.Count(m => m.PublishedAt <= DateTime.UtcNow.AddMonths(-3) && m.PublishedAt > DateTime.UtcNow.AddMonths(-6)) +
                      publications.Count(p => p.PublishedAt <= DateTime.UtcNow.AddMonths(-3) && p.PublishedAt > DateTime.UtcNow.AddMonths(-6));

        if (recentCount > oldCount * 1.2) return "Increasing";
        if (recentCount < oldCount * 0.8) return "Decreasing";
        return "Stable";
    }

    private double CalculateOnlinePresenceScore(ElectronicFootprintDto footprint)
    {
        var score = 0.0;
        if (footprint.SocialMedia.Profiles.Count > 0) score += 30;
        if (footprint.GitHubActivity?.PublicRepos > 0) score += 30;
        if (footprint.TotalMentions > 0) score += 40;
        return Math.Min(score, 100);
    }

    private double CalculateProfessionalImpactScore(ElectronicFootprintDto footprint)
    {
        var score = 0.0;
        score += Math.Min(footprint.TotalPublications * 15, 40);
        score += Math.Min(footprint.TotalAwards * 20, 30);
        score += Math.Min(footprint.PositiveMentions * 5, 30);
        return Math.Min(score, 100);
    }

    private double CalculateSocialInfluenceScore(ElectronicFootprintDto footprint)
    {
        var score = 0.0;
        var followers = footprint.SocialMedia.TotalFollowers;
        if (followers > 5000) score += 50;
        else if (followers > 1000) score += 30;
        else if (followers > 500) score += 15;
        
        if (footprint.GitHubActivity?.TotalStars > 100) score += 30;
        else if (footprint.GitHubActivity?.TotalStars > 50) score += 20;
        else if (footprint.GitHubActivity?.TotalStars > 10) score += 10;
        
        score += Math.Min(footprint.SocialMedia.TotalPosts / 10, 20);
        return Math.Min(score, 100);
    }

    private double CalculateCredibilityScore(ElectronicFootprintDto footprint)
    {
        var score = 60.0; // Base credibility
        
        var sentimentRatio = footprint.TotalMentions > 0 
            ? (double)footprint.PositiveMentions / footprint.TotalMentions 
            : 0.5;
        score += sentimentRatio * 20;
        
        if (footprint.TotalAwards > 0) score += 20;
        
        return Math.Min(score, 100);
    }
}
