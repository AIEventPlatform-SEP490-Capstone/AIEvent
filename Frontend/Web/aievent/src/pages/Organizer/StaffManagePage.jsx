import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    MoreHorizontal,
    UserCheck,
    UserX,
    Users,
    UserPlus,
    Trash2,
    Mail,
    Phone,
    Eye,
    X,
    MapPin,
    Lock,
    Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
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

        loadStaff(
            1, // Reset to first page when filters change
            staffPagination.pageSize,
            emailSearch,
            searchTerm
        );
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

    const handleDeleteStaff = async (staffId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
            try {
                await deleteStaff(staffId);
                refreshStaff();
            } catch (err) {
                console.error('Failed to delete staff:', err);
            }
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

        loadStaff(
            1,
            staffPagination.pageSize,
            emailSearch,
            searchTerm
        );
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
            error.phoneNumber = 'Số điện thoại là bắt buộc';
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
        // Clear error when user starts typing
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
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setFormErrors(prev => ({
                    ...prev,
                    image: 'Vui lòng chọn file hình ảnh'
                }));
                return;
            }

            // Validate file size (max 5MB)
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

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            // Clear error
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
        // Reset file input
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Helper function to translate error messages
    const translateError = (error) => {
        if (!error) return null;

        // If error is an object with statusCode
        const statusCode = error.statusCode || error.code;
        const message = error.message || error;

        // Map status codes to Vietnamese messages
        const errorMessages = {
            'AIE40001': {
                email: 'Email này đã tồn tại trong hệ thống',
                phoneNumber: 'Số điện thoại này đã tồn tại trong hệ thống',
                default: 'Dữ liệu đã tồn tại trong hệ thống'
            }
        };

        // Check if message contains email or phone number keywords
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

        // Default error message
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
            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('FullName', formData.fullName.trim());
            formDataToSend.append('Email', formData.email.trim());

            // Password
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
            // Check if the action was rejected
            if (result.type && result.type.endsWith('/rejected')) {
                // Throw the payload which contains the error info
                throw result.payload || result;
            }

            // Reset form and close modal
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

            // Refresh staff list
            refreshStaff();
        } catch (err) {
            console.error('Failed to create staff:', err);

            // Parse and display error
            // err might be the action result from Redux thunk or the error payload
            const errorData = err.payload || err.error || err;
            const errorInfo = translateError(errorData);
            
            // If errorInfo is null, try to get message from error directly
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
                    // For general errors, we can show them in the form or use a toast
                    // The error will also be in Redux state
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
        // Reset file input
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    if (loading && staffList.length === 0) {
        return <div className="flex justify-center items-center h-64">Đang tải...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
                    <p className="text-muted-foreground">Quản lý và theo dõi nhân viên của bạn</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Thêm nhân viên
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 w-4 h-4" />
                                <Input
                                    placeholder="Tìm kiếm theo tên..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 w-4 h-4" />
                                <Input
                                    placeholder="Tìm kiếm theo email..."
                                    value={emailSearch}
                                    onChange={(e) => setEmailSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button variant="outline" onClick={handleSearch}>
                            <Search className="h-4 w-4 mr-2" />
                            Tìm kiếm
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Staff List */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách nhân viên: {stats.totalStaff} nhân viên</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                            Lỗi: {typeof error === 'string' ? error : (error.message || 'Có lỗi xảy ra')}
                        </div>
                    )}

                    <div className="space-y-4">
                        {staffList.map((staff, index) => (
                            <div key={staff.id || `staff-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-muted rounded-full flex-shrink-0 flex items-center justify-center">
                                        {staff.image ? (
                                            <img src={staff.image} alt={staff.name} className="w-12 h-12 rounded-full" />
                                        ) : (
                                            <Users className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                                            <Badge className="bg-blue-100 text-blue-800">Nhân viên</Badge>
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-800 mt-1">
                                            <span className="flex items-center">
                                                <Mail className="w-4 h-4 mr-1" />
                                                {staff.email}
                                            </span>
                                            {staff.phoneNumber && (
                                                <span className="flex items-center">
                                                    <Phone className="w-4 h-4 mr-1" />
                                                    {staff.phoneNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteStaff(staff.id)}
                                        className="text-red-600 hover:text-black-700 hover:bg-red-50"
                                        title="Xóa nhân viên"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {staffList.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-sm font-medium">Không tìm thấy nhân viên</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                            Hiển thị {(staffPagination.currentPage - 1) * staffPagination.pageSize + 1} đến {Math.min(staffPagination.currentPage * staffPagination.pageSize, staffPagination.totalItems)} trong tổng số {staffPagination.totalItems}
                        </div>
                        <div className="flex space-x-2">
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
                            >
                                Trước
                            </Button>
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
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create Staff Modal */}
            <Dialog open={showCreateModal} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <UserPlus className="w-5 h-5" />
                            <span>Thêm nhân viên mới</span>
                        </DialogTitle>
                        <DialogDescription>
                            Điền thông tin để thêm nhân viên mới vào hệ thống
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateStaff} className="space-y-4">
                        {/* FullName */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">
                                Tên đầy đủ <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Nhập tên đầy đủ"
                                className={formErrors.fullName ? 'border-red-500' : ''}
                                disabled={isSubmitting}
                            />
                            {formErrors.fullName && (
                                <p className="text-sm text-red-500">{formErrors.fullName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="example@email.com"
                                className={formErrors.email ? 'border-red-500' : ''}
                                disabled={isSubmitting}
                            />
                            {formErrors.email && (
                                <p className="text-sm text-red-500">{formErrors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Mật khẩu
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Nhập mật khẩu (tùy chọn)"
                                className={formErrors.password ? 'border-red-500' : ''}
                                disabled={isSubmitting}
                            />
                            {formErrors.password && (
                                <p className="text-sm text-red-500">{formErrors.password}</p>
                            )}
                            <p className="text-xs text-gray-500">Nếu không nhập, hệ thống sẽ tạo mật khẩu mặc định là 'Staff123!'.</p>
                        </div>

                        {/* PhoneNumber */}
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">
                                Số điện thoại <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="0123456789"
                                className={formErrors.phoneNumber ? 'border-red-500' : ''}
                                disabled={isSubmitting}
                            />
                            {formErrors.phoneNumber && (
                                <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">
                                Địa chỉ
                            </Label>
                            <Input
                                id="address"
                                name="address"
                                type="text"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ"
                                className={formErrors.address ? 'border-red-500' : ''}
                                disabled={isSubmitting}
                            />
                            {formErrors.address && (
                                <p className="text-sm text-red-500">{formErrors.address}</p>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="image-upload">
                                Hình ảnh
                            </Label>
                            <div className="space-y-2">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg border"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
                                                <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                                <p className="text-sm font-semibold text-gray-600">Chọn hình ảnh</p>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
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
                            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                {formErrors.general}
                            </div>
                        )}
                        {error && typeof error === 'object' && error.statusCode && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                {translateError(error)?.message || 'Có lỗi xảy ra'}
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseModal}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang thêm...' : 'Thêm nhân viên'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Staff Detail Modal */}
            {showStaffDetail && selectedStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Thông tin chi tiết nhân viên</h3>
                                <button
                                    onClick={() => {
                                        setShowStaffDetail(false);
                                        setSelectedStaff(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-muted rounded-full flex-shrink-0 flex items-center justify-center">
                                        {selectedStaff.image ? (
                                            <img src={selectedStaff.image} alt={selectedStaff.name} className="w-16 h-16 rounded-full" />
                                        ) : (
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">{selectedStaff.name}</h3>
                                        <Badge className="bg-blue-100 text-blue-800 mt-1">Nhân viên</Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-800">Email</label>
                                        <p className="text-gray-900">{selectedStaff.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-800">Số điện thoại</label>
                                        <p className="text-gray-900">{selectedStaff.phoneNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagePage;