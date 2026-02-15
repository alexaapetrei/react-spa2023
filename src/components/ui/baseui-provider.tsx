import { Client as Styletron } from "styletron-engine-monolithic";
import { Provider as StyletronProvider } from "styletron-react";
import { LightTheme } from "baseui";

const styletron = new Styletron();

export function BaseUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <StyletronProvider value={styletron}>
      {children}
    </StyletronProvider>
  );
}

export { LightTheme };
