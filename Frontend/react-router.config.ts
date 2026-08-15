import type { Config } from "@react-router/dev/config";

export default {
  // SPA pura: sin servidor Node. Se despliega como estaticos.
  // El backend Express sigue siendo un origen aparte (ver docs/contrato-api.md).
  ssr: false,
  appDirectory: "app",
} satisfies Config;
