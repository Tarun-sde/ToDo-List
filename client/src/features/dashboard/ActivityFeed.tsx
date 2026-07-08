import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';

type ActivityType = 
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED';

export type Activity = {
  _id: string;
  type: ActivityType;
  message: string;
  createdAt: string;
};

const ACTIVITY_ICON: Record<ActivityType, string> = {
  TASK_CREATED: '➕',
  TASK_UPDATED: '✏️',
  TASK_COMPLETED: '✅',
  TASK_DELETED: '🗑️',
  PROJECT_CREATED: '📁',
  PROJECT_UPDATED: '✏️',
  PROJECT_DELETED: '🗑️',
  PROFILE_UPDATED: '👤',
  PASSWORD_CHANGED: '🔒',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activity?limit=10')
      .then(({ data }) => setActivities(data.activities))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
      <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-300 font-medium">Start using TaskFlow.</p>
          <p className="text-gray-500 text-sm mt-1">Your recent activity will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity._id} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-sm">
                {ACTIVITY_ICON[activity.type] || '📌'}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-gray-200">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
