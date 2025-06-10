export default function CurrencySettings() {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Currency Settings</h2>
        <form className="space-y-4">
          <input type="text" placeholder="Base Currency (e.g. KES)" className="w-full p-2 border rounded" />
          <input type="text" placeholder="Currency Symbol (e.g. KSh)" className="w-full p-2 border rounded" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Update</button>
        </form>
      </div>
    );
  }
  