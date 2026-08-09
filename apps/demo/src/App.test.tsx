import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  it("renders the public workbench heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "SDR Review" }),
    ).toBeInTheDocument();
  });

  it("includes each request recommendation and scope summary in the queue", () => {
    render(<App />);

    const queueItem = screen.getByRole("button", {
      name: /Aurora Fieldworks/i,
    });

    expect(queueItem).toHaveTextContent("Recommendation: allow");
    expect(queueItem).toHaveTextContent(
      "Explore a local workbench for transparent intake review.",
    );
  });

  it("shows the selected request explanation and human review actions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /Aurora Fieldworks/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Aurora Fieldworks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Policy results" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Request context" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
  });

  it("adds a human audit event and disables further actions after approval", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(
      screen.getByText("Human reviewer approved the request."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
  });

  it("restores the original workflow after reset", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Reset demo data" }));

    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
    expect(
      screen.queryByText("Human reviewer approved the request."),
    ).not.toBeInTheDocument();
  });
});
