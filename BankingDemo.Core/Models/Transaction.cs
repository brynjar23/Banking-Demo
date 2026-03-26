namespace BankingDemo.Core.Models;

public enum TransactionStatus { Pending, Completed, Flagged, Rejected }

public class Transaction
{
    public Guid Id { get; set; }
    public Guid FromAccountId { get; set; }
    public Account FromAccount { get; set; } = null!;
    public Guid ToAccountId { get; set; }
    public Account ToAccount { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "ISK";
    public string? Description { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;
    public bool FraudFlagged { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}