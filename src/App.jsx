import Chat from "./Chat";
import { Analytics } from "@vercel/analytics/next";

function App() {
  return (
    <>
      <Chat />
      <Analytics />
    </>
  );
}

export default App;
