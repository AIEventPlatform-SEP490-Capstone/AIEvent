import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    Users,
    UserPlus,
    Trash2,
    Mail,
    Phone,
    X,
    MapPin,
    Lock,
    Image as ImageIcon,
    RefreshCw,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { useStaffManagement } from '../../hooks/useStaffManagement';

const StaffManagePage = () => {
    const {
        staffList,
        staffPagination,
        loading,
        error,
        loadStaff,
        createStaff,
        deleteStaff,
        updateStaffFilters,
        refreshStaff,
        clearStaffError,
        staffFilters
    } = useStaffManagement();

    const [searchTerm, setSearchTerm] = useState(staffFilters.name || '');
    const [emailSearch, setEmailSearch] = useState(staffFilters.email || '');
    const [showStaffDetail, setShowStaffDetail] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        address: '',
        image: null
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isInitialMount = useRef(true);
    const lastFilters = useRef({ name: '', email: '' });

    // Load staff when component mounts
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            loadStaff(
                staffPagination.currentPage,
                staffPagination.pageSize,
                staffFilters.email,
                staffFilters.name
            );
        }
    }, []);

    // Handle search with debounce
    const debouncedSearch = useCallback(() => {
        if (searchTerm === lastFilters.current.name && emailSearch === lastFilters.current.email) {
            return;
        }

        lastFilters.current = { name: searchTerm, email: emailSearch };
        clearStaffError();

        updateStaffFilters({
            name: searchTerm,
            email: emailSearch
        });

        loadStaff(1, staffPagination.pageSize, emailSearch, searchTerm);
    }, [searchTerm, emailSearch, staffPagination.pageSize, loadStaff, updateStaffFilters, clearStaffError]);

    // Auto-search when user has finished typing
    useEffect(() => {
        let timeoutId;

        if (searchTerm.length >= 3 || emailSearch.length >= 3) {
            timeoutId = setTimeout(() => {
                debouncedSearch();
            }, 1000);
        } else if (searchTerm.length === 0 && emailSearch.length === 0) {
            timeoutId = setTimeout(() => {
                debouncedSearch();
            }, 300);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [searchTerm, emailSearch, debouncedSearch]);

    // Auto-clear error message after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                clearStaffError();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [error, clearStaffError]);

    const stats = {
        totalStaff: staffPagination.totalItems || 0,
        activeStaff: staffList.length,
    };

    const handleDeleteClick = (staff) => {
        setStaffToDelete(staff);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteStaff = async () => {
        if (!staffToDelete) return;
        
        setIsDeleting(true);
        try {
            await deleteStaff(staffToDelete.id);
            setShowDeleteConfirm(false);
            setStaffToDelete(null);
            refreshStaff();
        } catch (err) {
            console.error('Failed to delete staff:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSearch = () => {
        if (searchTerm === lastFilters.current.name && emailSearch === lastFilters.current.email) {
            return;
        }

        lastFilters.current = { name: searchTerm, email: emailSearch };
        clearStaffError();

        updateStaffFilters({
            name: searchTerm,
            email: emailSearch
        });

        loadStaff(1, staffPagination.pageSize, emailSearch, searchTerm);
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.fullName.trim()) {
            errors.fullName = 'Tên đầy đủ là bắt buộc';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email không hợp lệ';
        }

        if (formData.password && formData.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!formData.phoneNumber.trim()) {
            errors.phoneNumber = 'Số điện thoại là bắt buộc';
        } else if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
            errors.phoneNumber = 'Số điện thoại không hợp lệ';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle image change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setFormErrors(prev => ({
                    ...prev,
                    image: 'Vui lòng chọn file hình ảnh'
                }));
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setFormErrors(prev => ({
                    ...prev,
                    image: 'Kích thước file không được vượt quá 5MB'
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                image: file
            }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            if (formErrors.image) {
                setFormErrors(prev => ({
                    ...prev,
                    image: ''
                }));
            }
        }
    };

    // Remove image
    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            image: null
        }));
        setImagePreview(null);
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Helper function to translate error messages
    const translateError = (error) => {
        if (!error) return null;

        const statusCode = error.statusCode || error.code;
        const message = error.message || error;

        const errorMessages = {
            'AIE40001': {
                email: 'Email này đã tồn tại trong hệ thống',
                phoneNumber: 'Số điện thoại này đã tồn tại trong hệ thống',
                default: 'Dữ liệu đã tồn tại trong hệ thống'
            }
        };

        const lowerMessage = message.toLowerCase();
        if (statusCode === 'AIE40001') {
            if (lowerMessage.includes('email') || lowerMessage.includes('email is already')) {
                return { field: 'email', message: errorMessages[statusCode].email };
            }
            if (lowerMessage.includes('phone') || lowerMessage.includes('phone number')) {
                return { field: 'phoneNumber', message: errorMessages[statusCode].phoneNumber };
            }
            return { field: 'general', message: errorMessages[statusCode].default };
        }

        return { field: 'general', message: message || 'Có lỗi xảy ra khi tạo nhân viên' };
    };

    // Handle create staff
    const handleCreateStaff = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        clearStaffError();
        setFormErrors({});

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('FullName', formData.fullName.trim());
            formDataToSend.append('Email', formData.email.trim());

            const password = formData.password.trim() || 'Staff123!';
            formDataToSend.append('Password', password);

            if (formData.phoneNumber.trim()) {
                formDataToSend.append('PhoneNumber', formData.phoneNumber.trim());
            }

            if (formData.address.trim()) {
                formDataToSend.append('Address', formData.address.trim());
            }

            if (formData.image) {
                formDataToSend.append('Image', formData.image);
            }

            const result = await createStaff(formDataToSend);
            if (result.type && result.type.endsWith('/rejected')) {
                throw result.payload || result;
            }

            setFormData({
                fullName: '',
                email: '',
                password: '',
                phoneNumber: '',
                address: '',
                image: null
            });
            setFormErrors({});
            setImagePreview(null);
            setShowCreateModal(false);
            refreshStaff();
        } catch (err) {
            console.error('Failed to create staff:', err);

            const errorData = err.payload || err.error || err;
            const errorInfo = translateError(errorData);
            
            if (!errorInfo && err) {
                const directMessage = typeof err === 'string' ? err : (err.message || 'Có lỗi xảy ra khi tạo nhân viên');
                setFormErrors(prev => ({
                    ...prev,
                    general: directMessage
                }));
                return;
            }

            if (errorInfo) {
                if (errorInfo.field === 'email') {
                    setFormErrors(prev => ({
                        ...prev,
                        email: errorInfo.message
                    }));
                } else if (errorInfo.field === 'phoneNumber') {
                    setFormErrors(prev => ({
                        ...prev,
                        phoneNumber: errorInfo.message
                    }));
                } else {
                    console.error('Error:', errorInfo.message);
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowCreateModal(false);
        setFormData({
            fullName: '',
            email: '',
            password: '',
            phoneNumber: '',
            address: '',
            image: null
        });
        setFormErrors({});
        setImagePreview(null);
        clearStaffError();
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    if (loading && staffList.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-lg text-slate-600">Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Quản lý nhân viên
                            </h1>
                            <p className="text-slate-600 text-lg">Quản lý và theo dõi nhân viên của bạn</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0">
                                <Users className="w-4 h-4 mr-2" />
                                {stats.totalStaff} nhân viên
                            </Badge>
                            <Button
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Thêm nhân viên
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <Input
                                        placeholder="Tìm kiếm theo tên..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <Input
                                        placeholder="Tìm kiếm theo email..."
                                        value={emailSearch}
                                        onChange={(e) => setEmailSearch(e.target.value)}
                                        className="pl-12 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                                    />
                                </div>
                            </div>

                            <Button 
                                onClick={handleSearch}
                                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                            >
                                <Search className="h-4 w-4 mr-2" />
                                Tìm kiếm
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Staff List */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-xl font-semibold text-slate-800">
                            Danh sách nhân viên
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {error && (
                            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="font-medium">Lỗi: {typeof error === 'string' ? error : (error.message || 'Có lỗi xảy ra')}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            {staffList.map((staff, index) => (
                                <div 
                                    key={staff.id || `staff-${index}`} 
                                    className="group relative flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-white"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="relative">
                                            {staff.image ? (
                                                <img 
                                                    src={staff.image} 
                                                    alt={staff.name}
                                                    className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                                                    <Users className="h-7 w-7 text-white" />
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900 text-lg truncate">{staff.name}</h3>
                                                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0">
                                                    Nhân viên
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    {staff.email}
                                                </span>
                                                {staff.phoneNumber && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="w-4 h-4 text-slate-400" />
                                                        {staff.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteClick(staff)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                                            title="Xóa nhân viên"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {staffList.length === 0 && !loading && (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl mb-4">
                                    <Users className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Không tìm thấy nhân viên</h3>
                                <p className="text-slate-500">
                                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {staffList.length > 0 && (
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                                <div className="text-sm text-slate-600 font-medium">
                                    Hiển thị <span className="text-blue-600 font-semibold">{(staffPagination.currentPage - 1) * staffPagination.pageSize + 1}</span> đến <span className="text-blue-600 font-semibold">{Math.min(staffPagination.currentPage * staffPagination.pageSize, staffPagination.totalItems)}</span> trong tổng số <span className="text-blue-600 font-semibold">{staffPagination.totalItems}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => loadStaff(
                                            Math.max(staffPagination.currentPage - 1, 1),
                                            staffPagination.pageSize,
                                            staffFilters.email,
                                            staffFilters.name
                                        )}
                                        disabled={staffPagination.currentPage === 1}
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                                    >
                                        Trước
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(Math.min(5, staffPagination.totalPages))].map((_, i) => {
                                            const pageNum = i + 1;
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    onClick={() => loadStaff(
                                                        pageNum,
                                                        staffPagination.pageSize,
                                                        staffFilters.email,
                                                        staffFilters.name
                                                    )}
                                                    variant={staffPagination.currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    className={staffPagination.currentPage === pageNum 
                                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl" 
                                                        : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-xl"
                                                    }
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        onClick={() => loadStaff(
                                            Math.min(staffPagination.currentPage + 1, staffPagination.totalPages),
                                            staffPagination.pageSize,
                                            staffFilters.email,
                                            staffFilters.name
                                        )}
                                        disabled={staffPagination.currentPage === staffPagination.totalPages}
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                                    >
                                        Sau
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create Staff Modal */}
                <Dialog open={showCreateModal} onOpenChange={handleCloseModal}>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader className="space-y-3 pb-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <UserPlus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold">Thêm nhân viên mới</DialogTitle>
                                    <DialogDescription className="text-slate-500">
                                        Điền thông tin để thêm nhân viên mới vào hệ thống
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleCreateStaff} className="space-y-5 py-6">
                            {/* FullName */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    Tên đầy đủ <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Nhập tên đầy đủ"
                                    className={`h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${formErrors.fullName ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                                {formErrors.fullName && (
                                    <p className="text-sm text-red-500">{formErrors.fullName}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="example@email.com"
                                    className={`h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                                {formErrors.email && (
                                    <p className="text-sm text-red-500">{formErrors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-blue-500" />
                                    Mật khẩu
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Nhập mật khẩu (tùy chọn)"
                                    className={`h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${formErrors.password ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                                {formErrors.password && (
                                    <p className="text-sm text-red-500">{formErrors.password}</p>
                                )}
                                <p className="text-xs text-slate-500">Nếu không nhập, hệ thống sẽ tạo mật khẩu mặc định là 'Staff123!'</p>
                            </div>

                            {/* PhoneNumber */}
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-blue-500" />
                                    Số điện thoại <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="0123456789"
                                    className={`h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${formErrors.phoneNumber ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                                {formErrors.phoneNumber && (
                                    <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    Địa chỉ
                                </Label>
                                <Input
                                    id="address"
                                    name="address"
                                    type="text"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Nhập địa chỉ (tùy chọn)"
                                    className={`h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${formErrors.address ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                />
                                {formErrors.address && (
                                    <p className="text-sm text-red-500">{formErrors.address}</p>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="image-upload" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-blue-500" />
                                    Hình ảnh
                                </Label>
                                <div className="space-y-2">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-48 object-cover rounded-xl border"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 rounded-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                id="image-upload"
                                                disabled={isSubmitting}
                                            />
                                            <label htmlFor="image-upload" className="cursor-pointer">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-3">
                                                        <ImageIcon className="h-6 w-6 text-blue-500" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-600">Chọn hình ảnh</p>
                                                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF tối đa 5MB</p>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                    {formErrors.image && (
                                        <p className="text-sm text-red-500">{formErrors.image}</p>
                                    )}
                                </div>
                            </div>

                            {/* General Error Display */}
                            {formErrors.general && (
                                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    {formErrors.general}
                                </div>
                            )}
                            {error && typeof error === 'object' && error.statusCode && (
                                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    {translateError(error)?.message || 'Có lỗi xảy ra'}
                                </div>
                            )}

                            <DialogFooter className="gap-2 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                    className="rounded-xl"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Đang thêm...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Thêm nhân viên
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && staffToDelete && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Trash2 className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900">Xóa nhân viên</h3>
                                        <p className="text-sm text-slate-500">Xác nhận hành động này</p>
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-slate-700 mb-2">
                                        Bạn có chắc chắn muốn xóa nhân viên này?
                                    </p>
                                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-red-200">
                                        {staffToDelete.image ? (
                                            <img 
                                                src={staffToDelete.image} 
                                                alt={staffToDelete.name}
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                <Users className="h-5 w-5 text-white" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{staffToDelete.name}</p>
                                            <p className="text-xs text-slate-600 truncate">{staffToDelete.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setStaffToDelete(null);
                                        }}
                                        disabled={isDeleting}
                                        className="flex-1 rounded-xl"
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={confirmDeleteStaff}
                                        disabled={isDeleting}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Đang xóa...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Xóa nhân viên
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Detail Modal */}
                {showStaffDetail && selectedStaff && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                                <h3 className="text-xl font-bold">Thông tin chi tiết nhân viên</h3>
                                <button 
                                    onClick={() => {
                                        setShowStaffDetail(false);
                                        setSelectedStaff(null);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* User Header */}
                                <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                                    <div className="relative">
                                        {selectedStaff.image ? (
                                            <img 
                                                src={selectedStaff.image} 
                                                alt={selectedStaff.name}
                                                className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Users className="h-8 w-8 text-white" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">{selectedStaff.name}</h3>
                                        <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0">
                                            Nhân viên
                                        </Badge>
                                    </div>
                                </div>

                                {/* User Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-4 h-4 text-white" />
                                            </div>
                                            <label className="text-xs font-semibold text-slate-600">Email</label>
                                        </div>
                                        <p className="text-sm text-slate-900 font-medium truncate">{selectedStaff.email}</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Phone className="w-4 h-4 text-white" />
                                            </div>
                                            <label className="text-xs font-semibold text-slate-600">Số điện thoại</label>
                                        </div>
                                        <p className="text-sm text-slate-900 font-medium">{selectedStaff.phoneNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffManagePage;
