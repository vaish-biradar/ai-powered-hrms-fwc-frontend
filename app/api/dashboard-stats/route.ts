import { NextResponse } from "next/server";
import postgresDB from "@/lib/storage/cosmos-client";
import { format, subMonths } from "date-fns";
import { insertItem, updateItem } from "@/lib/storage/cosmos-utils";

// Types - unchanged from original
interface Application {
  id: string;
  candidate_name?: string;
  candidate_email?: string;
  applied_date?: string;
  similarity?: number | string;
  job_title?: string;
  status?: string;
  job_description_id?: string;
  department?: string;
}

interface Stats {
  resumes: number;
  job_descriptions: number;
  applications: number;
  hired: number;
  month_year?: string;
  id?: string;
}

interface Change {
  absolute: string;
  percentage: string;
}

interface HRStat {
  title: string;
  value: string;
  change: string;
  icon: string;
  department?: string;
}

interface RecentApplication {
  id: string;
  candidateName: string;
  candidateEmail: string;
  appliedDate: string;
  similarity: number | string;
  position: string;
  status: string;
  department: string;
}

export async function GET() {
  try {
    // Execute queries in parallel
    const [resumesResult, jdsResult, applicationsResult, departmentsResult, currentMonthYear] = await Promise.all([
      postgresDB.query("SELECT COUNT(*) as count FROM resumes"),
      postgresDB.query("SELECT * FROM job_descriptions WHERE status = 'Open'"),
      postgresDB.query(`
        SELECT a.*, j.department, j.title as job_title
        FROM applications a
        LEFT JOIN job_descriptions j ON a.job_description_id = j.id
      `),
      postgresDB.query("SELECT DISTINCT department FROM job_descriptions WHERE department IS NOT NULL"),
      format(new Date(), "MMM yyyy")
    ]);

    // Extract data from results
    const resumesCount = parseInt(resumesResult.rows[0].count);
    const jobDescriptionsCount = jdsResult.rowCount;
    const applicationsData = applicationsResult.rows as Application[];
    const applicationsCount = applicationsData.length;
    const hiredCount = applicationsData.filter((a) => a.status?.toLowerCase() === "hired").length;
    const departments = departmentsResult.rows.map(row => row.department);

    // Check whether the optional dashboard_stats table exists before querying it
    const statsTableExistsResult = await postgresDB.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS exists",
      ["dashboard_stats"]
    );

    const statsTableExists = statsTableExistsResult.rows[0]?.exists;
    let prevStats: Stats = {
      resumes: 0,
      job_descriptions: 0,
      applications: 0,
      hired: 0,
    };

    let statsQuery: { rows: any[] } | null = null;

    if (statsTableExists) {
      statsQuery = await postgresDB.query(
        "SELECT * FROM dashboard_stats WHERE month_year = $1 LIMIT 1",
        [currentMonthYear]
      );
      prevStats = statsQuery.rows[0] as Stats || prevStats;
    } else {
      console.warn("dashboard_stats table not found; skipping previous-month stats lookup and persistence.");
    }

    // Helper function for calculating changes
    const getChange = (current: number | null, previous: number): Change => {
      if (!previous) return { absolute: `+${current}`, percentage: "+100%" };
      const change = (current || 0) - previous;
      const percentChange = ((change / previous) * 100).toFixed(1);
      return {
        absolute: `${change >= 0 ? "+" : ""}${change}`,
        percentage: `${change >= 0 ? "+" : ""}${percentChange}%`,
      };
    };

    // Create overall stats
    const hrStats: HRStat[] = [
      {
        title: "Total Resumes",
        value: (resumesCount ?? 0).toLocaleString(),
        change: `${getChange(resumesCount, prevStats.resumes).absolute} (${getChange(resumesCount, prevStats.resumes).percentage})`,
        icon: "FileText",
      },
      {
        title: "Open JDs",
        value: (jobDescriptionsCount ?? 0).toLocaleString(),
        change: `${getChange(jobDescriptionsCount, prevStats.job_descriptions).absolute} (${getChange(jobDescriptionsCount, prevStats.job_descriptions).percentage})`,
        icon: "Briefcase",
      },
      {
        title: "New Applications",
        value: applicationsCount.toLocaleString(),
        change: `${getChange(applicationsCount, prevStats.applications).absolute} (${getChange(applicationsCount, prevStats.applications).percentage})`,
        icon: "CirclePlus",
      },
      {
        title: "Newly Hired",
        value: hiredCount.toLocaleString(),
        change: `${getChange(hiredCount, prevStats.hired).absolute} (${getChange(hiredCount, prevStats.hired).percentage})`,
        icon: "UserCheck",
      },
    ];

    // Pre-calculate department stats once
    const deptJDsMap = new Map();
    const deptAppsMap = new Map();
    const deptHiredMap = new Map();
    
    departments.forEach(department => {
      deptJDsMap.set(department, jdsResult.rows.filter(jd => jd.department === department).length);
      const deptApps = applicationsData.filter(app => app.department === department);
      deptAppsMap.set(department, deptApps.length);
      deptHiredMap.set(department, deptApps.filter(app => app.status?.toLowerCase() === "hired").length);
    });

    // Add department-specific stats
    departments.forEach(department => {
      hrStats.push(
        {
          title: `${department} Open JDs`,
          value: deptJDsMap.get(department).toLocaleString(),
          change: `+${deptJDsMap.get(department)} (+100%)`,
          icon: "Briefcase",
          department: department,
        },
        {
          title: `${department} Applications`,
          value: deptAppsMap.get(department).toLocaleString(),
          change: `+${deptAppsMap.get(department)} (+100%)`,
          icon: "CirclePlus",
          department: department,
        },
        {
          title: `${department} Hired`,
          value: deptHiredMap.get(department).toLocaleString(),
          change: `+${deptHiredMap.get(department)} (+100%)`,
          icon: "UserCheck",
          department: department,
        }
      );
    });

    // Calculate months once
    const today = new Date();
    const sixMonths = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(today, 5 - i);
      const formatted = format(date, "MMM yyyy");
      return { name: formatted, id: formatted };
    });

    // Pre-process applications by month to avoid repeated filtering
    const appsByMonth = new Map();
    applicationsData.forEach(app => {
      if (!app.applied_date) return;
      const appliedMonth = format(new Date(app.applied_date), "MMM yyyy");
      if (!appsByMonth.has(appliedMonth)) {
        appsByMonth.set(appliedMonth, []);
      }
      appsByMonth.get(appliedMonth).push(app);
    });

    // Generate application data for all departments
    const applicationData = sixMonths.map(({ name, id }) => {
      const monthApps = appsByMonth.get(id) || [];
      
      // Initialize statuses object with zeros
      const statuses: { [key: string]: number } = { 
        screening: 0, interview: 0, hired: 0, rejected: 0, applied: 0 
      };
      
      // Prepare department statuses with zeros
      departments.forEach(dept => {
        statuses[`${dept}_applied`] = 0;
        statuses[`${dept}_screening`] = 0;
        statuses[`${dept}_interview`] = 0;
        statuses[`${dept}_hired`] = 0;
        statuses[`${dept}_rejected`] = 0;
      });
      
      // Fill in actual values
      monthApps.forEach((app: Application) => {
        const status: string = app.status?.toLowerCase() || "applied";
        statuses[status]++;
        
        if (app.department) {
          const key: string = `${app.department}_${status}`;
          statuses[key]++;
        }
      });
      
      return {
        name,
        ...statuses,
        departments,
      };
    });
    
    // Get recent applications efficiently
    const recentApplications: RecentApplication[] = applicationsData
      .filter((app) => app.applied_date)
      .sort((a, b) => 
        new Date(b.applied_date!).getTime() - new Date(a.applied_date!).getTime()
      )
      .slice(0, 10)
      .map((app) => ({
        id: app.id,
        candidateName: app.candidate_name || "Unknown",
        candidateEmail: app.candidate_email || "Unknown",
        appliedDate: app.applied_date || "Unknown",
        similarity: app.similarity ?? "Unknown",
        position: app.job_title || "Unknown",
        status: app.status || "Pending",
        department: app.department || "Unknown",
      }));

    // Update or insert stats only if the optional table exists
    if (statsTableExists) {
      if (statsQuery && statsQuery.rows.length > 0 && statsQuery.rows[0].id) {
        // Fire and forget - don't await this
        updateItem("dashboard_stats", statsQuery.rows[0].id, {
          resumes: resumesCount,
          job_descriptions: jobDescriptionsCount,
          applications: applicationsCount,
          hired: hiredCount,
          applied_date: new Date().toISOString(),
        }).catch(e => console.error("Failed to update stats:", e));
      } else {
        // Fire and forget - don't await this
        insertItem("dashboard_stats", {
          resumes: resumesCount,
          job_descriptions: jobDescriptionsCount,
          applications: applicationsCount,
          hired: hiredCount,
          month_year: currentMonthYear,
        }).catch(e => console.error("Failed to insert stats:", e));
      }
    } else {
      console.warn("Skipped dashboard_stats persistence because the table does not exist.");
    }

    return NextResponse.json(
      {
        hrStats,
        applicationData,
        recentApplications,
        departments,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching HR stats:", errorMessage, error);
    const responseBody = {
      message: process.env.NODE_ENV === "development"
        ? `Internal Server Error: ${errorMessage}`
        : "Internal Server Error",
    };
    return NextResponse.json(responseBody, { status: 500 });
  }
}