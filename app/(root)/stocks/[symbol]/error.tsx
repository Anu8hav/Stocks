"use client";

interface StockSymbolErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const StockSymbolError = ({ error, reset }: StockSymbolErrorProps) => {
  return (
    <div className="rounded-lg border border-red-500/30 bg-gray-800 p-6">
      <h2 className="text-xl font-semibold text-gray-100">
        Failed to load stock details
      </h2>
      <p className="mt-2 text-sm text-gray-300">
        {error.message ||
          "An unexpected error occurred while loading this page."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
      >
        Try again
      </button>
    </div>
  );
};

export default StockSymbolError;
