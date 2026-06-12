import Chat from "./Chat";

import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <>
      <Chat />
      <Analytics />
    </>
  );
}

export default App;
