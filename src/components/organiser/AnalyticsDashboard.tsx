'use client';

export default function AnalyticsDashboard() {
  const stats = [
    { label: 'Total Teams', value: '24', icon: '👥' },
    { label: 'Participants', value: '87', icon: '🚀' },
    { label: 'Submissions', value: '22', icon: '📤' },
    { label: 'Open Tickets', value: '5', icon: '🎫' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 bg-white rounded-lg border border-gray-200">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Team Distribution</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will display here
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Top Skills Heatmap</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will display here
          </div>
        </div>
      </div>
    </div>
  );
}
