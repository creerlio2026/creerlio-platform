using Creerlio.Application.DTOs;
using Creerlio.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Creerlio.Api.Controllers;

/// <summary>
/// API endpoints for AI-powered resume parsing
/// Master Plan: Upload resume (AI extracts data) → Pre-fills 60-70% of profile
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResumeParsingController : ControllerBase
{
    private readonly IResumeParsingService _resumeParsingService;
    private readonly ILogger<ResumeParsingController> _logger;

    public ResumeParsingController(
        IResumeParsingService resumeParsingService,
        ILogger<ResumeParsingController> logger)
    {
        _resumeParsingService = resumeParsingService;
        _logger = logger;
    }

    /// <summary>
    /// Upload and parse a resume file (PDF, DOCX, TXT)
    /// </summary>
    /// <param name="file">Resume file</param>
    /// <returns>Parsed resume data with 60-70% of profile fields populated</returns>
    [HttpPost("upload")]
    [RequestSizeLimit(10_000_000)] // 10MB limit
    [ProducesResponseType(typeof(ParsedResumeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status415UnsupportedMediaType)]
    public async Task<IActionResult> UploadAndParseResume(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "No file uploaded" });
            }

            // Validate file size (max 10MB)
            if (file.Length > 10_000_000)
            {
                return BadRequest(new { error = "File size exceeds 10MB limit" });
            }

            // Validate file extension
            var allowedExtensions = new[] { ".pdf", ".docx", ".txt" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return StatusCode(415, new
                {
                    error = "Unsupported file format",
                    supportedFormats = allowedExtensions,
                    receivedFormat = extension
                });
            }

            _logger.LogInformation("Processing resume upload: {FileName}, Size: {Size} bytes", file.FileName, file.Length);

            // Parse the resume
            using var stream = file.OpenReadStream();
            var parsedResume = await _resumeParsingService.ParseResumeAsync(stream, file.FileName);

            return Ok(parsedResume);
        }
        catch (NotImplementedException ex)
        {
            _logger.LogWarning(ex, "Feature not implemented: {Message}", ex.Message);
            return StatusCode(501, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing resume");
            return StatusCode(500, new { error = "Failed to parse resume", details = ex.Message });
        }
    }

    /// <summary>
    /// Parse resume from plain text (no file upload)
    /// </summary>
    /// <param name="request">Resume text</param>
    /// <returns>Parsed resume data</returns>
    [HttpPost("parse-text")]
    [ProducesResponseType(typeof(ParsedResumeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ParseResumeText([FromBody] ParseResumeTextRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ResumeText))
            {
                return BadRequest(new { error = "Resume text is required" });
            }

            if (request.ResumeText.Length > 50000)
            {
                return BadRequest(new { error = "Resume text exceeds maximum length of 50,000 characters" });
            }

            _logger.LogInformation("Parsing resume text, length: {Length} chars", request.ResumeText.Length);

            var parsedResume = await _resumeParsingService.ParseResumeTextAsync(request.ResumeText);

            return Ok(parsedResume);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing resume text");
            return StatusCode(500, new { error = "Failed to parse resume text", details = ex.Message });
        }
    }

    /// <summary>
    /// Import profile data from LinkedIn
    /// </summary>
    /// <param name="request">LinkedIn profile data or URL</param>
    /// <returns>Parsed profile data</returns>
    [HttpPost("import-linkedin")]
    [ProducesResponseType(typeof(ParsedResumeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public async Task<IActionResult> ImportLinkedInProfile([FromBody] ImportLinkedInRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.LinkedInContent))
            {
                return BadRequest(new { error = "LinkedIn profile data is required" });
            }

            _logger.LogInformation("Importing LinkedIn profile");

            var parsedResume = await _resumeParsingService.ParseLinkedInProfileAsync(request.LinkedInContent);

            return Ok(parsedResume);
        }
        catch (NotImplementedException ex)
        {
            _logger.LogWarning(ex, "LinkedIn import not fully implemented: {Message}", ex.Message);
            return StatusCode(501, new { error = "LinkedIn import is under development", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing LinkedIn profile");
            return StatusCode(500, new { error = "Failed to import LinkedIn profile", details = ex.Message });
        }
    }

    /// <summary>
    /// Get supported resume file formats
    /// </summary>
    /// <returns>List of supported formats</returns>
    [HttpGet("supported-formats")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetSupportedFormats()
    {
        return Ok(new
        {
            formats = new[]
            {
                new { extension = ".txt", name = "Plain Text", maxSize = "10MB", status = "✅ Fully supported" },
                new { extension = ".pdf", name = "PDF Document", maxSize = "10MB", status = "🚧 Coming soon (requires PDF library)" },
                new { extension = ".docx", name = "Microsoft Word", maxSize = "10MB", status = "🚧 Coming soon (requires DOCX library)" }
            },
            maxFileSize = "10MB",
            maxTextLength = "50,000 characters"
        });
    }
}

public class ParseResumeTextRequest
{
    public string ResumeText { get; set; } = string.Empty;
}

public class ImportLinkedInRequest
{
    public string LinkedInContent { get; set; } = string.Empty;
}
