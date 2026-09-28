import { createContext, useContext } from "react";
import type { AppCtx } from "../domain/types";

export const AppContext = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(AppContext);
