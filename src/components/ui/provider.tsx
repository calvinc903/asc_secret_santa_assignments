// components/ui/provider.tsx
"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { NextUIProvider } from "@nextui-org/react";

import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode";

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <NextUIProvider>
        <ColorModeProvider {...props} />
      </NextUIProvider>
    </ChakraProvider>
  );
}