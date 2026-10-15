import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PolicyCard, { formatPremium } from "./PolicyCard";

const FUTURE_DATE = new Date(
  Date.now() + 1000 * 60 * 60 * 24 * 365
).toISOString();
const PAST_DATE = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

function makePolicy(overrides = {}) {
  return {
    id: "pol-123",
    name: "Comprehensive Auto Insurance",
    premium: 150075, // centavos -> ₱1,500.75
    currency: "PHP",
    status: "active",
    endDate: FUTURE_DATE,
    ...overrides,
  };
}

describe("PolicyCard", () => {
  test("renders the policy name", () => {
    render(<PolicyCard policy={makePolicy()} onSelect={() => {}} />);
    expect(
      screen.getByText("Comprehensive Auto Insurance")
    ).toBeInTheDocument();
  });

  test("calls onSelect with the policy id when clicked", async () => {
    const user = userEvent.setup ? userEvent.setup() : userEvent;
    const onSelect = jest.fn();
    render(
      <PolicyCard policy={makePolicy({ id: "pol-999" })} onSelect={onSelect} />
    );

    await user.click(screen.getByRole("button"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("pol-999");
  });

  test.each([
    ["active", "Active"],
    ["pending", "Pending"],
    ["lapsed", "Lapsed"],
    ["cancelled", "Unknown"],
  ])('shows the "%s" status as a "%s" badge', (status, label) => {
    render(<PolicyCard policy={makePolicy({ status })} onSelect={() => {}} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  // At least 1 test for the expired-policy edge case.

  test('overrides an active status with "Expired" once endDate has passed, and shows the renewal note', () => {
    render(
      <PolicyCard
        policy={makePolicy({ status: "active", endDate: PAST_DATE })}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(
      screen.getByText("This policy has expired. Contact your agent to renew.")
    ).toBeInTheDocument();
  });

  test("does not mark a policy expired when endDate is exactly now (boundary)", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    jest.useFakeTimers().setSystemTime(now);

    try {
      render(
        <PolicyCard
          policy={makePolicy({ status: "active", endDate: now.toISOString() })}
          onSelect={() => {}}
        />
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.queryByText("Expired")).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  test('does not apply the "Expired" override to a non-active status with a past endDate', () => {
    render(
      <PolicyCard
        policy={makePolicy({ status: "lapsed", endDate: PAST_DATE })}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText("Lapsed")).toBeInTheDocument();
    expect(screen.queryByText("Expired")).not.toBeInTheDocument();
  });
});

// test for the formatPremium util (happy path + edge case — null/NaN).
describe("formatPremium", () => {
  test("converts centavos to a localized PHP currency", () => {
    render(<PolicyCard policy={makePolicy()} onSelect={() => {}} />);
    expect(formatPremium(150075)).toBe("₱1,500.75");
  });

  test("format using different currency", () => {
    render(<PolicyCard policy={makePolicy()} onSelect={() => {}} />);
    expect(formatPremium(2000, 'USD')).toBe("$20.00");
  });

  test("returns the fallback dash for a null premium", () => {
    expect(formatPremium(null)).toBe("—");
  });

  test("returns the fallback dash for a NaN premium", () => {
    expect(formatPremium(NaN)).toBe("—");
  });

  test("formats a zero premium as currency, not the null fallback (boundary)", () => {
    expect(formatPremium(0)).toBe("₱0.00");
  });

});
