using BankingDemo.Core.DTOs;
using FluentValidation;

namespace BankingDemo.Api.Validators;

public class TransferValidator : AbstractValidator<TransferRequest>
{
    public TransferValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be positive")
            .LessThanOrEqualTo(10_000_000).WithMessage("Amount exceeds maximum transfer limit");

        RuleFor(x => x.Description)
            .MaximumLength(200).WithMessage("Description too long")
            .When(x => x.Description is not null);
    }
}