using Creerlio.Application.DTOs;
using Creerlio.Application.Services;
using Creerlio.Domain.Entities;
using Creerlio.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Creerlio.Infrastructure.Services;

public class JobMatchingService : IJobMatchingService
{
    private readonly CreerlioDbContext _context;
    private readonly ILogger<JobMatchingService> _logger;

    public JobMatchingService(CreerlioDbContext context, ILogger<JobMatchingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<JobMatchResultDto> CalculateMatchAsync(Guid talentId, Guid jobId)
    {
        var talent = await _context.TalentProfiles
            .Include(t => t.Skills)
            .Include(t => t.WorkExperiences)
            .Include(t => t.Educations)
            .Include(t => t.PersonalInformation)
            .FirstOrDefaultAsync(t => t.Id == talentId);

        var job = await _context.JobPostings
            .Include(j => j.JobLocation)
            .FirstOrDefaultAsync(j => j.Id == jobId);

        if (talent == null || job == null)
            throw new ArgumentException("Talent or Job not found");

        // Calculate weighted scores
        var skillsScore = CalculateSkillsMatch(talent, job);
        var experienceScore = CalculateExperienceMatch(talent, job);
        var educationScore = CalculateEducationMatch(talent);
        var locationScore = CalculateLocationMatch(talent, job);
        var cultureScore = 70.0; // Default culture fit
        var behavioralScore = 65.0; // Default behavioral fit

        // Weighted overall score: Skills 40%, Experience 30%, Education 10%, Location 10%, Culture 5%, Behavioral 5%
        var overallScore = (int)Math.Round(
            (skillsScore * 0.40) +
            (experienceScore * 0.30) +
            (educationScore * 0.10) +
            (locationScore * 0.10) +
            (cultureScore * 0.05) +
            (behavioralScore * 0.05)
        );

        var matchLevel = overallScore switch
        {
            >= 90 => "Excellent",
            >= 75 => "Good",
            >= 60 => "Fair",
            _ => "Poor"
        };

        var talentSkills = talent.Skills?.Select(s => s.Name.ToLower()).ToHashSet() ?? new HashSet<string>();
        var jobRequirements = job.Requirements?.Select(r => r.ToLower()).ToHashSet() ?? new HashSet<string>();
        var matchingSkills = talentSkills.Intersect(jobRequirements).ToList();
        var missingSkills = jobRequirements.Except(talentSkills).ToList();

        var result = new JobMatchResultDto
        {
            TalentProfileId = talentId,
            JobPostingId = jobId,
            OverallScore = overallScore,
            MatchLevel = matchLevel,
            Breakdown = new MatchBreakdownDto
            {
                SkillsScore = (int)Math.Round(skillsScore),
                ExperienceScore = (int)Math.Round(experienceScore),
                EducationScore = (int)Math.Round(educationScore),
                LocationScore = (int)Math.Round(locationScore),
                CultureScore = (int)Math.Round(cultureScore),
                BehavioralScore = (int)Math.Round(behavioralScore)
            },
            MatchingSkills = matchingSkills,
            MissingSkills = missingSkills,
            Highlights = GenerateHighlights(overallScore, matchingSkills.Count, jobRequirements.Count),
            Concerns = GenerateConcerns(missingSkills, experienceScore)
        };

        // Save match to database
        var existingMatch = await _context.JobMatches
            .FirstOrDefaultAsync(m => m.TalentProfileId == talentId && m.JobPostingId == jobId);

        if (existingMatch != null)
        {
            existingMatch.MatchScore = overallScore;
            existingMatch.MatchQuality = matchLevel;
            existingMatch.Breakdown = new MatchBreakdown
            {
                SkillsMatchScore = (int)Math.Round(skillsScore),
                ExperienceMatchScore = (int)Math.Round(experienceScore),
                EducationMatchScore = (int)Math.Round(educationScore),
                LocationMatchScore = (int)Math.Round(locationScore),
                CultureFitScore = (int)Math.Round(cultureScore),
                MissingSkills = missingSkills
            };
            existingMatch.CalculatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.JobMatches.Add(new JobMatch
            {
                Id = Guid.NewGuid(),
                TalentProfileId = talentId,
                JobPostingId = jobId,
                MatchScore = overallScore,
                MatchQuality = matchLevel,
                Breakdown = new MatchBreakdown
                {
                    SkillsMatchScore = (int)Math.Round(skillsScore),
                    ExperienceMatchScore = (int)Math.Round(experienceScore),
                    EducationMatchScore = (int)Math.Round(educationScore),
                    LocationMatchScore = (int)Math.Round(locationScore),
                    CultureFitScore = (int)Math.Round(cultureScore),
                    MissingSkills = missingSkills
                },
                CalculatedAt = DateTime.UtcNow,
                IsViewed = false
            });
        }

        await _context.SaveChangesAsync();

        return result;
    }

    public async Task<List<JobMatchResultDto>> GetTopMatchesForTalentAsync(Guid talentId, int topN = 10)
    {
        var matches = await _context.JobMatches
            .Where(m => m.TalentProfileId == talentId)
            .OrderByDescending(m => m.MatchScore)
            .Take(topN)
            .ToListAsync();

        var results = new List<JobMatchResultDto>();
        foreach (var match in matches)
        {
            results.Add(new JobMatchResultDto
            {
                TalentProfileId = match.TalentProfileId,
                JobPostingId = match.JobPostingId,
                OverallScore = match.MatchScore,
                MatchLevel = match.MatchQuality,
                Breakdown = new MatchBreakdownDto
                {
                    SkillsScore = match.Breakdown?.SkillsMatchScore ?? 0,
                    ExperienceScore = match.Breakdown?.ExperienceMatchScore ?? 0,
                    EducationScore = match.Breakdown?.EducationMatchScore ?? 0,
                    LocationScore = match.Breakdown?.LocationMatchScore ?? 0,
                    CultureScore = match.Breakdown?.CultureFitScore ?? 0,
                    BehavioralScore = 65
                },
                MatchingSkills = new List<string>(),
                MissingSkills = match.Breakdown?.MissingSkills ?? new List<string>(),
                Highlights = new List<string> { $"{match.MatchScore}% overall match" },
                Concerns = new List<string>()
            });
        }

        return results;
    }

    public async Task<List<JobMatchResultDto>> GetTopMatchesForJobAsync(Guid jobId, int topN = 10)
    {
        var matches = await _context.JobMatches
            .Where(m => m.JobPostingId == jobId)
            .OrderByDescending(m => m.MatchScore)
            .Take(topN)
            .ToListAsync();

        var results = new List<JobMatchResultDto>();
        foreach (var match in matches)
        {
            results.Add(new JobMatchResultDto
            {
                TalentProfileId = match.TalentProfileId,
                JobPostingId = match.JobPostingId,
                OverallScore = match.MatchScore,
                MatchLevel = match.MatchQuality,
                Breakdown = new MatchBreakdownDto
                {
                    SkillsScore = match.Breakdown?.SkillsMatchScore ?? 0,
                    ExperienceScore = match.Breakdown?.ExperienceMatchScore ?? 0,
                    EducationScore = match.Breakdown?.EducationMatchScore ?? 0,
                    LocationScore = match.Breakdown?.LocationMatchScore ?? 0,
                    CultureScore = match.Breakdown?.CultureFitScore ?? 0,
                    BehavioralScore = 65
                },
                MatchingSkills = new List<string>(),
                MissingSkills = match.Breakdown?.MissingSkills ?? new List<string>(),
                Highlights = new List<string> { $"{match.MatchScore}% overall match" },
                Concerns = new List<string>()
            });
        }

        return results;
    }

    public async Task RecalculateMatchesForTalentAsync(Guid talentId)
    {
        _logger.LogInformation($"Recalculating matches for talent {talentId}");

        // Delete existing matches
        var existingMatches = await _context.JobMatches
            .Where(m => m.TalentProfileId == talentId)
            .ToListAsync();
        _context.JobMatches.RemoveRange(existingMatches);

        // Get all active job postings
        var activeJobs = await _context.JobPostings
            .Where(j => j.PublishedAt != null && j.ClosedAt == null)
            .Take(50)
            .ToListAsync();

        // Calculate matches for each job
        foreach (var job in activeJobs)
        {
            try
            {
                await CalculateMatchAsync(talentId, job.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error calculating match for talent {talentId} and job {job.Id}");
            }
        }

        _logger.LogInformation($"Recalculated {activeJobs.Count} matches for talent {talentId}");
    }

    public async Task RecalculateMatchesForJobAsync(Guid jobId)
    {
        _logger.LogInformation($"Recalculating matches for job {jobId}");

        // Delete existing matches
        var existingMatches = await _context.JobMatches
            .Where(m => m.JobPostingId == jobId)
            .ToListAsync();
        _context.JobMatches.RemoveRange(existingMatches);

        // Get all active talent profiles
        var activeTalents = await _context.TalentProfiles
            .Where(t => t.ProfileStatus == "Active")
            .Take(50)
            .ToListAsync();

        // Calculate matches for each talent
        foreach (var talent in activeTalents)
        {
            try
            {
                await CalculateMatchAsync(talent.Id, jobId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error calculating match for talent {talent.Id} and job {jobId}");
            }
        }

        _logger.LogInformation($"Recalculated {activeTalents.Count} matches for job {jobId}");
    }

    private double CalculateSkillsMatch(TalentProfile talent, JobPosting job)
    {
        var talentSkills = talent.Skills?.Select(s => s.Name.ToLower()).ToHashSet() ?? new HashSet<string>();
        var jobRequirements = job.Requirements?.Select(r => r.ToLower()).ToHashSet() ?? new HashSet<string>();

        if (jobRequirements.Count == 0) return 100;

        var matchCount = talentSkills.Intersect(jobRequirements).Count();
        return (double)matchCount / jobRequirements.Count * 100;
    }

    private double CalculateExperienceMatch(TalentProfile talent, JobPosting job)
    {
        var totalYears = talent.WorkExperiences?
            .Where(w => w.StartDate != default)
            .Sum(w => 
            {
                var endDate = w.EndDate ?? DateTime.UtcNow;
                return (endDate - w.StartDate).TotalDays / 365.25;
            }) ?? 0;

        var experienceLevel = job.ExperienceLevel?.ToLower() ?? "mid";
        var requiredYears = experienceLevel switch
        {
            "entry" => 1,
            "mid" => 3,
            "senior" => 7,
            "lead" => 10,
            _ => 3
        };

        if (totalYears >= requiredYears) return 100;
        if (totalYears >= requiredYears * 0.7) return 80;
        if (totalYears >= requiredYears * 0.5) return 60;
        return 40;
    }

    private double CalculateEducationMatch(TalentProfile talent)
    {
        var hasEducation = talent.Educations?.Any() ?? false;
        return hasEducation ? 80 : 50;
    }

    private double CalculateLocationMatch(TalentProfile talent, JobPosting job)
    {
        if (job.WorkModel?.ToLower() == "remote") return 100;
        
        // Would need to load PersonalInformation to check city
        // For now return moderate match
        return 75;
    }

    private List<string> GenerateHighlights(int score, int matchingSkills, int totalRequired)
    {
        var highlights = new List<string>();
        
        if (score >= 90)
            highlights.Add("Excellent overall match - highly recommended");
        
        if (matchingSkills > 0)
            highlights.Add($"Matches {matchingSkills} of {totalRequired} required skills");
        
        return highlights;
    }

    private List<string> GenerateConcerns(List<string> missingSkills, double experienceScore)
    {
        var concerns = new List<string>();
        
        if (missingSkills.Count > 5)
            concerns.Add($"Missing {missingSkills.Count} required skills");
        
        if (experienceScore < 60)
            concerns.Add("Experience level may not meet requirements");
        
        return concerns;
    }
}
