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
      title: "TỔNG SỐ SỰ KIỆN",
      value: eventStatistics?.totalEvents || 0,
      description: "Tất cả sự kiện bạn đã tạo",
      icon: <Calendar size={20} />,
      color: "primary"
    },
    {
      title: "TỔNG SỐ NGƯỜI MUA",
      value: buyerStatistics?.totalBuyers || 0,
      description: "Những người đã mua vé",
      icon: <Users size={20} />,
      color: "success"
    },
    {
      title: "TỔNG DOANH THU",
      value: revenueStatistics?.totalRevenue ? `${revenueStatistics.totalRevenue.toLocaleString('vi-VN')}₫` : '0₫',
      description: "Tổng doanh thu từ tất cả sự kiện",
      icon: <DollarSign size={20} />,
      color: "info"
    },
    {
      title: "ĐÃ ĐĂNG KÝ",
      value: checkInStatistics?.totalCheckedIn || 0,
      description: "Người tham gia đã đăng ký",
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
      title: 'Sự Kiện Theo Trạng Thái',
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
            <Tooltip formatter={(value) => [value, 'Sự Kiện']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'revenueByEvent',
      title: 'Doanh Thu Theo Sự Kiện',
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
            <Tooltip formatter={(value) => [`${value.toLocaleString('vi-VN')}₫`, 'Doanh Thu']} />
            <Legend />
            <Bar dataKey="revenue" fill="#4e73df" name="Doanh Thu (₫)" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'eventsOverTime',
      title: 'Sự Kiện Theo Thời Gian',
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
      title: 'Người Mua Theo Sự Kiện',
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
            <Tooltip formatter={(value) => [value, 'Người Mua']} />
            <Legend />
            <Bar dataKey="buyers" fill="#1cc88a" name="Người Mua" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'checkInsByEvent',
      title: 'Đăng Ký Theo Sự Kiện',
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
            <Tooltip formatter={(value) => [value, 'Đăng Ký']} />
            <Legend />
            <Bar dataKey="checkIns" fill="#f6c23e" name="Đăng Ký" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'eventsByCategory',
      title: 'Sự Kiện Theo Danh Mục',
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
            <Tooltip formatter={(value) => [value, 'Sự Kiện']} />
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
            background-color: hsl(var(--background));
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            position: relative;
            overflow-x: hidden;
          }

          .dashboard-bg-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
              radial-gradient(circle at 10% 20%, rgba(0, 0, 0, 0.03) 0%, transparent 20%),
              radial-gradient(circle at 90% 80%, rgba(0, 0, 0, 0.03) 0%, transparent 20%);
            pointer-events: none;
            z-index: 0;
          }

          .dashboard-content {
            position: relative;
            z-index: 1;
          }

          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            animation: fadeInDown 0.5s ease-out;
          }

          .dashboard-title {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            animation: fadeIn 0.8s ease-out;
          }

          .header-actions {
            display: flex;
            gap: 15px;
            animation: fadeIn 0.8s ease-out;
          }

          .filter-toggle, .chart-toggle {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            color: #1e293b;
          }

          .filter-toggle:hover, .chart-toggle:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateY(-3px) scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          }

          .filter-toggle.active, .chart-toggle.active {
            background: linear-gradient(135deg, #4e73df 0%, #2e59d9 100%);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
          }

          .filter-toggle.active:hover, .chart-toggle.active:hover {
            transform: rotate(90deg) scale(1.1);
          }

          /* Ripple effect for buttons */
          .filter-toggle::after, .chart-toggle::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }

          .filter-toggle:active::after, .chart-toggle:active::after {
            width: 200px;
            height: 200px;
          }

          .dashboard-filters {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            padding: 25px;
            margin-bottom: 25px;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: slideInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
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
            background: rgba(0, 0, 0, 0.05);
            transform: rotate(90deg);
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
            animation: fadeInUp 0.3s ease-out;
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
            padding: 12px 15px;
            border: 1px solid #d1d3e2;
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 14px;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.8);
          }

          .filter-group input:focus, .filter-group select:focus {
            border-color: #4e73df;
            outline: none;
            box-shadow: 0 0 0 3px rgba(78, 115, 223, 0.2);
            background: white;
          }

          .filter-buttons {
            display: flex;
            gap: 12px;
            margin-top: 15px;
            justify-content: flex-end;
          }

          .filter-buttons button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }

          .filter-buttons button::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }

          .filter-buttons button:active::after {
            width: 300px;
            height: 300px;
          }

          .apply-btn {
            background: linear-gradient(135deg, #4e73df 0%, #2e59d9 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(78, 115, 223, 0.3);
          }

          .apply-btn:hover {
            background: linear-gradient(135deg, #2e59d9 0%, #1a3fb6 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(78, 115, 223, 0.4);
          }

          .clear-btn {
            background: linear-gradient(135deg, #858796 0%, #6c6e7e 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(133, 135, 150, 0.3);
          }

          .clear-btn:hover {
            background: linear-gradient(135deg, #6c6e7e 0%, #5a5c69 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(133, 135, 150, 0.4);
          }

          .dashboard-widgets {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
          }

          .widget {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            padding: 25px;
            display: flex;
            flex-direction: column;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: fadeInUp 0.5s ease-out;
            transform: translateY(0);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
          }

          .widget::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #4e73df, #1cc88a);
          }

          .widget:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
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
            width: 45px;
            height: 45px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }

          .widget:hover .widget-icon {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
          }

          .widget-icon.primary {
            background: linear-gradient(135deg, rgba(78, 115, 223, 0.15) 0%, rgba(46, 89, 217, 0.15) 100%);
            color: #4e73df;
          }

          .widget-icon.success {
            background: linear-gradient(135deg, rgba(28, 200, 138, 0.15) 0%, rgba(23, 162, 111, 0.15) 100%);
            color: #1cc88a;
          }

          .widget-icon.info {
            background: linear-gradient(135deg, rgba(54, 185, 204, 0.15) 0%, rgba(43, 147, 163, 0.15) 100%);
            color: #36b9cc;
          }

          .widget-icon.warning {
            background: linear-gradient(135deg, rgba(246, 194, 62, 0.15) 0%, rgba(197, 155, 49, 0.15) 100%);
            color: #f6c23e;
          }

          .widget-value {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 5px;
            color: #333;
            transition: all 0.3s ease;
            text-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }

          .widget:hover .widget-value {
            color: #4e73df;
            transform: scale(1.05);
          }

          .widget-description {
            font-size: 13px;
            color: #777;
            font-weight: 500;
          }

          .chart-selector {
            position: absolute;
            top: 60px;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            padding: 25px;
            width: 320px;
            z-index: 1000; /* Increased z-index to ensure it's above other elements */
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: top right;
            backdrop-filter: blur(10px);
          }

          .chart-selector-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          }

          .chart-selector-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            color: #333;
          }

          .chart-selector-actions {
            display: flex;
            gap: 10px;
          }

          .chart-selector-actions button {
            background: rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 6px;
            padding: 6px 16px; /* Increased padding for wider buttons */
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #555;
            min-width: 80px; /* Set minimum width for better consistency */
          }

          .chart-selector-actions button:hover {
            background: rgba(78, 115, 223, 0.1);
            border-color: rgba(78, 115, 223, 0.3);
            color: #4e73df;
            transform: translateY(-1px);
          }

          .chart-options {
            max-height: 300px;
            overflow-y: auto;
            padding-right: 5px; /* Add padding to prevent clipping */
          }

          .chart-option {
            display: flex;
            align-items: center;
            padding: 12px 8px; /* Adjust padding to ensure visibility */
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
            border-radius: 6px;
            margin: 0 5px; /* Add margin to prevent clipping */
          }

          .chart-option:last-child {
            border-bottom: none;
          }

          .chart-option:hover {
            background: rgba(78, 115, 223, 0.05);
            padding-left: 12px; /* Adjust hover padding */
          }

          .chart-option input {
            margin-right: 12px;
            transform: scale(1.3);
            cursor: pointer;
            accent-color: #4e73df;
            flex-shrink: 0; /* Prevent checkbox from shrinking */
          }

          .chart-option label {
            font-size: 15px;
            color: #444;
            cursor: pointer;
            flex: 1;
            transition: all 0.2s ease;
            font-weight: 500;
            overflow: hidden; /* Prevent text overflow */
            text-overflow: ellipsis; /* Add ellipsis for long text */
            white-space: nowrap; /* Prevent text wrapping */
          }

          .chart-option:hover label {
            color: #4e73df;
          }

          .dashboard-charts {
            display: grid;
            grid-template-columns: ${getChartGridColumns()};
            gap: 25px;
            position: relative;
          }

          .chart-container {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: fadeIn 0.6s ease-out;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
          }

          .chart-container::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #4e73df, #1cc88a, #36b9cc, #f6c23e);
          }

          .chart-container:hover {
            transform: translateY(-5px) scale(1.01);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          }

          .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .chart-title {
            font-size: 20px;
            font-weight: 700;
            color: #333;
            margin: 0;
          }

          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            color: white;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-top: 5px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }

          /* Animations */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }

          .dashboard-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
            padding: 20px;
            animation: fadeIn 0.5s ease-out;
            color: white;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 15px;
          }

          .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }

          .dashboard-error h3 {
            color: white;
            margin-bottom: 10px;
            font-size: 24px;
          }

          .dashboard-error p {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 20px;
            max-width: 500px;
            font-size: 16px;
          }

          .retry-button {
            background: linear-gradient(135deg, #4e73df 0%, #2e59d9 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(78, 115, 223, 0.3);
          }

          .retry-button:hover {
            background: linear-gradient(135deg, #2e59d9 0%, #1a3fb6 100%);
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(78, 115, 223, 0.4);
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
            
            .organizer-dashboard {
              padding: 15px;
            }
            
            .dashboard-title {
              font-size: 24px;
            }
          }

          @media (max-width: 768px) {
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
            
            .chart-container {
              padding: 20px;
            }
            
            .chart-title {
              font-size: 18px;
            }
          }
        `}
      </style>
      
      <div className="dashboard-bg-pattern"></div>
      <div className="dashboard-content">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Bảng Điều Khiển Của Nhà Tổ Chức</h1>
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
              <h3 className="chart-selector-title">Chọn Biểu Đồ Hiển Thị</h3>
              <div className="chart-selector-actions">
                <button onClick={() => toggleAllCharts(true)}>Tất Cả</button>
                <button onClick={() => toggleAllCharts(false)}>Không</button>
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
              <h2 className="filter-title">Lọc Dữ Liệu Bảng Điều Khiển</h2>
              <button 
                className="close-filter"
                onClick={() => setShowFilters(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="categoryId">Danh Mục</label>
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
                <label htmlFor="startDate">Ngày Bắt Đầu</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="endDate">Ngày Kết Thúc</label>
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
                <label htmlFor="year">Năm</label>
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
                <label htmlFor="month">Tháng</label>
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
                <label htmlFor="day">Ngày</label>
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
              <button className="clear-btn" onClick={clearFilters}>Xóa Bộ Lọc</button>
              <button className="apply-btn" onClick={applyFilters}>Áp Dụng</button>
            </div>
          </div>
        )}

        <div className="dashboard-widgets">
          {widgetData.map((widget, index) => (
            <div className="widget" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
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
            .map((chart, index) => (
              <div className="chart-container" key={chart.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="chart-header">
                  <h3 className="chart-title">{chart.title}</h3>
                </div>
                {chart.component}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;