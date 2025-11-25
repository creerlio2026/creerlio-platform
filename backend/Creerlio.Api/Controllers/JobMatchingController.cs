using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Creerlio.Application.Services;

namespace Creerlio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobMatchingController : ControllerBase
{
    private readonly IJobMatchingService _jobMatchingService;
    private readonly ILogger<JobMatchingController> _logger;

    public JobMatchingController(
        IJobMatchingService jobMatchingService,
        ILogger<JobMatchingController> logger)
    {
        _jobMatchingService = jobMatchingService;
        _logger = logger;
    }

    /// <summary>
    /// Get top job matches for a talent profile
    /// </summary>
    [HttpGet("talent/{talentId}/matches")]
    public async Task<IActionResult> GetTalentMatches(Guid talentId, [FromQuery] int top = 10)
    {
        try
        {
            var matches = await _jobMatchingService.GetTopMatchesForTalentAsync(talentId, top);
            return Ok(matches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting matches for talent {TalentId}", talentId);
            return StatusCode(500, new { error = "Failed to retrieve job matches" });
        }
    }

    /// <summary>
    /// Get top talent matches for a job posting
    /// </summary>
    [HttpGet("job/{jobId}/matches")]
    public async Task<IActionResult> GetJobMatches(Guid jobId, [FromQuery] int top = 10)
    {
        try
        {
            var matches = await _jobMatchingService.GetTopMatchesForJobAsync(jobId, top);
            return Ok(matches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting matches for job {JobId}", jobId);
            return StatusCode(500, new { error = "Failed to retrieve talent matches" });
        }
    }

    /// <summary>
    /// Calculate match score between a specific talent and job
    /// </summary>
    [HttpPost("calculate")]
    public async Task<IActionResult> CalculateMatch([FromBody] MatchRequest request)
    {
        try
        {
            var match = await _jobMatchingService.CalculateMatchAsync(request.TalentId, request.JobId);
            return Ok(match);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating match between talent {TalentId} and job {JobId}",
                request.TalentId, request.JobId);
            return StatusCode(500, new { error = "Failed to calculate match" });
        }
    }

    /// <summary>
    /// Recalculate all matches for a talent profile
    /// </summary>
    [HttpPost("talent/{talentId}/recalculate")]
    public async Task<IActionResult> RecalculateTalentMatches(Guid talentId)
    {
        try
        {
            await _jobMatchingService.RecalculateMatchesForTalentAsync(talentId);
            return Ok(new { message = "Matches recalculated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating matches for talent {TalentId}", talentId);
            return StatusCode(500, new { error = "Failed to recalculate matches" });
        }
    }

    /// <summary>
    /// Recalculate all matches for a job posting
    /// </summary>
    [HttpPost("job/{jobId}/recalculate")]
    public async Task<IActionResult> RecalculateJobMatches(Guid jobId)
    {
        try
        {
            await _jobMatchingService.RecalculateMatchesForJobAsync(jobId);
            return Ok(new { message = "Matches recalculated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating matches for job {JobId}", jobId);
            return StatusCode(500, new { error = "Failed to recalculate matches" });
        }
    }
}

public class MatchRequest
{
    public Guid TalentId { get; set; }
    public Guid JobId { get; set; }
}
