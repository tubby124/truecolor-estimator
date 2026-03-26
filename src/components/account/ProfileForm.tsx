"use client";

import type { CustomerProfile } from "./types";

interface ProfileFormProps {
  profile: CustomerProfile;
  setProfile: React.Dispatch<React.SetStateAction<CustomerProfile>>;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string;
}

export function ProfileForm({ profile, setProfile, onSave, saving, saved, error }: ProfileFormProps) {
  return (
    <div className="mt-14 mb-8">
      <h2 className="text-xl font-bold text-[#1c1712] mb-4">Your profile</h2>
      <div className="bg-[#f4efe9] rounded-2xl p-6 space-y-4 max-w-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1c1712] focus:outline-none focus:ring-2 focus:ring-[#16C2F3]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="(306) 555-0000"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1c1712] focus:outline-none focus:ring-2 focus:ring-[#16C2F3]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Company</label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
              placeholder="Company name (optional)"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1c1712] focus:outline-none focus:ring-2 focus:ring-[#16C2F3]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Address</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              placeholder="Delivery address (optional)"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1c1712] focus:outline-none focus:ring-2 focus:ring-[#16C2F3]/40"
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-[#1c1712] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-semibold">Saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}
