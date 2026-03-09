namespace TradeFlowSystemAPI.Models
{
    public static class UserRoles
    {
        public const string SuperAdmin = "superadmin";
        public const string Admin = "admin";
        public const string Employee = "employee";

        public static readonly string[] AllRoles = { SuperAdmin, Admin, Employee };
    }
} 