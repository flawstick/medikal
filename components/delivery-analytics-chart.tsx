"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Rectangle } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  date: string;
  displayDate: string;
  completed: number;
  waiting: number;
  in_progress: number;
  problem: number;
  unassigned: number;
  total: number;
  activeTotal: number;
}

const chartConfig = {
  deliveries: { label: "משלוחים" },
  completed: { label: "הושלמו", color: "#3b82f6" }, // blue-500
  waiting: { label: "ממתינים", color: "#eab308" }, // yellow-500
  problem: { label: "בעיות", color: "#ef4444" }, // red-500
} satisfies ChartConfig;

// Custom shape component that adds rounded corners to the topmost visible segment
const RoundedBar = (props: any) => {
  const { fill, x, y, width, height, payload, dataKey } = props;
  
  // Check if this bar segment is the topmost one with data
  const isTopSegment = 
    (dataKey === "problem" && payload.problem > 0) ||
    (dataKey === "waiting" && payload.problem === 0 && payload.waiting > 0) ||
    (dataKey === "completed" && payload.problem === 0 && payload.waiting === 0 && payload.completed > 0);
  
  const radius = isTopSegment ? 4 : 0;
  
  return (
    <Rectangle
      {...props}
      radius={[radius, radius, 0, 0]}
    />
  );
};


type DeliveryAnalyticsChartProps = {
  startDate?: Date | null;
  endDate?: Date | null;
};

export function DeliveryAnalyticsChart({
  startDate,
  endDate,
}: DeliveryAnalyticsChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Check if dark mode is active
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  React.useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the auth token from Supabase
        const { createClientComponentClient } = await import(
          "@supabase/auth-helpers-nextjs"
        );
        const supabase = createClientComponentClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const response = await fetch(`/api/analytics/chart?days=${days}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch chart data: ${errorText}`);
        }

        const result = await response.json();
        console.log("Chart API Response:", result); // Debug log
        setChartData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [timeRange]);

  // Data is already filtered by the API based on timeRange
  const filteredData = chartData;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">מגמות משלוחים</CardTitle>
          <CardDescription className="text-right flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardDescription>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">מגמות משלוחים</CardTitle>
          <CardDescription className="text-right">
            שגיאה בטעינת הנתונים
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex h-[250px] items-center justify-center">
            <div className="text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">מגמות משלוחים</CardTitle>
        <CardDescription className="text-right flex items-center justify-between">
          <div>
            <span className="hidden sm:block">
              מגמות משלוחים ב-
              {timeRange === "7d"
                ? "7 הימים"
                : timeRange === "30d"
                  ? "30 הימים"
                  : "90 הימים"}{" "}
              האחרונים
            </span>
            <span className="sm:hidden">
              {timeRange === "7d"
                ? "7 ימים"
                : timeRange === "30d"
                  ? "30 ימים"
                  : "90 ימים"}{" "}
              אחרונים
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span>הושלמו</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
              <span>ממתינים</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span>בעיות</span>
            </div>
          </div>
        </CardDescription>
        <div className="flex justify-end">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="7d">7 ימים</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 ימים</ToggleGroupItem>
            <ToggleGroupItem value="90d">90 ימים</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-32 sm:hidden"
              aria-label="בחר טווח זמן"
            >
              <SelectValue placeholder="30 ימים" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                7 ימים
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 ימים
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                90 ימים
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center">
            <div className="text-muted-foreground">אין נתונים להצגה</div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                fontSize={12}
                tickFormatter={(value) => value.length > 6 ? value.slice(0, 6) + '...' : value}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <ChartTooltip
                cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.12)" }}
                content={
                  <ChartTooltipContent
                    indicator="dashed"
                  />
                }
              />
              <Bar
                dataKey="completed"
                stackId="a"
                fill="var(--color-completed)"
                name="הושלמו"
                shape={RoundedBar}
              />
              <Bar
                dataKey="waiting"
                stackId="a"
                fill="var(--color-waiting)"
                name="ממתינים"
                shape={RoundedBar}
              />
              <Bar
                dataKey="problem"
                stackId="a"
                fill="var(--color-problem)"
                name="בעיות"
                shape={RoundedBar}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
