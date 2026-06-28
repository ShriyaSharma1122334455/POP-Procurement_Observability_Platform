"use client"

import { Component, type ReactNode, type ErrorInfo } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-red-50 mb-4">
            <AlertTriangle className="size-7 text-red-500" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-500 max-w-[40ch] mb-4">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <Button variant="outline" size="sm" onClick={this.reset}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
