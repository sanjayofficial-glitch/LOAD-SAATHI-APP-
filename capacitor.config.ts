import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.loadsaathi.app",
  appName: "LoadSaathi",
  webDir: "dist",
  server: {
    androidScheme: "https",
    hostname: "in.loadsaathi.app",
    allowNavigation: [
      "clerk.shared.lcl.dev",
      "accounts.google.com",
      "*.clerk.accounts.dev",
      "localhost",
      "in.loadsaathi.app",
      "clerk.loadsaathi.in",
      "loadsaathi.in",
    ],
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#ffffff",
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
