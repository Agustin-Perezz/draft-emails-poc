import { expect, type Page, type Route, test } from "@playwright/test";

import { API_ROUTES, CV_FILENAME, CV_PUBLIC_PATH } from "@/lib/constants";

import { DEVELOGIA_POST } from "../fixtures/develogia-post";

const STUB_DRAFT = {
  draft: {
    to: "antonella.m@develogia.com",
    subject: "Dev FullStack Jr/Ssr - Agustin Perez",
    body: "Hola,\n\nVi la búsqueda de Desarrollador FullStack en Develogia...",
    attachments: [
      {
        filename: CV_FILENAME,
        url: `https://test.example.com${CV_PUBLIC_PATH}`,
      },
    ],
  },
  approvalToken: "stub-token",
};

type SendRequestCapture = {
  draft: typeof STUB_DRAFT.draft;
  approvalToken: string;
};

async function stubDraftApi(
  page: Page,
  fulfill: (route: Route) => Promise<void>,
) {
  await page.route(`**${API_ROUTES.DRAFT}`, async (route) => {
    await fulfill(route);
  });
}

async function stubSendApi(
  page: Page,
  fulfill: (route: Route) => Promise<void>,
) {
  await page.route(`**${API_ROUTES.SEND}`, async (route) => {
    await fulfill(route);
  });
}

async function generateDraftFrom(page: Page) {
  await page.goto("/");
  await page.getByLabel("Paste the raw job post").fill(DEVELOGIA_POST);
  await page.getByRole("button", { name: "Generate Draft" }).click();
}

test.describe("draft review workflow", () => {
  test("happy path: paste, generate, edit, approve and send", async ({
    page,
  }) => {
    await stubDraftApi(page, (route) => route.fulfill({ json: STUB_DRAFT }));
    await stubSendApi(page, (route) =>
      route.fulfill({ json: { messageId: "msg-1" } }),
    );

    await generateDraftFrom(page);

    const toInput = page.getByLabel("To", { exact: true });
    await expect(toInput).toHaveValue("antonella.m@develogia.com");

    await page
      .getByLabel("Subject", { exact: true })
      .fill("Edited subject from review UI");

    await page.getByRole("button", { name: "Approve & Send" }).click();

    await expect(page.getByTestId("send-success")).toBeVisible();
  });

  test("edited values round-trip byte-for-byte to /api/send", async ({
    page,
  }) => {
    const captures: SendRequestCapture[] = [];
    await stubDraftApi(page, (route) => route.fulfill({ json: STUB_DRAFT }));
    await stubSendApi(page, async (route) => {
      captures.push(
        (await route.request().postDataJSON()) as SendRequestCapture,
      );
      await route.fulfill({ json: { messageId: "msg-1" } });
    });

    await generateDraftFrom(page);

    const editedSubject = "Dev FullStack - edited by human";
    const editedBody = "Cuerpo editado por el humano. Saludos.";
    await page.getByLabel("Subject", { exact: true }).fill(editedSubject);
    await page.getByLabel("Body", { exact: true }).fill(editedBody);

    await page.getByRole("button", { name: "Approve & Send" }).click();
    await expect(page.getByTestId("send-success")).toBeVisible();

    expect(captures).toHaveLength(1);
    expect(captures[0].draft.subject).toBe(editedSubject);
    expect(captures[0].draft.body).toBe(editedBody);
    expect(captures[0].approvalToken).toBe("stub-token");
    expect(captures[0].draft.to).toBe("antonella.m@develogia.com");
  });

  test("403 from send surfaces an error banner and never shows success", async ({
    page,
  }) => {
    await stubDraftApi(page, (route) => route.fulfill({ json: STUB_DRAFT }));
    await stubSendApi(page, (route) =>
      route.fulfill({
        status: 403,
        json: { error: { code: 403, message: "Approval token has expired." } },
      }),
    );

    await generateDraftFrom(page);
    await page.getByRole("button", { name: "Approve & Send" }).click();

    await expect(page.getByTestId("workflow-error")).toContainText(
      "Approval token has expired.",
    );
    await expect(page.getByTestId("send-success")).not.toBeVisible();
  });

  test("draft failure surfaces an error and offers no review form", async ({
    page,
  }) => {
    await stubDraftApi(page, (route) =>
      route.fulfill({
        status: 422,
        json: {
          error: {
            code: 422,
            message: "The generated draft is invalid at field 'to'.",
          },
        },
      }),
    );

    await generateDraftFrom(page);

    await expect(page.getByTestId("workflow-error")).toContainText(
      "invalid at field 'to'",
    );
    await expect(page.getByLabel("To", { exact: true })).not.toBeVisible();
  });
});
