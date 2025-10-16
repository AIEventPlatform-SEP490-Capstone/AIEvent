namespace AIEvent.Application.Helpers
{
    public interface IHasherHelper
    {
        bool Verify(string password = "", string hashedPassword = "");
        string Hash(string password, int workFactor = 12);
    }

    public class HasherHelper : IHasherHelper
    {
        public bool Verify(string password = "", string hashedPassword = "")
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Mật khẩu không được để trống", nameof(password));
            }

            if (string.IsNullOrEmpty(hashedPassword))
            {
                throw new ArgumentException("Hash không được để trống", nameof(hashedPassword));
            }

            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }

        public string Hash(string password, int workFactor = 12)
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Mật khẩu không được để trống", nameof(password));
            }

            if (workFactor < 4 || workFactor > 31)
            {
                throw new ArgumentException("Work factor phải nằm trong khoảng 4-31", nameof(workFactor));
            }

            return BCrypt.Net.BCrypt.HashPassword(password, workFactor);
        }
    }
}
