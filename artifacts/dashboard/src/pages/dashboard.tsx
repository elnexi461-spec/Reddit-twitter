import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Activity, Clock, CheckCircle2, AlertCircle, ExternalLink, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Lead {
  id: string;
  source: "reddit" | "twitter";
  keyword: string;
  title: string;
  url: string;
  timestamp: string;
}

interface ActivityResponse {
  uptime: number;
  totalLeads: number;
  workers: {
    reddit: "active" | "degraded";
    twitter: "active" | "degraded";
  };
  leads: Lead[];
}

export default function Dashboard() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add dark mode by default on the body for this dashboard since it's hardcoded to be dark
    document.documentElement.classList.add("dark");
    
    const fetchData = async () => {
      try {
        const response = await fetch('/api/activity');
        if (!response.ok) {
          throw new Error('Failed to fetch activity data');
        }
        const result = await response.json();
        setData(result);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800">
            <Activity className="w-4 h-4 text-zinc-400" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100" data-testid="text-sys-name">
            Proxies.sx Intel Engine
          </h1>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400" data-testid="status-live">Live</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href="/api/activity/export/csv"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 transition-colors"
            data-testid="button-export-csv"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span data-testid="text-last-updated">
              {lastUpdated ? format(lastUpdated, "HH:mm:ss") : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-md bg-red-950/30 border border-red-900/50 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm" data-testid="card-total-leads">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Leads Discovered</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="text-3xl font-bold tracking-tight text-zinc-100" data-testid="value-total-leads">
                  {data.totalLeads.toLocaleString()}
                </div>
              ) : (
                <Skeleton className="h-9 w-24 bg-zinc-800" />
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-sm" data-testid="card-reddit-worker">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Reddit Worker</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="flex items-center gap-2" data-testid={`status-reddit-${data.workers.reddit}`}>
                  {data.workers.reddit === "active" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="text-lg font-medium capitalize text-zinc-200">
                    {data.workers.reddit}
                  </span>
                </div>
              ) : (
                <Skeleton className="h-7 w-28 bg-zinc-800" />
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-sm" data-testid="card-twitter-worker">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Twitter Worker</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="flex items-center gap-2" data-testid={`status-twitter-${data.workers.twitter}`}>
                  {data.workers.twitter === "active" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="text-lg font-medium capitalize text-zinc-200">
                    {data.workers.twitter}
                  </span>
                </div>
              ) : (
                <Skeleton className="h-7 w-28 bg-zinc-800" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Real-Time Activity Feed</h2>
            {data && (
              <span className="text-xs text-zinc-500 font-mono">
                Uptime: {formatUptime(data.uptime)}
              </span>
            )}
          </div>

          <div className="rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[180px]">Timestamp</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[120px]">Source</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[150px]">Keyword</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider">Lead Title</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider text-right w-[140px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-zinc-800 hover:bg-zinc-900/30">
                      <TableCell><Skeleton className="h-4 w-32 bg-zinc-800" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 bg-zinc-800 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 bg-zinc-800" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full bg-zinc-800" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 bg-zinc-800 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : data.leads.length === 0 ? (
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                      Listening for high-intent signals...
                    </TableCell>
                  </TableRow>
                ) : (
                  data.leads.map((lead) => (
                    <TableRow key={lead.id} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors group">
                      <TableCell className="text-zinc-400 font-mono text-xs whitespace-nowrap" data-testid={`timestamp-${lead.id}`}>
                        {format(new Date(lead.timestamp), "MMM dd, HH:mm:ss")}
                      </TableCell>
                      <TableCell data-testid={`source-${lead.id}`}>
                        {lead.source === "reddit" ? (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20 font-medium text-[10px] uppercase tracking-wider">
                            Reddit
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20 font-medium text-[10px] uppercase tracking-wider">
                            X / Twitter
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-300 font-mono text-xs" data-testid={`keyword-${lead.id}`}>
                        {lead.keyword}
                      </TableCell>
                      <TableCell className="text-zinc-200 text-sm max-w-[400px] truncate" data-testid={`title-${lead.id}`} title={lead.title}>
                        {lead.title}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:pointer-events-none disabled:opacity-50 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-50 text-zinc-300 h-8 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`link-review-${lead.id}`}
                        >
                          Review Thread
                          <ExternalLink className="ml-1.5 h-3 w-3 text-zinc-500" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
