import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PolicyList from "./PolicyList";

function makePolicy(overrides = {}) {
  return {
    id: "pol-123",
    name: "Comprehensive Auto Insurance",
    premium: 150075,
    currency: "PHP",
    status: "active",
    endDate: new Date("2029-01-01").toISOString(),
    ...overrides,
  };
}

describe("PolicyList", () => {
  test("renders a card for each policy", () => {
    const policies = [
      makePolicy({ id: "pol-1", name: "Comprehensive Auto Insurance" }),
      makePolicy({ id: "pol-2", name: "Homeowners Policy" }),
    ];
    render(<PolicyList policies={policies} onSelect={() => {}} />);

    expect(
      screen.getByText("Comprehensive Auto Insurance")
    ).toBeInTheDocument();
    expect(screen.getByText("Homeowners Policy")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  test("calls onSelect with the id of the clicked policy", async () => {
    const user = userEvent.setup ? userEvent.setup() : userEvent;
    const onSelect = jest.fn();
    const policies = [
      makePolicy({ id: "pol-1", name: "Comprehensive Auto Insurance" }),
      makePolicy({ id: "pol-2", name: "Homeowners Policy" }),
    ];
    render(<PolicyList policies={policies} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /homeowners policy/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("pol-2");
  });

  test("shows an empty state and no policy cards when there are zero policies", () => {
    render(<PolicyList policies={[]} onSelect={() => {}} />);

    expect(screen.getByText("No policies to show.")).toBeInTheDocument();
  });
});
