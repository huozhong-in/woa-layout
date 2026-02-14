import { Layout } from "./components/Layout";
import { StyleConfigurator } from "./components/StyleConfigurator";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { Preview } from "./components/Preview";
import { useInitialize } from "./hooks/useInitialize";
import "./index.css";

export function App() {
  useInitialize();

  return (
    <Layout
      left={<StyleConfigurator />}
      center={<MarkdownEditor />}
      right={<Preview />}
    />
  );
}

export default App;
