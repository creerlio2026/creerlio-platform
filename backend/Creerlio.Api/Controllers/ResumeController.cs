using Microsoft.AspNetCore.Mvc;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using Creerlio.Application.Services;

namespace Creerlio.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResumeController : ControllerBase
    {
        private readonly ResumeParsingService _resumeParser;
        private readonly ILogger<ResumeController> _logger;
        private const long MaxFileSize = 10 * 1024 * 1024; // 10MB
        private readonly string[] AllowedExtensions = { ".pdf", ".docx", ".doc", ".txt" };

        public ResumeController(
            ResumeParsingService resumeParser,
            ILogger<ResumeController> logger)
        {
            _resumeParser = resumeParser;
            _logger = logger;
        }

        /// <summary>
        /// Upload and parse a resume file
        /// </summary>
        [HttpPost("upload")]
        public async Task<IActionResult> UploadResume([FromForm] IFormFile file)
        {
            try
            {
                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "No file uploaded" });
                }

                if (file.Length > MaxFileSize)
                {
                    return BadRequest(new { error = $"File size exceeds maximum allowed size of {MaxFileSize / 1024 / 1024}MB" });
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedExtensions.Contains(extension))
                {
                    return BadRequest(new { error = $"Invalid file type. Allowed types: {string.Join(", ", AllowedExtensions)}" });
                }

                _logger.LogInformation($"📤 Uploading resume: {file.FileName} ({file.Length} bytes)");

                // Extract text based on file type
                string resumeText;
                if (extension == ".pdf")
                {
                    resumeText = await ExtractTextFromPdf(file);
                }
                else if (extension == ".docx" || extension == ".doc")
                {
                    resumeText = await ExtractTextFromWord(file);
                }
                else if (extension == ".txt")
                {
                    using var reader = new StreamReader(file.OpenReadStream());
                    resumeText = await reader.ReadToEndAsync();
                }
                else
                {
                    return BadRequest(new { error = "Unsupported file type" });
                }

                if (string.IsNullOrWhiteSpace(resumeText))
                {
                    return BadRequest(new { error = "No text could be extracted from the file" });
                }

                _logger.LogInformation($"✅ Extracted {resumeText.Length} characters from resume");

                // Parse resume using AI
                var parseResult = await _resumeParser.ParseResumeAsync(resumeText);

                return Ok(new
                {
                    success = true,
                    message = "Resume parsed successfully",
                    data = parseResult,
                    extractedTextLength = resumeText.Length
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error uploading/parsing resume");
                return StatusCode(500, new
                {
                    error = "Failed to process resume",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Parse text directly (for testing)
        /// </summary>
        [HttpPost("parse-text")]
        public async Task<IActionResult> ParseText([FromBody] ParseTextRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new { error = "No text provided" });
                }

                _logger.LogInformation($"📝 Parsing text directly ({request.Text.Length} characters)");

                var parseResult = await _resumeParser.ParseResumeAsync(request.Text);

                return Ok(new
                {
                    success = true,
                    message = "Text parsed successfully",
                    data = parseResult
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error parsing text");
                return StatusCode(500, new
                {
                    error = "Failed to parse text",
                    details = ex.Message
                });
            }
        }

        private async Task<string> ExtractTextFromPdf(IFormFile file)
        {
            try
            {
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                stream.Position = 0;

                using var document = PdfDocument.Open(stream);
                var textBuilder = new System.Text.StringBuilder();

                foreach (var page in document.GetPages())
                {
                    var pageText = page.Text;
                    textBuilder.AppendLine(pageText);
                }

                return textBuilder.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting text from PDF");
                throw new Exception("Failed to extract text from PDF", ex);
            }
        }

        private async Task<string> ExtractTextFromWord(IFormFile file)
        {
            try
            {
                // For DOCX/DOC files, we'll use a basic approach
                // In production, you'd want to use a library like DocumentFormat.OpenXml or NPOI
                
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                stream.Position = 0;

                // Basic text extraction - for now just read as text
                // This won't work well for binary .doc files, only .docx
                using var reader = new StreamReader(stream, System.Text.Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
                var text = await reader.ReadToEndAsync();

                // Clean up XML tags if DOCX
                if (file.FileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
                {
                    // Very basic cleanup - in production use proper XML parsing
                    text = System.Text.RegularExpressions.Regex.Replace(text, @"<[^>]+>", " ");
                    text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ");
                }

                return text.Trim();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting text from Word document");
                throw new Exception("Failed to extract text from Word document. Please try converting to PDF first.", ex);
            }
        }

        public class ParseTextRequest
        {
            public string Text { get; set; } = "";
        }
    }
}
