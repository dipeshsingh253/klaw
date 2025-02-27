import { cleanup, screen, within } from "@testing-library/react";
import HeaderNavigation from "src/app/layout/header/HeaderNavigation";
import { Routes } from "src/app/router_utils";
import { customRender } from "src/services/test-utils/render-with-wrappers";
import {
  tabThroughBackward,
  tabThroughForward,
} from "src/services/test-utils/tabbing";

const isFeatureFlagActiveMock = jest.fn();

jest.mock("src/services/feature-flags/utils", () => ({
  isFeatureFlagActive: () => isFeatureFlagActiveMock(),
}));

jest.mock("@aivenio/aquarium", () => ({
  ...jest.requireActual("@aivenio/aquarium"),
  useToast: () => jest.fn(),
}));

const quickLinksNavItems = [
  { name: "Go to approve requests", linkTo: Routes.APPROVALS },
  {
    name: "Go to Klaw documentation page",
    linkTo: "https://www.klaw-project.io/docs",
  },
];

describe("HeaderNavigation.tsx", () => {
  isFeatureFlagActiveMock.mockReturnValue(true);

  describe("shows all necessary elements", () => {
    beforeAll(() => {
      customRender(<HeaderNavigation />, { memoryRouter: true });
    });

    afterAll(cleanup);

    it("renders a navigation element with quick links", () => {
      const nav = screen.getByRole("navigation", { name: "Quick links" });

      expect(nav).toBeVisible();
    });

    quickLinksNavItems.forEach((item) => {
      it(`renders a link to ${item.name}`, () => {
        const nav = screen.getByRole("navigation", { name: "Quick links" });
        const link = within(nav).getByRole("link", { name: item.name });

        expect(link).toBeEnabled();
        expect(link).toHaveAttribute("href", item.linkTo);
      });
    });

    it(`renders a button for the profile dropdown`, () => {
      const nav = screen.getByRole("navigation", { name: "Quick links" });
      const button = within(nav).getByRole("button", {
        name: "Open profile menu",
      });

      expect(button).toBeEnabled();
      expect(button).toHaveAttribute("aria-haspopup", "true");
    });

    it("renders all links in the header menu", () => {
      const nav = screen.getByRole("navigation", { name: "Quick links" });
      const links = within(nav).getAllByRole("link");

      expect(links).toHaveLength(quickLinksNavItems.length);
    });
  });

  describe("enables user to navigate with keyboard only", () => {
    const allHeaderElements = [
      "Request a new",
      ...quickLinksNavItems.map((link) => link.name),
      "Open profile menu",
    ];

    describe("user can navigate through elements", () => {
      beforeEach(() => {
        customRender(<HeaderNavigation />, { memoryRouter: true });
        const navigation = screen.getByRole("navigation");
        navigation.focus();
      });

      afterEach(cleanup);

      allHeaderElements.forEach((headerElement, index) => {
        const numbersOfTabs = index + 1;
        it(`sets focus on ${headerElement} when user tabs ${numbersOfTabs} times`, async () => {
          const element =
            headerElement !== "Request a new" &&
            headerElement !== "Open profile menu"
              ? screen.getByRole("link", { name: headerElement })
              : screen.getByRole("button", { name: headerElement });

          expect(element).not.toHaveFocus();

          await tabThroughForward(numbersOfTabs);

          expect(element).toHaveFocus();
        });
      });
    });

    describe("user can navigate backward through links", () => {
      beforeEach(() => {
        customRender(<HeaderNavigation />, { memoryRouter: true });
        const lastElement = allHeaderElements[allHeaderElements.length - 1];
        const lastNavItem = screen.getByRole("button", {
          name: lastElement,
        });
        lastNavItem.focus();
      });

      afterEach(cleanup);

      const allHeaderElementsReversed = [...allHeaderElements].reverse();
      allHeaderElementsReversed.forEach((headerElement, index) => {
        const numbersOfTabs = index;

        it(`sets focus on ${headerElement} when user shift+tabs ${numbersOfTabs} times`, async () => {
          const element =
            headerElement !== "Request a new" &&
            headerElement !== "Open profile menu"
              ? screen.getByRole("link", { name: headerElement })
              : screen.getByRole("button", { name: headerElement });
          index > 0 && expect(element).not.toHaveFocus();

          await tabThroughBackward(numbersOfTabs);

          expect(element).toHaveFocus();
        });
      });
    });
  });
});
