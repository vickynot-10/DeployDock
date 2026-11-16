"use client"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Check, CircleAlert, CircleX, Info, LoaderCircle } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: (
          <Check className="size-4" />
        ),
        info: (
          <Info strokeWidth={2} className="size-4" />
        ),
        warning: (
          <CircleAlert className="size-4" />
        ),
        error: (
          
          <CircleX className="size-4" />
        ),
        loading: (
          <LoaderCircle className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
