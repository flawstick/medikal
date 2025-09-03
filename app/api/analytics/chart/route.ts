import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 90); // Max 90 days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch missions data grouped by date and status
    const { data: missions, error } = await supabase
      .from("missions")
      .select("date_expected, status")
      .gte("date_expected", startDate.toISOString())
      .lte("date_expected", endDate.toISOString())
      .order("date_expected", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch data",
          details: error.message,
          table: "missions",
          columns: "date_expected, status",
        },
        { status: 500 },
      );
    }

    console.log("Missions fetched:", missions?.length || 0);

    // Process data by day
    const dailyData = new Map<
      string,
      {
        date: string;
        completed: number;
        waiting: number;
        in_progress: number;
        problem: number;
        unassigned: number;
        total: number;
      }
    >();

    // Initialize all days in range with zero counts
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = d.toISOString().split("T")[0];
      dailyData.set(dateKey, {
        date: dateKey,
        completed: 0,
        waiting: 0,
        in_progress: 0,
        problem: 0,
        unassigned: 0,
        total: 0,
      });
    }

    // Count missions by status for each day
    missions?.forEach((mission) => {
      const dateKey = new Date(mission.date_expected)
        .toISOString()
        .split("T")[0];
      const dayData = dailyData.get(dateKey);

      if (dayData) {
        dayData.total++;
        switch (mission.status) {
          case "completed":
            dayData.completed++;
            break;
          case "waiting":
            dayData.waiting++;
            break;
          case "in_progress":
            dayData.in_progress++;
            break;
          case "problem":
            dayData.problem++;
            break;
          case "unassigned":
            dayData.unassigned++;
            break;
        }
      }
    });

    // Convert to array and sort by date
    const chartData = Array.from(dailyData.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // Format dates for display (Hebrew month names)
    const hebrewMonths = [
      "ינואר",
      "פברואר",
      "מרץ",
      "אפריל",
      "מאי",
      "יוני",
      "יולי",
      "אוגוסט",
      "ספטמבר",
      "אוקטובר",
      "נובמבר",
      "דצמבר",
    ];

    const formattedData = chartData.map((item) => {
      const date = new Date(item.date);
      const day = date.getDate();
      const month = hebrewMonths[date.getMonth()];

      return {
        ...item,
        displayDate: `${day} ${month}`,
        // Also calculate cumulative for trends if needed
        activeTotal: item.waiting + item.in_progress, // Active missions
      };
    });

    return NextResponse.json({
      data: formattedData,
      summary: {
        totalMissions: missions?.length || 0,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days,
        },
      },
      debug: {
        rawMissionsCount: missions?.length || 0,
        dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
        sampleMissions: missions?.slice(0, 3) || [],
        processedDaysCount: formattedData.length,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
