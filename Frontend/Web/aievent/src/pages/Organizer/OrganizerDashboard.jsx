import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../api/dashboardAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const OrganizerDashboard = () => {
  const [eventStatistics, setEventStatistics] = useState(null);
  const [buyerStatistics, setBuyerStatistics] = useState(null);
  const [checkInStatistics, setCheckInStatistics] = useState(null);
  const [revenueStatistics, setRevenueStatistics] = useState(null);
  const [netRevenueStatistics, setNetRevenueStatistics] = useState(null);
  const [revenueByCategoryTag, setRevenueByCategoryTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all dashboard data in parallel
        const [
          eventStats,
          buyerStats,
          checkInStats,
          revenueStats,
          netRevenueStats,
          revenueCategoryTag
        ] = await Promise.all([
          dashboardAPI.getEventStatistics().catch(err => {
            console.error('Error fetching event statistics:', err);
            return { totalEvents: 0, eventsByStatus: [], eventsByTag: [], eventsByCategory: [], eventsByDate: [] };
          }),
          dashboardAPI.getBuyerStatistics().catch(err => {
            console.error('Error fetching buyer statistics:', err);
            return { totalBuyers: 0, buyersByEvent: [] };
          }),
          dashboardAPI.getCheckInStatistics().catch(err => {
            console.error('Error fetching check-in statistics:', err);
            return { totalCheckedIn: 0, checkInsByEvent: [] };
          }),
          dashboardAPI.getRevenueStatistics().catch(err => {
            console.error('Error fetching revenue statistics:', err);
            return { totalRevenue: 0, revenueByEvent: [] };
          }),
          dashboardAPI.getNetRevenueStatistics().catch(err => {
            console.error('Error fetching net revenue statistics:', err);
            return { totalNetRevenue: 0, netRevenueByEvent: [] };
          }),
          dashboardAPI.getRevenueByCategoryTag().catch(err => {
            console.error('Error fetching revenue by category/tag:', err);
            return { revenueByCategory: [], revenueByTag: [] };
          })
        ]);

        setEventStatistics(eventStats);
        setBuyerStatistics(buyerStats);
        setCheckInStatistics(checkInStats);
        setRevenueStatistics(revenueStats);
        setNetRevenueStatistics(netRevenueStats);
        setRevenueByCategoryTag(revenueCategoryTag);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format data for charts
  const getEventsByStatusData = () => {
    if (!eventStatistics || !eventStatistics.eventsByStatus) return [];
    return eventStatistics.eventsByStatus.map(item => ({
      name: item.status || 'Unknown',
      value: item.count || 0
    }));
  };

  const getEventsByCategoryData = () => {
    if (!eventStatistics || !eventStatistics.eventsByCategory) return [];
    return eventStatistics.eventsByCategory.map(item => ({
      name: item.categoryName || 'Unknown',
      value: item.count || 0
    }));
  };

  const getRevenueByEventData = () => {
    if (!revenueStatistics || !revenueStatistics.revenueByEvent) return [];
    return revenueStatistics.revenueByEvent.map(item => ({
      name: item.eventName || 'Unknown Event',
      revenue: item.revenue || 0
    }));
  };

  const getBuyersByEventData = () => {
    if (!buyerStatistics || !buyerStatistics.buyersByEvent) return [];
    return buyerStatistics.buyersByEvent.map(item => ({
      name: item.eventName || 'Unknown Event',
      buyers: item.buyerCount || 0
    }));
  };

  const getCheckInsByEventData = () => {
    if (!checkInStatistics || !checkInStatistics.checkInsByEvent) return [];
    return checkInStatistics.checkInsByEvent.map(item => ({
      name: item.eventName || 'Unknown Event',
      checkIns: item.checkInCount || 0
    }));
  };

  const getEventsByDateData = () => {
    if (!eventStatistics || !eventStatistics.eventsByDate) return [];
    return eventStatistics.eventsByDate.map(item => ({
      date: item.date || 'Unknown Date',
      count: item.count || 0
    }));
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Widget data
  const widgetData = [
    {
      title: "TOTAL EVENTS",
      value: eventStatistics?.totalEvents || 0,
      description: "All events you've created",
      color: "rgba(255, 0, 0, 0.2)",
      textColor: "crimson"
    },
    {
      title: "TOTAL BUYERS",
      value: buyerStatistics?.totalBuyers || 0,
      description: "People who bought tickets",
      color: "rgba(218, 165, 32, 0.2)",
      textColor: "goldenrod"
    },
    {
      title: "TOTAL REVENUE",
      value: revenueStatistics?.totalRevenue ? `$${revenueStatistics.totalRevenue.toFixed(2)}` : '$0.00',
      description: "Total sales from all events",
      color: "rgba(0, 128, 0, 0.2)",
      textColor: "green"
    },
    {
      title: "CHECKED IN",
      value: checkInStatistics?.totalCheckedIn || 0,
      description: "Attendees checked in",
      color: "rgba(128, 0, 128, 0.2)",
      textColor: "purple"
    }
  ];

  if (loading) {
    return <div className="dashboard">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="dashboard error">{error}</div>;
  }

  return (
    <div className="organizer-dashboard">
      <style>
        {`
          .organizer-dashboard {
            padding: 20px;
            background-color: #f5f5f5;
            min-height: 100vh;
          }

          .dashboard-widgets {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .widget {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.3s ease;
          }

          .widget:hover {
            transform: translateY(-5px);
          }

          .widget-content .title {
            display: block;
            font-size: 14px;
            color: #999;
            margin-bottom: 5px;
          }

          .widget-content .value {
            display: block;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .widget-content .description {
            display: block;
            font-size: 12px;
            color: #999;
          }

          .widget-icon {
            width: 50px;
            height: 50px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .dashboard-charts {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
          }

          .chart-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
          }

          .chart-container h3 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #333;
            font-size: 18px;
          }

          .error {
            color: #d32f2f;
            text-align: center;
            padding: 20px;
            font-size: 18px;
          }

          @media (max-width: 768px) {
            .organizer-dashboard {
              padding: 10px;
            }

            .dashboard-charts {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      
      <div className="dashboard-widgets">
        {widgetData.map((widget, index) => (
          <div className="widget" key={index}>
            <div className="widget-content">
              <span className="title">{widget.title}</span>
              <span className="value" style={{ color: widget.textColor }}>{widget.value}</span>
              <span className="description">{widget.description}</span>
            </div>
            <div className="widget-icon" style={{ backgroundColor: widget.color }}>
              {/* Icon would go here */}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Events by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getEventsByStatusData()}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {getEventsByStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Events']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Revenue by Event</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={getRevenueByEventData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Events Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={getEventsByDateData()}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Buyers by Event</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={getBuyersByEventData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Buyers']} />
              <Legend />
              <Bar dataKey="buyers" fill="#82ca9d" name="Buyers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Check-ins by Event</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={getCheckInsByEventData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Check-ins']} />
              <Legend />
              <Bar dataKey="checkIns" fill="#ffc658" name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Events by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getEventsByCategoryData()}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {getEventsByCategoryData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Events']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;