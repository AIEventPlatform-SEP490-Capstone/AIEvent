import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../api/dashboardAPI';
import { eventCategoryAPI } from '../../api/eventCategoryAPI';
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Filter, X } from 'lucide-react';

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

          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .dashboard-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }

          .filter-toggle {
            background: white;
            border: 1px solid #ddd;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }

          .filter-toggle:hover {
            background: #f0f0f0;
            transform: scale(1.05);
          }

          .filter-toggle.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
          }

          .dashboard-filters {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
            position: relative;
          }

          .filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .filter-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
          }

          .close-filter {
            background: none;
            border: none;
            cursor: pointer;
            color: #999;
            font-size: 20px;
          }

          .close-filter:hover {
            color: #333;
          }

          .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 15px;
          }

          .filter-group {
            flex: 1;
            min-width: 200px;
          }

          .filter-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
          }

          .filter-group input, .filter-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
          }

          .filter-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
          }

          .filter-buttons button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }

          .apply-btn {
            background-color: #007bff;
            color: white;
          }

          .clear-btn {
            background-color: #6c757d;
            color: white;
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

            .filter-row {
              flex-direction: column;
            }
          }
        `}
      </style>
      
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">Organizer Dashboard</div>
        <div 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <X size={20} /> : <Filter size={20} />}
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div className="dashboard-filters">
          <div className="filter-header">
            <div className="filter-title">Filter Dashboard Data</div>
            <button 
              className="close-filter"
              onClick={() => setShowFilters(false)}
            >
              <X size={24} />
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
            <button className="apply-btn" onClick={applyFilters}>Apply Filters</button>
            <button className="clear-btn" onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      )}

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