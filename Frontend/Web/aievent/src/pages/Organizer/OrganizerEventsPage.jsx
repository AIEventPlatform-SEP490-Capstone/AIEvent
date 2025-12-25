import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Heart, 
  ChevronLeft, 
  Search, 
  Filter,
  ChevronUp,
  ChevronDown,
  User,
  Mail,
  Phone,
  Globe,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Building2,
  FileText,
  Briefcase
} from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useFavoriteEvents } from '../../hooks/useFavoriteEvents';
import { useOrganizers } from '../../hooks/useOrganizers';
import { EventCard } from '../../components/HomePage/EventCard';

const ITEMS_PER_PAGE = 12;

export default function OrganizerEventsPage() {
  const { organizerId } = useParams();
  const navigate = useNavigate();
  const { getEventsByOrganizer, loading: eventsLoading } = useEvents();
  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();
  const { getOrganizerById } = useOrganizers();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, price
  const [favoriteEvents, setFavoriteEvents] = useState(new Set());
  const [organizer, setOrganizer] = useState(null);
  const [organizerLoading, setOrganizerLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Load organizer info
        const orgData = await getOrganizerById(organizerId);
        setOrganizer(orgData);

        // Load events
        const res = await getEventsByOrganizer({ organizerId, pageNumber: 1, pageSize: 50 });
        let eventData = [];
        if (res && res.data && res.data.items) eventData = res.data.items;
        else if (res && res.items) eventData = res.items;
        else if (Array.isArray(res)) eventData = res;
        else if (res && res.data && Array.isArray(res.data)) eventData = res.data;
        setEvents(eventData);
        setFilteredEvents(eventData);
        
        // Load favorite events
        const favorites = await getFavoriteEvents();
        const favoriteIds = new Set(favorites.map(event => event.eventId));
        setFavoriteEvents(favoriteIds);
      } catch (err) {
        console.error('Error loading organizer events', err);
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setOrganizerLoading(false);
      }
    };
    load();
  }, [organizerId]);

  // Filter and sort events
  useEffect(() => {
    let result = [...events];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date':
        result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        break;
      case 'price':
        result.sort((a, b) => (a.ticketPrice || 0) - (b.ticketPrice || 0));
        break;
      default:
        break;
    }
    
    setFilteredEvents(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, sortBy, events]);

  const handleViewDetail = (eventId) => navigate(`/event/${eventId}`);

  const toggleLike = async (eventId) => {
    try {
      const isCurrentlyLiked = favoriteEvents.has(eventId);
      
      // Update UI immediately for better UX
      const newFavoriteEvents = new Set(favoriteEvents);
      if (isCurrentlyLiked) {
        newFavoriteEvents.delete(eventId);
      } else {
        newFavoriteEvents.add(eventId);
      }
      setFavoriteEvents(newFavoriteEvents);
      
      // Call API to update server
      if (isCurrentlyLiked) {
        await removeFavoriteEvent(eventId);
      } else {
        await addFavoriteEvent(eventId);
      }
    } catch (err) {
      // Revert UI change if API call fails
      const newFavoriteEvents = new Set(favoriteEvents);
      if (favoriteEvents.has(eventId)) {
        newFavoriteEvents.delete(eventId);
      } else {
        newFavoriteEvents.add(eventId);
      }
      setFavoriteEvents(newFavoriteEvents);
      
      console.error("Error toggling favorite:", err);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-3 font-medium"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>Quay lại</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar - Organizer Info */}
          <div className="lg:col-span-1">
            {organizerLoading ? (
              <Card className="bg-white border border-gray-200 sticky top-24">
                <CardContent className="p-6 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </CardContent>
              </Card>
            ) : organizer ? (
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow sticky top-24">
                <CardContent className="p-6">
                  {/* Organizer Avatar */}
                  <div className="flex flex-col items-center text-center mb-6">
                    {organizer.imgCompany ? (
                      <img
                        src={organizer.imgCompany}
                        alt={organizer.companyName || "Organizer"}
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 mb-4"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4 border-4 border-blue-200">
                        <User className="h-12 w-12 text-blue-600" />
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-gray-900">{organizer.companyName || "Nhà tổ chức"}</h2>
                  </div>

                  {/* Organizer Stats */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                      <div className="text-sm text-gray-600">Sự kiện</div>
                    </div>
                  </div>

                  {/* Organizer Description */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {organizer.companyDescription || "Thông tin về nhà tổ chức chưa được cập nhật."}
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    {organizer.contactName && (
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Người liên hệ</p>
                          <p className="text-sm text-gray-900">{organizer.contactName}</p>
                        </div>
                      </div>
                    )}
                    {(organizer.contactEmail || organizer.email) && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Email</p>
                          <a href={`mailto:${organizer.contactEmail || organizer.email}`} className="text-sm text-blue-600 hover:underline break-all">
                            {organizer.contactEmail || organizer.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {(organizer.contactPhone || organizer.phone) && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Điện thoại</p>
                          <a href={`tel:${organizer.contactPhone || organizer.phone}`} className="text-sm text-green-600 hover:underline">
                            {organizer.contactPhone || organizer.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {organizer.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Địa chỉ</p>
                          <p className="text-sm text-gray-900">{organizer.address}</p>
                        </div>
                      </div>
                    )}
                    {organizer.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Website</p>
                          <a href={organizer.website} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline break-all">
                            {organizer.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {organizer.taxCode && (
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Mã số thuế</p>
                          <p className="text-sm text-gray-900">{organizer.taxCode}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(organizer.urlFacebook || organizer.urlInstagram || organizer.urlLinkedIn) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-3">Mạng xã hội</p>
                      <div className="flex gap-3">
                        {organizer.urlFacebook && (
                          <a 
                            href={organizer.urlFacebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                            title="Facebook"
                          >
                            <Facebook className="w-5 h-5 text-blue-600" />
                          </a>
                        )}
                        {organizer.urlInstagram && (
                          <a 
                            href={organizer.urlInstagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors"
                            title="Instagram"
                          >
                            <Instagram className="w-5 h-5 text-pink-600" />
                          </a>
                        )}
                        {organizer.urlLinkedIn && (
                          <a 
                            href={organizer.urlLinkedIn} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center hover:bg-sky-200 transition-colors"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-5 h-5 text-sky-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience Description */}
                  {organizer.experienceDescription && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Kinh nghiệm tổ chức</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{organizer.experienceDescription}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Right Content - Events List */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm sự kiện..."
                  className="pl-10 pr-4 py-3 h-12 text-base border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                  <span>Bộ lọc</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {showFilters && (
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date">Sắp xếp theo ngày</option>
                    <option value="price">Sắp xếp theo giá</option>
                  </select>
                )}

                <div className="text-sm text-gray-600">
                  Tìm thấy <span className="font-semibold text-gray-900">{filteredEvents.length}</span> sự kiện
                </div>
              </div>
            </div>

            {/* Loading State */}
            {eventsLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-3" />
                <p className="text-gray-600">Đang tải sự kiện...</p>
              </div>
            )}

            {/* Empty State */}
            {!eventsLoading && filteredEvents.length === 0 && (
              <Card className="bg-white border border-dashed border-gray-300">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
                  <p className="text-gray-600">
                    Hiện tại chưa có sự kiện nào phù hợp với tiêu chí tìm kiếm của bạn.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Events Grid */}
            {!eventsLoading && paginatedEvents.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                  {paginatedEvents.map((event) => (
                    <EventCard
                      key={event.eventId || event.id}
                      event={event}
                      onLike={toggleLike}
                      onViewDetail={handleViewDetail}
                      isLiked={favoriteEvents.has(event.eventId || event.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap gap-2 justify-center items-center py-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trước
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                            >
                              {pageNum}
                            </Button>
                          );
                        } else if (
                          (pageNum === currentPage - 2 && currentPage > 3) ||
                          (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                        ) {
                          return (
                            <span key={pageNum} className="px-2 py-1">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="gap-1"
                    >
                      Sau
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    <div className="w-full text-center text-sm text-gray-600 mt-2">
                      Trang {currentPage} / {totalPages}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}