import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageContainer } from "./page-container";

afterEach(cleanup);

describe("PageContainer", () => {
  it("renders its children", () => {
    render(<PageContainer>Page content</PageContainer>);

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("accepts a className", () => {
    render(<PageContainer className="custom-page">Page content</PageContainer>);

    expect(screen.getByRole("main")).toHaveClass("custom-page");
  });

  it("renders without external providers", () => {
    render(
      <PageContainer>
        <p>Standalone content</p>
      </PageContainer>,
    );

    expect(screen.getByText("Standalone content")).toBeVisible();
  });
});
