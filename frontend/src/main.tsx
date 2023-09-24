import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/700.css";

import { extendTheme } from "@chakra-ui/react";
import { ChakraProvider } from "@chakra-ui/react";
import { ComponentStyleConfig } from "@chakra-ui/react";
import { PrivyProvider } from "@privy-io/react-auth";
import { PrivyWagmiConnector } from "@privy-io/wagmi-connector";
// You can import additional chains from 'wagmi/chains'
// https://wagmi.sh/react/chains
import { optimismGoerli } from "@wagmi/chains";
import { configureChains } from "wagmi";
import "./styles/index.css"
// You may replace this with your preferred providers
// https://wagmi.sh/react/providers/configuring-chains#multiple-providers
import { jsonRpcProvider } from "@wagmi/core/providers/jsonRpc";

const rpc = import.meta.env.VITE_RPC!;

const breakpoints = {
  base: "0em", // 0px
  sm: "48em",
};

const theme = extendTheme({
  colors: { brand: "#ebab1f" },
  fonts: { heading: `'Open Sans' sans-serif`, body: `'Open Sans', sans-serif` },
  breakpoints: breakpoints,
});

// Replace the chains and providers with the ones used by your app.
// https://wagmi.sh/react/providers/configuring-chains
const configureChainsConfig = configureChains(
  [optimismGoerli],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: rpc,
      }),
    }),
  ]
);

const PRIVY_APPID = import.meta.env.VITE_PRIVY_APPID!;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PrivyProvider
      config={{
        embeddedWallets: {
          noPromptOnSignature: true,
        },
      }}
      appId={PRIVY_APPID}
    >
      <PrivyWagmiConnector wagmiChainsConfig={configureChainsConfig}>
        <ChakraProvider theme={theme}>
          <App />
        </ChakraProvider>
      </PrivyWagmiConnector>
    </PrivyProvider>
  </React.StrictMode>
);
