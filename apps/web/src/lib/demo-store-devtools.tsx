import { EventClient } from "@tanstack/devtools-event-client";
import { useState, useEffect } from "react";

import { store, fullName } from "./demo-store";

type EventMap = {
  "store-devtools:state": {
    firstName: string;
    lastName: string;
    fullName: string;
  };
};

class StoreDevtoolsEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: "store-devtools",
    });
  }
}

const sdec = new StoreDevtoolsEventClient();

store.subscribe(() => {
  sdec.emit("store-devtools:state", {
    firstName: store.state.firstName,
    lastName: store.state.lastName,
    fullName: fullName.state,
  });
});

function DevtoolPanel() {
  const [state, setState] = useState<EventMap["store-devtools:state"]>(() => ({
    firstName: store.state.firstName,
    lastName: store.state.lastName,
    fullName: fullName.state,
  }));

  useEffect(() => {
    const unsub = sdec.on("store-devtools:state", (e) => setState(e.payload));
    return () => {
      if (typeof unsub === "function") {
        unsub();
      } else if (unsub && typeof (unsub as any).unsubscribe === "function") {
        (unsub as any).unsubscribe();
      }
    };
  }, []);

  return (
    <div className="p-4 grid gap-4 grid-cols-[1fr_10fr]">
      <div className="text-sm font-bold text-gray-500 whitespace-nowrap">First Name</div>
      <div className="text-sm">{state?.firstName}</div>
      <div className="text-sm font-bold text-gray-500 whitespace-nowrap">Last Name</div>
      <div className="text-sm">{state?.lastName}</div>
      <div className="text-sm font-bold text-gray-500 whitespace-nowrap">Full Name</div>
      <div className="text-sm">{state?.fullName}</div>
    </div>
  );
}

export default {
  name: "TanStack Store",
  render: <DevtoolPanel />,
};
