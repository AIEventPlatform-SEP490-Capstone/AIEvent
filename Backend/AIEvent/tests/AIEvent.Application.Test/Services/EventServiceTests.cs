using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
   public class EventServiceTests
   {
       // Test constants
       private static readonly Guid TestOrganizerId = new Guid("22222222-2222-2222-2222-222222222222");
       private static readonly Guid TestEventCategoryId = new Guid("22222222-2222-2222-2222-222222222233");
       private static readonly Guid TestEventId = new Guid("33333333-3333-3333-3333-333333333333");

       private readonly Mock<IUnitOfWork> _mockUnitOfWork;
       private readonly Mock<IPayOSService> _mockpayOSService;
       private readonly Mock<ITransactionHelper> _mockTransactionHelper;
       private readonly Mock<IMapper> _mockMapper;
       private readonly Mock<IHangfireJobService> _mockHangfireJobService;
       private readonly Mock<INotificationService> _mockNotificationService;
       private readonly Mock<ILogger<EventService>> _mockLogger;
       private readonly IEventService _eventService;
       private readonly Mock<IPineconeVectorService> _mockPineconeVectorService;

        public EventServiceTests()
       {
           _mockUnitOfWork = new Mock<IUnitOfWork>();
           _mockTransactionHelper = new Mock<ITransactionHelper>();
           _mockMapper = new Mock<IMapper>();
           _mockHangfireJobService = new Mock<IHangfireJobService>();
           _mockNotificationService = new Mock<INotificationService>();
            _mockPineconeVectorService = new Mock<IPineconeVectorService>();
           _mockpayOSService = new Mock<IPayOSService>();
           _mockLogger = new Mock<ILogger<EventService>>();

            _eventService = new EventService(
               _mockUnitOfWork.Object,
               _mockTransactionHelper.Object,
               _mockMapper.Object,
               _mockHangfireJobService.Object,
               _mockNotificationService.Object,
               _mockpayOSService.Object,
               _mockLogger.Object,
               _mockPineconeVectorService.Object);
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
           var organizerId = TestOrganizerId;

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               Status = EventStatus.PendingApproval,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 100
                   }
               }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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
               EndTime = createEventRequest.EndTime,
               TicketTypes = createEventRequest.TicketTypes.Select(tt => new TicketType
               {
                   TicketName = tt.TicketName,
                   TicketPrice = tt.TicketPrice,
                   TicketQuantity = tt.TicketQuantity
               }).ToList()
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
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
           _mockMapper.Verify(x => x.Map<Event>(createEventRequest), Times.Once);
           _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Once);
       }

       // UTCID02: organizerId is Guid.Empty - Failure
       [Fact]
       public async Task UTCID02_CreateEventAsync_WithEmptyOrganizerId_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.Empty;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" }
           };

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Invalid OrganizerId");
           result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
           _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
       }

       // UTCID03: Null request - Failure
       [Fact]
       public async Task UTCID03_CreateEventAsync_WithNullRequest_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
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
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = null!,
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId
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
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = null!,
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId
           };

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Description is required");
           result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID06: Invalid TicketType in list - Failure
       [Fact]
       public async Task UTCID06_CreateEventAsync_WithInvalidTicketType_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = null!, // Invalid
                       TicketPrice = 10000,
                       TicketQuantity = 100
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

       // UTCID07: EndTime before StartTime - Failure
       [Fact]
       public async Task UTCID07_CreateEventAsync_WithEndTimeBeforeStartTime_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(4), // Before StartTime
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(3),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
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

       // UTCID08: SaleEndTime before SaleStartTime - Failure
       [Fact]
       public async Task UTCID08_CreateEventAsync_WithSaleEndTimeBeforeSaleStartTime_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(3),
               SaleEndTime = DateTime.UtcNow.AddDays(2),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
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

       // UTCID09: SaleEndTime after StartTime - Failure
       [Fact]
       public async Task UTCID09_CreateEventAsync_WithSaleEndTimeAfterStartTime_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(6), // After StartTime
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
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

       // UTCID10: Organizer not found (null) - Failure
       [Fact]
       public async Task UTCID10_CreateEventAsync_WithNonExistentOrganizer_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
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

       // UTCID11: Organizer status is Reject - Failure
       [Fact]
       public async Task UTCID11_CreateEventAsync_WithRejectedOrganizer_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
               }
           }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Rejected, // Rejected
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

       // UTCID12: Organizer status is PendingApproval - Failure
       [Fact]
       public async Task UTCID12_CreateEventAsync_WithPendingOrganizer_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
               }
           }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Pending, // Pending
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

       // UTCID13: Mapping fails (returns null) - Failure
       [Fact]
       public async Task UTCID13_CreateEventAsync_WithMappingFailure_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
               }
           }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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

       // UTCID14: With images - Success
       [Fact]
       public async Task UTCID14_CreateEventAsync_WithImages_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test1.jpg", "https://cloudinary.com/test2.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
               }
           }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Once);
       }

       // UTCID15: Boundary - SaleEndTime equals SaleStartTime - Success
       [Fact]
       public async Task UTCID15_CreateEventAsync_WithSaleEndTimeEqualsSaleStartTime_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var saleTime = DateTime.UtcNow.AddDays(3);

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = saleTime,
               SaleEndTime = saleTime, // Same as SaleStartTime (boundary)
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 10000,
                   TicketQuantity = 100
               }
           }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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
           result.IsSuccess.Should().BeTrue();
       }

       // UTCID16: Multiple valid ticket details - Success
       [Fact]
       public async Task UTCID16_CreateEventAsync_WithMultipleTicketTypes_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "VIP",
                       TicketPrice = 20000,
                       TicketQuantity = 20
                   },
                   new TicketTypeRequest
                   {
                       TicketName = "Regular",
                       TicketPrice = 10000,
                       TicketQuantity = 80
                   }
               }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Once);
       }

       // UTCID17: Invalid ticket price (negative) - Failure
       [Fact]
       public async Task UTCID17_CreateEventAsync_WithNegativeTicketPrice_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "VIP",
                       TicketPrice = 9999,
                       TicketQuantity = 20
                   }
               }
           };

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("TicketPrice must be greater than or equal to 10000");
           result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID18: Invalid ticket quantity (zero) - Failure
       [Fact]
       public async Task UTCID18_CreateEventAsync_WithZeroTicketQuantity_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               TotalTickets = 100,
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "VIP",
                       TicketPrice = 10000,
                       TicketQuantity = 0
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

       // UTCID19: Boundary - Ticket quantity is 1 - Success
       [Fact]
       public async Task UTCID19_CreateEventAsync_WithMinimumTicketQuantity_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 1,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Single Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 1
                   }
               }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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
           result.IsSuccess.Should().BeTrue();
       }

       // UTCID20: Empty ImgListEvent - Failure
       [Fact]
       public async Task UTCID20_CreateEventAsync_WithEmptyImgListEvent_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string>(),
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 100
                   }
               }
           };

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Please upload at least one image");
           result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       [Fact]
       public async Task UTCID21_CreateEventAsync_WithEmptyTicketTypes_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>(),

           };

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("TicketTypes is required");
           result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID22: Missing District - Failure
       [Fact]
       public async Task UTCID22_CreateEventAsync_WithMissingDistrict_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = null, // Missing District
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 100
                   }
               }
           };

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("District is required");
           result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID23: Missing Address - Failure
       [Fact]
       public async Task UTCID23_CreateEventAsync_WithMissingAddress_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "", // Missing Address
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 100
                   }
               }
           };

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Address is required");
           result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID24: Publish without evidence - Failure
       [Fact]
       public async Task UTCID24_CreateEventAsync_WithPublishButNoEvidence_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               Publish = true, // Publishing
               ImgListEvidences = null, // No evidence
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 100
                   }
               }
           };

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Evidence images are required when publishing the event");
           result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID25: Create with evidence and publish - Success
       [Fact]
       public async Task UTCID25_CreateEventAsync_WithEvidenceAndPublish_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/evidence.jpg" },
               Publish = true,
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 100
                   }
               }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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

           var managerRole = new Role
           {
               Id = Guid.NewGuid(),
               Name = "Manager",
               IsDeleted = false
           };

           _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
               .ReturnsAsync(organizer);
           _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
               .Returns(eventEntity);
           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
           _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(It.IsAny<Event>()));
           _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Role> { managerRole }.AsQueryable().BuildMockDbSet().Object);
           _mockNotificationService.Setup(x => x.CreateNotificationToAllAsync(It.IsAny<CreateNotificationToAllRequest>()))
               .ReturnsAsync(Result.Success());

           // Act
           var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Once);
           _mockNotificationService.Verify(x => x.CreateNotificationToAllAsync(It.Is<CreateNotificationToAllRequest>(
               req => req.Type == NotificationType.EventCreated &&
                      req.Title == "Yêu cầu phê duyệt sự kiện" &&
                      req.TargetRoles != null && req.TargetRoles.Any() &&
                      req.EventId == eventEntity.Id &&
                      req.ImageUrl == createEventRequest.ImgListEvent!.First())), Times.Once());
       }
        
       // UTCID26: Publish = false should not require evidence - Success
       [Fact]
       public async Task UTCID26_CreateEventAsync_WithPublishFalseNoEvidence_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               Publish = false, // Not publishing
               ImgListEvidences = null, // No evidence needed
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 100
                   }
               }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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
           result.IsSuccess.Should().BeTrue();
       }

       // UTCID27: Boundary - SaleEndTime equals StartTime - Success
       [Fact]
       public async Task UTCID27_CreateEventAsync_WithSaleEndTimeEqualsStartTime_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var startTime = DateTime.UtcNow.AddDays(5);

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = startTime,
               EndTime = startTime.AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = startTime, // Boundary: equals StartTime
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 10000,
                       TicketQuantity = 100
                   }
               }
           };

           var organizer = new OrganizerProfile
           {
               Id = organizerId,
               Status = OrganizerProfileStatus.Approved,
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
           result.IsSuccess.Should().BeTrue();
       }
       #endregion

       #region GetEventAsync Tests

       [Fact]
       public async Task UTCID01_GetEventAsync_WithNoFilters_ShouldReturnPaginatedEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Event 1",
                   Description = "Description 1",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   ImgListEvent = "image1.jpg, image2.jpg",
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType>
                   {
                       new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 }
                   }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.TotalItems.Should().Be(1);
           result.Value.CurrentPage.Should().Be(1);
           result.Value.PageSize.Should().Be(5);
           result.Value.Items.First().ImgListEvent.Should().HaveCount(2);
           result.Value.Items.First().ImgListEvent.Should().Contain("image1.jpg");
           result.Value.Items.First().ImgListEvent.Should().Contain("image2.jpg");
       }

       [Fact]
       public async Task UTCID02_GetEventAsync_WithValidUserId_ShouldShowFavoriteStatus()
       {
           // Arrange
           var userId = Guid.NewGuid();
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>
                   {
                       new FavoriteEvent { UserId = userId, EventId = eventId }
                   },
                   TicketTypes = new List<TicketType>
                   {
                       new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 50 }
                   }
               }
           }.AsQueryable().BuildMockDbSet();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

           // Act
           var result = await _eventService.GetEventAsync(userId, null, null, null, null!, null, null, null, null, null, null, 1, 5);

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
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Event 1",
                   Description = "Description 1",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType>
                   {
                       new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 }
                   }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(userId, null, null, null!, null, null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().IsFavorite.Should().BeFalse();
       }

       [Fact]
       public async Task UTCID04_GetEventAsync_WithSearchTitleCaseInsensitive_ShouldReturnMatchingEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Music Concert",
                   Description = "Description 1",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Art Exhibition",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, "music", null, null!, null, null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Contain("Music");
       }

       [Fact]
       public async Task UTCID05_GetEventAsync_WithEventCategoryId_ShouldReturnFilteredEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var categoryId1 = TestEventCategoryId;
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = categoryId1,
                   EventCategory = eventCategory1,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Art Event",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = categoryId2,
                   EventCategory = eventCategory2,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, categoryId1.ToString(), null!, null, null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().EventCategoryName.Should().Be("Music");
       }

       [Fact]
       public async Task UTCID06_GetEventAsync_WithSingleTag_ShouldReturnFilteredEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var tagId1 = Guid.NewGuid();
           var tagId2 = Guid.NewGuid();
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>
                   {
                       new EventTag { TagId = tagId1, Tag = tag1 }
                   },
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Jazz Event",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>
                   {
                       new EventTag { TagId = tagId2, Tag = tag2 }
                   },
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           var tagRequest = new List<EventTagRequest> { new EventTagRequest { TagId = tagId1 } };

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, tagRequest, null, null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Rock Event");
       }

       [Fact]
       public async Task UTCID07_GetEventAsync_WithMultipleTags_ShouldReturnFilteredEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var tagId1 = Guid.NewGuid();
           var tagId2 = Guid.NewGuid();
           var tagId3 = Guid.NewGuid();
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>
                   {
                       new EventTag { TagId = tagId1, Tag = tag1 }
                   },
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Jazz Event",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>
                   {
                       new EventTag { TagId = tagId2, Tag = tag2 }
                   },
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Pop Event",
                   Description = "Description 3",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 75,
                   SoldQuantity = 0,
                   LocationName = "Location 3",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>
                   {
                       new EventTag { TagId = tagId3, Tag = tag3 }
                   },
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           var tagRequest = new List<EventTagRequest>
           {
               new EventTagRequest { TagId = tagId1 },
               new EventTagRequest { TagId = tagId2 }
           };

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, tagRequest, null, null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(2);
       }

       [Fact]
       public async Task UTCID08_GetEventAsync_WithDistrictFilterCaseInsensitive_ShouldReturnFilteredEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Event in HCM",
                   Description = "Description 1",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   District = "Quận 2",
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Event in Hanoi",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                    District = "Quan 1",
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, "Quan 1", null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Event in Hanoi");
       }

       [Fact]
       public async Task UTCID09_GetEventAsync_WithTimeLineToday_ShouldReturnTodayEvents()
       {
           // Arrange
           var today = DateTime.Today;
           var tomorrow = today.AddDays(1);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Today Event",
                   Description = "Description 1",
                   StartTime = DateTime.UtcNow.AddHours(1),
                   EndTime = DateTime.UtcNow.AddHours(3),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Tomorrow Event",
                   Description = "Description 2",
                   StartTime = tomorrow.AddHours(10),
                   EndTime = tomorrow.AddHours(12),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, TimeLine.Today, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Today Event");
       }

       [Fact]
       public async Task UTCID10_GetEventAsync_WithTimeLineTomorrow_ShouldReturnTomorrowEvents()
       {
           // Arrange
           var today = DateTime.Today;
           var tomorrow = today.AddDays(1);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Today Event",
                   Description = "Description 1",
                   StartTime = today.AddHours(20),
                   EndTime = today.AddHours(22),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Tomorrow Event",
                   Description = "Description 2",
                   StartTime = tomorrow.AddHours(10),
                   EndTime = tomorrow.AddHours(12),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, TimeLine.Tomorrow, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Tomorrow Event");
       }

       [Fact]
       public async Task UTCID11_GetEventAsync_WithTimeLineThisWeek_ShouldReturnThisWeekEvents()
       {
           // Arrange
           var now = DateTime.UtcNow;
           var today = now.Date;
           var diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
           var startOfWeek = today.AddDays(-diff);
           var endOfWeek = startOfWeek.AddDays(7).AddTicks(-1);
           // Event in the future within this week
           var eventInWeek = now.AddSeconds(1);
           var eventOutsideWeek = endOfWeek.AddDays(2);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "This Week Event",
                   Description = "Description 1",
                   StartTime = eventInWeek,
                   EndTime = eventInWeek.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Next Week Event",
                   Description = "Description 2",
                   StartTime = eventOutsideWeek,
                   EndTime = eventOutsideWeek.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, TimeLine.ThisWeek, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("This Week Event");
       }

       [Fact]
       public async Task UTCID12_GetEventAsync_WithTimeLineThisMonth_ShouldReturnThisMonthEvents()
       {
           // Arrange
           var today = DateTime.Today;
           var thisMonth = today.AddHours(10);
           var nextMonth = today.AddMonths(1);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "This Month Event",
                   Description = "Description 1",
                   StartTime = thisMonth.AddHours(14),
                   EndTime = thisMonth.AddHours(16),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Next Month Event",
                   Description = "Description 2",
                   StartTime = nextMonth.AddHours(10),
                   EndTime = nextMonth.AddHours(12),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, TimeLine.ThisMonth, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("This Month Event");
       }

       [Fact]
       public async Task UTCID13_GetEventAsync_WithPastEvents_ShouldNotReturnPastEvents()
       {
           // Arrange
           var pastDate = DateTime.UtcNow.AddDays(-10);
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Past Event",
                   Description = "Description 1",
                   StartTime = pastDate,
                   EndTime = pastDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Future Event",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Future Event");
       }

       [Fact]
       public async Task UTCID14_GetEventAsync_WithDeletedEvents_ShouldNotReturnDeletedEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Deleted Event",
                   Description = "Description 1",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = DateTime.UtcNow.AddDays(-1), // Deleted
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, null, null, null,null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(0);
       }

       [Fact]
       public async Task UTCID15_GetEventAsync_WithUnapprovedEvents_ShouldNotReturnUnapprovedEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Pending Event",
                   Description = "Description 1",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.PendingApproval, // Not approved
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Rejected Event",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Rejected, // Rejected
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Approved Event",
                   Description = "Description 3",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 75,
                   SoldQuantity = 0,
                   LocationName = "Location 3",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Approved Event");
       }

       [Fact]
       public async Task UTCID16_GetEventAsync_WithMultipleFilters_ShouldReturnCorrectlyFilteredEvents()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var categoryId = TestEventCategoryId;
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = categoryId,
                   EventCategory = eventCategory,
                   District = "Quận 2",
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag> { new EventTag { TagId = tagId, Tag = tag } },
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 100 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Rock Concert in Hanoi",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = categoryId,
                   EventCategory = eventCategory,
                   District = "Quan 1",
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   EventTags = new List<EventTag> { new EventTag { TagId = tagId, Tag = tag } },
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 50 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           var tagRequest = new List<EventTagRequest> { new EventTagRequest { TagId = tagId } };

           // Act
           var result = await _eventService.GetEventAsync(null, "rock", categoryId.ToString(), tagRequest, "Quan 1", null, null, null, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Rock Concert in Hanoi");
       }

       [Fact]
       public async Task UTCID17_GetEventAsync_WithBoundaryPaginationPageSize1_ShouldReturn1Item()
       {
           // Arrange
           var futureDate = DateTime.UtcNow.AddDays(10);
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Event 1",
                   Description = "Description 1",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow.AddMinutes(-2),
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Event 2",
                   Description = "Description 2",
                   StartTime = futureDate.AddDays(1),
                   EndTime = futureDate.AddDays(1).AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow.AddMinutes(-1),
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, null, null, null, null, 1, 1);

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
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = eventId,
                   Title = "Test Event",
                   Description = "Test Description",
                   StartTime = DateTime.UtcNow.AddDays(5),
                   EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   OrganizerProfileId = TestOrganizerId,
                   TotalTickets = 100,
                   SoldQuantity = 20,
                   LocationName = "Test Location",
                    District = "Quận 7",
                   Publish = true,
                   CreatedAt = DateTime.UtcNow,
                   ImgListEvent = "image1.jpg, image2.jpg",
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   ImgListEvidences = "imageevd1.jpg, imageevd2.jpg",
                   TicketTypes = new List<TicketType>
                   {
                       new TicketType { TicketName = "Standard", TicketQuantity = 100, TicketPrice = 0 }
                   }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                                   : src.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()))
                       .ForMember(dest => dest.ImgListEvidences,
                           opt => opt.MapFrom(
                               src => string.IsNullOrEmpty(src.ImgListEvidences)
                                   ? new List<string>()
                                   : src.ImgListEvidences.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()));
                   cfg.CreateMap<OrganizerProfile, OrganizerEventResponse>();
                   cfg.CreateMap<EventCategory, EventCategoryResponse>()
                       .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom(src => src.Id))
                       .ForMember(dest => dest.EventCategoryName, opt => opt.MapFrom(src => src.CategoryName));
                   cfg.CreateMap<EventTag, TagResponse>();
                   cfg.CreateMap<TicketType, TicketTypeResponse>();
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
           var events = new List<Event>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                                   : src.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()))
                       .ForMember(dest => dest.ImgListEvidences,
                           opt => opt.MapFrom(
                               src => string.IsNullOrEmpty(src.ImgListEvidences)
                                   ? new List<string>()
                                   : src.ImgListEvidences.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()));
                   cfg.CreateMap<OrganizerProfile, OrganizerEventResponse>();
                   cfg.CreateMap<EventCategory, EventCategoryResponse>()
                       .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom(src => src.Id))
                       .ForMember(dest => dest.EventCategoryName, opt => opt.MapFrom(src => src.CategoryName));
                   cfg.CreateMap<EventTag, TagResponse>();
                   cfg.CreateMap<TicketType, TicketTypeResponse>();
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
           var events = new List<Event>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                                   : src.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()))
                       .ForMember(dest => dest.ImgListEvidences,
                           opt => opt.MapFrom(
                               src => string.IsNullOrEmpty(src.ImgListEvidences)
                                   ? new List<string>()
                                   : src.ImgListEvidences.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()));
                   cfg.CreateMap<OrganizerProfile, OrganizerEventResponse>();
                   cfg.CreateMap<EventCategory, EventCategoryResponse>()
                       .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom(src => src.Id))
                       .ForMember(dest => dest.EventCategoryName, opt => opt.MapFrom(src => src.CategoryName));
                   cfg.CreateMap<EventTag, TagResponse>();
                   cfg.CreateMap<TicketType, TicketTypeResponse>();
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

       #region UpdateEventAsync Tests

       // UTCID01: Valid update request - Success
       [Fact]
       public async Task UTCID01_UpdateEventAsync_WithValidRequest_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest
           {
               Title = "Updated Title",
               Description = "Updated Description"
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Original Title",
               Description = "Original Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               Publish = false,
               IsDeleted = false,
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Ticket 1", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       // UTCID02: Empty organizerId - Failure
       [Fact]
       public async Task UTCID02_UpdateEventAsync_WithEmptyOrganizerId_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.Empty;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Invalid input");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
           _mockUnitOfWork.Verify(x => x.EventRepository.Query(false), Times.Never());
       }

       // UTCID03: Empty eventId - Failure
       [Fact]
       public async Task UTCID03_UpdateEventAsync_WithEmptyEventId_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.Empty;
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Invalid input");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
           _mockUnitOfWork.Verify(x => x.EventRepository.Query(false), Times.Never());
       }

       // UTCID04: Event not found - Failure
       [Fact]
       public async Task UTCID04_UpdateEventAsync_WithNonExistentEvent_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var eventQueryable = new List<Event>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event not found");
           result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
       }

       // UTCID05: Event is deleted - Failure
       [Fact]
       public async Task UTCID05_UpdateEventAsync_WithDeletedEvent_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               IsDeleted = true
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event not found");
           result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
       }

       // UTCID06: Unauthorized - Different organizer - Failure
       [Fact]
       public async Task UTCID06_UpdateEventAsync_WithDifferentOrganizer_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var differentOrganizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = differentOrganizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               IsDeleted = false,
               TicketTypes = new List<TicketType>(),
               EventTags = new List<EventTag>()
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("You don't have permission to update this event");
           result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
       }
 
       // UTCID07: Publish validation - Missing title - Failure
       [Fact]
       public async Task UTCID07_UpdateEventAsync_WithPublishAndMissingTitle_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest
           {
               Publish = true,
               Title = ""
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "",
               Description = "Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID08: Publish validation - EndTime before StartTime - Failure
       [Fact]
       public async Task UTCID08_UpdateEventAsync_WithPublishAndEndTimeBeforeStartTime_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var startTime = DateTime.UtcNow.AddDays(5);
           var endTime = DateTime.UtcNow.AddDays(3);

           var updateRequest = new UpdateEventRequest
           {
               Publish = true,
               StartTime = startTime,
               EndTime = endTime
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "Title",
               Description = "Description",
               StartTime = startTime,
               EndTime = endTime,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID09: Publish validation - SaleEndTime after event StartTime - Failure
       [Fact]
       public async Task UTCID09_UpdateEventAsync_WithPublishAndSaleEndTimeAfterStartTime_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var startTime = DateTime.UtcNow.AddDays(5);
           var saleEndTime = DateTime.UtcNow.AddDays(6);

           var updateRequest = new UpdateEventRequest
           {
               Publish = true,
               SaleEndTime = saleEndTime
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "Title",
               Description = "Description",
               StartTime = startTime,
               EndTime = startTime.AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = saleEndTime,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }


       // UTCID10: Publish validation - Missing evidence - Failure
       [Fact]
       public async Task UTCID10_UpdateEventAsync_WithPublishAndMissingEvidence_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               Publish = true
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "Title",
               Description = "Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "", // Missing evidence
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

        // UTCID11: Publish validation - Missing images - Failure
        [Fact]
       public async Task UTCID11_UpdateEventAsync_WithPublishAndNoImages_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               Publish = true
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "Title",
               Description = "Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "", // Missing images
               ImgListEvidences = "evidence1.jpg",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID12: Publish validation - No ticket details - Failure
       [Fact]
       public async Task UTCID12_UpdateEventAsync_WithPublishAndNoTicketTypes_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               Publish = true
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "Title",
               Description = "Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               TicketTypes = new List<TicketType>(),
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           
           var ticketTypeQueryable = existingEvent.TicketTypes.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.TicketTypeRepository.Query(false)).Returns(ticketTypeQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }


       // UTCID13: Publish validation - Valid data with Publish=true - Success
       [Fact]
       public async Task UTCID13_UpdateEventAsync_WithValidPublishData_ShouldSetPublishAndStatus()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               Publish = true
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "Title",
               Description = "Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), EventId = eventId, TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           
           var ticketTypeQueryable = existingEvent.TicketTypes.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.TicketTypeRepository.Query(false)).Returns(ticketTypeQueryable);
           
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns((UpdateEventRequest req, Event ev) => {
               ev.Publish = req.Publish ?? ev.Publish;
               return ev;
           });

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           var managerRole = new Role
           {
               Id = Guid.NewGuid(),
               Name = "Manager",
               IsDeleted = false
           };

           _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Role> { managerRole }.AsQueryable().BuildMockDbSet().Object);
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
           _mockNotificationService.Setup(x => x.CreateNotificationToAllAsync(It.IsAny<CreateNotificationToAllRequest>()))
               .ReturnsAsync(Result.Success());

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           existingEvent.Publish.Should().BeTrue();
           existingEvent.Status.Should().Be(EventStatus.PendingApproval);
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       // UTCID14: Add new images - Success
       [Fact]
       public async Task UTCID14_UpdateEventAsync_WithAddImages_ShouldUploadAndAddImages()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var mockFile = CreateMockFormFile();

           var updateRequest = new UpdateEventRequest
           {
               ImgListEvent = new List<string> { "new-uploaded-image.jpg" }
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               ImgListEvent = "existing-image.jpg",
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       // UTCID15: Remove images - Success
       [Fact]
       public async Task UTCID15_UpdateEventAsync_WithRemoveImages_ShouldDeleteImages()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var imageToRemove = "image-to-remove.jpg";

           var updateRequest = new UpdateEventRequest
           {
               RemoveImageUrls = new List<string> { imageToRemove }
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               ImgListEvent = $"{imageToRemove}, keep-image.jpg",
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       // UTCID16: Add new ticket detail - Success
       [Fact]
       public async Task UTCID16_UpdateEventAsync_WithAddNewTicketType_ShouldAddTicket()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       Id = null, // New ticket
                       TicketName = "New Ticket",
                       TicketPrice = 50000,
                       TicketQuantity = 100
                   }
               }
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Existing Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var newTicket = new TicketType
           {
               TicketName = "New Ticket",
               TicketPrice = 50,
               TicketQuantity = 100
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           
           var ticketTypeQueryable = existingEvent.TicketTypes.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.TicketTypeRepository.Query(false)).Returns(ticketTypeQueryable);
           
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
           _mockMapper.Setup(x => x.Map<TicketType>(It.IsAny<TicketTypeRequest>())).Returns(newTicket);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
           _mockUnitOfWork.Setup(x => x.TicketTypeRepository.AddRangeAsync(It.IsAny<List<TicketType>>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       // UTCID17: Update existing ticket detail - Success
       [Fact]
       public async Task UTCID17_UpdateEventAsync_WithUpdateExistingTicketType_ShouldUpdateTicket()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var ticketId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       Id = ticketId,
                       TicketName = "Updated Ticket",
                       TicketPrice = 75000,
                       TicketQuantity = 150
                   }
               }
           };

           var existingTicket = new TicketType
           {
               Id = ticketId,
               EventId = eventId,
               TicketName = "Original Ticket",
               TicketPrice = 50000,
               TicketQuantity = 100,
               SoldQuantity = 10
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               TicketTypes = new List<TicketType> { existingTicket },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           
           var ticketTypeQueryable = new List<TicketType> { existingTicket }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.TicketTypeRepository.Query(false)).Returns(ticketTypeQueryable);
           
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
           _mockMapper.Setup(x => x.Map(It.IsAny<TicketTypeRequest>(), existingTicket)).Returns(existingTicket);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

        // UTCID18: Remove ticket with no sold quantity - Success
        [Fact]
        public async Task UTCID18_UpdateEventAsync_WithRemoveTicketNoSoldQuantity_ShouldRemoveTicket()
        {
            // Arrange
            var organizerId = TestOrganizerId;
            var eventId = Guid.NewGuid();
            var ticketToRemoveId = Guid.NewGuid();

            var updateRequest = new UpdateEventRequest
            {
                RemoveTicketTypeIds = new List<Guid> { ticketToRemoveId }
            };

            var ticketToRemove = new TicketType
            {
                Id = ticketToRemoveId,
                EventId = eventId,
                TicketName = "Ticket to Remove",
                TicketQuantity = 50,
                SoldQuantity = 0 // No sold tickets
            };

            var existingEvent = new Event
            {
                Id = eventId,
                OrganizerProfileId = organizerId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow.AddDays(5),
                EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
                Publish = false,
                IsDeleted = false,
                ImgListEvent = "image1.jpg",
                TicketTypes = new List<TicketType>
               {
                   ticketToRemove,
                   new TicketType { Id = Guid.NewGuid(), EventId = eventId, TicketName = "Keep Ticket", TicketQuantity = 100 }
               },
                EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
            };

            var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(eventQueryable); // For checking sold quantity
            
            var ticketTypeQueryable = existingEvent.TicketTypes.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.TicketTypeRepository.Query(false))
                .Returns(ticketTypeQueryable);
            
            _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.TicketTypeRepository.DeleteAsync(It.IsAny<TicketType>()));

            // Act
            var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.TicketTypeRepository.DeleteAsync(It.Is<TicketType>(t => t.Id == ticketToRemoveId)), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
        }

        // UTCID19: Add new tag - Success
        [Fact]
       public async Task UTCID19_UpdateEventAsync_WithAddNewTag_ShouldAddTag()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var newTagId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               AddTagIds = new List<Guid> { newTagId }
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       // UTCID20: Remove tag - Success
       [Fact]
       public async Task UTCID20_UpdateEventAsync_WithRemoveTag_ShouldRemoveTag()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var tagIdToRemove = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               RemoveTagIds = new List<Guid> { tagIdToRemove }
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = tagIdToRemove },
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       [Fact]
       public async Task UTCID21_UpdateEventAsync_WithPublishAndZeroTotalTickets_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               Publish = true,
               TotalTickets = 0
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "Title",
               Description = "Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TotalTickets = 0,
               EventCategoryId = TestEventCategoryId,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID22: Publish validation - Missing EventCategoryId
       [Fact]
       public async Task UTCID22_UpdateEventAsync_WithPublishAndMissingEventCategoryId_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               Publish = true,
               EventCategoryId = Guid.Empty
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Publish = false,
               IsDeleted = false,
               Title = "Title",
               Description = "Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TotalTickets = 100,
               EventCategoryId = Guid.Empty,
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID23: Add evidence images - Success
       [Fact]
       public async Task UTCID23_UpdateEventAsync_WithAddEvidence_ShouldUploadAndAddEvidence()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var mockEvidenceFile = CreateMockFormFile("evidence.jpg");

           var updateRequest = new UpdateEventRequest
           {
               ImgListEvidences = new List<string> { "uploaded-evidence.jpg" }
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "",
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       // UTCID24: Published event with active bookings (Pending) - Failure
       [Fact]
       public async Task UTCID24_UpdateEventAsync_WithPublishedEventAndPendingBookings_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var booking = new Booking
           {
               Id = Guid.NewGuid(),
               EventId = eventId,
               Status = BookingStatus.Completed
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = true,
               Status = EventStatus.PendingApproval,
               IsDeleted = false,
               Bookings = new List<Booking> { booking },
               TicketTypes = new List<TicketType>(),
               EventTags = new List<EventTag>()
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.SetupSequence(x => x.EventRepository.Query(false))
               .Returns(eventQueryable)
               .Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Cannot update event that has existing bookings");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID25: Published event without any bookings - Success
       [Fact]
       public async Task UTCID25_UpdateEventAsync_WithPublishedEventAndNoBookings_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test",
               Description = "Test",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = true,
               Status = EventStatus.PendingApproval,
               IsDeleted = false,
               Bookings = new List<Booking>(),
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.SetupSequence(x => x.EventRepository.Query(false))
               .Returns(eventQueryable)
               .Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
       }

       // UTCID26: Publish validation - Missing Description
       [Fact]
       public async Task UTCID26_UpdateEventAsync_WithPublishAndMissingDescription_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Publish = true, Description = "" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test",
               Description = "",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Location",
               District = "District",
               Address = "Address",
               ImgListEvent = "image.jpg",
               ImgListEvidences = "evidence.jpg",
               TotalTickets = 100,
               EventCategoryId = TestEventCategoryId,
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event data is incomplete for publishing");
       }


       // UTCID27: Publish validation - TotalTickets boundary value = 1
       [Fact]
       public async Task UTCID27_UpdateEventAsync_WithPublishAndTotalTicketsEqualOne_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Publish = true, TotalTickets = 1 };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test",
               Description = "Test",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               SaleEndTime = DateTime.UtcNow.AddDays(4),
               LocationName = "Location",
               District = "District",
               Address = "Address",
               ImgListEvent = "image.jpg",
               ImgListEvidences = "evidence.jpg",
               TotalTickets = 1,
               EventCategoryId = TestEventCategoryId,
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), EventId = eventId, TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var managerRole = new Role
           {
               Id = Guid.NewGuid(),
               Name = "Manager",
               IsDeleted = false
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           
           var ticketTypeQueryable = existingEvent.TicketTypes.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.TicketTypeRepository.Query(false)).Returns(ticketTypeQueryable);
           
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
           _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Role> { managerRole }.AsQueryable().BuildMockDbSet().Object);
           _mockNotificationService.Setup(x => x.CreateNotificationToAllAsync(It.IsAny<CreateNotificationToAllRequest>()))
               .ReturnsAsync(Result.Success());

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockNotificationService.Verify(x => x.CreateNotificationToAllAsync(It.Is<CreateNotificationToAllRequest>(
               req => req.Type == NotificationType.EventCreated &&
                      req.Title == "Yêu cầu phê duyệt sự kiện" &&
                      req.TargetRoles != null && req.TargetRoles.Any() &&
                      req.EventId == eventId &&
                      req.ImageUrl == "image.jpg")), Times.Once());
       }

       // UTCID28: Update with add and remove images simultaneously - Success
       [Fact]
       public async Task UTCID28_UpdateEventAsync_WithAddAndRemoveImagesSimultaneously_ShouldUpdateImages()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               RemoveImageUrls = new List<string> { "old-image.jpg" },
               ImgListEvent = new List<string> { "new-image.jpg" }
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               ImgListEvent = "old-image.jpg, keep-image.jpg",
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

        // UTCID29: Update without Publish - Success
        [Fact]
       public async Task UTCID29_UpdateEventAsync_WithoutPublish_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               Title = "Updated Title",
               Description = "Updated Description"
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Original Title",
               Description = "Original Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = false,
               IsDeleted = false,
               ImgListEvent = "image1.jpg",
               TicketTypes = new List<TicketType>
               {
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Standard Ticket", TicketQuantity = 100 }
               },
               EventTags = new List<EventTag>
               {
                   new EventTag { EventId = eventId, TagId = Guid.NewGuid() }
               }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
       }

       // UTCID30: Published event with Approved status - Failure
       [Fact]
       public async Task UTCID30_UpdateEventAsync_WithPublishedEventAndApprovedStatus_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = true,
               Status = EventStatus.Approved,
               IsDeleted = false,
               Bookings = new List<Booking>(),
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.SetupSequence(x => x.EventRepository.Query(false))
               .Returns(eventQueryable)
               .Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Cannot update published event that is not in pending approval status");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID31: Published event with Rejected status - Failure
       [Fact]
       public async Task UTCID31_UpdateEventAsync_WithPublishedEventAndRejectedStatus_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = true,
               Status = EventStatus.Rejected,
               IsDeleted = false,
               Bookings = new List<Booking>(),
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.SetupSequence(x => x.EventRepository.Query(false))
               .Returns(eventQueryable)
               .Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Cannot update published event that is not in pending approval status");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID32: Published event with Cancelled status - Failure
       [Fact]
       public async Task UTCID32_UpdateEventAsync_WithPublishedEventAndCancelledStatus_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = true,
               Status = EventStatus.Cancelled,
               IsDeleted = false,
               Bookings = new List<Booking>(),
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.SetupSequence(x => x.EventRepository.Query(false))
               .Returns(eventQueryable)
               .Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Cannot update published event that is not in pending approval status");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID33: Published event with WaitingForPayout status - Failure
       [Fact]
       public async Task UTCID33_UpdateEventAsync_WithPublishedEventAndWaitingForPayoutStatus_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = true,
               Status = EventStatus.WaitingForPayout,
               IsDeleted = false,
               Bookings = new List<Booking>(),
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.SetupSequence(x => x.EventRepository.Query(false))
               .Returns(eventQueryable)
               .Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Cannot update published event that is not in pending approval status");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID34: Published event with PaidOut status - Failure
       [Fact]
       public async Task UTCID34_UpdateEventAsync_WithPublishedEventAndPaidOutStatus_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
               Publish = true,
               Status = EventStatus.PaidOut,
               IsDeleted = false,
               Bookings = new List<Booking>(),
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.SetupSequence(x => x.EventRepository.Query(false))
               .Returns(eventQueryable)
               .Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Cannot update published event that is not in pending approval status");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       #endregion

       #region DeleteEventAsync Tests

       [Fact]
       public async Task UTCID01_DeleteEventAsync_WithValidEventWithoutBookings_ShouldReturnSuccess()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 0,
               DeletedAt = null,
               IsDeleted = false,
               CreatedAt = DateTime.UtcNow,
               Bookings = new List<Booking>(),
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           _mockUnitOfWork.Setup(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()), Times.Once);
       }

       [Fact]
       public async Task UTCID02_DeleteEventAsync_WithEmptyEventId_ShouldReturnFailure()
       {
           // Arrange
           var emptyGuid = Guid.Empty;
           var organizerId = TestOrganizerId;

           // Act
           var result = await _eventService.DeleteEventAsync(emptyGuid, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Invalid input");
           result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
       }

       [Fact]
       public async Task UTCID03_DeleteEventAsync_WithNonExistentEventId_ShouldReturnFailure()
       {
           // Arrange
           var nonExistentEventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;

           var mockEmptyQueryable = new List<Event>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEmptyQueryable);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.DeleteEventAsync(nonExistentEventId, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Event not found or inactive");
           result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
       }

       [Fact]
       public async Task UTCID04_DeleteEventAsync_WithAlreadyDeletedEvent_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;

           var deletedEvent = new Event
           {
               Id = eventId,
               Title = "Deleted Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 0,
               DeletedAt = DateTime.UtcNow.AddDays(-1),
               IsDeleted = true,
               CreatedAt = DateTime.UtcNow.AddDays(-10)
           };

           var mockDeletedEventQueryable = new List<Event> { deletedEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockDeletedEventQueryable);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Event not found or inactive");
           result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
       }

       [Fact]
       public async Task UTCID05_DeleteEventAsync_WithUnauthorizedOrganizer_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var actualOrganizerId = TestOrganizerId;
           var unauthorizedOrganizerId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = actualOrganizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 0,
               DeletedAt = null,
               IsDeleted = false,
               CreatedAt = DateTime.UtcNow,
               Bookings = new List<Booking>()
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, unauthorizedOrganizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Cannot delete other people's events");
           result.Error!.StatusCode.Should().Contain(ErrorCodes.Unauthorized);
       }

       [Fact]
       public async Task UTCID06_DeleteEventAsync_WithBookingsButNoReason_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 100,
                       User = new User
                       {
                           Id = userId,
                           Email = "user@test.com",
                           FullName = "Test User",
                           RoleId = Guid.NewGuid()
                       }
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Cancellation of a published event with existing bookings must have a reason");
           result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
       }

       [Fact]
       public async Task UTCID07_DeleteEventAsync_WithBookingsAndReason_ShouldRefundAndReturnSuccess()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var userWalletId = Guid.NewGuid();
           var organizerWalletId = Guid.NewGuid();
           var bookingId = Guid.NewGuid();
           var reasonCancel = "Test reason for cancellation";

           var userWallet = new Wallet
           {
               Id = userWalletId,
               UserId = userId,
               Balance = 500,
               IsDeleted = false
           };

           var organizerWallet = new Wallet
           {
               Id = organizerWalletId,
               UserId = organizerUserId,
               Balance = 1000,
               IsDeleted = false
           };

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = bookingId,
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 100,
                       User = new User
                       {
                           Id = userId,
                           Email = "user@test.com",
                           FullName = "Test User",
                           RoleId = Guid.NewGuid(),
                           Wallet = userWallet
                       }
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var mockWalletQueryable = new List<Wallet> { organizerWallet }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.WalletRepository.Query(false)).Returns(mockWalletQueryable);

           _mockHangfireJobService.Setup(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, reasonCancel);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();

           // Verify job is enqueued
           _mockHangfireJobService.Verify(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel), Times.Once);
       }

       [Fact]
       public async Task UTCID08_DeleteEventAsync_WithBookingsButInsufficientOrganizerBalance_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var userWalletId = Guid.NewGuid();
           var organizerWalletId = Guid.NewGuid();
           var reasonCancel = "Test reason";

           var userWallet = new Wallet
           {
               Id = userWalletId,
               UserId = userId,
               Balance = 500,
               IsDeleted = false
           };

           var organizerWallet = new Wallet
           {
               Id = organizerWalletId,
               UserId = organizerUserId,
               Balance = 50, // Not enough to refund 100
               IsDeleted = false
           };

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 100,
                       User = new User
                       {
                           Id = userId,
                           Email = "user@test.com",
                           FullName = "Test User",
                           RoleId = Guid.NewGuid(),
                           Wallet = userWallet
                       }
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           _mockHangfireJobService.Setup(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, reasonCancel);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockHangfireJobService.Verify(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel), Times.Once);
       }

       [Fact]
       public async Task UTCID09_DeleteEventAsync_WithFreeBookings_ShouldCancelBookingsWithoutRefund()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var reasonCancel = "Test cancellation";

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Free Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 0, // Free booking
                       User = new User
                       {
                           Id = userId,
                           Email = "user@test.com",
                           FullName = "Test User",
                           RoleId = Guid.NewGuid()
                       }
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var organizerWallet = new Wallet
           {
               Id = Guid.NewGuid(),
               UserId = organizerUserId,
               Balance = 1000,
               IsDeleted = false
           };

           _mockHangfireJobService.Setup(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, reasonCancel);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockHangfireJobService.Verify(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel), Times.Once);
       }

       [Fact]
       public async Task UTCID10_DeleteEventAsync_WithOrganizerWalletNotFound_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var reasonCancel = "Test cancellation";

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Paid Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 100,
                       User = new User
                       {
                           Id = userId,
                           Email = "user@test.com",
                           FullName = "Test User",
                           RoleId = Guid.NewGuid(),
                           Wallet = new Wallet
                           {
                               Id = Guid.NewGuid(),
                               UserId = userId,
                               Balance = 0,
                               IsDeleted = false
                           }
                       }
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           _mockHangfireJobService.Setup(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, reasonCancel);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockHangfireJobService.Verify(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel), Times.Once);
       }

       [Fact]
       public async Task UTCID11_DeleteEventAsync_WithUserWalletNotFound_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var reasonCancel = "Test cancellation";

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Paid Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 100,
                       User = new User
                       {
                           Id = userId,
                           Email = "user@test.com",
                           FullName = "Test User",
                           RoleId = Guid.NewGuid(),
                           Wallet = null! // User wallet not found
                       }
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var organizerWallet = new Wallet
           {
               Id = Guid.NewGuid(),
               UserId = organizerUserId,
               Balance = 1000,
               IsDeleted = false
           };

           _mockHangfireJobService.Setup(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, reasonCancel);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockHangfireJobService.Verify(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel), Times.Once);
       }

       [Fact]
       public async Task UTCID12_DeleteEventAsync_WithUnpublishedEventAndBookings_ShouldSucceedWithoutReason()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var userId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Unpublished Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = false, // Unpublished event
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = Guid.NewGuid(),
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 0,
                       User = new User
                       {
                           Id = userId,
                           Email = "user@test.com",
                           FullName = "Test User",
                           RoleId = Guid.NewGuid()
                       }
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           _mockUnitOfWork.Setup(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act - no reason provided, but should succeed because event is not published
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()), Times.Once);
       }

       [Fact]
       public async Task UTCID13_DeleteEventAsync_WithOnlyCancelledBookings_ShouldSucceedWithoutRefund()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;
           var userId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Event with Cancelled Bookings",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = Guid.NewGuid(),
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Cancelled, // Already cancelled
                       TotalAmount = 100,
                       User = new User
                       {
                           Id = userId,
                           Email = "user@test.com",
                           FullName = "Test User",
                           RoleId = Guid.NewGuid()
                       }
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           _mockUnitOfWork.Setup(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act - no reason needed because no active bookings
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()), Times.Once);
       }
       [Fact]
       public async Task UTCID14_DeleteEventAsync_WithEmptyOrganizerId_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = Guid.Empty;

           // Act
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Invalid input");
           result.Error!.StatusCode.Should().Contain(ErrorCodes.InvalidInput);
       }

       // UTCID15: DeleteEventAsync with Publish=true and no bookings - Should succeed
       [Fact]
       public async Task UTCID15_DeleteEventAsync_WithPublishedEventAndNoBookings_ShouldSucceed()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = TestOrganizerId;

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Published Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = TestEventCategoryId,
               TotalTickets = 100,
               SoldQuantity = 0,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true, // Published event
               CreatedAt = DateTime.UtcNow,
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = Guid.NewGuid(),
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               },
               Bookings = new List<Booking>() // No bookings
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           _mockUnitOfWork.Setup(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()))
               .Returns(Task.CompletedTask);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act - no reason needed because no bookings
           var result = await _eventService.DeleteEventAsync(eventId, organizerId, null);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.DeleteAsync(It.IsAny<Event>()), Times.Once);
       }
       #endregion

       #region GetRelatedEventAsync Tests

       [Fact]
       public async Task UTCID01_GetRelatedEventAsync_WithValidEventIdAndSameCategory_ShouldReturnRelatedEvents()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var categoryId = TestEventCategoryId;
           var futureDate = DateTime.UtcNow.AddDays(10);
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
                District = "Quận 1",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
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
               District = "Quận 7",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>(),
               TicketTypes = new List<TicketType>
               {
                   new TicketType { TicketName = "Standard", TicketQuantity = 50, TicketPrice = 100 }
               }
           };

           var allEvents = new List<Event> { targetEvent, relatedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents);

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
           var futureDate = DateTime.UtcNow.AddDays(10);
           var tag = new Tag { Id = tagId, NameTag = "Rock" };

           // Target event with tag
           var targetEvent = new Event
           {
               Id = eventId,
               Title = "Target Event",
               Description = "Target Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = TestEventCategoryId,
               District = "Quận 1",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
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
               EventCategoryId = TestEventCategoryId,
                District = "Quận 7",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>
               {
                   new EventTag { TagId = tagId, Tag = tag }
               },
               TicketTypes = new List<TicketType>
               {
                   new TicketType { TicketName = "VIP", TicketQuantity = 50, TicketPrice = 200 }
               }
           };

           var allEvents = new List<Event> { targetEvent, relatedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents);

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
       public async Task UTCID03_GetRelatedEventAsync_WithValidEventIdAndSameDistrict_ShouldReturnRelatedEvents()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var futureDate = DateTime.UtcNow.AddDays(10);

           // Target event
           var targetEvent = new Event
           {
               Id = eventId,
               Title = "Target Event",
               Description = "Target Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = TestEventCategoryId,
               District = "Quận 1",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>()
           };

           // Related event with same District
           var relatedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Related Event By District",
               Description = "Related Description",
               StartTime = futureDate.AddDays(1),
               EndTime = futureDate.AddDays(1).AddHours(2),
               EventCategoryId = TestEventCategoryId,
               District = "Quận 1", // Same District
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>(),
               TicketTypes = new List<TicketType>
               {
                   new TicketType { TicketName = "Standard", TicketQuantity = 50, TicketPrice = 50 }
               }
           };

           var allEvents = new List<Event> { targetEvent, relatedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents);

           // Act
           var result = await _eventService.GetRelatedEventAsync(eventId, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().EventId.Should().Be(relatedEvent.Id);
           result.Value.Items.First().Title.Should().Be("Related Event By District");
       }

       [Fact]
       public async Task UTCID04_GetRelatedEventAsync_WithNoRelatedEvents_ShouldReturnAllOtherEvents()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var futureDate = DateTime.UtcNow.AddDays(10);

           // Target event with specific attributes
           var targetEvent = new Event
           {
               Id = eventId,
               Title = "Target Event",
               Description = "Target Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = TestEventCategoryId,
                District = "Quận 1",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>()
           };

           // Unrelated event (different category, District, no common tags)
           var unrelatedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Unrelated Event",
               Description = "Unrelated Description",
               StartTime = futureDate.AddDays(1),
               EndTime = futureDate.AddDays(1).AddHours(2),
               EventCategoryId = TestEventCategoryId, // Different category
                District = "Quận 7", // Different District
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>(), // No common tags
               TicketTypes = new List<TicketType>()
           };

           var allEvents = new List<Event> { targetEvent, unrelatedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents);

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
           var futureDate = DateTime.UtcNow.AddDays(10);

           var event1 = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Event 1",
               Description = "Description 1",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = TestEventCategoryId,
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 1",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>(),
               TicketTypes = new List<TicketType>()
           };

           var event2 = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Event 2",
               Description = "Description 2",
               StartTime = futureDate.AddDays(1),
               EndTime = futureDate.AddDays(1).AddHours(2),
               EventCategoryId = TestEventCategoryId,
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>(),
               TicketTypes = new List<TicketType>()
           };

           var allEvents = new List<Event> { event1, event2 }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents);

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
           var futureDate = DateTime.UtcNow.AddDays(10);
           var pastDate = DateTime.UtcNow.AddDays(-10);

           var targetEvent = new Event
           {
               Id = eventId,
               Title = "Target Event",
               Description = "Target Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = TestEventCategoryId,
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>()
           };

           var pastEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Past Event",
               Description = "Past Description",
               StartTime = pastDate, // Past event
               EndTime = pastDate.AddHours(2),
               EventCategoryId = TestEventCategoryId,
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>(),
               TicketTypes = new List<TicketType>()
           };

           var allEvents = new List<Event> { targetEvent, pastEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents);

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
           var futureDate = DateTime.UtcNow.AddDays(10);

           var targetEvent = new Event
           {
               Id = eventId,
               Title = "Target Event",
               Description = "Target Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = TestEventCategoryId,
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>()
           };

           var deletedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Deleted Event",
               Description = "Deleted Description",
               StartTime = futureDate.AddDays(1),
               EndTime = futureDate.AddDays(1).AddHours(2),
               EventCategoryId = TestEventCategoryId,
               Status = EventStatus.Approved,
               DeletedAt = DateTime.UtcNow, // Deleted
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>(),
               TicketTypes = new List<TicketType>()
           };

           var allEvents = new List<Event> { targetEvent, deletedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents);

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
           var futureDate = DateTime.UtcNow.AddDays(10);

           var targetEvent = new Event
           {
               Id = eventId,
               Title = "Target Event",
               Description = "Target Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = TestEventCategoryId,
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>()
           };

           var unapprovedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Unapproved Event",
               Description = "Unapproved Description",
               StartTime = futureDate.AddDays(1),
               EndTime = futureDate.AddDays(1).AddHours(2),
               EventCategoryId = TestEventCategoryId,
               Status = EventStatus.PendingApproval, // Not approved
               DeletedAt = null,
               OrganizerProfileId = TestOrganizerId,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.UtcNow,
               EventTags = new List<EventTag>(),
               TicketTypes = new List<TicketType>()
           };

           var allEvents = new List<Event> { targetEvent, unapprovedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(allEvents);

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
           var organizerId = TestOrganizerId;
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var organizerProfile = new OrganizerProfile
           {
               Id = organizerId,
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company",
               ContactName = "Test Contact",
               ContactEmail = "test@example.com",
               ContactPhone = "0123456789",
               Address = "Test Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

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
               OrganizerProfile = organizerProfile,
               Publish = false, // Draft
               IsDeleted = false,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 1",
               CreatedAt = DateTime.UtcNow.AddDays(-2),
               ImgListEvent = "image1.jpg",
               TicketTypes = null!
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
               OrganizerProfile = organizerProfile,
               Publish = false, // Draft
               IsDeleted = false,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1),
               TicketTypes = new List<TicketType>
               {
                   new TicketType
                   {
                       TicketName = "Standard",
                       TicketPrice = 100,
                       TicketQuantity = 50
                   }
               }
           };

           var events = new List<Event> { draftEvent1, draftEvent2 }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
           var organizerId = TestOrganizerId;
           var events = new List<Event>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
           var organizerId = TestOrganizerId;
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var organizerProfile = new OrganizerProfile
           {
               Id = organizerId,
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company",
               ContactName = "Test Contact",
               ContactEmail = "test@example.com",
               ContactPhone = "0123456789",
               Address = "Test Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

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
               OrganizerProfile = organizerProfile,
               Publish = false, // Draft
               IsDeleted = false,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow,
               TicketTypes = null!
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
               OrganizerProfile = organizerProfile,
               Publish = true, // Published - should be excluded
               IsDeleted = false,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { draftEvent, publishedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
           var organizerId = TestOrganizerId;
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var organizerProfile = new OrganizerProfile
           {
               Id = organizerId,
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company",
               ContactName = "Test Contact",
               ContactEmail = "test@example.com",
               ContactPhone = "0123456789",
               Address = "Test Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

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
               OrganizerProfile = organizerProfile,
               Publish = false, // Draft
               IsDeleted = false,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow,
               TicketTypes = null!
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
               OrganizerProfile = organizerProfile,
               Publish = false, // Draft
               IsDeleted = true, // Deleted - should be excluded
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { draftEvent, deletedDraftEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
           var organizerId1 = TestOrganizerId;
           var organizerId2 = Guid.NewGuid();
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var organizerProfile1 = new OrganizerProfile
           {
               Id = organizerId1,
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company 1",
               ContactName = "Test Contact 1",
               ContactEmail = "test1@example.com",
               ContactPhone = "0123456789",
               Address = "Test Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

           var organizerProfile2 = new OrganizerProfile
           {
               Id = organizerId2,
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company 2",
               ContactName = "Test Contact 2",
               ContactEmail = "test2@example.com",
               ContactPhone = "0987654321",
               Address = "Test Address 2",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

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
               OrganizerProfile = organizerProfile1,
               Publish = false,
               IsDeleted = false,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow,
               TicketTypes = null!
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
               OrganizerProfile = organizerProfile2,
               Publish = false,
               IsDeleted = false,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { draftEventOrganizer1, draftEventOrganizer2 }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
       public async Task UTCID01_GetAllEventStatusAsync_WithDefaultPendingApprovalStatus_ShouldReturnPendingApprovalEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var organizerProfile1 = new OrganizerProfile
           {
               Id = Guid.NewGuid(),
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company 1",
               ContactName = "Test Contact 1",
               ContactEmail = "test1@example.com",
               ContactPhone = "0123456789",
               Address = "Test Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

           var organizerProfile2 = new OrganizerProfile
           {
               Id = Guid.NewGuid(),
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company 2",
               ContactName = "Test Contact 2",
               ContactEmail = "test2@example.com",
               ContactPhone = "0987654321",
               Address = "Test Address 2",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

           var PendingApprovalEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Need Confirm Event",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = organizerProfile1.Id,
               OrganizerProfile = organizerProfile1,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.PendingApproval,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow,
               TicketTypes = null!
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
               OrganizerProfileId = organizerProfile2.Id,
               OrganizerProfile = organizerProfile2,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved, // Should be excluded
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { PendingApprovalEvent, approvedEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.PendingApproval, null, null, 1, 10);

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
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var organizerProfile1 = new OrganizerProfile
           {
               Id = Guid.NewGuid(),
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company 1",
               ContactName = "Test Contact 1",
               ContactEmail = "test1@example.com",
               ContactPhone = "0123456789",
               Address = "Test Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

           var organizerProfile2 = new OrganizerProfile
           {
               Id = Guid.NewGuid(),
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company 2",
               ContactName = "Test Contact 2",
               ContactEmail = "test2@example.com",
               ContactPhone = "0987654321",
               Address = "Test Address 2",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

           var approvedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Approved Event",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = organizerProfile1.Id,
               OrganizerProfile = organizerProfile1,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow,
               TicketTypes = null!
           };

           var PendingApprovalEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Need Confirm Event",
               Description = "Description",
               StartTime = futureDate.AddDays(1),
               EndTime = futureDate.AddDays(1).AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = organizerProfile2.Id,
               OrganizerProfile = organizerProfile2,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.PendingApproval, // Should be excluded
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { approvedEvent, PendingApprovalEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Approved, null, null, 1, 10);

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
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var organizerProfile1 = new OrganizerProfile
           {
               Id = Guid.NewGuid(),
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company 1",
               ContactName = "Test Contact 1",
               ContactEmail = "test1@example.com",
               ContactPhone = "0123456789",
               Address = "Test Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

           var organizerProfile2 = new OrganizerProfile
           {
               Id = Guid.NewGuid(),
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company 2",
               ContactName = "Test Contact 2",
               ContactEmail = "test2@example.com",
               ContactPhone = "0987654321",
               Address = "Test Address 2",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

           var rejectedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Rejected Event",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = organizerProfile1.Id,
               OrganizerProfile = organizerProfile1,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Rejected,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow,
               TicketTypes = null!
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
               OrganizerProfileId = organizerProfile2.Id,
               OrganizerProfile = organizerProfile2,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved, // Should be excluded
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { rejectedEvent, approvedEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Rejected, null, null, 1, 10);

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
           var organizerId = TestOrganizerId;
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var organizerProfile1 = new OrganizerProfile
           {
               Id = organizerId,
               UserId = Guid.NewGuid(),
               CompanyName = "Test Company",
               ContactName = "Test Contact",
               ContactEmail = "test@example.com",
               ContactPhone = "0123456789",
               Address = "Test Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

           var organizerProfile2 = new OrganizerProfile
           {
               Id = Guid.NewGuid(),
               UserId = Guid.NewGuid(),
               CompanyName = "Other Company",
               ContactName = "Other Contact",
               ContactEmail = "other@example.com",
               ContactPhone = "0987654321",
               Address = "Other Address",
               OrganizationType = OrganizationType.PrivateCompany,
               EventFrequency = EventFrequency.Monthly,
               EventSize = EventSize.Medium,
               OrganizerType = OrganizerType.Individual,
               EventExperienceLevel = EventExperienceLevel.Intermediate,
               Status = OrganizerProfileStatus.Approved
           };

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
               OrganizerProfile = organizerProfile1,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow,
               TicketTypes = null!
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
               OrganizerProfileId = organizerProfile2.Id,
               OrganizerProfile = organizerProfile2,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { organizerEvent, otherEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(organizerId, null, EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Organizer Event");
       }

       [Fact]
       public async Task UTCID05_GetAllEventStatusAsync_WithEmptyOrganizerId_ShouldReturnAllEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var event1 = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Event 1",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var events = new List<Event> { event1, event2 }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(2);
       }

       [Fact]
       public async Task UTCID06_GetAllEventStatusAsync_WithSearchInTitle_ShouldReturnMatchingEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var matchingEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Rock Concert", // Contains "rock"
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "rock", EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Rock Concert");
       }

       [Fact]
       public async Task UTCID07_GetAllEventStatusAsync_WithSearchInAddress_ShouldReturnMatchingEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var matchingEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Event 1",
               Description = "Description",
               Address = "Ho Chi Minh District", // Contains "minh"
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "minh", EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Event 1");
       }

       [Fact]
       public async Task UTCID08_GetAllEventStatusAsync_WithSearchInDescription_ShouldReturnMatchingEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var matchingEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Event 1",
               Description = "Amazing music festival", // Contains "music"
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "music", EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Event 1");
       }

       [Fact]
       public async Task UTCID09_GetAllEventStatusAsync_WithEmptySearch_ShouldReturnAllMatchingStatusEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var event1 = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Event 1",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var events = new List<Event> { event1, event2 }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "", EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(2);
       }

       [Fact]
       public async Task UTCID10_GetAllEventStatusAsync_ShouldExcludeUnpublishedEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var publishedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Published Event",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = TestOrganizerId,
               Publish = false, // Unpublished - should be excluded
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var events = new List<Event> { publishedEvent, unpublishedEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Published Event");
       }

       [Fact]
       public async Task UTCID11_GetAllEventStatusAsync_ShouldExcludeDeletedEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var activeEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Active Event",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = true, // Deleted - should be excluded
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var events = new List<Event> { activeEvent, deletedEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Active Event");
       }

       [Fact]
       public async Task UTCID12_GetAllEventStatusAsync_WithMultipleFilters_ShouldReturnCorrectEvents()
       {
           // Arrange
           var organizerId = TestOrganizerId;
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

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
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = Guid.NewGuid(),
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
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
               Status = EventStatus.Approved, // Same organizer but different title
               TotalTickets = 75,
               SoldQuantity = 0,
               LocationName = "Location 3",
               CreatedAt = DateTime.UtcNow.AddDays(-2)
           };

           var events = new List<Event> { matchingEvent, nonMatchingEvent1, nonMatchingEvent2 }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(organizerId, "rock", EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Rock Concert");
       }

       [Fact]
       public async Task UTCID13_GetAllEventStatusAsync_WithNullStatus_ShouldReturnAllStatusEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var approvedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Approved Event",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
           };

           var rejectedEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Rejected Event",
               Description = "Description",
               StartTime = futureDate.AddDays(1),
               EndTime = futureDate.AddDays(1).AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Rejected,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var PendingApprovalEvent = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Need Confirm Event",
               Description = "Description",
               StartTime = futureDate.AddDays(2),
               EndTime = futureDate.AddDays(2).AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.PendingApproval,
               TotalTickets = 75,
               SoldQuantity = 0,
               LocationName = "Location 3",
               CreatedAt = DateTime.UtcNow.AddDays(-2)
           };

           var events = new List<Event> { approvedEvent, rejectedEvent, PendingApprovalEvent }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(null, null, null, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           result.Value!.Items.Should().HaveCount(3);
           result.Value.Items.Should().Contain(e => e.Title == "Approved Event");
           result.Value.Items.Should().Contain(e => e.Title == "Rejected Event");
           result.Value.Items.Should().Contain(e => e.Title == "Need Confirm Event");
       }


       [Fact]
       public async Task UTCID014_GetAllEventStatusAsync_WithNullOrganizerId_ShouldReturnAllEvents()
       {
           // Arrange
           var eventCategory = new EventCategory { Id = TestEventCategoryId, CategoryName = "Music" };
           var futureDate = DateTime.UtcNow.AddDays(10);

           var event1 = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Event 1",
               Description = "Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.UtcNow
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
               OrganizerProfileId = TestOrganizerId,
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.UtcNow.AddDays(-1)
           };

           var events = new List<Event> { event1, event2 }.AsQueryable().BuildMock();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(null, null, EventStatus.Approved, null, null, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(2);
       }


       #endregion

       #region ConfirmEventAsync
       private static Event CreateEventPendingApproval(Guid id, Guid? organizerUserId = null)
       {
           return new Event
           {
               Id = id,
               OrganizerProfileId = TestOrganizerId,
               EventCategoryId = TestEventCategoryId,
               Title = "Title",
               Description = "Desc",
               StartTime = DateTime.UtcNow.AddDays(1),
               EndTime = DateTime.UtcNow.AddDays(2),
               TotalTickets = 10,
               RemainingTickets = 10,
               Status = EventStatus.PendingApproval,
               IsDeleted = false,
               ImgListEvent = "image1.jpg, image2.jpg",
               OrganizerProfile = organizerUserId.HasValue ? new OrganizerProfile
               {
                   UserId = organizerUserId.Value,
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Monthly,
                   EventSize = EventSize.Medium,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Intermediate,
                   ContactName = "Test Contact",
                   ContactEmail = "test@example.com",
                   ContactPhone = "0123456789",
                   Address = "Test Address"
               } : null
           };
       }

       private static Event CreateEventProcessed(Guid id, EventStatus? status)
       {
           var e = CreateEventPendingApproval(id);
           e.Status = status;
           return e;
       }

       [Fact]
       public async Task UTCID01_ConfirmEventAsync_WithEmptyUserId_ShouldReturnInvalidInput()
       {
           // Act
           var result = await _eventService.ConfirmEventAsync(Guid.Empty, Guid.NewGuid(), new ConfirmEventRequest { Status = ConfirmStatus.Approved });

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
           result.Error!.Message.Should().Be("Invalid input");
       }

       [Fact]
       public async Task UTCID02_ConfirmEventAsync_WithEmptyEventId_ShouldReturnInvalidInput()
       {
           // Act
           var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), Guid.Empty, new ConfirmEventRequest { Status = ConfirmStatus.Approved });

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
           var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), Guid.NewGuid(), new ConfirmEventRequest { Status = ConfirmStatus.Approved });

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
           result.Error!.Message.Should().Be("Event can not found or is deleted");
       }

       [Fact]
       public async Task UTCID05_ConfirmEventAsync_AlreadyProcessed_ShouldReturnInvalidInput()
       {
           // Arrange: Status != PendingApproval (Approve here)
           var evt = CreateEventProcessed(Guid.NewGuid(), EventStatus.Approved);
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);

           // Act
           var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), evt.Id, new ConfirmEventRequest { Status = ConfirmStatus.Approved });

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
           result.Error!.Message.Should().Contain("Event has already been processed");
       }

       [Fact]
       public async Task UTCID06_ConfirmEventAsync_RejectWithoutReason_ShouldReturnInvalidInput()
       {
           // Arrange: entity in PendingApproval
           var evt = CreateEventPendingApproval(Guid.NewGuid());
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);

           // Act
           var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), evt.Id, new ConfirmEventRequest { Status = ConfirmStatus.Rejected, Reason = "   " });

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
           result.Error!.Message.Should().Contain("Reason is required when rejecting");
       }

       [Fact]
       public async Task UTCID07_ConfirmEventAsync_RejectWithReason_ShouldUpdateAndReturnSuccess()
       {
           // Arrange
           var organizerUserId = Guid.NewGuid();
           var evt = CreateEventPendingApproval(Guid.NewGuid(), organizerUserId);
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
               .ReturnsAsync((Event e) => e);
           _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
           _mockNotificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
               .ReturnsAsync(Result.Success());

           var userId = Guid.NewGuid();
           var request = new ConfirmEventRequest { Status = ConfirmStatus.Rejected, Reason = " invalid info  " };

           // Act
           var result = await _eventService.ConfirmEventAsync(userId, evt.Id, request);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e =>
               e.Id == evt.Id &&
               e.Status == EventStatus.Rejected &&
               e.ReasonReject == "invalid info" &&
               e.RequireApprovalBy == userId &&
               e.RequireApprovalAt.HasValue
           )), Times.Once());
           _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
           _mockNotificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(
               req => req.UserId == organizerUserId &&
                      req.Type == NotificationType.EventRejected &&
                      req.Title == "Sự kiện đã bị từ chối" &&
                      req.Message.Contains("invalid info") &&
                      req.EventId == evt.Id)), Times.Once());
       }

       [Fact]
       public async Task UTCID08_ConfirmEventAsync_Approve_ShouldUpdateAndReturnSuccess()
       {
           // Arrange
           var organizerUserId = Guid.NewGuid();
           var evt = CreateEventPendingApproval(Guid.NewGuid(), organizerUserId);
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
               .ReturnsAsync((Event e) => e);
           _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
           _mockNotificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
               .ReturnsAsync(Result.Success());

           var userId = Guid.NewGuid();
           var request = new ConfirmEventRequest { Status = ConfirmStatus.Approved };

           // Act
           var result = await _eventService.ConfirmEventAsync(userId, evt.Id, request);

           // Assert
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e =>
               e.Id == evt.Id &&
               e.Status == EventStatus.Approved &&
               e.RequireApprovalBy == userId &&
               e.RequireApprovalAt.HasValue
           )), Times.Once());
           _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
           _mockNotificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(
               req => req.UserId == organizerUserId &&
                      req.Type == NotificationType.EventApproved &&
                      req.Title == "Sự kiện đã được phê duyệt" &&
                      req.EventId == evt.Id &&
                      req.ImageUrl == "image1.jpg")), Times.Once());
       }

       [Fact]
       public async Task UTCID09_ConfirmEventAsync_DeletedEvent_ShouldReturnNotFound()
       {
           // Arrange
           var evt = CreateEventPendingApproval(Guid.NewGuid());
           evt.IsDeleted = true;
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);

           // Act
           var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), evt.Id, new ConfirmEventRequest { Status = ConfirmStatus.Approved });

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
           var evt = CreateEventProcessed(Guid.NewGuid(), EventStatus.Rejected);
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMockDbSet().Object);

           // Act
           var result = await _eventService.ConfirmEventAsync(Guid.NewGuid(), evt.Id, new ConfirmEventRequest { Status = ConfirmStatus.Approved });

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
           result.Error!.Message.Should().Contain("Event has already been processed");
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Never());
           _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
       }
       #endregion

       #region CompleteExpiredEventsAsync Tests
         
       [Fact]
       public async Task CompleteExpiredEventsAsync_WithNoEndedEvents_ShouldReturnWithoutError()
       {
           // Arrange
           var events = new List<Event>().AsQueryable().BuildMockDbSet();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

           // Act
           await _eventService.CompleteExpiredEventsAsync();

           // Assert
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateRangeAsync(It.IsAny<List<Event>>()), Times.Never);
           _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
           _mockLogger.Verify(
               x => x.Log(
                   LogLevel.Information,
                   It.IsAny<EventId>(),
                   It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No expired events found to process")),
                   It.IsAny<Exception>(),
                   It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
               Times.Once);
       }
         
       [Fact]
       public async Task CompleteExpiredEventsAsync_WithNoSystemSettings_ShouldReturnWithoutError()
       {
           // Arrange
           var now = DateTime.UtcNow;
           var eventItem = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Test Event",
               Description = "Test Description",
               StartTime = now.AddDays(-2),
               EndTime = now.AddHours(-1), // Ended
               SaleStartTime = now.AddDays(-3),
               Status = EventStatus.Approved,
               Publish = true,
               IsDeleted = false,
               TotalAmount = 100000,
               OrganizerProfileId = TestOrganizerId
           };

           var events = new List<Event> { eventItem }.AsQueryable().BuildMockDbSet();
           var systemSettings = new List<SystemSetting>().AsQueryable().BuildMockDbSet();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings.Object);

           // Act
           await _eventService.CompleteExpiredEventsAsync();

           // Assert
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateRangeAsync(It.IsAny<List<Event>>()), Times.Never);
           _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
       }
         
       [Fact]
       public async Task CompleteExpiredEventsAsync_WithHighRevenue_ShouldSetWaitingForPayout()
       {
           // Arrange
           var now = DateTime.UtcNow;
           var eventItem = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Test Event",
               Description = "Test Description",
               StartTime = now.AddDays(-2),
               EndTime = now.AddHours(-1), // Ended
               SaleStartTime = now.AddDays(-3),
               Status = EventStatus.Approved,
               Publish = true,
               IsDeleted = false,
               TotalAmount = 200000, // High revenue
               OrganizerProfileId = TestOrganizerId
           };

           var systemSetting = new SystemSetting
           {
               Id = Guid.NewGuid(),
               FlatformFee = 0.07m,
               FixFee = 45000,
               DatePayout = 7,
               UpdatedAt = now.AddDays(-4),
               IsDeleted = false
           };

           var events = new List<Event> { eventItem }.AsQueryable().BuildMockDbSet();
           var systemSettings = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMockDbSet();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings.Object);
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateRangeAsync(It.IsAny<List<Event>>()))
               .Returns(Task.CompletedTask);
           _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

           // Act
           await _eventService.CompleteExpiredEventsAsync();

           // Assert
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateRangeAsync(It.Is<List<Event>>(e => 
               e.First().Status == EventStatus.WaitingForPayout &&
               e.First().CompletedAt.HasValue)), Times.Once);
           _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
           _mockLogger.Verify(
               x => x.Log(
                   LogLevel.Information,
                   It.IsAny<EventId>(),
                   It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("set to WaitingForPayout")),
                   It.IsAny<Exception>(),
                   It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
               Times.Once);
       }
         
       [Fact]
       public async Task CompleteExpiredEventsAsync_WithLowRevenue_ShouldSetPaidOutAndCreateRevenueReport()
       {
           // Arrange
           var now = DateTime.UtcNow;
           var eventItem = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Test Event",
               Description = "Test Description",
               StartTime = now.AddDays(-2),
               EndTime = now.AddHours(-1), // Ended
               SaleStartTime = now.AddDays(-3),
               Status = EventStatus.Approved,
               Publish = true,
               IsDeleted = false,
               TotalAmount = 5000, // Low revenue - với FlatformFee = 0.07 và FixFee = 45000, netRevenue sẽ < 0
               OrganizerProfileId = TestOrganizerId
           };

           var systemSetting = new SystemSetting
           {
               Id = Guid.NewGuid(),
               FlatformFee = 0.07m,
               FixFee = 45000,
               DatePayout = 7,
               UpdatedAt = now.AddDays(-4),
               IsDeleted = false
           };

           var events = new List<Event> { eventItem }.AsQueryable().BuildMockDbSet();
           var systemSettings = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMockDbSet();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings.Object);
           _mockUnitOfWork.Setup(x => x.RevenueReportRepository.AddAsync(It.IsAny<RevenueReport>()))
               .ReturnsAsync((RevenueReport r) => r);
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateRangeAsync(It.IsAny<List<Event>>()))
               .Returns(Task.CompletedTask);
           _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

           // Act
           await _eventService.CompleteExpiredEventsAsync();

           // Assert
           _mockUnitOfWork.Verify(x => x.RevenueReportRepository.AddAsync(It.Is<RevenueReport>(r => 
               r.EventId == eventItem.Id &&
               r.GrossRevenue == 0 &&
               r.PlatformFee == 0 &&
               r.NetRevenue == 0)), Times.Once);
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateRangeAsync(It.Is<List<Event>>(e => 
               e.First().Status == EventStatus.PaidOut &&
               e.First().PaidOutAt.HasValue &&
               e.First().CompletedAt.HasValue)), Times.Once);
           _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.AtLeast(2));
           _mockLogger.Verify(
               x => x.Log(
                   LogLevel.Information,
                   It.IsAny<EventId>(),
                   It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("set to PaidOut with zero revenue")),
                   It.IsAny<Exception>(),
                   It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
               Times.Once);
       }

       #endregion

       #region CancelEventAsync Tests

       [Fact]
       public async Task UTCID01_CancelEventAsync_WithEmptyEventId_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.Empty;
           var request = new CancelEventRequest
           {
               ReasonCancel = "Test reason"
           };

           // Act
           var result = await _eventService.CancelEventAsync(eventId, request);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Invalid eventId");
       }

       [Fact]
       public async Task UTCID02_CancelEventAsync_WithNullRequest_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           CancelEventRequest request = null!;

           // Act
           var result = await _eventService.CancelEventAsync(eventId, request);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Request cannot be null");
       }

       [Fact]
       public async Task UTCID03_CancelEventAsync_WithEventNotFound_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var request = new CancelEventRequest
           {
               ReasonCancel = "Test reason"
           };

           var mockEventQueryable = new List<Event>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           // Act
           var result = await _eventService.CancelEventAsync(eventId, request);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event not found or inactive");
       }

       [Fact]
       public async Task UTCID04_CancelEventAsync_WithDeletedEvent_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var request = new CancelEventRequest
           {
               ReasonCancel = "Test reason"
           };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow.AddDays(5),
                EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
                OrganizerProfileId = organizerId,
                DeletedAt = DateTime.UtcNow,
                IsDeleted = true,
                Status = EventStatus.PendingApproval,
                Bookings = new List<Booking>()
            };

            var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            // Act
            var result = await _eventService.CancelEventAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or inactive");
        }

        [Fact]
       public async Task UTCID05_CancelEventAsync_WithAlreadyCancelledEvent_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var request = new CancelEventRequest
           {
               ReasonCancel = "Test reason"
           };

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Status = EventStatus.Cancelled,
               Bookings = new List<Booking>(),
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner,
                   User = new User
                   {
                       Id = organizerUserId,
                       Email = "organizer@test.com",
                       FullName = "Test Organizer"
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           // Act
           var result = await _eventService.CancelEventAsync(eventId, request);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event cancelled cannot cancel");
       }

       [Fact]
       public async Task UTCID06_CancelEventAsync_WithPublishedEventAndBookingsButNoReason_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var request = new CancelEventRequest
           {
               ReasonCancel = null
           };

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Status = EventStatus.Approved,
               Publish = true,
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 100
                   }
               },
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner,
                   User = new User
                   {
                       Id = organizerUserId,
                       Email = "organizer@test.com",
                       FullName = "Test Organizer"
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           // Act
           var result = await _eventService.CancelEventAsync(eventId, request);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Cancellation of a published event with existing bookings must have a reason.");
       }

       [Fact]
       public async Task UTCID07_CancelEventAsync_WithBookingsAndReason_ShouldEnqueueCancelJobAndReturnSuccess()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var reasonCancel = "Test cancellation reason";
           var request = new CancelEventRequest
           {
               ReasonCancel = reasonCancel
           };

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Status = EventStatus.Approved,
               Publish = true,
               ImgListEvent = "image1.jpg, image2.jpg",
               Bookings = new List<Booking>
               {
                   new Booking
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       EventId = eventId,
                       Status = BookingStatus.Completed,
                       TotalAmount = 100
                   }
               },
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   TotalEventFlags = 0,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner,
                   User = new User
                   {
                       Id = organizerUserId,
                       Email = "organizer@test.com",
                       FullName = "Test Organizer",
                       IsEmailNotificationEnabled = true
                   }
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);
           _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()))
               .Returns<OrganizerProfile>(profile => Task.FromResult(profile));
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
               .Returns<Event>(evt => Task.FromResult(evt));
           _mockHangfireJobService.Setup(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel))
               .Returns(Task.CompletedTask);
           _mockHangfireJobService.Setup(x => x.EnqueueCancelEventNotificationJobAsync(It.IsAny<CancelEventNotificationRequest>()))
               .Returns(Task.CompletedTask);
           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.CancelEventAsync(eventId, request);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.UpdateAsync(It.Is<OrganizerProfile>(p => 
               p.TotalEventFlags == 1)), Times.Once);
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e => 
               e.Status == EventStatus.Cancelled && 
               e.IsFlagWarning == true && 
               e.ReasonCancel == reasonCancel.Trim())), Times.Once);
           _mockHangfireJobService.Verify(x => x.EnqueueCancelEventJobAsync(eventId, reasonCancel), Times.Once);
           _mockHangfireJobService.Verify(x => x.EnqueueCancelEventNotificationJobAsync(It.Is<CancelEventNotificationRequest>(r => 
               r.EventId == eventId && 
               r.OrganizerUserId == organizerUserId &&
               r.ReasonCancel == reasonCancel)), Times.Once);
       }

        #endregion

       #region ResolveErrorPaymentAsync Tests

       [Fact]
       public async Task UTREPA01_ResolveErrorPaymentAsync_WithEmptyEventId_ShouldReturnFailure()
       {
           // Arrange
           var eventId = Guid.Empty;

           // Act
           var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Invalid eventId");
       }

       [Fact]
       public async Task UTREPA02_ResolveErrorPaymentAsync_WithEventNotFound_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;

           var mockEventQueryable = new List<Event>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           // Act
           var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event not found");
       }

       [Fact]
       public async Task UTREPA03_ResolveErrorPaymentAsync_WithEventNotInErrorPaymentStatus_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TotalAmount = 1000000,
               SaleStartTime = DateTime.UtcNow.AddDays(1)
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           // Act
           var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Event not found");
       }

       [Fact]
       public async Task UTREPA04_ResolveErrorPaymentAsync_WithSystemSettingNotFound_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               Status = EventStatus.ErrorPayment,
               TotalAmount = 1000000,
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               }
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var mockSystemSettingQueryable = new List<SystemSetting>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(false)).Returns(mockSystemSettingQueryable);

           // Act
           var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("System setting not found");
       }

       [Fact]
       public async Task UTREPA05_ResolveErrorPaymentAsync_WithOrganizerProfileNotFound_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               Status = EventStatus.ErrorPayment,
               TotalAmount = 1000000,
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               OrganizerProfile = null
           };

           var systemSetting = new SystemSetting
           {
               Id = Guid.NewGuid(),
               FlatformFee = 0.07m,
               FixFee = 45000m,
               DatePayout = 7,
               EventReminderHours = 3,
               UpdatedAt = DateTime.UtcNow.AddDays(-1),
               IsDeleted = false
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var mockSystemSettingQueryable = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(false)).Returns(mockSystemSettingQueryable);

           // Act
           var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Organizer profile not found");
       }

       [Fact]
       public async Task UTREPA06_ResolveErrorPaymentAsync_WithPaymentInformationNotFound_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               Status = EventStatus.ErrorPayment,
               TotalAmount = 1000000,
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               }
           };

           var systemSetting = new SystemSetting
           {
               Id = Guid.NewGuid(),
               FlatformFee = 0.07m,
               FixFee = 45000m,
               DatePayout = 7,
               EventReminderHours = 3,
               UpdatedAt = DateTime.UtcNow.AddDays(-1),
               IsDeleted = false
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var mockSystemSettingQueryable = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(false)).Returns(mockSystemSettingQueryable);

           var mockPaymentInfoQueryable = new List<PaymentInformation>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false)).Returns(mockPaymentInfoQueryable);

           // Act
           var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Payment information not found. Organizer needs to add payment information first.");
       }

       [Fact]
       public async Task UTREPA07_ResolveErrorPaymentAsync_WithNegativeNetRevenue_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               Status = EventStatus.ErrorPayment,
               TotalAmount = 10000, // Very small amount
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               }
           };

           var systemSetting = new SystemSetting
           {
               Id = Guid.NewGuid(),
               FlatformFee = 0.07m,
               FixFee = 50000m, // High fix fee that makes netRevenue negative
               DatePayout = 7,
               EventReminderHours = 3,
               UpdatedAt = DateTime.UtcNow.AddDays(-1),
               IsDeleted = false
           };

           var paymentInfo = new PaymentInformation
           {
               Id = Guid.NewGuid(),
               UserId = organizerUserId,
               AccountHolderName = "Test Organizer",
               AccountNumber = "1234567890",
               BankName = "Vietcombank",
               BankBin = "970436",
               IsDeleted = false
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var mockSystemSettingQueryable = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(false)).Returns(mockSystemSettingQueryable);

           var mockPaymentInfoQueryable = new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false)).Returns(mockPaymentInfoQueryable);

           var mockRevenueReportQueryable = new List<RevenueReport>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(false)).Returns(mockRevenueReportQueryable);
            // Act
            var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Be("Payout amount is negative");
       }

       [Fact]
       public async Task UTREPA08_ResolveErrorPaymentAsync_WithPayoutFailed_ShouldReturnFailure()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               Status = EventStatus.ErrorPayment,
               TotalAmount = 1000000,
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               }
           };

           var systemSetting = new SystemSetting
           {
               Id = Guid.NewGuid(),
               FlatformFee = 0.07m,
               FixFee = 45000m,
               DatePayout = 7,
               EventReminderHours = 3,
               UpdatedAt = DateTime.UtcNow.AddDays(-1),
               IsDeleted = false
           };

           var paymentInfo = new PaymentInformation
           {
               Id = Guid.NewGuid(),
               UserId = organizerUserId,
               AccountHolderName = "Test Organizer",
               AccountNumber = "1234567890",
               BankName = "Vietcombank",
               BankBin = "970436",
               IsDeleted = false
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var mockSystemSettingQueryable = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(false)).Returns(mockSystemSettingQueryable);

           var mockPaymentInfoQueryable = new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false)).Returns(mockPaymentInfoQueryable);

           var mockRevenueReportQueryable = new List<RevenueReport>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(false)).Returns(mockRevenueReportQueryable);

           var payoutResponse = new PayOS.Models.V1.Payouts.Payout
           {
               ApprovalState = PayOS.Models.V1.Payouts.PayoutApprovalState.Rejected
           };

           _mockpayOSService.Setup(x => x.CreatePayoutAsync(It.IsAny<PayOS.Models.V1.Payouts.PayoutRequest>()))
               .ReturnsAsync(payoutResponse);

           // Act
           var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Payout transaction failed");
       }

       [Fact]
       public async Task UTREPA09_ResolveErrorPaymentAsync_WithSuccess_CreateNewRevenueReport_ShouldReturnSuccess()
       {
           // Arrange
           var eventId = TestEventId;
           var organizerId = TestOrganizerId;
           var organizerUserId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.UtcNow.AddDays(5),
               EndTime = DateTime.UtcNow.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               Status = EventStatus.ErrorPayment,
               TotalAmount = 1000000,
               SaleStartTime = DateTime.UtcNow.AddDays(1),
               OrganizerProfile = new OrganizerProfile
               {
                   Id = organizerId,
                   UserId = organizerUserId,
                   ContactName = "Test Organizer",
                   ContactEmail = "test@test.com",
                   ContactPhone = "123456789",
                   Address = "Test Address",
                   OrganizationType = OrganizationType.PrivateCompany,
                   EventFrequency = EventFrequency.Occasionally,
                   EventSize = EventSize.Small,
                   OrganizerType = OrganizerType.Individual,
                   EventExperienceLevel = EventExperienceLevel.Beginner
               }
           };

           var systemSetting = new SystemSetting
           {
               Id = Guid.NewGuid(),
               FlatformFee = 0.07m,
               FixFee = 45000m,
               DatePayout = 7,
               EventReminderHours = 3,
               UpdatedAt = DateTime.UtcNow.AddDays(-1),
               IsDeleted = false
           };

           var paymentInfo = new PaymentInformation
           {
               Id = Guid.NewGuid(),
               UserId = organizerUserId,
               AccountHolderName = "Test Organizer",
               AccountNumber = "1234567890",
               BankName = "Vietcombank",
               BankBin = "970436",
               IsDeleted = false
           };

           var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

           var mockSystemSettingQueryable = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(false)).Returns(mockSystemSettingQueryable);

           var mockPaymentInfoQueryable = new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false)).Returns(mockPaymentInfoQueryable);

           var mockRevenueReportQueryable = new List<RevenueReport>().AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(false)).Returns(mockRevenueReportQueryable);

           var payoutResponse = new PayOS.Models.V1.Payouts.Payout
           {
               ApprovalState = PayOS.Models.V1.Payouts.PayoutApprovalState.Completed
           };

           _mockpayOSService.Setup(x => x.CreatePayoutAsync(It.IsAny<PayOS.Models.V1.Payouts.PayoutRequest>()))
               .ReturnsAsync(payoutResponse);

           _mockUnitOfWork.Setup(x => x.RevenueReportRepository.AddAsync(It.IsAny<RevenueReport>()))
               .Returns<RevenueReport>(report => Task.FromResult(report));
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
               .Returns<Event>(evt => Task.FromResult(evt));
           _mockUnitOfWork.Setup(x => x.SaveChangesAsync())
               .ReturnsAsync(1);
           _mockNotificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
               .ReturnsAsync(Result.Success());
           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(async func => await func());

           // Act
           var result = await _eventService.ResolveErrorPaymentAsync(eventId);

           // Assert
           result.Should().NotBeNull();
           result.IsSuccess.Should().BeTrue();
           _mockUnitOfWork.Verify(x => x.RevenueReportRepository.AddAsync(It.IsAny<RevenueReport>()), Times.Once);
           _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e => 
               e.Status == EventStatus.PaidOut && 
               e.PaidOutAt.HasValue)), Times.Once);
           _mockNotificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(n => 
               n.UserId == organizerUserId && 
               n.Type == NotificationType.PayoutCompleted)), Times.Once);
       }

        #endregion

        #region ReportEventAsyncs Tests
        [Fact]
        public async Task UTCID01_ReportEventAsync_InvalidEventIdFormat_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = "abc",
                Type = EventReportType.Scam,
                Reason = "Test reason",
                AttachmentUrl = null
            };

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid event ID format");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockUnitOfWork.VerifyNoOtherCalls();
            _mockNotificationService.VerifyNoOtherCalls();
        }


        [Fact]
        public async Task UTCID02_ReportEventAsync_EventNotFound_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Test reason"
            };

            var mockEventQueryable = new List<Event>().AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or unavailable");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }


        [Fact]
        public async Task UTCID03_ReportEventAsync_EventDeleted_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Test reason"
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                IsDeleted = true,
                Description = "test",
                Status = EventStatus.PendingApproval,
                Publish = true,
                StartTime = DateTime.UtcNow.AddDays(-2),
                EndTime = DateTime.UtcNow.AddDays(-1)
            };

            var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or unavailable");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }


        [Fact]
        public async Task UTCID04_ReportEventAsync_EventNotPublished_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Test reason"
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                IsDeleted = false,
                Description = "test",
                Status = EventStatus.PendingApproval,
                Publish = false,
                StartTime = DateTime.UtcNow.AddDays(-2),
                EndTime = DateTime.UtcNow.AddDays(-1)
            };

            var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or unavailable");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }


        [Fact]
        public async Task UTCID05_ReportEventAsync_EventCancelled_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Test reason"
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "test",
                IsDeleted = false,
                Status = EventStatus.Cancelled,
                Publish = true,
                StartTime = DateTime.UtcNow.AddDays(-2),
                EndTime = DateTime.UtcNow.AddDays(-1)
            };

            var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or unavailable");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }


        [Fact]
        public async Task UTCID06_ReportEventAsync_EventNotEnded_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Test reason",
                AttachmentUrl = null
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "test",
                StartTime = DateTime.Now.AddHours(-1),
                EndTime = DateTime.Now.AddHours(2),
                IsDeleted = false,
                Publish = true,
                Status = EventStatus.Approved
            };

            var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            _mockUnitOfWork.Setup(x => x.TicketRepository.Query(false))
                .Returns(new List<Ticket>().AsQueryable().BuildMock());

            _mockUnitOfWork.Setup(x => x.EventReportRepository.Query(false))
                .Returns(new List<EventReport>().AsQueryable().BuildMock());

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(false))
                .Returns(new List<Role>().AsQueryable().BuildMock());


            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You can only report after the event has ended");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockUnitOfWork.Verify(x => x.EventRepository.Query(false), Times.Once);
            _mockUnitOfWork.VerifyNoOtherCalls();
            _mockNotificationService.VerifyNoOtherCalls();
        }


        [Fact]
        public async Task UTCID07_ReportEventAsync_UserHasNotBooked_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Test reason",
                AttachmentUrl = null
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "test",
                StartTime = DateTime.Now.AddDays(-2),
                EndTime = DateTime.Now.AddDays(-1),
                IsDeleted = false,
                Publish = true,
                Status = EventStatus.Approved
            };

            var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            var mockTicketQueryable = new List<Ticket>().AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.TicketRepository.Query(false)).Returns(mockTicketQueryable);

            var mockEventReportQueryable = new List<EventReport>().AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventReportRepository.Query(false)).Returns(mockEventReportQueryable);

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You can only report events you booked and join");
            result.Error.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
        }


        [Fact]
        public async Task UTCID08_ReportEventAsync_UserHasTicketButNotUsed_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Test reason",
                AttachmentUrl = null
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "test",
                StartTime = DateTime.Now.AddDays(-2),
                EndTime = DateTime.Now.AddDays(-1),
                IsDeleted = false,
                Publish = true,
                Status = EventStatus.Approved
            };

            var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            var ticket = new Ticket
            {
                UserId = userId,
                Status = TicketStatus.Valid,
                EventName = "test",
                QrCodeUrl = "",
                TicketCode = "test",
                TicketType = new TicketType
                {
                    EventId = eventId,
                    TicketName = "test",
                    TicketQuantity = 100,
                }
            };

            var mockTicketQueryable = new List<Ticket> { ticket }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.TicketRepository.Query(false)).Returns(mockTicketQueryable);

            var mockEventReportQueryable = new List<EventReport>().AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventReportRepository.Query(false)).Returns(mockEventReportQueryable);

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You can only report events you booked and join");
            result.Error.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
        }


        [Fact]
        public async Task UTCID09_ReportEventAsync_AlreadyReported_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Test reason",
                AttachmentUrl = null
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "test",
                StartTime = DateTime.Now.AddDays(-2),
                EndTime = DateTime.Now.AddDays(-1),
                IsDeleted = false,
                Publish = true,
                Status = EventStatus.Approved
            };

            var mockEventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(mockEventQueryable);

            var ticket = new Ticket
            {
                UserId = userId,
                Status = TicketStatus.Used,
                EventName = "test",
                QrCodeUrl = "",
                TicketCode = "test",
                TicketType = new TicketType
                {
                    EventId = eventId,
                    TicketName = "test",
                    TicketQuantity = 100,
                }
            };

            var mockTicketQueryable = new List<Ticket> { ticket }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.TicketRepository.Query(false)).Returns(mockTicketQueryable);

            var eventReport = new EventReport
            {
                EventId = eventId,
                UserId = userId,
                IsDeleted = false,
                Type = EventReportType.Scam,
                Reason = "Previous report"
            };

            var mockEventReportQueryable = new List<EventReport> { eventReport }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(x => x.EventReportRepository.Query(false)).Returns(mockEventReportQueryable);

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have already reported this event");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }


        [Fact]
        public async Task UTCID10_ReportEventAsyncs_ShouldSucceed_WhenAllValid()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var request = new ReportEventRequest
            {
                EventId = eventId.ToString(),
                Type = EventReportType.Scam,
                Reason = "Some issue",
                AttachmentUrl = "http://example.com/file.png"
            };

            var now = DateTime.UtcNow;

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "test",
                StartTime = DateTime.Now.AddDays(-2),
                EndTime = DateTime.Now.AddDays(-1),
                Title = "AIEvent 2025",
                IsDeleted = false,
                Publish = true,
                Status = EventStatus.Approved
            };

            var ticket = new Ticket
            {
                UserId = userId,
                Status = TicketStatus.Used,
                EventName = "test",
                TicketCode = "asd",
                QrCodeUrl = "asdasd",
                TicketType = new TicketType
                {
                    EventId = eventId,
                    TicketQuantity = 100,
                    TicketName = "Test",
                }
            };

            var managerRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = "Manager",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(u => u.TicketRepository.Query(false))
                .Returns(new List<Ticket> { ticket }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(u => u.EventReportRepository.Query(false))
                .Returns(new List<EventReport>().AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(u => u.EventReportRepository.AddAsync(It.IsAny<EventReport>()))
                .ReturnsAsync((EventReport r) => r);

            _mockUnitOfWork.Setup(u => u.RoleRepository.Query(false))
                .Returns(new List<Role> { managerRole }.AsQueryable().BuildMockDbSet().Object);

            _mockNotificationService.Setup(n => n.CreateNotificationToAllAsync(It.IsAny<CreateNotificationToAllRequest>()))
                .ReturnsAsync(Result.Success());

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _eventService.ReportEventAsyncs(userId, request);

            // Assert
            Assert.True(result.IsSuccess);
            _mockUnitOfWork.Verify(u => u.EventReportRepository.AddAsync(It.IsAny<EventReport>()), Times.Once);
            _mockNotificationService.Verify(n => n.CreateNotificationToAllAsync(It.IsAny<CreateNotificationToAllRequest>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
        #endregion

    }
}
