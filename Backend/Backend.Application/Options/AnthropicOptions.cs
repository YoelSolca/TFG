namespace Backend.Application.Options
{
    public class AnthropicOptions
    {
        public const string SectionName = "Anthropic";
        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = "claude-sonnet-5-5";
        public int MaxTokens { get; set; } = 4000;
        public int TimeoutSegundos { get; set; } = 90;
    }
}
