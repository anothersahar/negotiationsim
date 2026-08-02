import { AnimatePresence } from "framer-motion";
import { useNegotiation } from "./hooks/useNegotiation";
import SetupScreen from "./components/SetupScreen";
import NegotiationTable from "./components/NegotiationTable";
import DebriefScreen from "./components/DebriefScreen";

export default function App(): JSX.Element {
  const nego = useNegotiation();

  return (
    <div className="app-root">
      <AnimatePresence mode="wait">
        {nego.view === "setup" && (
          <SetupScreen
            key="setup"
            onSubmit={nego.startSession}
            loading={nego.sending}
            error={nego.error}
          />
        )}

        {nego.view === "table" && nego.session && (
          <NegotiationTable
            key="table"
            session={nego.session}
            suggestions={nego.suggestions}
            onMessage={nego.sendUserMessage}
            onClose={nego.finishSession}
            sending={nego.sending}
            closing={nego.closing}
            error={nego.error}
          />
        )}

        {nego.view === "debrief" &&
          nego.session?.debrief && (
            <DebriefScreen
              key="debrief"
              session={nego.session}
              onReset={nego.reset}
            />
          )}
      </AnimatePresence>
    </div>
  );
}
