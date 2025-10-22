using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MockQueryable.Moq;
using Moq;
using System.Text.Json;

namespace AIEvent.Application.Test.Services
{
    public class EventServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ICloudinaryService> _mockCloudinaryService;
        private readonly EventService _eventService;

        public EventServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _mockMapper = new Mock<IMapper>();
            _mockCloudinaryService = new Mock<ICloudinaryService>();

            _eventService = new EventService(
                _mockUnitOfWork.Object,
                _mockTransactionHelper.Object,
                _mockMapper.Object,
                _mockCloudinaryService.Object);
        }


        #region CreateEventAsync Tests
        private Mock<IFormFile> CreateMockFormFile(string fileName = "test.jpg", long length = 1024)
        {
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns(fileName);
            mockFile.Setup(f => f.Length).Returns(length);
            return mockFile;
        }

        // UTCID01: Valid request with all required fields - Success
        [Fact]
        public async Task UTCID01_CreateEventAsync_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = ConfirmStatus.NeedConfirm,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("https://cloudinary.com/test.jpg");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
            _mockMapper.Verify(x => x.Map<Event>(createEventRequest), Times.Once);
            _mockCloudinaryService.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Once);
        }

        // UTCID02: organizerId is Guid.Empty - Failure
        [Fact]
        public async Task UTCID02_CreateEventAsync_WithEmptyOrganizerId_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.Empty;
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object }
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
        }

        // UTCID03: Null request - Failure
        [Fact]
        public async Task UTCID03_CreateEventAsync_WithNullRequest_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            CreateEventRequest? request = null;

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, request!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID04: Missing Title - Failure
        [Fact]
        public async Task UTCID04_CreateEventAsync_WithMissingTitle_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var createEventRequest = new CreateEventRequest
            {
                Title = null!,
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString()
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Title is required");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID05: Missing Description - Failure
        [Fact]
        public async Task UTCID05_CreateEventAsync_WithMissingDescription_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = null!,
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString()
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Description is required");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID06: Empty Title - Failure
        [Fact]
        public async Task UTCID06_CreateEventAsync_WithEmptyTitle_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var createEventRequest = new CreateEventRequest
            {
                Title = "",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString()
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Title is required");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID07: Invalid TicketDetail in list - Failure
        [Fact]
        public async Task UTCID07_CreateEventAsync_WithInvalidTicketDetail_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Paid,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
                {
                    new TicketDetailRequest
                    {
                        TicketName = null!, // Invalid
                        TicketPrice = 100,
                        TicketQuantity = 50,
                        RuleRefundRequestId = Guid.NewGuid().ToString()
                    }
                }
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("TicketName is required");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID08: EndTime before StartTime - Failure
        [Fact]
        public async Task UTCID08_CreateEventAsync_WithEndTimeBeforeStartTime_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(4), // Before StartTime
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(3),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("EndTime cannot be before the StartTime");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID09: SaleEndTime before SaleStartTime - Failure
        [Fact]
        public async Task UTCID09_CreateEventAsync_WithSaleEndTimeBeforeSaleStartTime_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(3),
                SaleEndTime = DateTime.Now.AddDays(2), // Before SaleStartTime
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("SaleEndTime cannot be before the SaleStartTime");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID10: SaleEndTime after StartTime - Failure
        [Fact]
        public async Task UTCID10_CreateEventAsync_WithSaleEndTimeAfterStartTime_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(6), // After StartTime
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice =0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("SaleEndTime cannot be after the event StartTime");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID11: Organizer not found (null) - Failure
        [Fact]
        public async Task UTCID11_CreateEventAsync_WithNonExistentOrganizer_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync((OrganizerProfile?)null);

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
        }

        // UTCID12: Organizer status is Reject - Failure
        [Fact]
        public async Task UTCID12_CreateEventAsync_WithRejectedOrganizer_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Reject, // Rejected
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
        }

        // UTCID13: Organizer status is NeedConfirm - Failure
        [Fact]
        public async Task UTCID13_CreateEventAsync_WithPendingOrganizer_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.NeedConfirm, // Pending
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID14: Mapping fails (returns null) - Failure
        [Fact]
        public async Task UTCID14_CreateEventAsync_WithMappingFailure_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice =0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns((Event?)null!);

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to map event");
            result.Error.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockMapper.Verify(x => x.Map<Event>(createEventRequest), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Never);
        }

        // UTCID15: With images - Success
        [Fact]
        public async Task UTCID15_CreateEventAsync_WithImages_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile1 = new Mock<IFormFile>();
            mockFile1.Setup(f => f.FileName).Returns("test1.jpg");
            mockFile1.Setup(f => f.Length).Returns(1024);

            var mockFile2 = new Mock<IFormFile>();
            mockFile2.Setup(f => f.FileName).Returns("test2.jpg");
            mockFile2.Setup(f => f.Length).Returns(2048);

            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile1.Object, mockFile2.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync((IFormFile file) => $"https://cloudinary.com/{file.FileName}");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockCloudinaryService.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>()), Times.Exactly(2));
            _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Once);
        }

        // UTCID16: Image upload fails - Failure
        [Fact]
        public async Task UTCID16_CreateEventAsync_WithImageUploadFailure_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns("test.jpg");
            mockFile.Setup(f => f.Length).Returns(1024);

            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync((string?)null); // Upload fails

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Some images failed to upload");
            result.Error.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockCloudinaryService.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Never);
        }

        // UTCID17: Boundary - EndTime equals StartTime - Success
        [Fact]
        public async Task UTCID17_CreateEventAsync_WithEndTimeEqualsStartTime_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var eventTime = DateTime.Now.AddDays(5);
            var mockFile = CreateMockFormFile();
            
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = eventTime,
                EndTime = eventTime, // Same as StartTime (boundary)
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("https://cloudinary.com/test.jpg");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        // UTCID18: Boundary - SaleEndTime equals StartTime - Success
        [Fact]
        public async Task UTCID18_CreateEventAsync_WithSaleEndTimeEqualsStartTime_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var eventStartTime = DateTime.Now.AddDays(5);
            var mockFile = CreateMockFormFile();
            
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = eventStartTime,
                EndTime = eventStartTime.AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = eventStartTime, // Same as StartTime (boundary)
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("https://cloudinary.com/test.jpg");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        // UTCID19: Boundary - SaleEndTime equals SaleStartTime - Success
        [Fact]
        public async Task UTCID19_CreateEventAsync_WithSaleEndTimeEqualsSaleStartTime_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var saleTime = DateTime.Now.AddDays(3);
            var mockFile = CreateMockFormFile();
            
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = saleTime,
                SaleEndTime = saleTime, // Same as SaleStartTime (boundary)
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("https://cloudinary.com/test.jpg");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        // UTCID20: Multiple valid ticket details - Success
        [Fact]
        public async Task UTCID20_CreateEventAsync_WithMultipleTicketDetails_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Paid,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
                {
                    new TicketDetailRequest
                    {
                        TicketName = "VIP",
                        TicketPrice = 200,
                        TicketQuantity = 20,
                        RuleRefundRequestId = Guid.NewGuid().ToString()
                    },
                    new TicketDetailRequest
                    {
                        TicketName = "Regular",
                        TicketPrice = 100,
                        TicketQuantity = 80,
                        RuleRefundRequestId = Guid.NewGuid().ToString()
                    }
                }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("https://cloudinary.com/test.jpg");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Once);
        }

        // UTCID21: Invalid ticket price (negative) - Failure
        [Fact]
        public async Task UTCID21_CreateEventAsync_WithNegativeTicketPrice_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Paid,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
                {
                    new TicketDetailRequest
                    {
                        TicketName = "VIP",
                        TicketPrice = -100, // Invalid negative price
                        TicketQuantity = 20,
                        RuleRefundRequestId = Guid.NewGuid().ToString()
                    }
                }
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("TicketPrice must be greater than or equal to 0");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID22: Invalid ticket quantity (zero) - Failure
        [Fact]
        public async Task UTCID22_CreateEventAsync_WithZeroTicketQuantity_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Paid,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
                {
                    new TicketDetailRequest
                    {
                        TicketName = "VIP",
                        TicketPrice = 100,
                        TicketQuantity = 0, // Invalid zero quantity
                        RuleRefundRequestId = Guid.NewGuid().ToString()
                    }
                }
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("TicketQuantity must be greater than 0");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID23: Boundary - Ticket price is 0 - Success
        [Fact]
        public async Task UTCID23_CreateEventAsync_WithZeroTicketPrice_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
                {
                    new TicketDetailRequest
                    {
                        TicketName = "Free Ticket",
                        TicketPrice = 0, // Boundary: minimum valid price
                        TicketQuantity = 100,
                        RuleRefundRequestId = Guid.NewGuid().ToString()
                    }
                }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("https://cloudinary.com/test.jpg");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        // UTCID24: Boundary - Ticket quantity is 1 - Success
        [Fact]
        public async Task UTCID24_CreateEventAsync_WithMinimumTicketQuantity_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 1,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
                {
                    new TicketDetailRequest
                    {
                        TicketName = "Single Ticket",
                        TicketPrice = 0,
                        TicketQuantity = 1, // Boundary: minimum valid quantity
                        RuleRefundRequestId = Guid.NewGuid().ToString()
                    }
                }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("https://cloudinary.com/test.jpg");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }
        [Fact]
        public async Task UTCID25_CreateEventAsync_WithEmptyImgListEvent_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile>(),              
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1, // Equal to Max
                    MaxPurchaseQuantity =10  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Please upload at least one image");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockCloudinaryService.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>()), Times.Never);
        }

        [Fact]
        public async Task UTCID26_CreateEventAsync_WithEmptyDescription_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString()
            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Description is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        [Fact]
        public async Task UTCID27_CreateEventAsync_WithMinPurchaseQuantityLessThanOne_ShouldReturnValidationError()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Paid,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 50.00m,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 0, // Invalid: less than 1
                    MaxPurchaseQuantity = 10
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("MinPurchaseQuantity must be at least 1");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID28_CreateEventAsync_WithMaxPurchaseQuantityLessThanOne_ShouldReturnValidationError()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Paid,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 50.00m,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 1,
                    MaxPurchaseQuantity = 0 // Invalid: less than 1
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("MaxPurchaseQuantity must be at least 1");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID29_CreateEventAsync_WithMinPurchaseQuantityEqualsMaxPurchaseQuantity_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Paid,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 50.00m,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 5, // Equal to Max
                    MaxPurchaseQuantity = 5  // Equal to Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("https://cloudinary.com/test.jpg");
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task UTCID30_CreateEventAsync_WithMinPurchaseQuantityGreaterThanMaxPurchaseQuantity_ShouldReturnValidationError()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Paid,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>
            {
                new TicketDetailRequest
                {
                    TicketName = "Standard Ticket",
                    TicketPrice = 50.00m,
                    TicketQuantity = 100,
                    RuleRefundRequestId = Guid.NewGuid().ToString(),
                    MinPurchaseQuantity = 10, // Greater than Max
                    MaxPurchaseQuantity = 5   // Less than Min
                }
            }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("MinPurchaseQuantity cannot be greater than MaxPurchaseQuantity");
        }

        [Fact]
        public async Task UTCID31_CreateEventAsync_WithEmptyTicketDetails_ShouldReturnFailure()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var mockFile = CreateMockFormFile();
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                SaleStartTime = DateTime.Now.AddDays(1),
                SaleEndTime = DateTime.Now.AddDays(4),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                EventCategoryId = Guid.NewGuid().ToString(),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                TicketDetails = new List<TicketDetailRequest>(),

            };

            // Act
            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Ticket is required");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        #endregion

        #region GetEventAsync Tests

        [Fact]
        public async Task UTCID01_GetEventAsync_WithNoFilters_ShouldReturnPaginatedEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Event 1",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail>
                    {
                        new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 }
                    }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.TotalItems.Should().Be(1);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(5);
        }

        [Fact]
        public async Task UTCID02_GetEventAsync_WithValidUserId_ShouldShowFavoriteStatus()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var eventId = Guid.NewGuid();
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = eventId,
                    Title = "Event 1",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>
                    {
                        new FavoriteEvent { UserId = userId, EventId = eventId }
                    },
                    TicketDetails = new List<TicketDetail>
                    {
                        new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 50 }
                    }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(userId, null, null, null!, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().IsFavorite.Should().BeTrue();
        }

        [Fact]
        public async Task UTCID03_GetEventAsync_WithEmptyUserId_ShouldNotShowFavorite()
        {
            // Arrange
            var userId = Guid.Empty;
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Event 1",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail>
                    {
                        new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 }
                    }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(userId, null, null, null!, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().IsFavorite.Should().BeFalse();
        }

        [Fact]
        public async Task UTCID04_GetEventAsync_WithSearchTitleCaseInsensitive_ShouldReturnMatchingEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Music Concert",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Art Exhibition",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, "music", null, null!, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Contain("Music");
        }

        [Fact]
        public async Task UTCID05_GetEventAsync_WithEventCategoryId_ShouldReturnFilteredEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var categoryId1 = Guid.NewGuid();
            var categoryId2 = Guid.NewGuid();
            var eventCategory1 = new EventCategory { Id = categoryId1, CategoryName = "Music" };
            var eventCategory2 = new EventCategory { Id = categoryId2, CategoryName = "Art" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Music Event",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = categoryId1,
                    EventCategory = eventCategory1,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Art Event",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = categoryId2,
                    EventCategory = eventCategory2,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, categoryId1.ToString(), null!, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().EventCategoryName.Should().Be("Music");
        }

        [Fact]
        public async Task UTCID06_GetEventAsync_WithSingleTag_ShouldReturnFilteredEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var tagId1 = Guid.NewGuid();
            var tagId2 = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var tag1 = new Tag { Id = tagId1, NameTag = "Rock" };
            var tag2 = new Tag { Id = tagId2, NameTag = "Jazz" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Rock Event",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag> 
                    { 
                        new EventTag { TagId = tagId1, Tag = tag1 } 
                    },
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Jazz Event",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag> 
                    { 
                        new EventTag { TagId = tagId2, Tag = tag2 } 
                    },
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            var tagRequest = new List<EventTagRequest> { new EventTagRequest { TagId = tagId1 } };

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, tagRequest, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Rock Event");
        }

        [Fact]
        public async Task UTCID07_GetEventAsync_WithMultipleTags_ShouldReturnFilteredEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var tagId1 = Guid.NewGuid();
            var tagId2 = Guid.NewGuid();
            var tagId3 = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var tag1 = new Tag { Id = tagId1, NameTag = "Rock" };
            var tag2 = new Tag { Id = tagId2, NameTag = "Jazz" };
            var tag3 = new Tag { Id = tagId3, NameTag = "Pop" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Rock Event",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag> 
                    { 
                        new EventTag { TagId = tagId1, Tag = tag1 } 
                    },
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Jazz Event",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag> 
                    { 
                        new EventTag { TagId = tagId2, Tag = tag2 } 
                    },
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Pop Event",
                    Description = "Description 3",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 75,
                    SoldQuantity = 0,
                    LocationName = "Location 3",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag> 
                    { 
                        new EventTag { TagId = tagId3, Tag = tag3 } 
                    },
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            var tagRequest = new List<EventTagRequest> 
            { 
                new EventTagRequest { TagId = tagId1 },
                new EventTagRequest { TagId = tagId2 }
            };

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, tagRequest, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
        }

        [Fact]
        public async Task UTCID08_GetEventAsync_WithTicketTypeFree_ShouldReturnFilteredEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Free Event",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Paid Event",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Paid,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 100 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, TicketType.Free, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().TicketType.Should().Be(TicketType.Free);
        }

        [Fact]
        public async Task UTCID09_GetEventAsync_WithTicketTypePaid_ShouldReturnFilteredEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Free Event",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Paid Event",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Paid,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 100 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, TicketType.Paid, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().TicketType.Should().Be(TicketType.Paid);
        }
    
        [Fact]
        public async Task UTCID10_GetEventAsync_WithCityFilterCaseInsensitive_ShouldReturnFilteredEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Event in HCM",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    City = "Ho Chi Minh",
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Event in Hanoi",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    City = "Hanoi",
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, "ho chi", null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Event in HCM");
        }

        [Fact]
        public async Task UTCID11_GetEventAsync_WithTimeLineToday_ShouldReturnTodayEvents()
        {
            // Arrange
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Today Event",
                    Description = "Description 1",
                    StartTime = DateTime.Now.AddHours(1),
                    EndTime = today.AddHours(22),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Tomorrow Event",
                    Description = "Description 2",
                    StartTime = tomorrow.AddHours(10),
                    EndTime = tomorrow.AddHours(12),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, TimeLine.Today, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Today Event");
        }

        [Fact]
        public async Task UTCID12_GetEventAsync_WithTimeLineTomorrow_ShouldReturnTomorrowEvents()
        {
            // Arrange
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Today Event",
                    Description = "Description 1",
                    StartTime = today.AddHours(20),
                    EndTime = today.AddHours(22),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Tomorrow Event",
                    Description = "Description 2",
                    StartTime = tomorrow.AddHours(10),
                    EndTime = tomorrow.AddHours(12),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, TimeLine.Tomorrow, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Tomorrow Event");
        }

        [Fact]
        public async Task UTCID13_GetEventAsync_WithTimeLineThisWeek_ShouldReturnThisWeekEvents()
        {
            // Arrange
            var today = DateTime.Today;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
            var eventInWeek = today.AddDays(2);
            var eventOutsideWeek = startOfWeek.AddDays(2).AddHours(2);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "This Week Event",
                    Description = "Description 1",
                    StartTime = eventInWeek,
                    EndTime = eventInWeek.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Next Week Event",
                    Description = "Description 2",
                    StartTime = eventOutsideWeek,
                    EndTime = eventOutsideWeek.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, TimeLine.ThisWeek, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("This Week Event");
        }

        [Fact]
        public async Task UTCID14_GetEventAsync_WithTimeLineThisMonth_ShouldReturnThisMonthEvents()
        {
            // Arrange
            var today = DateTime.Today;
            var thisMonth = today.AddDays(5);
            var nextMonth = today.AddMonths(1);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "This Month Event",
                    Description = "Description 1",
                    StartTime = thisMonth.AddHours(14),
                    EndTime = thisMonth.AddHours(16),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Next Month Event",
                    Description = "Description 2",
                    StartTime = nextMonth.AddHours(10),
                    EndTime = nextMonth.AddHours(12),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, TimeLine.ThisMonth, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("This Month Event");
        }

        [Fact]
        public async Task UTCID15_GetEventAsync_WithPastEvents_ShouldNotReturnPastEvents()
        {
            // Arrange
            var pastDate = DateTime.Now.AddDays(-10);
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Past Event",
                    Description = "Description 1",
                    StartTime = pastDate,
                    EndTime = pastDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Future Event",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Future Event");
        }

        [Fact]
        public async Task UTCID16_GetEventAsync_WithDeletedEvents_ShouldNotReturnDeletedEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Deleted Event",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = DateTime.Now.AddDays(-1), // Deleted
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(0);
        }

        [Fact]
        public async Task UTCID17_GetEventAsync_WithUnapprovedEvents_ShouldNotReturnUnapprovedEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Pending Event",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.NeedConfirm, // Not approved
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Rejected Event",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Reject, // Rejected
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Approved Event",
                    Description = "Description 3",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 75,
                    SoldQuantity = 0,
                    LocationName = "Location 3",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Approved Event");
        }

        [Fact]
        public async Task UTCID18_GetEventAsync_WithMultipleFilters_ShouldReturnCorrectlyFilteredEvents()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var categoryId = Guid.NewGuid();
            var tagId = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = categoryId, CategoryName = "Music" };
            var tag = new Tag { Id = tagId, NameTag = "Rock" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Rock Concert in HCM",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = categoryId,
                    EventCategory = eventCategory,
                    City = "Ho Chi Minh",
                    TicketType = TicketType.Paid,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag> { new EventTag { TagId = tagId, Tag = tag } },
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 100 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Rock Concert in Hanoi",
                    Description = "Description 2",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = categoryId,
                    EventCategory = eventCategory,
                    City = "Hanoi",
                    TicketType = TicketType.Paid,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    EventTags = new List<EventTag> { new EventTag { TagId = tagId, Tag = tag } },
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 50 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            var tagRequest = new List<EventTagRequest> { new EventTagRequest { TagId = tagId } };

            // Act
            var result = await _eventService.GetEventAsync(null, "rock", categoryId.ToString(), tagRequest, TicketType.Paid, "chi minh", null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Rock Concert in HCM");
        }

        [Fact]
        public async Task UTCID19_GetEventAsync_WithBoundaryPaginationPageSize1_ShouldReturn1Item()
        {
            // Arrange
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            
            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Event 1",
                    Description = "Description 1",
                    StartTime = futureDate,
                    EndTime = futureDate.AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Publish = true,
                    CreatedAt = DateTime.Now.AddMinutes(-2),
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Event 2",
                    Description = "Description 2",
                    StartTime = futureDate.AddDays(1),
                    EndTime = futureDate.AddDays(1).AddHours(2),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    TicketType = TicketType.Free,
                    TotalTickets = 50,
                    SoldQuantity = 0,
                    LocationName = "Location 2",
                    Publish = true,
                    CreatedAt = DateTime.Now.AddMinutes(-1),
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> { new TicketDetail { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 1);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.TotalItems.Should().Be(2);
            result.Value.PageSize.Should().Be(1);
        }

        #endregion

        #region GetEventByIdAsync Tests

        [Fact]
        public async Task UTCID01_GetEventByIdAsync_WithValidExistingEventId_ShouldReturnSuccess()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };

            var events = new List<Event>
            {
                new Event
                {
                    Id = eventId,
                    Title = "Test Event",
                    Description = "Test Description",
                    StartTime = DateTime.Now.AddDays(5),
                    EndTime = DateTime.Now.AddDays(5).AddHours(3),
                    RequireApproval = ConfirmStatus.Approve,
                    DeletedAt = null,
                    EventCategoryId = eventCategory.Id,
                    EventCategory = eventCategory,
                    OrganizerProfileId = Guid.NewGuid(),
                    TicketType = TicketType.Free,
                    TotalTickets = 100,
                    SoldQuantity = 20,
                    LocationName = "Test Location",
                    City = "HCM",
                    Publish = true,
                    CreatedAt = DateTime.Now,
                    ImgListEvent = JsonSerializer.Serialize(new List<string> { "image1.jpg", "image2.jpg" }),
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>(),
                    TicketDetails = new List<TicketDetail> 
                    { 
                        new TicketDetail { TicketName = "Standard", TicketQuantity = 100, TicketPrice = 0 } 
                    }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            _mockMapper.Setup(x => x.ConfigurationProvider)
                .Returns(new MapperConfiguration(cfg => 
                {
                    cfg.CreateMap<Event, EventDetailResponse>()
                        .ForMember(dest => dest.EventId, opt => opt.MapFrom(src => src.Id))
                        .ForMember(dest => dest.OrganizerEvent, opt => opt.MapFrom(src => src.OrganizerProfile))
                        .ForMember(dest => dest.ImgListEvent, 
                            opt => opt.MapFrom(
                                src => string.IsNullOrEmpty(src.ImgListEvent)
                                    ? new List<string>()
                                    : JsonSerializer.Deserialize<List<string>>(src.ImgListEvent, new JsonSerializerOptions())));
                    cfg.CreateMap<OrganizerProfile, OrganizerEventResponse>();
                    cfg.CreateMap<EventCategory, EventCategoryResponse>()
                        .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom(src => src.Id))
                        .ForMember(dest => dest.EventCategoryName, opt => opt.MapFrom(src => src.CategoryName));
                    cfg.CreateMap<EventTag, TagResponse>();
                    cfg.CreateMap<TicketDetail, TicketDetailResponse>();
                }));

            // Act
            var result = await _eventService.GetEventByIdAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.EventId.Should().Be(eventId);
        }

        [Fact]
        public async Task UTCID02_GetEventByIdAsync_WithNonExistentEventId_ShouldReturnFailure()
        {
            // Arrange
            var nonExistentEventId = Guid.NewGuid();
            var events = new List<Event>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            _mockMapper.Setup(x => x.ConfigurationProvider)
                .Returns(new MapperConfiguration(cfg => 
                {
                    cfg.CreateMap<Event, EventDetailResponse>()
                        .ForMember(dest => dest.EventId, opt => opt.MapFrom(src => src.Id))
                        .ForMember(dest => dest.OrganizerEvent, opt => opt.MapFrom(src => src.OrganizerProfile))
                        .ForMember(dest => dest.ImgListEvent, 
                            opt => opt.MapFrom(
                                src => string.IsNullOrEmpty(src.ImgListEvent)
                                    ? new List<string>()
                                    : JsonSerializer.Deserialize<List<string>>(src.ImgListEvent, new JsonSerializerOptions())));
                    cfg.CreateMap<OrganizerProfile, OrganizerEventResponse>();
                    cfg.CreateMap<EventCategory, EventCategoryResponse>()
                        .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom(src => src.Id))
                        .ForMember(dest => dest.EventCategoryName, opt => opt.MapFrom(src => src.CategoryName));
                    cfg.CreateMap<EventTag, TagResponse>();
                    cfg.CreateMap<TicketDetail, TicketDetailResponse>();
                }));

            // Act
            var result = await _eventService.GetEventByIdAsync(nonExistentEventId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Event not found");
            result.Error!.StatusCode.Should().Contain(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID03_GetEventByIdAsync_WithEmptyGuid_ShouldReturnFailure()
        {
            // Arrange
            var emptyGuid = Guid.Empty;
            var events = new List<Event>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            _mockMapper.Setup(x => x.ConfigurationProvider)
                .Returns(new MapperConfiguration(cfg => 
                {
                    cfg.CreateMap<Event, EventDetailResponse>()
                        .ForMember(dest => dest.EventId, opt => opt.MapFrom(src => src.Id))
                        .ForMember(dest => dest.OrganizerEvent, opt => opt.MapFrom(src => src.OrganizerProfile))
                        .ForMember(dest => dest.ImgListEvent, 
                            opt => opt.MapFrom(
                                src => string.IsNullOrEmpty(src.ImgListEvent)
                                    ? new List<string>()
                                    : JsonSerializer.Deserialize<List<string>>(src.ImgListEvent, new JsonSerializerOptions())));
                    cfg.CreateMap<OrganizerProfile, OrganizerEventResponse>();
                    cfg.CreateMap<EventCategory, EventCategoryResponse>()
                        .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom(src => src.Id))
                        .ForMember(dest => dest.EventCategoryName, opt => opt.MapFrom(src => src.CategoryName));
                    cfg.CreateMap<EventTag, TagResponse>();
                    cfg.CreateMap<TicketDetail, TicketDetailResponse>();
                }));

            // Act
            var result = await _eventService.GetEventByIdAsync(emptyGuid);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
        }
        #endregion

        #region DeleteEventAsync Tests

        [Fact]
        public async Task UTCID01_DeleteEventAsync_WithValidExistingEventId_ShouldReturnSuccess()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(3),
                OrganizerProfileId = Guid.NewGuid(),
                EventCategoryId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                DeletedAt = null, // Not deleted
                CreatedAt = DateTime.Now
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true))
                .ReturnsAsync(existingEvent);

            _mockUnitOfWork.Setup(x => x.EventRepository.DeleteAsync(existingEvent))
                .Returns(Task.CompletedTask);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _eventService.DeleteEventAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.DeleteAsync(existingEvent), Times.Once);
        }

        [Fact]
        public async Task UTCID02_DeleteEventAsync_WithEmptyGuid_ShouldReturnFailure()
        {
            // Arrange
            var emptyGuid = Guid.Empty;

            // Act
            var result = await _eventService.DeleteEventAsync(emptyGuid);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task UTCID03_DeleteEventAsync_WithNonExistentEventId_ShouldReturnFailure()
        {
            // Arrange
            var nonExistentEventId = Guid.NewGuid();

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(nonExistentEventId, true))
                .ReturnsAsync((Event?)null);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _eventService.DeleteEventAsync(nonExistentEventId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Event not found or inactive");
            result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(nonExistentEventId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()), Times.Never);
        }

        [Fact]
        public async Task UTCID04_DeleteEventAsync_WithAlreadyDeletedEvent_ShouldReturnFailure()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var deletedEvent = new Event
            {
                Id = eventId,
                Title = "Deleted Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(3),
                OrganizerProfileId = Guid.NewGuid(),
                EventCategoryId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                DeletedAt = DateTime.Now.AddDays(-1), // Already deleted
                CreatedAt = DateTime.Now.AddDays(-10)
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true))
                .ReturnsAsync(deletedEvent);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _eventService.DeleteEventAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Event not found or inactive");
            result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()), Times.Never);
        }

        #endregion

        #region GetRelatedEventAsync Tests

        [Fact]
        public async Task UTCID01_GetRelatedEventAsync_WithValidEventIdAndSameCategory_ShouldReturnRelatedEvents()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var categoryId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);
            var eventCategory = new EventCategory { Id = categoryId, CategoryName = "Music" };

            // Target event
            var targetEvent = new Event
            {
                Id = eventId,
                Title = "Target Event",
                Description = "Target Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = categoryId,
                EventCategory = eventCategory,
                City = "Hanoi",
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>()
            };

            // Related event with same category
            var relatedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Related Event",
                Description = "Related Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = categoryId,
                EventCategory = eventCategory,
                City = "HCM",
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Paid,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>(),
                TicketDetails = new List<TicketDetail>
                {
                    new TicketDetail { TicketName = "Standard", TicketQuantity = 50, TicketPrice = 100 }
                }
            };

            var allEvents = new List<Event> { targetEvent, relatedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents.Object);

            // Act
            var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().EventId.Should().Be(relatedEvent.Id);
            result.Value.Items.First().Title.Should().Be("Related Event");
        }

        [Fact]
        public async Task UTCID02_GetRelatedEventAsync_WithValidEventIdAndSameTags_ShouldReturnRelatedEvents()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var tagId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);
            var tag = new Tag { Id = tagId, NameTag = "Rock" };

            // Target event with tag
            var targetEvent = new Event
            {
                Id = eventId,
                Title = "Target Event",
                Description = "Target Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                City = "Hanoi",
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>
                {
                    new EventTag { TagId = tagId, Tag = tag }
                }
            };

            // Related event with same tag
            var relatedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Related Event By Tag",
                Description = "Related Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                City = "HCM",
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Paid,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>
                {
                    new EventTag { TagId = tagId, Tag = tag }
                },
                TicketDetails = new List<TicketDetail>
                {
                    new TicketDetail { TicketName = "VIP", TicketQuantity = 50, TicketPrice = 200 }
                }
            };

            var allEvents = new List<Event> { targetEvent, relatedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents.Object);

            // Act
            var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().EventId.Should().Be(relatedEvent.Id);
            result.Value.Items.First().Title.Should().Be("Related Event By Tag");
        }

        [Fact]
        public async Task UTCID03_GetRelatedEventAsync_WithValidEventIdAndSameCity_ShouldReturnRelatedEvents()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);

            // Target event
            var targetEvent = new Event
            {
                Id = eventId,
                Title = "Target Event",
                Description = "Target Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                City = "Hanoi",
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>()
            };

            // Related event with same city
            var relatedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Related Event By City",
                Description = "Related Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                City = "Hanoi", // Same city
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Paid,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>(),
                TicketDetails = new List<TicketDetail>
                {
                    new TicketDetail { TicketName = "Standard", TicketQuantity = 50, TicketPrice = 50 }
                }
            };

            var allEvents = new List<Event> { targetEvent, relatedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents.Object);

            // Act
            var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().EventId.Should().Be(relatedEvent.Id);
            result.Value.Items.First().Title.Should().Be("Related Event By City");
        }

        [Fact]
        public async Task UTCID04_GetRelatedEventAsync_WithNoRelatedEvents_ShouldReturnAllOtherEvents()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);

            // Target event with specific attributes
            var targetEvent = new Event
            {
                Id = eventId,
                Title = "Target Event",
                Description = "Target Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                City = "Hanoi",
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>()
            };

            // Unrelated event (different category, city, no common tags)
            var unrelatedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Unrelated Event",
                Description = "Unrelated Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = Guid.NewGuid(), // Different category
                City = "HCM", // Different city
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Paid,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>(), // No common tags
                TicketDetails = new List<TicketDetail>()
            };

            var allEvents = new List<Event> { targetEvent, unrelatedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents.Object);

            // Act
            var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1); // Should still return the unrelated event
            result.Value.Items.First().EventId.Should().Be(unrelatedEvent.Id);
        }

        [Fact]
        public async Task UTCID05_GetRelatedEventAsync_WithNonExistentEventId_ShouldReturnAllEvents()
        {
            // Arrange
            var nonExistentEventId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);

            var event1 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 1",
                Description = "Description 1",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location 1",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>(),
                TicketDetails = new List<TicketDetail>()
            };

            var event2 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 2",
                Description = "Description 2",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Paid,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>(),
                TicketDetails = new List<TicketDetail>()
            };

            var allEvents = new List<Event> { event1, event2 }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents.Object);

            // Act
            var result = await _eventService.GetRelatedEventAsync(nonExistentEventId, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2); // Should return all events
            result.Value.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task UTCID06_GetRelatedEventAsync_ShouldExcludePastEvents()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);
            var pastDate = DateTime.Now.AddDays(-10);

            var targetEvent = new Event
            {
                Id = eventId,
                Title = "Target Event",
                Description = "Target Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>()
            };

            var pastEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Past Event",
                Description = "Past Description",
                StartTime = pastDate, // Past event
                EndTime = pastDate.AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location 2",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>(),
                TicketDetails = new List<TicketDetail>()
            };

            var allEvents = new List<Event> { targetEvent, pastEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents.Object);

            // Act
            var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty(); // Past event should be excluded
        }

        [Fact]
        public async Task UTCID07_GetRelatedEventAsync_ShouldExcludeDeletedEvents()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);

            var targetEvent = new Event
            {
                Id = eventId,
                Title = "Target Event",
                Description = "Target Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>()
            };

            var deletedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Deleted Event",
                Description = "Deleted Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = DateTime.Now, // Deleted
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location 2",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>(),
                TicketDetails = new List<TicketDetail>()
            };

            var allEvents = new List<Event> { targetEvent, deletedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents.Object);

            // Act
            var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty(); // Deleted event should be excluded
        }

        [Fact]
        public async Task UTCID08_GetRelatedEventAsync_ShouldExcludeUnapprovedEvents()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var futureDate = DateTime.Now.AddDays(10);

            var targetEvent = new Event
            {
                Id = eventId,
                Title = "Target Event",
                Description = "Target Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                RequireApproval = ConfirmStatus.Approve,
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>()
            };

            var unapprovedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Unapproved Event",
                Description = "Unapproved Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = Guid.NewGuid(),
                RequireApproval = ConfirmStatus.NeedConfirm, // Not approved
                DeletedAt = null,
                OrganizerProfileId = Guid.NewGuid(),
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location 2",
                Publish = true,
                CreatedAt = DateTime.Now,
                EventTags = new List<EventTag>(),
                TicketDetails = new List<TicketDetail>()
            };

            var allEvents = new List<Event> { targetEvent, unapprovedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents.Object);

            // Act
            var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty(); // Unapproved event should be excluded
        }

        [Fact]
        public async Task UTCID09_GetRelatedEventAsync_WithNullEventId_Fail()
        {
            // Arrange
            var eventId = Guid.Empty;

            // Act
            var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

            // Assert
            result.Value.Should().BeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        #endregion

        #region GetAllEventDraftAsync Tests

        [Fact]
        public async Task UTCID01_GetAllEventDraftAsync_WithValidOrganizerIdAndDraftEvents_ShouldReturnSuccess()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var draftEvent1 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Draft Event 1",
                Description = "Description 1",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = false, // Draft
                IsDeleted = false,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location 1",
                CreatedAt = DateTime.Now.AddDays(-2),
                ImgListEvent = JsonSerializer.Serialize(new List<string> { "image1.jpg" })
            };

            var draftEvent2 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Draft Event 2",
                Description = "Description 2",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = false, // Draft
                IsDeleted = false,
                TicketType = TicketType.Paid,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { draftEvent1, draftEvent2 }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventDraftAsync(organizerId, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value.TotalItems.Should().Be(2);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(10);
        }

        [Fact]
        public async Task UTCID02_GetAllEventDraftAsync_WithEmptyOrganizerId_ShouldReturnFailure()
        {
            // Arrange
            var emptyOrganizerId = Guid.Empty;

            // Act
            var result = await _eventService.GetAllEventDraftAsync(emptyOrganizerId, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found organizer");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task UTCID03_GetAllEventDraftAsync_WithValidOrganizerIdButNoDraftEvents_ShouldReturnEmptyList()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var events = new List<Event>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventDraftAsync(organizerId, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty();
            result.Value.TotalItems.Should().Be(0);
        }

        [Fact]
        public async Task UTCID04_GetAllEventDraftAsync_ShouldExcludePublishedEvents()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var draftEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Draft Event",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = false, // Draft
                IsDeleted = false,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var publishedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Published Event",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = true, // Published - should be excluded
                IsDeleted = false,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { draftEvent, publishedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventDraftAsync(organizerId, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Draft Event");
        }

        [Fact]
        public async Task UTCID05_GetAllEventDraftAsync_ShouldExcludeDeletedEvents()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var draftEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Draft Event",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = false, // Draft
                IsDeleted = false,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var deletedDraftEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Deleted Draft Event",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = false, // Draft
                IsDeleted = true, // Deleted - should be excluded
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { draftEvent, deletedDraftEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventDraftAsync(organizerId, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Draft Event");
        }

        [Fact]
        public async Task UTCID06_GetAllEventDraftAsync_ShouldReturnOnlyEventsForSpecificOrganizer()
        {
            // Arrange
            var organizerId1 = Guid.NewGuid();
            var organizerId2 = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var draftEventOrganizer1 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Draft Event Organizer 1",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId1, // Organizer 1
                Publish = false,
                IsDeleted = false,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var draftEventOrganizer2 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Draft Event Organizer 2",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId2, // Organizer 2 - should be excluded
                Publish = false,
                IsDeleted = false,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { draftEventOrganizer1, draftEventOrganizer2 }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventDraftAsync(organizerId1, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Draft Event Organizer 1");
        }

       
        #endregion

        #region GetAllEventStatusAsync Tests

        [Fact]
        public async Task UTCID01_GetAllEventStatusAsync_WithDefaultNeedConfirmStatus_ShouldReturnNeedConfirmEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var needConfirmEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Need Confirm Event",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.NeedConfirm,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var approvedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Approved Event",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve, // Should be excluded
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { needConfirmEvent, approvedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, ConfirmStatus.NeedConfirm, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Need Confirm Event");
        }

        [Fact]
        public async Task UTCID02_GetAllEventStatusAsync_WithApproveStatus_ShouldReturnApprovedEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var approvedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Approved Event",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var needConfirmEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Need Confirm Event",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.NeedConfirm, // Should be excluded
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { approvedEvent, needConfirmEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Approved Event");
        }

        [Fact]
        public async Task UTCID03_GetAllEventStatusAsync_WithRejectStatus_ShouldReturnRejectedEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var rejectedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Rejected Event",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Reject,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var approvedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Approved Event",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve, // Should be excluded
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { rejectedEvent, approvedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, ConfirmStatus.Reject, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Rejected Event");
        }

        [Fact]
        public async Task UTCID04_GetAllEventStatusAsync_WithValidOrganizerId_ShouldReturnOrganizerEvents()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var organizerEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Organizer Event",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var otherEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Other Event",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(), // Different organizer
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { organizerEvent, otherEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(organizerId, null, ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Organizer Event");
        }

        [Fact]
        public async Task UTCID05_GetAllEventStatusAsync_WithEmptyOrganizerId_ShouldReturnAllEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var event1 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 1",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var event2 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 2",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { event1, event2 }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
        }

        [Fact]
        public async Task UTCID06_GetAllEventStatusAsync_WithSearchInTitle_ShouldReturnMatchingEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var matchingEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Rock Concert", // Contains "rock"
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var nonMatchingEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Jazz Festival",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "rock", ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Rock Concert");
        }

        [Fact]
        public async Task UTCID07_GetAllEventStatusAsync_WithSearchInAddress_ShouldReturnMatchingEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var matchingEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 1",
                Description = "Description",
                Address = "Ho Chi Minh City", // Contains "minh"
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var nonMatchingEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 2",
                Description = "Description",
                Address = "Hanoi",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "minh", ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Event 1");
        }

        [Fact]
        public async Task UTCID08_GetAllEventStatusAsync_WithSearchInDescription_ShouldReturnMatchingEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var matchingEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 1",
                Description = "Amazing music festival", // Contains "music"
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var nonMatchingEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 2",
                Description = "Sports event",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "music", ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Event 1");
        }

        [Fact]
        public async Task UTCID09_GetAllEventStatusAsync_WithEmptySearch_ShouldReturnAllMatchingStatusEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var event1 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 1",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var event2 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event 2",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { event1, event2 }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "", ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
        }

        [Fact]
        public async Task UTCID10_GetAllEventStatusAsync_ShouldExcludeUnpublishedEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var publishedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Published Event",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var unpublishedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Unpublished Event",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = false, // Unpublished - should be excluded
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { publishedEvent, unpublishedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Published Event");
        }

        [Fact]
        public async Task UTCID11_GetAllEventStatusAsync_ShouldExcludeDeletedEvents()
        {
            // Arrange
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var activeEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Active Event",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var deletedEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Deleted Event",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(),
                Publish = true,
                IsDeleted = true, // Deleted - should be excluded
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var events = new List<Event> { activeEvent, deletedEvent }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Active Event");
        }

        [Fact]
        public async Task UTCID12_GetAllEventStatusAsync_WithMultipleFilters_ShouldReturnCorrectEvents()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
            var futureDate = DateTime.Now.AddDays(10);

            var matchingEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Rock Concert",
                Description = "Description",
                StartTime = futureDate,
                EndTime = futureDate.AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 100,
                SoldQuantity = 0,
                LocationName = "Location",
                CreatedAt = DateTime.Now
            };

            var nonMatchingEvent1 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Rock Festival",
                Description = "Description",
                StartTime = futureDate.AddDays(1),
                EndTime = futureDate.AddDays(1).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = Guid.NewGuid(), // Different organizer
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve,
                TicketType = TicketType.Free,
                TotalTickets = 50,
                SoldQuantity = 0,
                LocationName = "Location 2",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var nonMatchingEvent2 = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Jazz Concert",
                Description = "Description",
                StartTime = futureDate.AddDays(2),
                EndTime = futureDate.AddDays(2).AddHours(2),
                EventCategoryId = eventCategory.Id,
                EventCategory = eventCategory,
                OrganizerProfileId = organizerId,
                Publish = true,
                IsDeleted = false,
                RequireApproval = ConfirmStatus.Approve, // Same organizer but different title
                TicketType = TicketType.Free,
                TotalTickets = 75,
                SoldQuantity = 0,
                LocationName = "Location 3",
                CreatedAt = DateTime.Now.AddDays(-2)
            };

            var events = new List<Event> { matchingEvent, nonMatchingEvent1, nonMatchingEvent2 }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventService.GetAllEventStatusAsync(organizerId, "rock", ConfirmStatus.Approve, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Rock Concert");
        }

        #endregion

        #region ConfirmEventAsync
        private static Event CreateEventNeedConfirm(Guid id)
        {
            return new Event
            {
                Id = id,
                OrganizerProfileId = Guid.NewGuid(),
                EventCategoryId = Guid.NewGuid(),
                Title = "Title",
                Description = "Desc",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                TotalTickets = 10,
                RemainingTickets = 10,
                TicketType = TicketType.Free,
                RequireApproval = ConfirmStatus.NeedConfirm,
                IsDeleted = false
            };
        }

        private static Event CreateEventProcessed(Guid id, ConfirmStatus? status)
        {
            var e = CreateEventNeedConfirm(id);
            e.RequireApproval = status; // Approve/Reject/null represent already processed partition
            return e;
        }

        [Fact]
        public async Task UTCID01_ConfirmEventAsync_WithEmptyUserId_ShouldReturnInvalidInput()
        {
            // Act
            var result = await _eventService.ConfirmEventAsync(Guid.Empty, Guid.NewGuid(), new ConfirmRequest { Status = ConfirmStatus.Approve });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID02_ConfirmEventAsync_WithEmptyEventId_ShouldReturnInvalidInput()
        {
            // Act
            var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), Guid.Empty, new ConfirmRequest { Status = ConfirmStatus.Approve });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID03_ConfirmEventAsync_WithNullRequest_ShouldReturnInvalidInput()
        {
            // Act
            var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), Guid.NewGuid(), null!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Request cannot be null");
        }

        [Fact]
        public async Task UTCID04_ConfirmEventAsync_EventNotFound_ShouldReturnNotFound()
        {
            // Arrange
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), Guid.NewGuid(), new ConfirmRequest { Status = ConfirmStatus.Approve });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Event can not found or is deleted");
        }

        [Fact]
        public async Task UTCID05_ConfirmEventAsync_AlreadyProcessed_ShouldReturnInvalidInput()
        {
            // Arrange: RequireApproval != NeedConfirm (Approve here)
            var evt = CreateEventProcessed(Guid.NewGuid(), ConfirmStatus.Approve);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), evt.Id, new ConfirmRequest { Status = ConfirmStatus.Approve });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Event has already been processed");
        }

        [Fact]
        public async Task UTCID06_ConfirmEventAsync_RejectWithoutReason_ShouldReturnInvalidInput()
        {
            // Arrange: entity in NeedConfirm
            var evt = CreateEventNeedConfirm(Guid.NewGuid());
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), evt.Id, new ConfirmRequest { Status = ConfirmStatus.Reject, Reason = "   " });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Reason is required when rejecting");
        }

        [Fact]
        public async Task UTCID07_ConfirmEventAsync_RejectWithReason_ShouldUpdateAndReturnSuccess()
        {
            // Arrange
            var evt = CreateEventNeedConfirm(Guid.NewGuid());
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
                .ReturnsAsync((Event e) => e);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var userId = Guid.NewGuid();
            var request = new ConfirmRequest { Status = ConfirmStatus.Reject, Reason = " invalid info  " };

            // Act
            var result = await _eventService.ConfirmEventAsync(userId, evt.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e =>
                e.Id == evt.Id &&
                e.RequireApproval == ConfirmStatus.Reject &&
                e.ReasonReject == "invalid info" &&
                e.RequireApprovalBy == userId &&
                e.RequireApprovalAt.HasValue
            )), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID08_ConfirmEventAsync_Approve_ShouldUpdateAndReturnSuccess()
        {
            // Arrange
            var evt = CreateEventNeedConfirm(Guid.NewGuid());
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
                .ReturnsAsync((Event e) => e);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var userId = Guid.NewGuid();
            var request = new ConfirmRequest { Status = ConfirmStatus.Approve };

            // Act
            var result = await _eventService.ConfirmEventAsync(userId, evt.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e =>
                e.Id == evt.Id &&
                e.RequireApproval == ConfirmStatus.Approve &&
                e.RequireApprovalBy == userId &&
                e.RequireApprovalAt.HasValue
            )), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID09_ConfirmEventAsync_DeletedEvent_ShouldReturnNotFound()
        {
            // Arrange
            var evt = CreateEventNeedConfirm(Guid.NewGuid());
            evt.IsDeleted = true;
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), evt.Id, new ConfirmRequest { Status = ConfirmStatus.Approve });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Event can not found or is deleted");
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID10_ConfirmEventAsync_AlreadyProcessedReject_ShouldReturnInvalidInput()
        {
            // Arrange
            var evt = CreateEventProcessed(Guid.NewGuid(), ConfirmStatus.Reject);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), evt.Id, new ConfirmRequest { Status = ConfirmStatus.Approve });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Event has already been processed");
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }


        #endregion
    }
}
