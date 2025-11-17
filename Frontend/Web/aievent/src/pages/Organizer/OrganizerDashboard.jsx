import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../api/dashboardAPI';
import { eventCategoryAPI } from '../../api/eventCategoryAPI';
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Filter, X, Calendar, Users, DollarSign, CheckCircle, Eye, EyeOff } from 'lucide-react';

const OrganizerDashboard = () => {
  const [eventStatistics, setEventStatistics] = useState(null);
  const [buyerStatistics, setBuyerStatistics] = useState(null);
  const [checkInStatistics, setCheckInStatistics] = useState(null);
  const [revenueStatistics, setRevenueStatistics] = useState(null);
  const [netRevenueStatistics, setNetRevenueStatistics] = useState(null);
  const [revenueByCategoryTag, setRevenueByCategoryTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showChartSelector, setShowChartSelector] = useState(false);
  
  // Chart visibility state
  const [visibleCharts, setVisibleCharts] = useState({
    eventsByStatus: true,
    revenueByEvent: true,
    eventsOverTime: true,
    buyersByEvent: true,
    checkInsByEvent: true,
    eventsByCategory: true
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    categoryId: '',
    startDate: '',
    endDate: '',
    year: '',
    month: '',
    day: ''
  });

  // Generate options for year, month, and day dropdowns
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // 10 years around current year
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const days = Array.from({ length: 31 }, (_, i) => i + 1); // 1-31

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await eventCategoryAPI.getEventCategories(1, 100);
      if (response?.data?.items) {
        setCategories(response.data.items);
      } else if (response?.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      // Set fallback categories if API fails
      setCategories([
        { eventCategoryId: '1', eventCategoryName: 'Technology' },
        { eventCategoryId: '2', eventCategoryName: 'Music' },
        { eventCategoryId: '3', eventCategoryName: 'Networking' },
        { eventCategoryId: '4', eventCategoryName: 'Workshop' },
        { eventCategoryId: '5', eventCategoryName: 'Conference' }
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchData();
    setShowFilters(false); // Close filters after applying
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      startDate: '',
      endDate: '',
      year: '',
      month: '',
      day: ''
    });
  };

  const getFilterParams = () => {
    const params = {};
    
    // Map category name to ID if a category is selected
    if (filters.categoryId) {
      params.categoryId = filters.categoryId;
    }
    
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.year) params.year = parseInt(filters.year);
    if (filters.month) params.month = parseInt(filters.month);
    if (filters.day) params.day = parseInt(filters.day);
    return params;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const filterParams = getFilterParams();
      
      // Fetch all dashboard data in parallel
      const [
        eventStats,
        buyerStats,
        checkInStats,
        revenueStats,
        netRevenueStats,
        revenueCategoryTag
      ] = await Promise.all([
        dashboardAPI.getEventStatistics(filterParams).catch(err => {
          console.error('Error fetching event statistics:', err);
          return { totalEvents: 0, eventsByStatus: [], eventsByTag: [], eventsByCategory: [], eventsByDate: [] };
        }),
        dashboardAPI.getBuyerStatistics(filterParams).catch(err => {
          console.error('Error fetching buyer statistics:', err);
          return { totalBuyers: 0, buyersByEvent: [] };
        }),
        dashboardAPI.getCheckInStatistics(filterParams).catch(err => {
          console.error('Error fetching check-in statistics:', err);
          return { totalCheckedIn: 0, checkInsByEvent: [] };
        }),
        dashboardAPI.getRevenueStatistics(filterParams).catch(err => {
          console.error('Error fetching revenue statistics:', err);
          return { totalRevenue: 0, revenueByEvent: [] };
        }),
        dashboardAPI.getNetRevenueStatistics(filterParams).catch(err => {
          console.error('Error fetching net revenue statistics:', err);
          return { totalNetRevenue: 0, netRevenueByEvent: [] };
        }),
        dashboardAPI.getRevenueByCategoryTag(filterParams).catch(err => {
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

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle chart visibility
  const toggleChartVisibility = (chartName) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

  // Toggle all charts
  const toggleAllCharts = (isVisible) => {
    setVisibleCharts({
      eventsByStatus: isVisible,
      revenueByEvent: isVisible,
      eventsOverTime: isVisible,
      buyersByEvent: isVisible,
      checkInsByEvent: isVisible,
      eventsByCategory: isVisible
    });
  };

  // Format data for charts
  const getEventsByStatusData = () => {
    if (!eventStatistics || !eventStatistics.eventsByStatus) return [];
    
    return eventStatistics.eventsByStatus.map(item => {
      // Map backend status integer to frontend enum
      let statusKey = null;
      switch (item.status) {
        case 0: // PendingApproval
          statusKey = EventStatus.PendingApproval;
          break;
        case 1: // Approved
          statusKey = EventStatus.Approved;
          break;
        case 2: // Rejected
          statusKey = EventStatus.Rejected;
          break;
        case 3: // Cancelled
          statusKey = EventStatus.Cancelled;
          break;
        case 4: // WaitingForPayout
          statusKey = EventStatus.WaitingForPayout;
          break;
        case 5: // PaidOut
          statusKey = EventStatus.PaidOut;
          break;
        default:
          statusKey = null;
      }
      
      // Use display name if available, otherwise use status name from backend
      const displayName = statusKey ? EventStatusDisplay[statusKey] : item.statusName;
      
      return {
        name: displayName || 'Unknown',
        value: item.count || 0
      };
    });
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
  const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];

  // Widget data
  const widgetData = [
    {
      title: "TOTAL EVENTS",
      value: eventStatistics?.totalEvents || 0,
      description: "All events you've created",
      icon: <Calendar size={20} />,
      color: "primary"
    },
    {
      title: "TOTAL BUYERS",
      value: buyerStatistics?.totalBuyers || 0,
      description: "People who bought tickets",
      icon: <Users size={20} />,
      color: "success"
    },
    {
      title: "TOTAL REVENUE",
      value: revenueStatistics?.totalRevenue ? `$${revenueStatistics.totalRevenue.toFixed(2)}` : '$0.00',
      description: "Total sales from all events",
      icon: <DollarSign size={20} />,
      color: "info"
    },
    {
      title: "CHECKED IN",
      value: checkInStatistics?.totalCheckedIn || 0,
      description: "Attendees checked in",
      icon: <CheckCircle size={20} />,
      color: "warning"
    }
  ];

  // Calculate chart height based on visibility
  const getChartHeight = () => {
    const visibleCount = Object.values(visibleCharts).filter(Boolean).length;
    
    // Adjust height based on number of visible charts
    if (visibleCount <= 2) return 350;
    if (visibleCount <= 4) return 300;
    return 250;
  };

  // Chart definitions
  const chartDefinitions = [
    {
      id: 'eventsByStatus',
      title: 'Events by Status',
      visible: visibleCharts.eventsByStatus,
      component: (
        <ResponsiveContainer width="100%" height={getChartHeight()}>
          <PieChart>
            <Pie
              data={getEventsByStatusData()}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={Math.min(getChartHeight() / 3, 80)}
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
      )
    },
    {
      id: 'revenueByEvent',
      title: 'Revenue by Event',
      visible: visibleCharts.revenueByEvent,
      component: (
        <ResponsiveContainer width="100%" height={getChartHeight()}>
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
            <Bar dataKey="revenue" fill="#4e73df" name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'eventsOverTime',
      title: 'Events Over Time',
      visible: visibleCharts.eventsOverTime,
      component: (
        <ResponsiveContainer width="100%" height={getChartHeight()}>
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
            <Area type="monotone" dataKey="count" stroke="#4e73df" fill="rgba(78, 115, 223, 0.2)" />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'buyersByEvent',
      title: 'Buyers by Event',
      visible: visibleCharts.buyersByEvent,
      component: (
        <ResponsiveContainer width="100%" height={getChartHeight()}>
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
            <Bar dataKey="buyers" fill="#1cc88a" name="Buyers" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'checkInsByEvent',
      title: 'Check-ins by Event',
      visible: visibleCharts.checkInsByEvent,
      component: (
        <ResponsiveContainer width="100%" height={getChartHeight()}>
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
            <Bar dataKey="checkIns" fill="#f6c23e" name="Check-ins" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'eventsByCategory',
      title: 'Events by Category',
      visible: visibleCharts.eventsByCategory,
      component: (
        <ResponsiveContainer width="100%" height={getChartHeight()}>
          <PieChart>
            <Pie
              data={getEventsByCategoryData()}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={Math.min(getChartHeight() / 3, 80)}
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
      )
    }
  ];

  // Calculate grid layout based on visible charts
  const getChartGridColumns = () => {
    const visibleCount = Object.values(visibleCharts).filter(Boolean).length;
    
    if (visibleCount === 0) return '1fr';
    if (visibleCount === 1) return '1fr';
    if (visibleCount === 2) return '1fr 1fr';
    if (visibleCount <= 4) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)';
  };

  if (loading) {
    return (
      <div className="organizer-dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="organizer-dashboard">
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="organizer-dashboard">
      <style>
        {`
          .organizer-dashboard {
            padding: 20px;
            background-color: #f8f9fc;
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e3e6f0;
          }

          .dashboard-title {
            font-size: 28px;
            font-weight: 700;
            color: #333;
            margin: 0;
          }

          .header-actions {
            display: flex;
            gap: 15px;
          }

          .filter-toggle, .chart-toggle {
            background: white;
            border: 1px solid #ddd;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }

          .filter-toggle:hover, .chart-toggle:hover {
            background: #f8f9fc;
            transform: scale(1.05);
          }

          .filter-toggle.active, .chart-toggle.active {
            background: #4e73df;
            color: white;
            border-color: #4e73df;
          }

          .dashboard-filters {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 25px;
            margin-bottom: 25px;
            position: relative;
            border: 1px solid #e3e6f0;
          }

          .filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .filter-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin: 0;
          }

          .close-filter {
            background: none;
            border: none;
            cursor: pointer;
            color: #999;
            font-size: 20px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
          }

          .close-filter:hover {
            color: #333;
            background: #f8f9fc;
          }

          .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
          }

          .filter-group {
            flex: 1;
            min-width: 200px;
          }

          .filter-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #555;
            font-size: 14px;
          }

          .filter-group input, .filter-group select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d3e2;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .filter-group input:focus, .filter-group select:focus {
            border-color: #4e73df;
            outline: none;
            box-shadow: 0 0 0 2px rgba(78, 115, 223, 0.2);
          }

          .filter-buttons {
            display: flex;
            gap: 12px;
            margin-top: 15px;
            justify-content: flex-end;
          }

          .filter-buttons button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
          }

          .apply-btn {
            background-color: #4e73df;
            color: white;
          }

          .apply-btn:hover {
            background-color: #2e59d9;
            transform: translateY(-1px);
          }

          .clear-btn {
            background-color: #858796;
            color: white;
          }

          .clear-btn:hover {
            background-color: #6c6e7e;
            transform: translateY(-1px);
          }

          .dashboard-widgets {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
          }

          .widget {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
            padding: 20px;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e3e6f0;
          }

          .widget:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          }

          .widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .widget-title {
            font-size: 14px;
            font-weight: 600;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .widget-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }

          .widget-icon.primary {
            background-color: rgba(78, 115, 223, 0.15);
            color: #4e73df;
          }

          .widget-icon.success {
            background-color: rgba(28, 200, 138, 0.15);
            color: #1cc88a;
          }

          .widget-icon.info {
            background-color: rgba(54, 185, 204, 0.15);
            color: #36b9cc;
          }

          .widget-icon.warning {
            background-color: rgba(246, 194, 62, 0.15);
            color: #f6c23e;
          }

          .widget-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
            color: #333;
          }

          .widget-description {
            font-size: 12px;
            color: #777;
          }

          .chart-selector {
            position: absolute;
            top: 60px;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
            padding: 20px;
            width: 300px;
            z-index: 100;
            border: 1px solid #e3e6f0;
          }

          .chart-selector-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }

          .chart-selector-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
            color: #333;
          }

          .chart-selector-actions {
            display: flex;
            gap: 8px;
          }

          .chart-selector-actions button {
            background: #f8f9fc;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .chart-selector-actions button:hover {
            background: #e3e6f0;
          }

          .chart-options {
            max-height: 300px;
            overflow-y: auto;
          }

          .chart-option {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
          }

          .chart-option:last-child {
            border-bottom: none;
          }

          .chart-option input {
            margin-right: 10px;
          }

          .chart-option label {
            font-size: 14px;
            color: #555;
            cursor: pointer;
            flex: 1;
          }

          .dashboard-charts {
            display: grid;
            grid-template-columns: ${getChartGridColumns()};
            gap: 25px;
            position: relative;
          }

          .chart-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
            padding: 25px;
            border: 1px solid #e3e6f0;
          }

          .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .chart-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin: 0;
          }

          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(78, 115, 223, 0.2);
            border-top: 5px solid #4e73df;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .dashboard-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
            padding: 20px;
          }

          .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }

          .dashboard-error h3 {
            color: #333;
            margin-bottom: 10px;
          }

          .dashboard-error p {
            color: #777;
            margin-bottom: 20px;
            max-width: 500px;
          }

          .retry-button {
            background-color: #4e73df;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .retry-button:hover {
            background-color: #2e59d9;
          }

          @media (max-width: 1200px) {
            .dashboard-charts {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 992px) {
            .dashboard-charts {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .organizer-dashboard {
              padding: 15px;
            }

            .dashboard-title {
              font-size: 24px;
            }

            .dashboard-widgets {
              grid-template-columns: 1fr;
            }

            .dashboard-charts {
              grid-template-columns: 1fr;
            }

            .filter-row {
              flex-direction: column;
            }

            .filter-buttons {
              justify-content: center;
            }

            .chart-selector {
              width: 280px;
              right: -20px;
            }
          }

          @media (max-width: 576px) {
            .dashboard-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 15px;
            }

            .header-actions {
              align-self: flex-end;
            }

            .chart-selector {
              width: 250px;
              right: -10px;
            }
          }
        `}
      </style>
      
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Organizer Dashboard</h1>
        <div className="header-actions">
          <div 
            className={`chart-toggle ${showChartSelector ? 'active' : ''}`}
            onClick={() => setShowChartSelector(!showChartSelector)}
          >
            <Eye size={20} />
          </div>
          <div 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <X size={20} /> : <Filter size={20} />}
          </div>
        </div>
      </div>

      {/* Chart Selector Dropdown */}
      {showChartSelector && (
        <div className="chart-selector">
          <div className="chart-selector-header">
            <h3 className="chart-selector-title">Select Charts to Display</h3>
            <div className="chart-selector-actions">
              <button onClick={() => toggleAllCharts(true)}>All</button>
              <button onClick={() => toggleAllCharts(false)}>None</button>
            </div>
          </div>
          <div className="chart-options">
            {chartDefinitions.map(chart => (
              <div className="chart-option" key={chart.id}>
                <input
                  type="checkbox"
                  id={`chart-${chart.id}`}
                  checked={visibleCharts[chart.id]}
                  onChange={() => toggleChartVisibility(chart.id)}
                />
                <label htmlFor={`chart-${chart.id}`}>{chart.title}</label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Section */}
      {showFilters && (
        <div className="dashboard-filters">
          <div className="filter-header">
            <h2 className="filter-title">Filter Dashboard Data</h2>
            <button 
              className="close-filter"
              onClick={() => setShowFilters(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="categoryId">Category</label>
              <select
                id="categoryId"
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option 
                    key={category.eventCategoryId} 
                    value={category.eventCategoryId}
                  >
                    {category.eventCategoryName}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="year">Year</label>
              <select
                id="year"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="month">Month</label>
              <select
                id="month"
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
              >
                <option value="">All Months</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="day">Day</label>
              <select
                id="day"
                name="day"
                value={filters.day}
                onChange={handleFilterChange}
              >
                <option value="">All Days</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-buttons">
            <button className="clear-btn" onClick={clearFilters}>Clear Filters</button>
            <button className="apply-btn" onClick={applyFilters}>Apply Filters</button>
          </div>
        </div>
      )}

      <div className="dashboard-widgets">
        {widgetData.map((widget, index) => (
          <div className="widget" key={index}>
            <div className="widget-header">
              <div className="widget-title">{widget.title}</div>
              <div className={`widget-icon ${widget.color}`}>
                {widget.icon}
              </div>
            </div>
            <div className="widget-value">{widget.value}</div>
            <div className="widget-description">{widget.description}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        {chartDefinitions
          .filter(chart => chart.visible)
          .map(chart => (
            <div className="chart-container" key={chart.id}>
              <div className="chart-header">
                <h3 className="chart-title">{chart.title}</h3>
              </div>
              {chart.component}
            </div>
          ))}
      </div>
    </div>
  );
};

export default OrganizerDashboard;