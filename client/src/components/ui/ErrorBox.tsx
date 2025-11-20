export function ErrorBox({ message }: { message: string }) {
    return (
      <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm">
        {message}
      </div>
    );
  }
  