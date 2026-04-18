"use client";
import { createContext, useContext } from "react";

interface MobileMenuCtx {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

export const MobileMenuContext = createContext<MobileMenuCtx>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);
