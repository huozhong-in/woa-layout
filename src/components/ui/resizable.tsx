import * as React from "react"
import { GripVertical } from "lucide-react"
import {
  Group as ResizableGroup,
  Panel as ResizablePanelPrimitive,
  Separator as ResizableSeparator,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizableGroup>) {
  return (
    <ResizableGroup
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePanelPrimitive>) {
  return <ResizablePanelPrimitive {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizableSeparator> & {
  withHandle?: boolean
}) {
  return (
    <ResizableSeparator
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-transparent hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=vertical]:h-full aria-[orientation=vertical]:w-2 aria-[orientation=vertical]:cursor-col-resize aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="pointer-events-none z-10 flex h-5 w-3 items-center justify-center rounded-sm border bg-white shadow-sm">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizableSeparator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
