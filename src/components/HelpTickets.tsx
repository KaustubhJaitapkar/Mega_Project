'use client';

import { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  creator: {
    name: string;
  };
  assignedTo?: {
    name: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

interface HelpTicketsProps {
  hackathonId: string;
}

export default function HelpTickets({ hackathonId }: HelpTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    async function fetchTickets() {
      try {
        const url = new URL('/api/hackathons/' + hackathonId + '/tickets', window.location.origin);
        if (filterStatus) {
          url.searchParams.append('status', filterStatus);
        }
        const res = await fetch(url.toString());
        const data = await res.json();
        setTickets(data.data || []);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (hackathonId) {
      fetchTickets();
    }
  }, [hackathonId, filterStatus]);

  function getStatusColor(status: string) {
    switch (status) {
      case 'OPEN':
        return 'badge-warning';
      case 'IN_PROGRESS':
        return 'badge-primary';
      case 'RESOLVED':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high':
        return 'badge-danger';
      case 'normal':
        return 'badge-primary';
      case 'low':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === ''
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('OPEN')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'OPEN'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setFilterStatus('IN_PROGRESS')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'IN_PROGRESS'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('RESOLVED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'RESOLVED'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Resolved
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-900 flex-1">{ticket.title}</h3>
                <div className="flex gap-2">
                  <span className={`badge ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-3">{ticket.description}</p>

              <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium">{ticket.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created By</p>
                  <p className="font-medium">{ticket.creator.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assigned To</p>
                  <p className="font-medium">{ticket.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
