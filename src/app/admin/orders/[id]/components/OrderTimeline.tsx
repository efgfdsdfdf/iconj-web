import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function OrderTimeline({ events }: { events: any[] }) {
  return (
    <Card className="shadow-sm border-none">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Order Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events && events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event, idx) => (
              <div key={event.id} className="relative flex gap-4">
                {idx !== events.length - 1 && (
                  <div className="absolute left-2 top-6 bottom-[-24px] w-0.5 bg-slate-200" />
                )}
                <div className="w-4 h-4 mt-1 rounded-full bg-blue-100 border-2 border-blue-500 shrink-0 z-10" />
                <div>
                  <p className="font-semibold text-slate-800">{event.event_type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-slate-600">{event.description}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No timeline events recorded.</p>
        )}
      </CardContent>
    </Card>
  );
}
