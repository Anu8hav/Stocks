"use client";

import React from "react";

interface TradingViewBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface TradingViewBoundaryState {
  hasError: boolean;
  message?: string;
}

class TradingViewBoundary extends React.Component<
  TradingViewBoundaryProps,
  TradingViewBoundaryState
> {
  state: TradingViewBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): TradingViewBoundaryState {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("TradingView widget crashed", { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
            Unable to load chart right now. Please retry or pick another symbol.
            {this.state.message ? ` (${this.state.message})` : ""}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default TradingViewBoundary;
