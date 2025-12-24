import { Progress as ChakraProgress } from "@chakra-ui/react"
import * as React from "react"

export interface ProgressBarProps extends ChakraProgress.RootProps {
  value: number
  max?: number
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressBar(props, ref) {
    const { value, max = 100, ...rest } = props
    return (
      <ChakraProgress.Root ref={ref} value={value} max={max} {...rest}>
        <ChakraProgress.Track>
          <ChakraProgress.Range />
        </ChakraProgress.Track>
      </ChakraProgress.Root>
    )
  },
)

export const ProgressRoot = ChakraProgress.Root
