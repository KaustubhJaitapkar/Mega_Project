'use client';

export default function StaffInvitePage({ searchParams }: { searchParams: { inviteToken: string; role: string; hackathonId: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Staff Invitation</h1>
        <p className="text-lg text-gray-600 mb-8">
          Click below to accept your invitation and create your account.
        </p>
        <a
          href={`/signup?inviteToken=${searchParams.inviteToken}&role=${searchParams.role}&hackathonId=${searchParams.hackathonId}`}
          className="btn btn-primary text-lg px-8 py-3"
        >
          Accept & Sign Up
        </a>
      </div>
    </div>
  );
}

