import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import {
  User,
  MapPin,
  Edit3,
  Calendar,
  Bell,
  Briefcase,
  Globe,
  Wrench,
  Sparkles,
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Facebook,
  Lock,
  Wallet,
  CreditCard,
  Building2,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  X,
  Search,
  Shield
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import SuggestionInput from '../../components/ui/suggestion-input';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileNavigation from '../../components/Profile/ProfileNavigation';
import EventTicketCard from '../../components/Profile/EventTicketCard';
import { useUserProfile } from '../../hooks/userProfile';
import {
  ParticipationFrequency,
  ParticipationFrequencyDisplay,
  BudgetOption,
  BudgetOptionDisplay,
  PredefinedInterests,
  PredefinedCities,
  PredefinedSkills,
  PredefinedLanguages,
  PredefinedEventTypes,
  Experience,
  ExperienceDisplay,
  ParticipationFrequencyReverse,
  ExperienceReverse,
  BudgetOptionReverse
} from '../../constants/userConstants';
import { validateProfileData, transformFormDataToAPI } from '../../utils/profileValidation';
import ChangePasswordModal from '../../components/Auth/ChangePasswordModal';
import { walletAPI } from '../../api/walletAPI';

const UserProfilePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('tickets');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const hasFetchedProfile = useRef(false);
  const [paymentInformations, setPaymentInformations] = useState([]);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);
  const [paymentInfoError, setPaymentInfoError] = useState(null);
  const hasFetchedPaymentInfo = useRef(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(null);
  const [paymentPagination, setPaymentPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    profile,
    isLoading,
    isUpdating,
    error,
    updateError,
    getUserProfile,
    updateProfile,
    clearError,
  } = useUserProfile();

  useEffect(() => {
    if (!profile && !isLoading && !hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      getUserProfile();
    }
  }, [profile, isLoading, getUserProfile]);

  // Handle tab from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Fetch payment information when user is authenticated
  const fetchPaymentInformations = useCallback(async (pageNumber = 1) => {
    if (!user) return;
    
    setIsLoadingPaymentInfo(true);
    setPaymentInfoError(null);
    
    try {
      const response = await walletAPI.getPaymentInformations({ pageNumber, pageSize: 10 });
      if (response.data) {
        setPaymentInformations(response.data.items || []);
        setPaymentPagination({
          currentPage: response.data.currentPage || pageNumber,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalItems || 0,
          pageSize: response.data.pageSize || 10
        });
      }
    } catch (error) {
      console.error('Error fetching payment informations:', error);
      setPaymentInfoError(error.message || 'Không thể tải thông tin thẻ');
    } finally {
      setIsLoadingPaymentInfo(false);
    }
  }, [user]);

  useEffect(() => {
    if (!hasFetchedPaymentInfo.current && user) {
      hasFetchedPaymentInfo.current = true;
      fetchPaymentInformations(1);
    }
  }, [user, fetchPaymentInformations]);

  // Transform API data to match component expectations
  const profileData = profile ? {
    name: profile.fullName || "Chưa cập nhật",
    email: profile.email || "Chưa cập nhật",
    phone: profile.phoneNumber || "Chưa cập nhật",
    address: profile.address || "Chưa cập nhật",
    city: profile.city || "Chưa cập nhật",
    website: profile.personalWebsite || "",
    bio: profile.introduction || "Chưa cập nhật giới thiệu",
    jobTitle: profile.jobTitle || "Chưa cập nhật",
    occupation: profile.occupation || "Chưa cập nhật",
    experience: ExperienceDisplay[profile.experience] || "Chưa cập nhật",
    careerObjective: profile.careerGoal || "Chưa cập nhật",
    socialLinks: {
      linkedin: profile.linkedInUrl || "",
      github: profile.gitHubUrl || "",
      twitter: profile.twitterUrl || "",
      instagram: profile.instagramUrl || "",
      facebook: profile.facebookUrl || ""
    },
    skills: (profile.professionalSkills && Array.isArray(profile.professionalSkills)) ? profile.professionalSkills.map(skill => skill.skillsName) : [],
    languages: (profile.languages && Array.isArray(profile.languages)) ? profile.languages.map(language => language.languagesName) : [],
    interests: (profile.userInterests && Array.isArray(profile.userInterests)) ? profile.userInterests.map(interest => interest.interestName) : [],
    eventTypes: (profile.favoriteEventTypes && Array.isArray(profile.favoriteEventTypes)) ? profile.favoriteEventTypes.map(eventType => eventType.favoriteEventTypeName) : [],
    cities: (profile.interestedCities && Array.isArray(profile.interestedCities)) ? profile.interestedCities.map(city => city.cityName) : [],
    participationFrequency: ParticipationFrequencyDisplay[profile.participationFrequency] || "Hàng tháng",
    budgetOptionDisplay: BudgetOptionDisplay[profile.budgetOption] || "Linh hoạt",
    // API specific fields
    id: profile.id,
    emailConfirmed: profile.emailConfirmed,
    latitude: profile.latitude,
    longitude: profile.longitude,
    avatarImgUrl: profile.avatarImgUrl,
    isEmailNotificationEnabled: profile.isEmailNotificationEnabled,
    isPushNotificationEnabled: profile.isPushNotificationEnabled,
    isSmsNotificationEnabled: profile.isSmsNotificationEnabled,
    budgetOption: profile.budgetOption,
    totalJoinedEvents: profile.totalJoinedEvents || 0,
    totalFavoriteEvents: profile.totalFavoriteEvents || 0,
    totalFriends: profile.totalFriends || 0
  } : {
    name: "Chưa tải được dữ liệu",
    email: "Chưa tải được dữ liệu",
    phone: "Chưa tải được dữ liệu",
    address: "Chưa tải được dữ liệu",
    city: "Chưa tải được dữ liệu",
    website: "",
    bio: "Đang tải thông tin...",
    jobTitle: "Chưa tải được dữ liệu",
    occupation: "Chưa tải được dữ liệu",
    experience: "Chưa tải được dữ liệu",
    careerObjective: "Chưa tải được dữ liệu",
    socialLinks: {
      linkedin: "",
      github: "",
      twitter: "",
      instagram: "",
      facebook: ""
    },
    skills: [],
    languages: [],
    interests: [],
    eventTypes: [],
    cities: [],
    participationFrequency: "Hàng tháng",
    // API specific fields
    id: null,
    emailConfirmed: null,
    latitude: null,
    longitude: null,
    avatarImgUrl: null,
    isEmailNotificationEnabled: null,
    isPushNotificationEnabled: null,
    isSmsNotificationEnabled: null,
    budgetOption: "Flexible",
    totalJoinedEvents: 0,
    totalFavoriteEvents: 0,
    totalFriends: 0
  };

  const stats = {
    eventsAttended: profile?.totalJoinedEvents || 0,
    likes: profile?.totalFavoriteEvents || 0,
    friends: profile?.totalFriends || 0
  };

  const tabs = [
    { id: 'tickets', label: 'Vé của tôi' },
    { id: 'likes', label: 'Yêu thích' },
    { id: 'friends', label: 'Bạn bè' },
    { id: 'card', label: 'Thông tin thẻ' },
    { id: 'settings', label: 'Cài đặt' }
  ];

  const eventTickets = [
    {
      id: 1,
      name: "Vietnam Tech Conference 2024",
      date: "15/3/2024",
      time: "09:00",
      location: "Trung tâm Hội nghị Quốc gia, Đường Thăng Long, Mỹ Đình, Nam Từ Liêm, Hà Nội",
      status: "Có hiệu lực",
      image: "/api/placeholder/300/200"
    }
  ];

  const handleViewQR = (ticketId) => {
    // TODO: Implement QR code viewing
  };

  const handleViewDetails = (ticketId) => {
    // TODO: Implement ticket details viewing
  };

  const handleCopyToClipboard = async (text, accountNumber) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccountNumber(accountNumber);
      setTimeout(() => {
        setCopiedAccountNumber(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeletePaymentInfo = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông tin thẻ này?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await walletAPI.deletePaymentInformation(id);
      // Refresh the payment informations list
      await fetchPaymentInformations(paymentPagination.currentPage);
    } catch (error) {
      console.error('Error deleting payment information:', error);
      alert('Không thể xóa thông tin thẻ: ' + (error.message || 'Có lỗi xảy ra'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Enhanced Profile Header - Rounded corners */}
      <div className="max-w-4xl mx-auto mt-4 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-center">
            <div className="text-white text-lg">Đang tải thông tin cá nhân...</div>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-br from-red-600 via-red-500 to-red-400 p-8 text-center">
            <div className="text-white text-lg">Lỗi khi tải thông tin: {error.message || 'Không thể tải dữ liệu'}</div>
            <button
              onClick={() => {
                hasFetchedProfile.current = false;
                getUserProfile();
              }}
              className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <ProfileHeader
            profileData={profileData}
            stats={stats}
            onEditProfile={() => setIsEditModalOpen(true)}
          />
        )}
      </div>

      {/* Separated Content Area */}
      <div className="max-w-4xl mx-auto mt-4">
        {/* Enhanced Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <ProfileNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Content Area */}
        <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-6">
            {activeTab === 'tickets' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Vé sự kiện của tôi</h2>
                  <span className="text-gray-600">3 vé</span>
                </div>

                <div className="grid gap-4">
                  {eventTickets.map((ticket) => (
                    <EventTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onViewQR={handleViewQR}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'likes' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Sự kiện yêu thích</h2>
                <p className="text-gray-600">Chưa có sự kiện yêu thích nào.</p>
              </div>
            )}

            {activeTab === 'friends' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Bạn bè</h2>
                <p className="text-gray-600">Chưa có bạn bè nào.</p>
              </div>
            )}

            {activeTab === 'card' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                      <Wallet className="w-6 h-6 mr-2 text-blue-600" />
                      Thông tin thẻ
                    </h2>
                    <p className="text-gray-600 text-sm">Quản lý và xem thông tin tài khoản ngân hàng của bạn</p>
                  </div>
                  <Button
                    onClick={() => setIsAddPaymentModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm thẻ
                  </Button>
                </div>
                
                {isLoadingPaymentInfo ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2 text-sm">Đang tải thông tin thẻ...</p>
                  </div>
                ) : paymentInfoError ? (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-red-700 text-sm font-medium">{paymentInfoError}</p>
                      </div>
                    </div>
                  </div>
                ) : paymentInformations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-base font-medium">Chưa có thông tin thẻ nào được lưu</p>
                    <p className="text-gray-500 text-sm mt-1">Thêm thẻ để thanh toán nhanh chóng</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {paymentInformations.map((paymentInfo) => (
                        <div
                          key={paymentInfo.paymentInformationId}
                          className="group relative overflow-hidden bg-[#f9f7f5] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#e8e4df]"
                        >
                          {/* Decorative Pattern */}
                          <div className="absolute inset-0 opacity-3">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -mr-24 -mt-24"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -ml-16 -mb-16"></div>
                          </div>
                          
                          {/* Card Content */}
                          <div className="relative p-5">
                            {/* Top Section */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                {paymentInfo.bankLogo ? (
                                  <div className="bg-white rounded-xl p-4 border border-[#e8e4df] shadow-sm">
                                    <img
                                      src={paymentInfo.bankLogo}
                                      alt={paymentInfo.bankName}
                                      className="w-20 h-20 object-contain"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-xl p-4 border border-[#e8e4df] shadow-sm">
                                    <Building2 className="w-20 h-20 text-blue-600" />
                                  </div>
                                )}
                                <div>
                                  <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 text-xs px-3 py-1 shadow-sm">
                                    {paymentInfo.bankShortName || paymentInfo.bankName}
                                  </Badge>
                                  {paymentInfo.branchName && (
                                    <p className="text-gray-600 text-xs mt-1">{paymentInfo.branchName}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#e8e4df] shadow-sm">
                                  <CreditCard className="w-4 h-4 text-blue-600" />
                                </div>
                                <button
                                  onClick={() => handleDeletePaymentInfo(paymentInfo.paymentInformationId)}
                                  disabled={isDeleting}
                                  className="w-8 h-8 bg-white hover:bg-red-50 rounded-lg flex items-center justify-center border border-[#e8e4df] hover:border-red-300 shadow-sm transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                  title="Xóa thông tin thẻ"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Account Number Section */}
                            <div className="mb-3">
                              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Số tài khoản</p>
                              <div className="flex items-center justify-between">
                                <p className="text-xl font-bold text-gray-900 tracking-wider">
                                  {paymentInfo.accountNumber}
                                </p>
                                <button
                                  onClick={() => handleCopyToClipboard(paymentInfo.accountNumber, paymentInfo.accountNumber)}
                                  className="ml-3 p-2 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 border border-[#e8e4df] hover:border-blue-300 hover:scale-105 shadow-sm"
                                  title="Sao chép số tài khoản"
                                >
                                  {copiedAccountNumber === paymentInfo.accountNumber ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-blue-600" />
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            {/* Account Holder Section */}
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Chủ tài khoản</p>
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 border border-[#e8e4df] shadow-sm">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-base font-semibold text-gray-900">
                                  {paymentInfo.accountHolderName}
                                </p>
                              </div>
                            </div>
                            
                            {/* Bottom Decoration */}
                            <div className="absolute bottom-3 right-3 opacity-5">
                              <div className="grid grid-cols-4 gap-1">
                                {[...Array(16)].map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {paymentPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Hiển thị {(paymentPagination.currentPage - 1) * paymentPagination.pageSize + 1} - {Math.min(paymentPagination.currentPage * paymentPagination.pageSize, paymentPagination.totalItems)} trong số {paymentPagination.totalItems} thẻ
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => fetchPaymentInformations(paymentPagination.currentPage - 1)}
                            disabled={paymentPagination.currentPage === 1 || isLoadingPaymentInfo}
                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="flex items-center space-x-1">
                            {[...Array(paymentPagination.totalPages)].map((_, i) => {
                              const page = i + 1;
                              // Show first page, last page, current page, and pages around current
                              if (
                                page === 1 ||
                                page === paymentPagination.totalPages ||
                                (page >= paymentPagination.currentPage - 1 && page <= paymentPagination.currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => fetchPaymentInformations(page)}
                                    disabled={isLoadingPaymentInfo}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                      paymentPagination.currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-300 hover:bg-gray-50'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {page}
                                  </button>
                                );
                              } else if (
                                page === paymentPagination.currentPage - 2 ||
                                page === paymentPagination.currentPage + 2
                              ) {
                                return <span key={page} className="px-2">...</span>;
                              }
                              return null;
                            })}
                          </div>
                          <button
                            onClick={() => fetchPaymentInformations(paymentPagination.currentPage + 1)}
                            disabled={paymentPagination.currentPage === paymentPagination.totalPages || isLoadingPaymentInfo}
                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch sử hoạt động</h2>
                <p className="text-gray-600">Chưa có hoạt động nào.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cài đặt tài khoản</h2>
                <div className="space-y-4">
                  {/* Security Settings */}
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-red-600" />
                      Bảo mật tài khoản
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Lock className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Mật khẩu</h4>
                          <p className="text-sm text-gray-600">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                          <p className="text-xs text-gray-500">Khuyến nghị đổi mật khẩu định kỳ</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Đổi mật khẩu
                      </Button>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Bell className="w-5 h-5 mr-2 text-blue-600" />
                      Thông báo
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-4 h-4 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Email thông báo</h4>
                            <p className="text-sm text-gray-600">Nhận thông báo về sự kiện qua email</p>
                          </div>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm">
                          Bật
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-green-600" />
                      Quyền riêng tư
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <Globe className="w-4 h-4 text-green-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Hồ sơ công khai</h4>
                            <p className="text-sm text-gray-600">Cho phép người khác xem thông tin hồ sơ</p>
                          </div>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-sm">
                          Bật
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <EditProfileModal
            profileData={profileData}
            originalProfile={profile}
            onClose={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* Add Payment Information Modal */}
      <Dialog open={isAddPaymentModalOpen} onOpenChange={setIsAddPaymentModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <div className="p-6">
            <AddPaymentModal
              onClose={() => setIsAddPaymentModalOpen(false)}
              onSuccess={() => {
                setIsAddPaymentModalOpen(false);
                fetchPaymentInformations(paymentPagination.currentPage);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

// Edit Profile Modal Component
const EditProfileModal = ({ profileData, originalProfile, onClose }) => {
  const { updateProfile, isUpdating, updateError, clearError, getUserProfile } = useUserProfile();
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState({
    name: profileData.name || '',
    email: profileData.email || '',
    phone: profileData.phone || '',
    address: profileData.address || '',
    city: profileData.city || '',
    website: profileData.website || '',
    bio: profileData.bio || '',
    jobTitle: profileData.jobTitle || '',
    occupation: profileData.occupation || '',
    experience: ExperienceReverse[profileData.experience] || Experience.None,
    careerObjective: profileData.careerObjective || '',
    socialLinks: profileData.socialLinks || {},
    skills: profileData.skills || [],
    languages: profileData.languages || [],
    interests: profileData.interests || [],
    cities: profileData.cities || [],
    eventTypes: profileData.eventTypes || [],
    participationFrequency: ParticipationFrequencyReverse[profileData.participationFrequency] || ParticipationFrequency.Monthly,
    budgetOption: BudgetOptionReverse[profileData.budgetOptionDisplay] || BudgetOption.Flexible,
    isEmailNotificationEnabled: profileData.isEmailNotificationEnabled !== null && profileData.isEmailNotificationEnabled !== undefined ? profileData.isEmailNotificationEnabled : true,
    isPushNotificationEnabled: profileData.isPushNotificationEnabled !== null && profileData.isPushNotificationEnabled !== undefined ? profileData.isPushNotificationEnabled : true,
    isSmsNotificationEnabled: profileData.isSmsNotificationEnabled !== null && profileData.isSmsNotificationEnabled !== undefined ? profileData.isSmsNotificationEnabled : false,
    latitude: profileData.latitude || '',
    longitude: profileData.longitude || '',
    avatarImage: null,
    avatarImgUrl: profileData.avatarImgUrl || ''
  });

  useEffect(() => {
    setFormData({
      name: profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      city: profileData.city || '',
      website: profileData.website || '',
      bio: profileData.bio || '',
      jobTitle: profileData.jobTitle || '',
      occupation: profileData.occupation || '',
      experience: ExperienceReverse[profileData.experience] || Experience.None,
      careerObjective: profileData.careerObjective || '',
      socialLinks: profileData.socialLinks || {},
      skills: profileData.skills || [],
      languages: profileData.languages || [],
      interests: profileData.interests || [],
      cities: profileData.cities || [],
      eventTypes: profileData.eventTypes || [],
      participationFrequency: ParticipationFrequencyReverse[profileData.participationFrequency] || ParticipationFrequency.Monthly,
      budgetOption: BudgetOptionReverse[profileData.budgetOptionDisplay] || BudgetOption.Flexible,
      isEmailNotificationEnabled: profileData.isEmailNotificationEnabled !== null && profileData.isEmailNotificationEnabled !== undefined ? profileData.isEmailNotificationEnabled : true,
      isPushNotificationEnabled: profileData.isPushNotificationEnabled !== null && profileData.isPushNotificationEnabled !== undefined ? profileData.isPushNotificationEnabled : true,
      isSmsNotificationEnabled: profileData.isSmsNotificationEnabled !== null && profileData.isSmsNotificationEnabled !== undefined ? profileData.isSmsNotificationEnabled : false,
      latitude: profileData.latitude || '',
      longitude: profileData.longitude || '',
      avatarImage: null,
      avatarImgUrl: profileData.avatarImgUrl || ''
    });
  }, [profileData]);

  // Helper functions for form handling
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatarImage: file
      }));
    }
  };

  // Define sections for the modal
  const sections = [
    { id: 'basic', label: 'Thông tin cơ bản', icon: User, color: 'text-blue-600' },
    { id: 'professional', label: 'Nghề nghiệp', icon: Briefcase, color: 'text-green-600' },
    { id: 'social', label: 'Mạng xã hội', icon: Globe, color: 'text-purple-600' },
    { id: 'skills', label: 'Kỹ năng & Sở thích', icon: Wrench, color: 'text-orange-600' },
    { id: 'preferences', label: 'Tùy chọn sự kiện', icon: Calendar, color: 'text-pink-600' }
  ];

  const handleSave = async () => {
    try {
      clearError();

      // Transform form data to API format
      const apiData = transformFormDataToAPI(formData, originalProfile);

      // Validate the data
      const validation = validateProfileData(apiData);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }

      const result = await updateProfile(apiData);
      
      if (result && result.error) {
        throw new Error(result.error);
      }
      
      // Refresh profile data after successful update
      await getUserProfile(); // Refresh the profile data
      
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error details:', error.response || error.message);
      alert(`Có lỗi xảy ra khi cập nhật thông tin: ${error.message || 'Vui lòng thử lại sau!'}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <DialogHeader className="pb-6">
        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Chỉnh sửa thông tin
        </DialogTitle>
        <p className="text-gray-600 mt-2">Cập nhật thông tin cá nhân và tùy chọn của bạn</p>
      </DialogHeader>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Enhanced Sidebar Navigation */}
        <div className="lg:w-72 space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Cài đặt hồ sơ</h3>
            <p className="text-sm text-gray-600">Chọn một mục để chỉnh sửa thông tin</p>
          </div>

          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center space-x-4 px-4 py-4 text-left rounded-xl transition-all duration-300 group ${activeSection === section.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:shadow-md hover:scale-102'
                }`}
            >
              <div className={`p-2 rounded-lg ${activeSection === section.id
                ? 'bg-white/20'
                : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-white' : section.color
                  }`} />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">{section.label}</span>
                <div className={`w-full h-0.5 mt-1 rounded-full transition-all duration-300 ${activeSection === section.id
                  ? 'bg-white'
                  : 'bg-transparent group-hover:bg-gray-300'
                  }`}></div>
              </div>
            </button>
          ))}
        </div>

        {/* Enhanced Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {sections.find(s => s.id === activeSection)?.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {activeSection === 'basic' && 'Cập nhật thông tin cá nhân cơ bản'}
                {activeSection === 'professional' && 'Thông tin về nghề nghiệp và kinh nghiệm'}
                {activeSection === 'social' && 'Liên kết với các mạng xã hội'}
                {activeSection === 'skills' && 'Kỹ năng, ngôn ngữ và sở thích'}
                {activeSection === 'preferences' && 'Tùy chọn sự kiện và ngân sách'}
              </p>
            </div>

            <div className="p-6">
              {activeSection === 'basic' && (
                <BasicInfoSection formData={formData} onChange={handleInputChange} onAvatarChange={handleAvatarChange} />
              )}
              {activeSection === 'professional' && (
                <ProfessionalInfoSection formData={formData} onChange={handleInputChange} />
              )}
              {activeSection === 'social' && (
                <SocialLinksSection formData={formData} onChange={handleSocialLinkChange} />
              )}
              {activeSection === 'skills' && (
                <SkillsSection formData={formData} onChange={handleArrayChange} />
              )}
              {activeSection === 'preferences' && (
                <EventPreferencesSection formData={formData} onChange={handleArrayChange} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {updateError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 text-sm">
              <strong>Lỗi:</strong> {updateError.message || 'Có lỗi xảy ra khi cập nhật hồ sơ'}
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 -mx-6 px-6 py-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">*Lưu ý:</span> Thay đổi sẽ được lưu khi bạn nhấn "Lưu thay đổi".
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2.5 font-medium border-gray-300 hover:border-gray-400"
            disabled={isUpdating}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Basic Info Section Component
const BasicInfoSection = ({ formData, onChange, onAvatarChange }) => {
  return (
    <div className="space-y-8">
      {/* Enhanced Profile Picture Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
            {formData.avatarImage ? (
              // Preview new uploaded image
              <img
                src={URL.createObjectURL(formData.avatarImage)}
                alt="Avatar Preview"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : formData.avatarImgUrl && formData.avatarImgUrl.trim() !== '' ? (
              // Show existing avatar from server
              <img
                src={formData.avatarImgUrl}
                alt="User Avatar"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              // Default placeholder
              <User className="w-16 h-16 text-gray-400" />
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer">
            <Edit3 className="w-5 h-5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
          </label>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <p className="text-sm text-gray-600 mt-4 text-center max-w-xs">
          Nhấn vào biểu tượng để thay đổi ảnh đại diện
        </p>
        {formData.avatarImage && (
          <div className="mt-2 text-center">
            <p className="text-xs text-green-600 font-medium">
              ✓ Đã chọn: {formData.avatarImage.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Kích thước: {(formData.avatarImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Form Fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              placeholder="Nhập họ và tên đầy đủ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 bg-gray-50"
              placeholder="example@email.com"
              readOnly
              disabled
            />
            <p className="text-xs text-gray-500">
              Email không thể chỉnh sửa
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
              Số điện thoại
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              placeholder="+84 123 456 789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
              Địa chỉ
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => onChange('address', e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              placeholder="Quận 1, Hồ Chí Minh"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
              Website cá nhân
            </Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => onChange('website', e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
            Giới thiệu bản thân
          </Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => onChange('bio', e.target.value)}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 resize-none"
            rows={4}
            placeholder="Mô tả ngắn gọn về bản thân, sở thích và mục tiêu..."
          />
          <p className="text-xs text-gray-500">
            {formData.bio.length}/500 ký tự
          </p>
        </div>
      </div>
    </div>
  );
};

// Professional Info Section Component
const ProfessionalInfoSection = ({ formData, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
          Thông tin nghề nghiệp
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="jobTitle">Chức danh</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => onChange('jobTitle', e.target.value)}
              placeholder="Ví dụ: Senior Developer, Product Manager..."
            />
          </div>
          <div>
            <Label htmlFor="occupation">Ngành nghề</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) => onChange('occupation', e.target.value)}
              placeholder="Ví dụ: Công nghệ thông tin, Marketing, Tài chính..."
            />
          </div>
          <div>
            <Label htmlFor="experience">Kinh nghiệm</Label>
            <Select value={formData.experience} onValueChange={(value) => onChange('experience', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn mức kinh nghiệm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Experience.None}>{ExperienceDisplay[Experience.None]}</SelectItem>
                <SelectItem value={Experience.LessThan1Year}>{ExperienceDisplay[Experience.LessThan1Year]}</SelectItem>
                <SelectItem value={Experience.OneToThreeYears}>{ExperienceDisplay[Experience.OneToThreeYears]}</SelectItem>
                <SelectItem value={Experience.ThreeToFiveYears}>{ExperienceDisplay[Experience.ThreeToFiveYears]}</SelectItem>
                <SelectItem value={Experience.FiveToTenYears}>{ExperienceDisplay[Experience.FiveToTenYears]}</SelectItem>
                <SelectItem value={Experience.MoreThanTenYears}>{ExperienceDisplay[Experience.MoreThanTenYears]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="careerObjective">Mục tiêu nghề nghiệp</Label>
          <Textarea
            id="careerObjective"
            value={formData.careerObjective}
            onChange={(e) => onChange('careerObjective', e.target.value)}
            className="mt-2"
            rows={3}
            placeholder="Mô tả mục tiêu nghề nghiệp và định hướng phát triển của bạn..."
          />
        </div>
      </div>
    </div>
  );
};

// Social Links Section Component
const SocialLinksSection = ({ formData, onChange }) => {
  const socialPlatforms = [
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
    { key: 'github', label: 'GitHub', icon: Github, color: 'text-gray-800' },
    { key: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-sky-500' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-700' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-blue-600" />
          Liên kết mạng xã hội
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialPlatforms.map((platform) => (
            <div key={platform.key}>
              <Label htmlFor={platform.key} className="flex items-center">
                <div className="w-6 h-6 bg-gray-100 rounded mr-2 flex items-center justify-center">
                  <platform.icon className={`w-4 h-4 ${platform.color}`} />
                </div>
                {platform.label}
              </Label>
              <Input
                id={platform.key}
                value={formData.socialLinks[platform.key] || ''}
                onChange={(e) => onChange(platform.key, e.target.value)}
                className="mt-1"
                placeholder={`https://${platform.key}.com/username`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Skills Section Component
const SkillsSection = ({ formData, onChange }) => {
  const addSkill = (skill) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      onChange('skills', [...formData.skills, skill.trim()]);
    }
  };

  const removeSkill = (index) => {
    const updatedSkills = formData.skills.filter((_, i) => i !== index);
    onChange('skills', updatedSkills);
  };

  const addLanguage = (language) => {
    if (language.trim() && !(formData.languages || []).includes(language.trim())) {
      onChange('languages', [...(formData.languages || []), language.trim()]);
    }
  };

  const removeLanguage = (index) => {
    const updatedLanguages = formData.languages.filter((_, i) => i !== index);
    onChange('languages', updatedLanguages);
  };

  const addInterest = (interest) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      onChange('interests', [...formData.interests, interest.trim()]);
    }
  };

  const removeInterest = (index) => {
    const updatedInterests = formData.interests.filter((_, i) => i !== index);
    onChange('interests', updatedInterests);
  };

  return (
    <div className="space-y-8">
      {/* Professional Skills */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Wrench className="w-5 h-5 mr-2 text-purple-600" />
          Kỹ năng chuyên môn
        </h3>

        <div className="flex flex-wrap gap-3 mb-4">
          {(formData.skills || []).map((skill, index) => (
            <div key={index} className="group">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300">
                {skill}
                <button
                  onClick={() => removeSkill(index)}
                  className="ml-2 hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center transition-colors duration-200"
                >
                  ×
                </button>
              </Badge>
            </div>
          ))}
        </div>

        <SuggestionInput
          value={formData.skills}
          onChange={onChange}
          onAdd={addSkill}
          placeholder="Thêm kỹ năng mới..."
          suggestions={PredefinedSkills}
          maxSuggestions={8}
          className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
          buttonText="+ Thêm"
          buttonClassName="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6"
        />
      </div>

      {/* Languages */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-orange-600" />
          Ngôn ngữ
        </h3>

        <div className="flex flex-wrap gap-3 mb-4">
          {(formData.languages || []).map((language, index) => (
            <div key={index} className="group">
              <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0 px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300">
                {language}
                <button
                  onClick={() => removeLanguage(index)}
                  className="ml-2 hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center transition-colors duration-200"
                >
                  ×
                </button>
              </Badge>
            </div>
          ))}
        </div>

        <SuggestionInput
          value={formData.languages || []}
          onChange={onChange}
          onAdd={addLanguage}
          placeholder="Thêm ngôn ngữ..."
          suggestions={PredefinedLanguages}
          maxSuggestions={8}
          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
          buttonText="+ Thêm"
          buttonClassName="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6"
        />
      </div>

      {/* Event Interests */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Sở thích sự kiện</h3>
        <h4 className="text-md font-medium mb-3 text-gray-700">Sở thích chung</h4>

        <div className="flex flex-wrap gap-3 mb-4">
          {(formData.interests || []).map((interest, index) => (
            <div key={index} className="group">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300">
                {interest}
                <button
                  onClick={() => removeInterest(index)}
                  className="ml-2 hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center transition-colors duration-200"
                >
                  ×
                </button>
              </Badge>
            </div>
          ))}
        </div>

        <SuggestionInput
          value={formData.interests}
          onChange={onChange}
          onAdd={addInterest}
          placeholder="Thêm sở thích mới..."
          suggestions={PredefinedInterests}
          maxSuggestions={8}
          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
          buttonText="+ Thêm"
          buttonClassName="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6"
        />
      </div>
    </div>
  );
};

// Event Preferences Section Component
const EventPreferencesSection = ({ formData, onChange }) => {
  const addEventType = (eventType) => {
    if (eventType.trim() && !formData.eventTypes.includes(eventType.trim())) {
      onChange('eventTypes', [...formData.eventTypes, eventType.trim()]);
    }
  };

  const removeEventType = (index) => {
    const updatedEventTypes = formData.eventTypes.filter((_, i) => i !== index);
    onChange('eventTypes', updatedEventTypes);
  };

  const addCity = (city) => {
    if (city.trim() && !formData.cities.includes(city.trim())) {
      onChange('cities', [...formData.cities, city.trim()]);
    }
  };

  const removeCity = (index) => {
    const updatedCities = formData.cities.filter((_, i) => i !== index);
    onChange('cities', updatedCities);
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Preferred Event Types */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3">Loại sự kiện ưa thích</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {(formData.eventTypes || []).map((eventType, index) => (
              <Badge key={index} className="bg-green-100 text-green-800 border-0">
                {eventType}
                <button
                  onClick={() => removeEventType(index)}
                  className="ml-2 hover:text-green-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <SuggestionInput
            value={formData.eventTypes}
            onChange={onChange}
            onAdd={addEventType}
            placeholder="Thêm loại sự kiện..."
            suggestions={PredefinedEventTypes}
            maxSuggestions={8}
            className="border-green-200 focus:border-green-500 focus:ring-green-500"
            buttonText="+"
            buttonClassName="bg-green-600 hover:bg-green-700"
          />
        </div>

        {/* Cities of Interest */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Quận quan tâm
          </h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {(formData.cities || []).map((city, index) => (
              <Badge key={index} className="bg-green-100 text-green-800 border-0">
                {city}
                <button
                  onClick={() => removeCity(index)}
                  className="ml-2 hover:text-green-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <SuggestionInput
            value={formData.cities}
            onChange={onChange}
            onAdd={addCity}
            placeholder="Thêm quận quan tâm..."
            suggestions={PredefinedCities}
            maxSuggestions={8}
            className="border-green-200 focus:border-green-500 focus:ring-green-500"
            buttonText="+"
            buttonClassName="bg-green-600 hover:bg-green-700"
          />
        </div>

        {/* Participation Frequency */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Tần suất tham gia sự kiện
          </h4>
          <Select value={formData.participationFrequency} onValueChange={(value) => {
            onChange('participationFrequency', value);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn tần suất tham gia sự kiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ParticipationFrequency.Daily}>{ParticipationFrequencyDisplay[ParticipationFrequency.Daily]}</SelectItem>
              <SelectItem value={ParticipationFrequency.Weekly}>{ParticipationFrequencyDisplay[ParticipationFrequency.Weekly]}</SelectItem>
              <SelectItem value={ParticipationFrequency.Monthly}>{ParticipationFrequencyDisplay[ParticipationFrequency.Monthly]}</SelectItem>
              <SelectItem value={ParticipationFrequency.Occasionally}>{ParticipationFrequencyDisplay[ParticipationFrequency.Occasionally]}</SelectItem>
            </SelectContent>
          </Select>
        </div>


        {/* Budget Option */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3 flex items-center">
            <span className="text-lg mr-2">₫</span>
            Ngân sách cho sự kiện
          </h4>
          <Select value={formData.budgetOption} onValueChange={(value) => {
            onChange('budgetOption', value);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn mức ngân sách cho sự kiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BudgetOption.Flexible}>{BudgetOptionDisplay[BudgetOption.Flexible]}</SelectItem>
              <SelectItem value={BudgetOption.Under500k}>{BudgetOptionDisplay[BudgetOption.Under500k]}</SelectItem>
              <SelectItem value={BudgetOption.From500kTo2M}>{BudgetOptionDisplay[BudgetOption.From500kTo2M]}</SelectItem>
              <SelectItem value={BudgetOption.Above2M}>{BudgetOptionDisplay[BudgetOption.Above2M]}</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
};

// Add Payment Information Modal Component
const AddPaymentModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    bankBin: '',
    bankShortName: '',
    bankLogo: ''
  });
  const [banks, setBanks] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const response = await walletAPI.getBanksFromVietnamQR();
        if (response.data) {
          setBanks(response.data);
        }
      } catch (error) {
        console.error('Error loading banks:', error);
        setError('Không thể tải danh sách ngân hàng');
      } finally {
        setIsLoadingBanks(false);
      }
    };
    loadBanks();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBankSelect = (bank) => {
    setFormData(prev => ({
      ...prev,
      bankName: bank.name,
      bankBin: bank.bin,
      bankShortName: bank.shortName,
      bankLogo: bank.logo
    }));
    setSearchTerm('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.accountHolderName.trim()) {
      setError('Vui lòng nhập tên chủ tài khoản');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('Vui lòng nhập số tài khoản');
      return;
    }
    if (!formData.bankName) {
      setError('Vui lòng chọn ngân hàng');
      return;
    }
    if (!formData.branchName.trim()) {
      setError('Vui lòng nhập tên chi nhánh');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await walletAPI.createPaymentInformation(formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating payment information:', error);
      setError(error.message || 'Không thể thêm thông tin thanh toán');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 flex items-center">
          <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
          Thêm thẻ ngân hàng mới
        </DialogTitle>
        <p className="text-gray-600 text-sm">Thêm thông tin tài khoản ngân hàng của bạn để sử dụng</p>
      </DialogHeader>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Side - Form */}
        <div className="w-80 flex-shrink-0 space-y-6 overflow-y-auto pr-2">
          {/* Bank Selection */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-blue-600" />
              Chọn ngân hàng <span className="text-red-500">*</span>
            </Label>
            {isLoadingBanks ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 text-sm mt-3 font-medium">Đang tải danh sách ngân hàng...</p>
              </div>
            ) : (
              <div className="relative">
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm ngân hàng..."
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                  />
                </div>

                {/* Selected Bank Display */}
                {formData.bankName && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {formData.bankLogo && (
                          <img
                            src={formData.bankLogo}
                            alt={formData.bankName}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {!formData.bankLogo && (
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{formData.bankShortName}</p>
                          <p className="text-xs text-gray-600">{formData.bankName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          bankName: '',
                          bankBin: '',
                          bankShortName: '',
                          bankLogo: ''
                        }))}
                        className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors border border-red-200"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Bank List */}
                {!formData.bankName && (
                  <div className="border-2 border-gray-200 rounded-xl max-h-64 overflow-y-auto shadow-inner bg-gray-50">
                    {filteredBanks.length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm font-medium">Không tìm thấy ngân hàng</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 divide-y divide-gray-200">
                        {filteredBanks.map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => handleBankSelect(bank)}
                            className="p-4 hover:bg-blue-50 transition-colors flex items-center space-x-3 text-left w-full group"
                          >
                            {bank.logo ? (
                              <div className="w-12 h-12 bg-white rounded-lg p-2 border border-gray-200 group-hover:border-blue-300 shadow-sm">
                                <img
                                  src={bank.logo}
                                  alt={bank.shortName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{bank.shortName}</p>
                              <p className="text-xs text-gray-600 truncate">{bank.name}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Holder Name */}
          <div>
            <Label htmlFor="accountHolderName" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Tên chủ tài khoản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountHolderName"
              value={formData.accountHolderName}
              onChange={(e) => handleInputChange('accountHolderName', e.target.value.toUpperCase())}
              placeholder="NGUYEN VAN A"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 uppercase font-semibold tracking-wide"
            />
            <p className="text-xs text-gray-500 mt-1">Nhập tên in hoa giống trên thẻ ngân hàng</p>
          </div>

          {/* Account Number */}
          <div>
            <Label htmlFor="accountNumber" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
              Số tài khoản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              placeholder="0337252208"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 font-mono text-lg tracking-widest"
              type="text"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">Số tài khoản không có dấu cách hoặc ký tự đặc biệt</p>
          </div>

          {/* Branch Name */}
          <div>
            <Label htmlFor="branchName" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              Chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="branchName"
              value={formData.branchName}
              onChange={(e) => handleInputChange('branchName', e.target.value)}
              placeholder="Ví dụ: Hồ Chí Minh, Hà Nội..."
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
            />
            <p className="text-xs text-gray-500 mt-1">Nhập tên chi nhánh hoặc thành phố</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Card Preview */}
        <div className="flex-1 min-w-0">
          <div className="sticky top-0">
            {formData.bankName ? (
              <div className="group relative overflow-hidden bg-[#f9f7f5] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#e8e4df]">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-3">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -mr-24 -mt-24"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -ml-16 -mb-16"></div>
                </div>
                
                {/* Card Content */}
                <div className="relative p-5">
                  {/* Top Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {formData.bankLogo ? (
                        <div className="bg-white rounded-xl p-4 border border-[#e8e4df] shadow-sm">
                          <img
                            src={formData.bankLogo}
                            alt={formData.bankName}
                            className="w-20 h-20 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-[#e8e4df] shadow-sm">
                          <Building2 className="w-20 h-20 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 text-xs px-3 py-1 shadow-sm">
                          {formData.bankShortName || formData.bankName}
                        </Badge>
                        <p className="text-gray-600 text-xs mt-1">
                          {formData.branchName || 'Chưa nhập'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#e8e4df] shadow-sm">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Number Section */}
                  <div className="mb-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Số tài khoản</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-gray-900 tracking-wider">
                        {formData.accountNumber || 'Chưa nhập'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Account Holder Section */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Chủ tài khoản</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 border border-[#e8e4df] shadow-sm">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {formData.accountHolderName || 'Chưa nhập'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Bottom Decoration */}
                  <div className="absolute bottom-3 right-3 opacity-5">
                    <div className="grid grid-cols-4 gap-1">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-2xl p-12 text-center min-h-[400px] flex flex-col justify-center">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-blue-100 transform hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-16 h-16 text-blue-600" />
                </div>
                <h3 className="font-bold text-2xl text-gray-900 mb-3">Xem trước thẻ ngân hàng</h3>
                <p className="text-base text-gray-600 mb-6">Nhập thông tin bên trái để xem thẻ ngân hàng của bạn</p>
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <MapPin className="w-5 h-5" />
                  <p className="text-sm font-medium">Hãy bắt đầu bằng việc chọn ngân hàng</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-300 hover:border-gray-400 px-6"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 px-8"
          >
            {isSubmitting ? 'Đang thêm...' : 'Thêm thẻ'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
