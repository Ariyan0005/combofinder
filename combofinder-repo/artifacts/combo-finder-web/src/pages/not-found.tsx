export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <p className="text-muted-foreground mt-2 mb-4">Page not found</p>
      <button
        onClick={() => history.back()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition"
      >
        Go Back
      </button>
    </div>
  );
}
