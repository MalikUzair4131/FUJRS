// The in-progress bespoke configuration: measurements and style choices.
// Extracted from TailoringContext.
//
// These become `stitching_requests` rows once the backend lands — the table
// allows a request to exist before an order does, which is exactly what this
// draft state is.

import type { TailoringStore } from "../ports";
import type { TailoringConfig } from "../types";
import { readJSON, writeJSON } from "./storage";

const KEY = "fujrs-tailoring-config";

export const localTailoring: TailoringStore = {
  async read() {
    return readJSON<TailoringConfig | null>(KEY, null);
  },

  async write(config) {
    writeJSON(KEY, config);
  },
};
