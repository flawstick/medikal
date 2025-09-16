"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Activity,
  ExternalLink,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";

interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface Mission {
  id: number;
  type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  date_expected: string | null;
  metadata: any;
}

const statusColors = {
  unassigned: "#94a3b8",
  waiting: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#10b981",
  problem: "#ef4444"
};

const statusLabels = {
  unassigned: "לא מוקצה",
  waiting: "ממתין",
  in_progress: "בביצוע",
  completed: "הושלם",
  problem: "בעיה"
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllMissions, setShowAllMissions] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchClientData();
    }
  }, [params.id]);

  const fetchClientData = async () => {
    try {
      const [clientResponse, missionsResponse] = await Promise.all([
        fetch(`/api/clients/${params.id}`),
        fetch(`/api/missions?client_id=${params.id}`)
      ]);

      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        setClient(clientData);
      }

      if (missionsResponse.ok) {
        const missionsData = await missionsResponse.json();
        setMissions(missionsData.data || missionsData);
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת נתוני הלקוח",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Analytics calculations
  const analytics = {
    totalMissions: missions.length,
    completedMissions: missions.filter(m => m.status === 'completed').length,
    waitingMissions: missions.filter(m => m.status === 'waiting').length,
    problemMissions: missions.filter(m => m.status === 'problem').length,
  };

  // Charts data
  const monthlyMissions = missions.reduce((acc, mission) => {
    const month = new Date(mission.created_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.entries(monthlyMissions).map(([month, count]) => ({
    month,
    missions: count
  })).slice(-6);

  const statusData = Object.entries(statusLabels).map(([status, label]) => ({
    name: label,
    value: missions.filter(m => m.status === status).length,
    color: statusColors[status as keyof typeof statusColors]
  })).filter(item => item.value > 0);

  const typeData = missions.reduce((acc, mission) => {
    acc[mission.type] = (acc[mission.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(typeData).map(([type, count]) => ({
    type,
    count
  }));

  // Helper function to format mission date
  const formatMissionDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'problem':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get recent missions for preview (limit to 5)
  const recentMissions = missions.slice(0, 5);
  const hasMoreMissions = missions.length > 5;

  // Missions list component
  const MissionsList = ({ missions: missionsList, showAll = false }: { missions: Mission[], showAll?: boolean }) => {
    const displayMissions = showAll ? missionsList : missionsList.slice(0, 5);

    return (
      <div className="space-y-3">
        {displayMissions.map((mission) => (
          <div
            key={mission.id}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              {getStatusIcon(mission.status)}
              <div>
                <div className="font-medium">
                  {mission.type || 'משלוח'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatMissionDate(mission.created_at)}
                  {mission.date_expected && (
                    <span className="mx-2">• צפוי: {formatMissionDate(mission.date_expected)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Badge variant={
                mission.status === 'completed' ? 'default' :
                mission.status === 'problem' ? 'destructive' :
                mission.status === 'waiting' ? 'secondary' :
                'outline'
              }>
                {statusLabels[mission.status as keyof typeof statusLabels]}
              </Badge>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/deliveries/${mission.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-6" dir="rtl">
        {/* Back Button Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Header Skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Client Info Skeleton */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-20" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 space-x-reverse">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Charts Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-32" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-48" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>

            {/* Bottom Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-24" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-24" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">לקוח לא נמצא</h2>
        <Button asChild>
          <Link href="/clients">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזור לרשימת לקוחות
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6" dir="rtl">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button variant="outline" onClick={() => router.push("/clients")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          חזרה ללקוחות
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-start justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
            <Link href="/clients" className="hover:text-foreground">לקוחות</Link>
            <span>/</span>
            <span>{client.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3 space-x-reverse">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <span>{client.name}</span>
            <Badge variant={client.is_active ? "default" : "secondary"}>
              {client.is_active ? "פעיל" : "לא פעיל"}
            </Badge>
          </h1>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 ml-2" />
            עריכה
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 ml-2" />
            מחיקה
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ משלוחים</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMissions}</div>
            <p className="text-xs text-muted-foreground">
              משלוחים בסך הכל
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הושלמו</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.completedMissions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalMissions > 0 ? Math.round((analytics.completedMissions / analytics.totalMissions) * 100) : 0}% מהסך
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתינים</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{analytics.waitingMissions}</div>
            <p className="text-xs text-muted-foreground">
              משלוחים ממתינים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בעיות</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.problemMissions}</div>
            <p className="text-xs text-muted-foreground">
              דורשים טיפול
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Activity className="h-5 w-5" />
                <span>פרטי לקוח</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.phone && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}

              {client.email && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}

              {client.address && (
                <div className="flex items-start space-x-3 space-x-reverse">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{client.address}</span>
                </div>
              )}

              {client.contact_person && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{client.contact_person}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center space-x-3 space-x-reverse text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>נוצר ב-{new Date(client.created_at).toLocaleDateString('he-IL')}</span>
              </div>

              {client.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">הערות</h4>
                    <p className="text-sm text-muted-foreground">{client.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Missions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Package className="h-5 w-5" />
                  <span>משלוחים אחרונים</span>
                </div>
                {hasMoreMissions && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 ml-2" />
                        הצג הכל ({missions.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>כל המשלוחים של {client?.name}</DialogTitle>
                        <DialogDescription>
                          סה"כ {missions.length} משלוחים
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <MissionsList missions={missions} showAll={true} />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {missions.length > 0 ? (
                <MissionsList missions={missions} showAll={false} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>אין משלוחים עדיין</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Monthly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>פעילות חודשית</CardTitle>
              <CardDescription>מספר משלוחים לפי חודש</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="missions"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>התפלגות סטטוס</CardTitle>
                <CardDescription>סטטוס המשלוחים</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {statusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mission Types */}
            <Card>
              <CardHeader>
                <CardTitle>סוגי משלוחים</CardTitle>
                <CardDescription>התפלגות לפי סוג</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}