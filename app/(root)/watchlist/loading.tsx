const WatchlistLoading = () => {
  return (
    <div className="space-y-5 animate-pulse">
      <section className="rounded-lg border border-gray-600 bg-gray-800 p-5">
        <div className="mb-3 h-8 w-48 rounded bg-gray-700" />
        <div className="h-10 w-full rounded bg-gray-700" />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-lg border border-gray-600 bg-gray-800"
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-72 rounded-lg border border-gray-600 bg-gray-800"
          />
        ))}
      </section>
    </div>
  );
};

export default WatchlistLoading;
