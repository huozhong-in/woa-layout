import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { StyleConfigurator } from "./components/StyleConfigurator";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { Preview } from "./components/Preview";
import { useInitialize } from "./hooks/useInitialize";
import { useAppStore } from "./store";
import "./index.css";

export function App() {
  useInitialize();
  const { hasUnsavedChanges } = useAppStore();

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <Layout
      left={<StyleConfigurator />}
      center={<MarkdownEditor />}
      right={<Preview />}
    />
  );
}

export default App;
