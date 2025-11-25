using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Creerlio.Application.Services;

namespace Creerlio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CareerPathwayController : ControllerBase
{
    private readonly ICareerPathwayService _careerPathwayService;
    private readonly ILogger<CareerPathwayController> _logger;

    public CareerPathwayController(
        ICareerPathwayService careerPathwayService,
        ILogger<CareerPathwayController> logger)
    {
        _careerPathwayService = careerPathwayService;
        _logger = logger;
    }

    /// <summary>
    /// Generate a career pathway for a talent profile
    /// </summary>
    [HttpPost("generate")]
    public async Task<IActionResult> GeneratePathway([FromQuery] Guid talentId, [FromQuery] string targetRole)
    {
        try
        {
            var pathway = await _careerPathwayService.GeneratePathwayAsync(talentId, targetRole);
            return Ok(pathway);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating pathway for talent {TalentId} to {TargetRole}",
                talentId, targetRole);
            return StatusCode(500, new { error = "Failed to generate career pathway" });
        }
    }

    /// <summary>
    /// Analyze skill gaps for current vs target role
    /// </summary>
    [HttpGet("skill-gaps")]
    public async Task<IActionResult> AnalyzeSkillGaps([FromQuery] Guid talentId, [FromQuery] string targetRole)
    {
        try
        {
            var analysis = await _careerPathwayService.AnalyzeSkillGapsAsync(talentId, targetRole);
            return Ok(analysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing skill gaps for talent {TalentId}", talentId);
            return StatusCode(500, new { error = "Failed to analyze skill gaps" });
        }
    }

}
