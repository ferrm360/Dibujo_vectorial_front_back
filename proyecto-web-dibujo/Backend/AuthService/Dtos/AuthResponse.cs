namespace AuthService.Dtos
{
    public class AuthResponse
    {
        public string Token { get; set; } = null!;
        public string Id { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? Email { get; set; }
    }
}
