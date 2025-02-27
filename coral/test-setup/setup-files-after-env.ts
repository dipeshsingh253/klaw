import "@testing-library/jest-dom";
import "whatwg-fetch";
import * as process from "process";
import "src/services/test-utils/mock-documenation-helper";

// This is needed to be able to use crypto.randomUUID in testing components which use it
// ie: components using useToast
import { Crypto } from "@peculiar/webcrypto";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { server } from "src/services/test-utils/api-mocks/server";

window.crypto.randomUUID = new Crypto().randomUUID;

//eslint-disable-next-line no-relative-import-paths/no-relative-import-paths

process.env.API_BASE_URL = "http://localhost:8080";
process.env.FEATURE_FLAG_TOPIC_REQUEST = "true";

beforeAll(() => {
  server.listen();
});

afterAll(() => {
  server.close();
});
