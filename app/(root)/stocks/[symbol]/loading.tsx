const StockSymbolLoading = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="rounded-lg border border-gray-600 bg-gray-800 p-6">
        <div className="mb-4 h-6 w-40 rounded bg-gray-700" />
        <div className="mb-3 h-10 w-64 rounded bg-gray-700" />
        <div className="h-5 w-80 rounded bg-gray-700" />
      </section>

      <section className="rounded-lg border border-gray-600 bg-gray-800 p-6">
        <div className="mb-4 h-8 w-52 rounded bg-gray-700" />
        <div className="h-[540px] w-full rounded bg-gray-700" />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-6">
          <div className="mb-4 h-7 w-44 rounded bg-gray-700" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-20 rounded bg-gray-700" />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-600 bg-gray-800 p-6">
          <div className="mb-4 h-7 w-52 rounded bg-gray-700" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 rounded bg-gray-700" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StockSymbolLoading;
