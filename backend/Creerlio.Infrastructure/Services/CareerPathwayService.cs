using Creerlio.Application.DTOs;
using Creerlio.Application.Services;
using Creerlio.Domain.Entities;
using Creerlio.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace Creerlio.Infrastructure.Services;

public class CareerPathwayService : ICareerPathwayService
{
    private readonly CreerlioDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CareerPathwayService> _logger;
    private readonly HttpClient _httpClient;

    public CareerPathwayService(
        CreerlioDbContext context,
        IConfiguration configuration,
        ILogger<CareerPathwayService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<CareerPathwayDto> GeneratePathwayAsync(Guid talentId, string targetRole)
    {
        var talent = await _context.TalentProfiles
            .Include(t => t.Skills)
            .Include(t => t.WorkExperiences)
            .Include(t => t.Educations)
            .FirstOrDefaultAsync(t => t.Id == talentId);

        if (talent == null)
            throw new ArgumentException("Talent profile not found");

        var currentRole = talent.WorkExperiences?
            .OrderByDescending(w => w.StartDate)
            .FirstOrDefault()?.Title ?? "Entry Level";

        var currentSkills = talent.Skills?.Select(s => s.Name).ToList() ?? new List<string>();
        var totalExperience = CalculateTotalYears(talent.WorkExperiences);

        // Use OpenAI to generate intelligent pathway
        var skillGaps = await AnalyzeSkillGapsAsync(talentId, targetRole);
        var intermediateRoles = await GetIntermediateRolesAsync(currentRole, targetRole);
        var trainings = await GetTrainingRecommendationsAsync(skillGaps.MissingSkills);

        // Generate pathway steps
        var steps = new List<PathwayStepDto>();
        var stepNum = 1;

        // Step 1: Skill Development
        if (skillGaps.MissingSkills.Count > 0)
        {
            steps.Add(new PathwayStepDto
            {
                StepNumber = stepNum++,
                Title = "Acquire Missing Skills",
                Description = $"Develop {skillGaps.MissingSkills.Count} critical skills for {targetRole}",
                Type = "Skill",
                EstimatedMonths = Math.Min(skillGaps.MissingSkills.Count * 2, 12),
                EstimatedCost = trainings.Sum(t => t.Cost),
                IsCompleted = false
            });
        }

        // Step 2: Certifications
        var relevantCerts = GetRelevantCertifications(targetRole);
        if (relevantCerts.Any())
        {
            steps.Add(new PathwayStepDto
            {
                StepNumber = stepNum++,
                Title = "Earn Key Certifications",
                Description = $"Obtain industry-recognized certifications for {targetRole}",
                Type = "Certification",
                EstimatedMonths = 3,
                EstimatedCost = 1500,
                IsCompleted = false
            });
        }

        // Step 3: Intermediate Roles
        foreach (var role in intermediateRoles)
        {
            steps.Add(new PathwayStepDto
            {
                StepNumber = stepNum++,
                Title = $"Transition to {role.RoleTitle}",
                Description = role.Description,
                Type = "Experience",
                EstimatedMonths = role.EstimatedMonthsInRole,
                EstimatedCost = 0,
                IsCompleted = false
            });
        }

        // Step 4: Final Transition
        steps.Add(new PathwayStepDto
        {
            StepNumber = stepNum,
            Title = $"Achieve {targetRole} Role",
            Description = "Apply for target role positions with full qualifications",
            Type = "Experience",
            EstimatedMonths = 3,
            EstimatedCost = 0,
            IsCompleted = false
        });

        var pathway = new CareerPathwayDto
        {
            Id = Guid.NewGuid(),
            TalentProfileId = talentId,
            CurrentRole = currentRole,
            CurrentYearsOfExperience = (int)totalExperience,
            CurrentSkills = currentSkills,
            TargetRole = targetRole,
            TargetIndustry = "Technology",
            TargetSalary = EstimateTargetSalary(targetRole),
            Steps = steps,
            IntermediateRoles = intermediateRoles,
            SkillGapAnalysis = skillGaps,
            TrainingRecommendations = trainings,
            CertificationRecommendations = relevantCerts,
            EstimatedMonths = steps.Sum(s => s.EstimatedMonths),
            EstimatedCost = steps.Sum(s => s.EstimatedCost),
            Currency = "AUD",
            CompletionPercentage = 0,
            Milestones = GenerateMilestones(steps),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        // Save to database
        var pathwayEntity = new CareerPathway
        {
            Id = pathway.Id,
            TalentProfileId = talentId,
            CurrentRole = currentRole,
            TargetRole = targetRole,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        _context.CareerPathways.Add(pathwayEntity);
        await _context.SaveChangesAsync();

        return pathway;
    }

    public async Task<SkillGapAnalysisDto> AnalyzeSkillGapsAsync(Guid talentId, string targetRole)
    {
        var talent = await _context.TalentProfiles
            .Include(t => t.Skills)
            .FirstOrDefaultAsync(t => t.Id == talentId);

        if (talent == null)
            throw new ArgumentException("Talent profile not found");

        var currentSkills = talent.Skills?.Select(s => s.Name.ToLower()).ToHashSet() ?? new HashSet<string>();
        var requiredSkills = await GetRequiredSkillsForRoleAsync(targetRole);
        var requiredSkillsLower = requiredSkills.Select(s => s.ToLower()).ToHashSet();

        var missingSkills = requiredSkillsLower.Except(currentSkills).ToList();
        var gapSeverity = requiredSkills.Count > 0 
            ? (double)missingSkills.Count / requiredSkills.Count * 100 
            : 0;

        return new SkillGapAnalysisDto
        {
            CurrentSkills = currentSkills.ToList(),
            RequiredSkills = requiredSkills,
            MissingSkills = missingSkills,
            PartialSkills = new List<string>(),
            TotalGapCount = missingSkills.Count,
            GapSeverity = gapSeverity
        };
    }

    public async Task<List<TrainingRecommendationDto>> GetTrainingRecommendationsAsync(List<string> skillGaps)
    {
        var recommendations = new List<TrainingRecommendationDto>();

        // Use OpenAI to get personalized training recommendations
        var openAiKey = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrEmpty(openAiKey))
        {
            // Fallback to curated recommendations
            return GetCuratedTrainingRecommendations(skillGaps);
        }

        try
        {
            var prompt = $"Recommend top 5 online courses (Udemy, Coursera, Pluralsight) for learning these skills: {string.Join(", ", skillGaps)}. " +
                        "For each course provide: title, provider, URL, duration in hours, estimated cost in AUD, rating, and number of reviews. " +
                        "Format as JSON array.";

            var requestBody = new
            {
                model = "gpt-4",
                messages = new[]
                {
                    new { role = "system", content = "You are a career development advisor helping professionals find the best training courses." },
                    new { role = "user", content = prompt }
                },
                response_format = new { type = "json_object" },
                temperature = 0.7
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {openAiKey}");

            var response = await _httpClient.PostAsync(
                "https://api.openai.com/v1/chat/completions",
                new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
            );

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(content);
                var messageContent = jsonDoc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                var coursesData = JsonSerializer.Deserialize<Dictionary<string, List<Dictionary<string, JsonElement>>>>(messageContent ?? "{}");
                if (coursesData != null && coursesData.ContainsKey("courses"))
                {
                    foreach (var course in coursesData["courses"])
                    {
                        recommendations.Add(new TrainingRecommendationDto
                        {
                            Title = course.ContainsKey("title") ? course["title"].GetString() ?? "" : "",
                            Provider = course.ContainsKey("provider") ? course["provider"].GetString() ?? "" : "",
                            Url = course.ContainsKey("url") ? course["url"].GetString() ?? "" : "",
                            Type = "Course",
                            DurationHours = course.ContainsKey("duration") ? course["duration"].GetInt32() : 40,
                            Cost = course.ContainsKey("cost") ? course["cost"].GetInt32() : 199,
                            Currency = "AUD",
                            SkillsCovered = skillGaps.Take(2).ToList(),
                            Rating = course.ContainsKey("rating") ? course["rating"].GetDouble() : 4.5,
                            Reviews = course.ContainsKey("reviews") ? course["reviews"].GetInt32() : 5000
                        });
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OpenAI for training recommendations");
        }

        // Fallback if OpenAI fails
        if (recommendations.Count == 0)
        {
            return GetCuratedTrainingRecommendations(skillGaps);
        }

        return recommendations;
    }

    public async Task<List<IntermediateRoleDto>> GetIntermediateRolesAsync(string currentRole, string targetRole)
    {
        // Use career progression logic to determine stepping stones
        var roles = new List<IntermediateRoleDto>();

        var currentLevel = DetermineCareerLevel(currentRole);
        var targetLevel = DetermineCareerLevel(targetRole);

        if (targetLevel - currentLevel > 1)
        {
            // Need intermediate steps
            for (int level = currentLevel + 1; level < targetLevel; level++)
            {
                var intermediateRole = GenerateIntermediateRole(level, targetRole);
                roles.Add(intermediateRole);
            }
        }

        return roles;
    }

    public async Task<CareerPathwayDto> UpdatePathwayProgressAsync(Guid pathwayId, PathwayProgressDto progress)
    {
        var pathway = await _context.CareerPathways.FirstOrDefaultAsync(p => p.Id == pathwayId);
        
        if (pathway == null)
            throw new ArgumentException("Pathway not found");

        // Update pathway in database
        pathway.Status = "In Progress";
        await _context.SaveChangesAsync();

        // Return updated pathway DTO
        return await GeneratePathwayAsync(pathway.TalentProfileId, pathway.TargetRole);
    }

    private List<TrainingRecommendationDto> GetCuratedTrainingRecommendations(List<string> skillGaps)
    {
        var recommendations = new List<TrainingRecommendationDto>();
        var providers = new[] { "Udemy", "Coursera", "Pluralsight", "LinkedIn Learning" };

        foreach (var skill in skillGaps.Take(5))
        {
            recommendations.Add(new TrainingRecommendationDto
            {
                Title = $"Complete {skill} Developer Course",
                Provider = providers[new Random().Next(providers.Length)],
                Url = $"https://udemy.com/course/{skill.ToLower().Replace(" ", "-")}",
                Type = "Course",
                DurationHours = new Random().Next(20, 100),
                Cost = new Random().Next(50, 300),
                Currency = "AUD",
                SkillsCovered = new List<string> { skill },
                Rating = 4.0 + new Random().NextDouble(),
                Reviews = new Random().Next(1000, 50000)
            });
        }

        return recommendations;
    }

    private async Task<List<string>> GetRequiredSkillsForRoleAsync(string targetRole)
    {
        // Role-based skill mappings
        var skillMappings = new Dictionary<string, List<string>>
        {
            ["Software Engineer"] = new() { "C#", ".NET", "SQL", "Git", "REST APIs", "Unit Testing" },
            ["Senior Software Engineer"] = new() { "C#", ".NET", "Microservices", "Cloud (Azure/AWS)", "Architecture", "CI/CD", "Team Leadership" },
            ["Full Stack Developer"] = new() { "JavaScript", "React", "Node.js", "SQL", "REST APIs", "HTML/CSS", "Git" },
            ["DevOps Engineer"] = new() { "Docker", "Kubernetes", "CI/CD", "Cloud (Azure/AWS)", "Terraform", "Linux", "Monitoring" },
            ["Data Scientist"] = new() { "Python", "Machine Learning", "SQL", "Statistics", "TensorFlow", "Data Visualization", "R" },
            ["Product Manager"] = new() { "Product Strategy", "Agile", "User Research", "Analytics", "Roadmapping", "Stakeholder Management" }
        };

        if (skillMappings.ContainsKey(targetRole))
            return skillMappings[targetRole];

        return new List<string> { "Communication", "Problem Solving", "Technical Skills" };
    }

    private List<string> GetRelevantCertifications(string targetRole)
    {
        var certMappings = new Dictionary<string, List<string>>
        {
            ["Software Engineer"] = new() { "Microsoft Certified: Azure Developer Associate" },
            ["Senior Software Engineer"] = new() { "Microsoft Certified: Azure Solutions Architect" },
            ["DevOps Engineer"] = new() { "AWS Certified DevOps Engineer", "Kubernetes Administrator (CKA)" },
            ["Data Scientist"] = new() { "Google Professional Data Engineer", "AWS Certified Machine Learning" }
        };

        return certMappings.ContainsKey(targetRole) ? certMappings[targetRole] : new List<string>();
    }

    private int EstimateTargetSalary(string targetRole)
    {
        var salaryMap = new Dictionary<string, int>
        {
            ["Software Engineer"] = 90000,
            ["Senior Software Engineer"] = 130000,
            ["Full Stack Developer"] = 95000,
            ["DevOps Engineer"] = 120000,
            ["Data Scientist"] = 110000,
            ["Product Manager"] = 125000
        };

        return salaryMap.ContainsKey(targetRole) ? salaryMap[targetRole] : 80000;
    }

    private int DetermineCareerLevel(string role)
    {
        var roleLower = role.ToLower();
        if (roleLower.Contains("junior") || roleLower.Contains("entry")) return 1;
        if (roleLower.Contains("senior") || roleLower.Contains("lead")) return 3;
        if (roleLower.Contains("principal") || roleLower.Contains("staff")) return 4;
        if (roleLower.Contains("architect") || roleLower.Contains("director")) return 5;
        return 2; // Mid-level
    }

    private IntermediateRoleDto GenerateIntermediateRole(int level, string targetRole)
    {
        var levelNames = new[] { "", "Junior", "Mid-Level", "Senior", "Principal", "Director" };
        var roleTitle = $"{levelNames[level]} {targetRole.Replace("Senior ", "").Replace("Junior ", "")}";

        return new IntermediateRoleDto
        {
            RoleTitle = roleTitle,
            Description = $"Develop expertise as {roleTitle}",
            StepNumber = level,
            EstimatedMonthsInRole = 18 + (level * 6),
            AverageSalary = 70000 + (level * 20000),
            RequiredSkills = new List<string> { "Core Technical Skills", "Communication" },
            SkillsToGain = new List<string> { "Advanced Skills", "Leadership" }
        };
    }

    private List<PathwayMilestoneDto> GenerateMilestones(List<PathwayStepDto> steps)
    {
        var milestones = new List<PathwayMilestoneDto>();
        var cumulativeMonths = 0;

        for (int i = 0; i < steps.Count; i += 2)
        {
            var step = steps[i];
            cumulativeMonths += step.EstimatedMonths;

            milestones.Add(new PathwayMilestoneDto
            {
                Id = Guid.NewGuid(),
                Title = $"Milestone {i / 2 + 1}: {step.Title}",
                Description = step.Description,
                TargetDate = DateTime.UtcNow.AddMonths(cumulativeMonths),
                IsCompleted = false
            });
        }

        return milestones;
    }

    private double CalculateTotalYears(List<WorkExperience>? experiences)
    {
        if (experiences == null || !experiences.Any()) return 0;

        return experiences
            .Where(w => w.StartDate != default)
            .Sum(w =>
            {
                var endDate = w.EndDate ?? DateTime.UtcNow;
                return (endDate - w.StartDate).TotalDays / 365.25;
            });
    }
}
