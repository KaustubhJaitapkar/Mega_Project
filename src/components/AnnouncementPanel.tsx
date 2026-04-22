'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useParams } from 'next/navigation';

interface AnnouncementPanelProps {
  hackathonId: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
  };
  isUrgent: boolean;
  createdAt: string;
}

export default function AnnouncementPanel({ hackathonId }: AnnouncementPanelProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch announcements
    async function fetchAnnouncements() {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/announcements`);
        const data = await res.json();
        setAnnouncements(data.data || []);
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnnouncements();

    // Setup Socket.io for real-time updates
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

    socket.on('connect', () => {
      socket.emit('join-room', `hackathon:${hackathonId}`);
    });

    socket.on('announcement:new', (newAnnouncement: Announcement) => {
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [hackathonId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Announcements</h2>

      {announcements.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No announcements yet</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`p-4 rounded-lg border-l-4 ${
                announcement.isUrgent
                  ? 'bg-red-50 border-red-500'
                  : 'bg-blue-50 border-indigo-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{announcement.title}</h3>
                {announcement.isUrgent && (
                  <span className="badge badge-danger text-xs">URGENT</span>
                )}
              </div>
              <p className="text-gray-700 text-sm mb-2">{announcement.content}</p>
              <p className="text-xs text-gray-600">
                {announcement.author.name} • {new Date(announcement.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
