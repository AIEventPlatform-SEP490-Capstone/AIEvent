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
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
   public class EventServiceTests
   {
       private readonly Mock<IUnitOfWork> _mockUnitOfWork;
       private readonly Mock<ITransactionHelper> _mockTransactionHelper;
       private readonly Mock<IMapper> _mockMapper;
       private readonly Mock<IHangfireJobService> _mockHangfireJobService;
       private readonly IEventService _eventService;

       public EventServiceTests()
       {
           _mockUnitOfWork = new Mock<IUnitOfWork>();
           _mockTransactionHelper = new Mock<ITransactionHelper>();
           _mockMapper = new Mock<IMapper>();
           _mockHangfireJobService = new Mock<IHangfireJobService>();

           _eventService = new EventService(
               _mockUnitOfWork.Object,
               _mockTransactionHelper.Object,
               _mockMapper.Object,
               _mockHangfireJobService.Object);
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

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               Status = EventStatus.PendingApproval,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
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
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid()
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
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid()
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Paid,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = null!, // Invalid
                       TicketPrice = 100,
                       TicketQuantity = 50
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(4), // Before StartTime
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(3),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(3),
               SaleEndTime = DateTime.Now.AddDays(2),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(6), // After StartTime
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice =0,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice =0,
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
           var organizerId = Guid.NewGuid();

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test1.jpg", "https://cloudinary.com/test2.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();
           var saleTime = DateTime.Now.AddDays(3);

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = saleTime,
               SaleEndTime = saleTime, // Same as SaleStartTime (boundary)
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
           {
               new TicketTypeRequest
               {
                   TicketName = "Standard Ticket",
                   TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Paid,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "VIP",
                       TicketPrice = 200,
                       TicketQuantity = 20
                   },
                   new TicketTypeRequest
                   {
                       TicketName = "Regular",
                       TicketPrice = 100,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Paid,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "VIP",
                       TicketPrice = -100,
                       TicketQuantity = 20
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

       // UTCID18: Invalid ticket quantity (zero) - Failure
       [Fact]
       public async Task UTCID18_CreateEventAsync_WithZeroTicketQuantity_ShouldReturnFailure()
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
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TicketPricingType = TicketPricingType.Paid,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "VIP",
                       TicketPrice = 100,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 1,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Single Ticket",
                       TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();
           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string>(),
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
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
           var organizerId = Guid.NewGuid();

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = null, // Missing District
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "", // Missing Address
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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
           var organizerId = Guid.NewGuid();

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               Publish = true, // Publishing
               ImgListEvidences = null, // No evidence
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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

       // UTCID25: Publish = true but ImgListEvidences is empty list - Failure
       [Fact]
       public async Task UTCID25_CreateEventAsync_WithPublishButEmptyEvidenceList_ShouldReturnFailure()
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
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               Publish = true, // Publishing
               ImgListEvidences = new List<string>(), // Empty list
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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

       // UTCID26: Create with evidence and publish - Success
       [Fact]
       public async Task UTCID26_CreateEventAsync_WithEvidenceAndPublish_ShouldReturnSuccess()
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
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               ImgListEvidences = new List<string> { "https://cloudinary.com/evidence.jpg" },
               Publish = true,
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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
        
       // UTCID28: Publish = false should not require evidence - Success
       [Fact]
       public async Task UTCID27_CreateEventAsync_WithPublishFalseNoEvidence_ShouldReturnSuccess()
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
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               Publish = false, // Not publishing
               ImgListEvidences = null, // No evidence needed
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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

       // UTCID29: Boundary - SaleEndTime equals StartTime - Success
       [Fact]
       public async Task UTCID28_CreateEventAsync_WithSaleEndTimeEqualsStartTime_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
           var startTime = DateTime.Now.AddDays(5);

           var createEventRequest = new CreateEventRequest
           {
               Title = "Test Event",
               Description = "Test Description",
               StartTime = startTime,
               EndTime = startTime.AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = startTime, // Boundary: equals StartTime
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               TotalTickets = 100,
               TicketPricingType = TicketPricingType.Free,
               EventCategoryId = Guid.NewGuid(),
               ImgListEvent = new List<string> { "https://cloudinary.com/test.jpg" },
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       TicketName = "Standard Ticket",
                       TicketPrice = 0,
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

       #region RequestEndEvent

        [Fact]
        public async Task UTCID01_RequestEndEventAsync_WithEmptyUserId_ShouldReturnInvalidInput()
        {
            // Act
            var result = await _eventService.RequestEndEventAsync(Guid.Empty, new CompleteEventRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid userId");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID02_RequestEndEventAsync_WithNullRequest_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, null!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID03_RequestEndEventAsync_InvalidModel_NoEvidenceImages_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CompleteEventRequest
            {
                EventId = Guid.NewGuid(),
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string>() // empty
            };

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("At least one image must be provided.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID04_RequestEndEventAsync_EventNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CompleteEventRequest
            {
                EventId = Guid.NewGuid(),
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID05_RequestEndEventAsync_Unauthorized_WhenNotOwner_ShouldReturnUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" }; // different user
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Approved };
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You can only request to end your own events");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task UTCID06_RequestEndEventAsync_EventNotOverYet_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow, OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddHours(1), Publish = true, Status = EventStatus.Approved };
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event is not over yet");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID07_RequestEndEventAsync_ExistingPendingRequest_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Approved };
            var pending = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, IsLatest = true, IsDeleted = false };
            var paymentInfoId = Guid.NewGuid();
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = paymentInfoId,
                EvidenceImages = new List<string> { "img1" }
            };
            var paymentInfo = new PaymentInformation { Id = paymentInfoId, UserId = userId, IsDeleted = false, AccountHolderName = "Test", AccountNumber = "123456", BankName = "Test Bank", BankBin = "123456" };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { pending }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("There is already a pending end event request for this event");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID08_RequestEndEventAsync_Success_ShouldUpdateEventAndCreateEndRequest()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-5), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Approved };
            var paymentInfoId = Guid.NewGuid();
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = paymentInfoId,
                EvidenceImages = new List<string> { "img1" },
                Summary = "summary"
            };
            var paymentInfo = new PaymentInformation { Id = paymentInfoId, UserId = userId, IsDeleted = false, AccountHolderName = "Test", AccountNumber = "123456", BankName = "Test Bank", BankBin = "123456" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.AddAsync(It.IsAny<EndEventRequest>()));

            _mockMapper.Setup(x => x.Map<EndEventRequest>(It.IsAny<CompleteEventRequest>()))
                .Returns<CompleteEventRequest>(r => new EndEventRequest { EventId = r.EventId, EvidenceImages = string.Join(", ", r.EvidenceImages), Summary = r.Summary });

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e => e.Id == ev.Id && e.Status == EventStatus.PendingApprovalEnd)), Times.Once());
            _mockUnitOfWork.Verify(x => x.EndEventRequestRepository.AddAsync(It.Is<EndEventRequest>(er => er.EventId == ev.Id && er.IsLatest && er.Status == EndEventStatus.PendingApprovalEnd && er.OrganizerProfileId == organizerProfile.Id)), Times.Once());
        }

        [Fact]
        public async Task UTCID09_RequestEndEventAsync_WithOldLatestRequests_ShouldCreateNewAndKeepOldUnchangedExternally()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Approved };
            var old1 = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, IsLatest = true, IsDeleted = false, Status = EndEventStatus.Approved };
            var old2 = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, IsLatest = true, IsDeleted = false, Status = EndEventStatus.Rejected };
            var paymentInfoId = Guid.NewGuid();
            var request = new CompleteEventRequest { EventId = ev.Id, PaymentInformationId = paymentInfoId, EvidenceImages = new List<string> { "img1" } };
            var paymentInfo = new PaymentInformation { Id = paymentInfoId, UserId = userId, IsDeleted = false, AccountHolderName = "Test", AccountNumber = "123456", BankName = "Test Bank", BankBin = "123456" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { old1, old2 }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.AddAsync(It.IsAny<EndEventRequest>()));

            _mockMapper.Setup(x => x.Map<EndEventRequest>(It.IsAny<CompleteEventRequest>()))
                .Returns<CompleteEventRequest>(r => new EndEventRequest { EventId = r.EventId, EvidenceImages = string.Join(", ", r.EvidenceImages) });

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EndEventRequestRepository.AddAsync(It.Is<EndEventRequest>(er => er.EventId == ev.Id && er.IsLatest)), Times.Once());
        }

        [Fact]
        public async Task UTCID10_RequestEndEventAsync_Boundary_EndTimeEqualsNow_ShouldSucceed()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-2), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddSeconds(-1), Publish = true, Status = EventStatus.Approved };
            var paymentInfoId = Guid.NewGuid();
            var request = new CompleteEventRequest { EventId = ev.Id, PaymentInformationId = paymentInfoId, EvidenceImages = new List<string> { "img1" } };
            var paymentInfo = new PaymentInformation { Id = paymentInfoId, UserId = userId, IsDeleted = false, AccountHolderName = "Test", AccountNumber = "123456", BankName = "Test Bank", BankBin = "123456" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.AddAsync(It.IsAny<EndEventRequest>()));

            _mockMapper.Setup(x => x.Map<EndEventRequest>(It.IsAny<CompleteEventRequest>()))
                .Returns(new EndEventRequest());

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task UTCID11_RequestEndEventAsync_EventStatusPendingApproval_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.PendingApproval };
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event cannot be requested to end in its current state");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID12_RequestEndEventAsync_EventStatusRejected_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Rejected };
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event cannot be requested to end in its current state");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID13_RequestEndEventAsync_EventStatusCancelled_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Cancelled };
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event cannot be requested to end in its current state");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID14_RequestEndEventAsync_EventStatusPendingApprovalEnd_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.PendingApprovalEnd };
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event cannot be requested to end in its current state");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID15_RequestEndEventAsync_EventStatusWaitingForPayout_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.WaitingForPayout };
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event cannot be requested to end in its current state");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID16_RequestEndEventAsync_EventStatusEnded_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Ended };
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = Guid.NewGuid(),
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event cannot be requested to end in its current state");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID17_RequestEndEventAsync_EventStatusRejectEnded_ShouldSucceed()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-5), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.RejectEnded };
            var paymentInfoId = Guid.NewGuid();
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = paymentInfoId,
                EvidenceImages = new List<string> { "img1" },
                Summary = "summary"
            };
            var paymentInfo = new PaymentInformation { Id = paymentInfoId, UserId = userId, IsDeleted = false, AccountHolderName = "Test", AccountNumber = "123456", BankName = "Test Bank", BankBin = "123456" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.AddAsync(It.IsAny<EndEventRequest>()));

            _mockMapper.Setup(x => x.Map<EndEventRequest>(It.IsAny<CompleteEventRequest>()))
                .Returns<CompleteEventRequest>(r => new EndEventRequest { EventId = r.EventId, EvidenceImages = string.Join(", ", r.EvidenceImages), Summary = r.Summary });

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e => e.Id == ev.Id && e.Status == EventStatus.PendingApprovalEnd)), Times.Once());
            _mockUnitOfWork.Verify(x => x.EndEventRequestRepository.AddAsync(It.Is<EndEventRequest>(er => er.EventId == ev.Id && er.IsLatest && er.Status == EndEventStatus.PendingApprovalEnd && er.OrganizerProfileId == organizerProfile.Id)), Times.Once());
        }

        [Fact]
        public async Task UTCID18_RequestEndEventAsync_PaymentInformationNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Approved };
            var paymentInfoId = Guid.NewGuid();
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = paymentInfoId,
                EvidenceImages = new List<string> { "img1" }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Payment information not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID19_RequestEndEventAsync_PaymentInformationDeleted_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Approved };
            var paymentInfoId = Guid.NewGuid();
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = paymentInfoId,
                EvidenceImages = new List<string> { "img1" }
            };
            var paymentInfo = new PaymentInformation { Id = paymentInfoId, UserId = userId, IsDeleted = true, AccountHolderName = "Test", AccountNumber = "123456", BankName = "Test Bank", BankBin = "123456" };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Payment information not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID20_RequestEndEventAsync_PaymentInformationDifferentUser_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = userId, OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Name", ContactEmail = "email@ex.com", ContactPhone = "0123", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), OrganizerProfileId = organizerProfile.Id, OrganizerProfile = organizerProfile, EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.Approved };
            var paymentInfoId = Guid.NewGuid();
            var request = new CompleteEventRequest
            {
                EventId = ev.Id,
                PaymentInformationId = paymentInfoId,
                EvidenceImages = new List<string> { "img1" }
            };
            var paymentInfo = new PaymentInformation { Id = paymentInfoId, UserId = Guid.NewGuid(), IsDeleted = false, AccountHolderName = "Test", AccountNumber = "123456", BankName = "Test Bank", BankBin = "123456" };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event> { ev }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                .Returns(new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.RequestEndEventAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Payment information not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        #endregion

       #region GetEndEventRequestById

        [Fact]
        public async Task UTCID01_GetEndEventRequestByIdAsync_WithEmptyId_ShouldReturnInvalidInput()
        {
            // Act
            var result = await _eventService.GetEndEventRequestByIdAsync(Guid.Empty);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid EndEventRequestId");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID02_GetEndEventRequestByIdAsync_NotFound_ShouldReturnNotFound()
        {
            // Arrange
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest>().AsQueryable().BuildMockDbSet().Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<EndEventRequest, EndEventReview>()
                   .ForMember(d => d.EndEventRequestId, o => o.MapFrom(s => s.Id))
                   .ForMember(d => d.EventId, o => o.MapFrom(s => s.EventId))
                   .ForMember(d => d.EvidenceImages, o => o.MapFrom(s => string.IsNullOrEmpty(s.EvidenceImages) ? new List<string>() : s.EvidenceImages!.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()))
                   .ForMember(d => d.EventTitle, o => o.MapFrom(s => s.Event.Title))
                   .ForMember(d => d.StartTime, o => o.MapFrom(s => s.Event.StartTime))
                   .ForMember(d => d.EndTime, o => o.MapFrom(s => s.Event.EndTime))
                   .ForMember(d => d.TotalAmount, o => o.MapFrom(s => s.Event.TotalAmount))
                   .ForMember(d => d.PlatformFee, o => o.MapFrom(s => s.Event.PlatformFee))
                   .ForMember(d => d.PayoutAmount, o => o.MapFrom(s => s.Event.PayoutAmount))
                   .ForMember(d => d.OrganizerName, o => o.MapFrom(s => s.OrganizerProfile.ContactName ?? s.OrganizerProfile.ContactEmail))
                   .ForMember(d => d.ContactEmail, o => o.MapFrom(s => s.OrganizerProfile.ContactEmail))
                   .ForMember(d => d.ContactPhone, o => o.MapFrom(s => s.OrganizerProfile.ContactPhone))
                   .ForMember(d => d.BankName, o => o.MapFrom(s => s.PaymentInformation.BankName))
                   .ForMember(d => d.AccountHolderName, o => o.MapFrom(s => s.PaymentInformation.AccountHolderName))
                   .ForMember(d => d.AccountNumber, o => o.MapFrom(s => s.PaymentInformation.AccountNumber));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _eventService.GetEndEventRequestByIdAsync(Guid.NewGuid());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("End event request not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID03_GetEndEventRequestByIdAsync_Found_ShouldReturnMappedReview()
        {
            // Arrange
            var id = Guid.NewGuid();
            var organizer = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org", ContactEmail = "org@ex.com", ContactPhone = "0123", Address = "addr" };
            var payment = new PaymentInformation { Id = Guid.NewGuid(), UserId = organizer.UserId, AccountHolderName = "Holder", AccountNumber = "123", BankName = "Bank", BankBin = "001" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "Event", Description = "Desc", StartTime = DateTime.UtcNow.AddDays(-3), EndTime = DateTime.UtcNow.AddDays(-1), TotalAmount = 100, PlatformFee = 10, PayoutAmount = 90 };
            var entity = new EndEventRequest { Id = id, EventId = ev.Id, OrganizerProfileId = organizer.Id, PaymentInformationId = payment.Id, Status = EndEventStatus.PendingApprovalEnd, Summary = "sum", AdminNote = "note", EvidenceImages = "a, b", Event = ev, OrganizerProfile = organizer, PaymentInformation = payment, CreatedAt = DateTimeOffset.UtcNow };

            var list = new List<EndEventRequest> { entity }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(list.Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<EndEventRequest, EndEventReview>()
                   .ForMember(d => d.EndEventRequestId, o => o.MapFrom(s => s.Id))
                   .ForMember(d => d.EventId, o => o.MapFrom(s => s.EventId))
                   .ForMember(d => d.EvidenceImages, o => o.MapFrom(s => string.IsNullOrEmpty(s.EvidenceImages) ? new List<string>() : s.EvidenceImages!.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()))
                   .ForMember(d => d.EventTitle, o => o.MapFrom(s => s.Event.Title))
                   .ForMember(d => d.StartTime, o => o.MapFrom(s => s.Event.StartTime))
                   .ForMember(d => d.EndTime, o => o.MapFrom(s => s.Event.EndTime))
                   .ForMember(d => d.TotalAmount, o => o.MapFrom(s => s.Event.TotalAmount))
                   .ForMember(d => d.PlatformFee, o => o.MapFrom(s => s.Event.PlatformFee))
                   .ForMember(d => d.PayoutAmount, o => o.MapFrom(s => s.Event.PayoutAmount))
                   .ForMember(d => d.OrganizerName, o => o.MapFrom(s => s.OrganizerProfile.ContactName ?? s.OrganizerProfile.ContactEmail))
                   .ForMember(d => d.ContactEmail, o => o.MapFrom(s => s.OrganizerProfile.ContactEmail))
                   .ForMember(d => d.ContactPhone, o => o.MapFrom(s => s.OrganizerProfile.ContactPhone))
                   .ForMember(d => d.BankName, o => o.MapFrom(s => s.PaymentInformation.BankName))
                   .ForMember(d => d.AccountHolderName, o => o.MapFrom(s => s.PaymentInformation.AccountHolderName))
                   .ForMember(d => d.AccountNumber, o => o.MapFrom(s => s.PaymentInformation.AccountNumber));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _eventService.GetEndEventRequestByIdAsync(id);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.EndEventRequestId.Should().Be(id);
            result.Value!.EvidenceImages.Should().BeEquivalentTo(new[] { "a", "b" });
            result.Value!.EventTitle.Should().Be("Event");
            result.Value!.OrganizerName.Should().Be("Org");
            result.Value!.BankName.Should().Be("Bank");
        }

        [Fact]
        public async Task UTCID04_GetEndEventRequestByIdAsync_Boundary_EvidenceImagesNull_ShouldReturnEmptyList()
        {
            // Arrange
            var id = Guid.NewGuid();
            var organizer = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = null!, ContactEmail = "org@ex.com", ContactPhone = "0123", Address = "addr" };
            var payment = new PaymentInformation { Id = Guid.NewGuid(), UserId = organizer.UserId, AccountHolderName = "Holder", AccountNumber = "123", BankName = "Bank", BankBin = "001" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "Event", Description = "Desc", StartTime = DateTime.UtcNow.AddDays(-3), EndTime = DateTime.UtcNow.AddDays(-1), TotalAmount = 100 };
            var entity = new EndEventRequest { Id = id, EventId = ev.Id, OrganizerProfileId = organizer.Id, PaymentInformationId = payment.Id, Status = EndEventStatus.PendingApprovalEnd, EvidenceImages = null, Event = ev, OrganizerProfile = organizer, PaymentInformation = payment, CreatedAt = DateTimeOffset.UtcNow };

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { entity }.AsQueryable().BuildMockDbSet().Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<EndEventRequest, EndEventReview>()
                   .ForMember(d => d.EndEventRequestId, o => o.MapFrom(s => s.Id))
                   .ForMember(d => d.EventId, o => o.MapFrom(s => s.EventId))
                   .ForMember(d => d.EvidenceImages, o => o.MapFrom(s => string.IsNullOrEmpty(s.EvidenceImages) ? new List<string>() : s.EvidenceImages!.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()))
                   .ForMember(d => d.EventTitle, o => o.MapFrom(s => s.Event.Title))
                   .ForMember(d => d.StartTime, o => o.MapFrom(s => s.Event.StartTime))
                   .ForMember(d => d.EndTime, o => o.MapFrom(s => s.Event.EndTime))
                   .ForMember(d => d.TotalAmount, o => o.MapFrom(s => s.Event.TotalAmount))
                   .ForMember(d => d.OrganizerName, o => o.MapFrom(s => s.OrganizerProfile.ContactName ?? s.OrganizerProfile.ContactEmail))
                   .ForMember(d => d.ContactEmail, o => o.MapFrom(s => s.OrganizerProfile.ContactEmail))
                   .ForMember(d => d.ContactPhone, o => o.MapFrom(s => s.OrganizerProfile.ContactPhone))
                   .ForMember(d => d.BankName, o => o.MapFrom(s => s.PaymentInformation.BankName))
                   .ForMember(d => d.AccountHolderName, o => o.MapFrom(s => s.PaymentInformation.AccountHolderName))
                   .ForMember(d => d.AccountNumber, o => o.MapFrom(s => s.PaymentInformation.AccountNumber));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _eventService.GetEndEventRequestByIdAsync(id);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.EvidenceImages.Should().NotBeNull();
            result.Value!.EvidenceImages.Should().HaveCount(0);
            result.Value!.OrganizerName.Should().Be("org@ex.com");
        }

        #endregion

       #region GetEndEventRequests

        [Fact]
        public async Task UTCID01_GetEndEventRequestsAsync_StatusNull_ShouldReturnAllNonDeletedPaged()
        {
            // Arrange
            var org = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org A", ContactEmail = "orga@ex.com", ContactPhone = "1", Address = "addr" };
            var ev1 = new Event { Id = Guid.NewGuid(), Title = "E1", Description = "D", StartTime = DateTime.UtcNow.AddDays(-3), EndTime = DateTime.UtcNow.AddDays(-2), TotalAmount = 10, PlatformFee = 1, PayoutAmount = 9 };
            var ev2 = new Event { Id = Guid.NewGuid(), Title = "E2", Description = "D", StartTime = DateTime.UtcNow.AddDays(-2), EndTime = DateTime.UtcNow.AddDays(-1), TotalAmount = 20, PlatformFee = 2, PayoutAmount = 18 };
            var r1 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev1.Id, Status = EndEventStatus.PendingApprovalEnd, EvidenceImages = "a, b", CreatedAt = DateTimeOffset.UtcNow.AddDays(-2), OrganizerProfile = org, Event = ev1 };
            var r2 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev2.Id, Status = EndEventStatus.Approved, EvidenceImages = null, CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), OrganizerProfile = org, Event = ev2 };
            var set = new List<EndEventRequest> { r1, r2 }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(null, null, null, 1, 10);

            // Assert
            result.Value!.Items.Should().HaveCount(2);
            result.Value.TotalItems.Should().Be(2);
            result.Value.Items.Any(i => i.EvidenceImages.Count == 2).Should().BeTrue();
            result.Value.Items.Any(i => i.EvidenceImages.Count == 0).Should().BeTrue();
        }

        [Fact]
        public async Task UTCID02_GetEndEventRequestsAsync_FilterByOrganizer_ShouldReturnOnlyOrganizerItems()
        {
            // Arrange
            var org1 = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org1", ContactEmail = "o1@ex.com", ContactPhone = "1", Address = "addr" };
            var org2 = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org2", ContactEmail = "o2@ex.com", ContactPhone = "2", Address = "addr" };
            var ev1 = new Event { Id = Guid.NewGuid(), Title = "E1", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var ev2 = new Event { Id = Guid.NewGuid(), Title = "E2", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var r1 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org1.Id, EventId = ev1.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org1, Event = ev1 };
            var r2 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org2.Id, EventId = ev2.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org2, Event = ev2 };
            var set = new List<EndEventRequest> { r1, r2 }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(org1.Id, null, null, 1, 10);

            // Assert
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().OrganizerName.Should().Be("Org1");
        }

        [Fact]
        public async Task UTCID03_GetEndEventRequestsAsync_FilterByEmptyOrganizer_ShouldNotFilterByOrganizer()
        {
            // Arrange
            var org = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org", ContactEmail = "o@ex.com", ContactPhone = "1", Address = "addr" };
            var ev1 = new Event { Id = Guid.NewGuid(), Title = "E1", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var ev2 = new Event { Id = Guid.NewGuid(), Title = "E2", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var r1 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev1.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org, Event = ev1 };
            var r2 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev2.Id, Status = EndEventStatus.Approved, OrganizerProfile = org, Event = ev2 };
            var set = new List<EndEventRequest> { r1, r2 }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(Guid.Empty, null, EndEventStatus.Approved, 1, 10);

            // Assert
            result.Value!.Items.Should().HaveCount(1);
            result.Value.TotalItems.Should().Be(1);
            result.Value.Items.First().Status.Should().Be(EndEventStatus.Approved);
        }

        [Fact]
        public async Task UTCID04_GetEndEventRequestsAsync_FilterByStatus_ShouldReturnMatching()
        {
            // Arrange
            var org = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org", ContactEmail = "o@ex.com", ContactPhone = "1", Address = "addr" };
            var ev1 = new Event { Id = Guid.NewGuid(), Title = "E1", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var ev2 = new Event { Id = Guid.NewGuid(), Title = "E2", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var r1 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev1.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org, Event = ev1 };
            var r2 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev2.Id, Status = EndEventStatus.Rejected, OrganizerProfile = org, Event = ev2 };
            var set = new List<EndEventRequest> { r1, r2 }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(null, null, EndEventStatus.Rejected, 1, 10);

            // Assert
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Status.Should().Be(EndEventStatus.Rejected);
        }

        [Fact]
        public async Task UTCID05_GetEndEventRequestsAsync_ExcludeDeleted_ShouldNotIncludeDeleted()
        {
            // Arrange
            var org = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org", ContactEmail = "o@ex.com", ContactPhone = "1", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "E", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var r1 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org, Event = ev, IsDeleted = true };
            var r2 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org, Event = ev };
            var set = new List<EndEventRequest> { r1, r2 }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(null, null, null, 1, 10);

            // Assert
            result.Value!.Items.Should().HaveCount(1);
            result.Value.TotalItems.Should().Be(1);
        }

        [Fact]
        public async Task UTCID06_GetEndEventRequestsAsync_OrderAndPaging_Page1Size1_ShouldReturnFirstByCreatedAt()
        {
            // Arrange
            var org = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org", ContactEmail = "o@ex.com", ContactPhone = "1", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "E", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var ev2 = new Event { Id = Guid.NewGuid(), Title = "E", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var older = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, CreatedAt = DateTimeOffset.UtcNow.AddDays(-2), OrganizerProfile = org, Event = ev };
            var newer = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), OrganizerProfile = org, Event = ev2 };
            var set = new List<EndEventRequest> { newer, older }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(null, null, null, 1, 1);

            // Assert
            result.Value!.Items.Should().HaveCount(1);
            result.Value.TotalItems.Should().Be(2);
            result.Value.Items.First().EndEventRequestId.Should().Be(older.Id);
        }

        [Fact]
        public async Task UTCID07_GetEndEventRequestsAsync_PageNumberExceedsTotal_ShouldReturnEmpty()
        {
            // Arrange
            var org = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org", ContactEmail = "o@ex.com", ContactPhone = "1", Address = "addr" };
            var ev = new Event { Id = Guid.NewGuid(), Title = "E", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var r = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, CreatedAt = DateTimeOffset.UtcNow, OrganizerProfile = org, Event = ev };
            var set = new List<EndEventRequest> { r }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(null, null, null, 10, 10);

            // Assert
            result.Value!.Items.Should().HaveCount(0);
            result.Value.TotalItems.Should().Be(1);
            result.Value.CurrentPage.Should().Be(10);
            result.Value.PageSize.Should().Be(10);
        }

        [Fact]
        public async Task UTCID08_GetEndEventRequestsAsync_FilterByEventId_ShouldReturnOnlyMatchingEvent()
        {
            // Arrange
            var org = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org", ContactEmail = "o@ex.com", ContactPhone = "1", Address = "addr" };
            var ev1 = new Event { Id = Guid.NewGuid(), Title = "E1", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var ev2 = new Event { Id = Guid.NewGuid(), Title = "E2", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var r1 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev1.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org, Event = ev1 };
            var r2 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev2.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org, Event = ev2 };
            var set = new List<EndEventRequest> { r1, r2 }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(null, ev1.Id, null, 1, 10);

            // Assert
            result.Value!.Items.Should().HaveCount(1);
            result.Value.TotalItems.Should().Be(1);
            result.Value.Items.First().EventId.Should().Be(ev1.Id);
            result.Value.Items.First().EventTitle.Should().Be("E1");
        }

        [Fact]
        public async Task UTCID09_GetEndEventRequestsAsync_FilterByEmptyEventId_ShouldNotFilterByEventId()
        {
            // Arrange
            var org = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.PrivateCompany, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Medium, OrganizerType = OrganizerType.Business, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "Org", ContactEmail = "o@ex.com", ContactPhone = "1", Address = "addr" };
            var ev1 = new Event { Id = Guid.NewGuid(), Title = "E1", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var ev2 = new Event { Id = Guid.NewGuid(), Title = "E2", Description = "D", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow, TotalAmount = 0 };
            var r1 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev1.Id, Status = EndEventStatus.PendingApprovalEnd, OrganizerProfile = org, Event = ev1 };
            var r2 = new EndEventRequest { Id = Guid.NewGuid(), OrganizerProfileId = org.Id, EventId = ev2.Id, Status = EndEventStatus.Approved, OrganizerProfile = org, Event = ev2 };
            var set = new List<EndEventRequest> { r1, r2 }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>())).Returns(set.Object);

            // Act
            var result = await _eventService.GetEndEventRequestsAsync(null, Guid.Empty, null, 1, 10);

            // Assert
            result.Value!.Items.Should().HaveCount(2);
            result.Value.TotalItems.Should().Be(2);
        }

        #endregion

       #region ConfirmEndEvent

        [Fact]
        public async Task UTCID01_ConfirmEndEventAsync_NullRequest_ShouldReturnInvalidInput()
        {
            // Act
            var result = await _eventService.ConfirmEndEventAsync(null!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID02_ConfirmEndEventAsync_EndEventRequestNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var req = new ApproveEndEventRequest { EndEventRequestId = Guid.NewGuid(), Status = ConfirmStatus.Approved };

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEndEventAsync(req);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("EndEventRequest not found or already processed");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID03_ConfirmEndEventAsync_EventNotFoundOrProcessed_ShouldReturnNotFound()
        {
            // Arrange
            var endReq = new EndEventRequest { Id = Guid.NewGuid(), EventId = Guid.NewGuid(), Status = EndEventStatus.PendingApprovalEnd, IsLatest = true, IsDeleted = false };
            var req = new ApproveEndEventRequest { EndEventRequestId = endReq.Id, Status = ConfirmStatus.Approved };

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { endReq }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEndEventAsync(req);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or already processed");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID04_ConfirmEndEventAsync_EventNotOverYet_ShouldReturnInvalidInput()
        {
            // Arrange
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-1), EndTime = DateTime.UtcNow.AddHours(1), Publish = true, Status = EventStatus.PendingApprovalEnd };
            var endReq = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, IsLatest = true, IsDeleted = false, Event = ev };
            var req = new ApproveEndEventRequest { EndEventRequestId = endReq.Id, Status = ConfirmStatus.Approved };

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { endReq }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEndEventAsync(req);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event is not over yet");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID05_ConfirmEndEventAsync_EventNotPublished_ShouldReturnInvalidInput()
        {
            // Arrange
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-2), EndTime = DateTime.UtcNow.AddHours(-1), Publish = false, Status = EventStatus.PendingApprovalEnd };
            var endReq = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, IsLatest = true, IsDeleted = false, Event = ev };
            var req = new ApproveEndEventRequest { EndEventRequestId = endReq.Id, Status = ConfirmStatus.Approved };

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { endReq }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEndEventAsync(req);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can only confirm end event request for published events");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID06_ConfirmEndEventAsync_Approve_Success_ComputesFeesAndUpdatesStatuses()
        {
            // Arrange
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.PendingApprovalEnd, TotalAmount = 1_000_000m };
            var endReq = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, IsLatest = true, IsDeleted = false, Event = ev };
            var req = new ApproveEndEventRequest { EndEventRequestId = endReq.Id, Status = ConfirmStatus.Approved };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { endReq }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.UpdateAsync(It.IsAny<EndEventRequest>()));
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.ConfirmEndEventAsync(req);

            // Assert
            result.IsSuccess.Should().BeTrue();
            var expectedPlatformFee = ev.TotalAmount * 0.066m + 45000m;
            var expectedNet = ev.TotalAmount - expectedPlatformFee;
            _mockUnitOfWork.Verify(x => x.EndEventRequestRepository.UpdateAsync(It.Is<EndEventRequest>(r => 
                r.Status == EndEventStatus.Approved && 
                r.ReviewedAt.HasValue &&
                r.Event != null &&
                r.Event.PlatformFee == expectedPlatformFee && 
                r.Event.PayoutAmount == expectedNet && 
                r.Event.Status == EventStatus.WaitingForPayout)), Times.Once());
        }

        [Fact]
        public async Task UTCID07_ConfirmEndEventAsync_Reject_WithoutAdminNote_ShouldReturnInvalidInput()
        {
            // Arrange
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.PendingApprovalEnd };
            var endReq = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, IsLatest = true, IsDeleted = false, Event = ev };
            var req = new ApproveEndEventRequest { EndEventRequestId = endReq.Id, Status = ConfirmStatus.Rejected, AdminNote = null };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { endReq }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _eventService.ConfirmEndEventAsync(req);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Admin note is required when rejecting request");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID08_ConfirmEndEventAsync_Reject_Success_UpdatesStatusesAndNoteTrimmed()
        {
            // Arrange
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-3), EndTime = DateTime.UtcNow.AddDays(-1), Publish = true, Status = EventStatus.PendingApprovalEnd };
            var endReq = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, IsLatest = true, IsDeleted = false, Event = ev };
            var req = new ApproveEndEventRequest { EndEventRequestId = endReq.Id, Status = ConfirmStatus.Rejected, AdminNote = "  need more info  " };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { endReq }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.UpdateAsync(It.IsAny<EndEventRequest>()));
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.ConfirmEndEventAsync(req);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EndEventRequestRepository.UpdateAsync(It.Is<EndEventRequest>(r => 
                r.Status == EndEventStatus.Rejected && 
                r.AdminNote == "need more info" && 
                r.ReviewedAt.HasValue &&
                r.Event != null &&
                r.Event.Status == EventStatus.RejectEnded)), Times.Once());
        }

        [Fact]
        public async Task UTCID09_ConfirmEndEventAsync_Boundary_EndTimeEqualsNow_ShouldPassConstraints()
        {
            // Arrange
            var ev = new Event { Id = Guid.NewGuid(), Title = "t", Description = "d", StartTime = DateTime.UtcNow.AddDays(-2), EndTime = DateTime.UtcNow, Publish = true, Status = EventStatus.PendingApprovalEnd, TotalAmount = 0m };
            var endReq = new EndEventRequest { Id = Guid.NewGuid(), EventId = ev.Id, Status = EndEventStatus.PendingApprovalEnd, IsLatest = true, IsDeleted = false, Event = ev };
            var req = new ApproveEndEventRequest { EndEventRequestId = endReq.Id, Status = ConfirmStatus.Approved };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.Query(It.IsAny<bool>()))
                .Returns(new List<EndEventRequest> { endReq }.AsQueryable().BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(x => x.EndEventRequestRepository.UpdateAsync(It.IsAny<EndEventRequest>()));
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.ConfirmEndEventAsync(req);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EndEventRequestRepository.UpdateAsync(It.Is<EndEventRequest>(r => 
                r.Event != null &&
                r.Event.PlatformFee == 45000m && 
                r.Event.PayoutAmount == -45000m)), Times.Once());
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 5);

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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
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
                   TicketTypes = new List<TicketType>
                   {
                       new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 50 }
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = categoryId1,
                   EventCategory = eventCategory1,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
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
                   TicketPricingType = TicketPricingType.Free,
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
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
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
                   TicketPricingType = TicketPricingType.Free,
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
                   TicketPricingType = TicketPricingType.Free,
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Paid Event",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Paid,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 100 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, TicketPricingType.Free, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().TicketPricingType.Should().Be(TicketPricingType.Free);
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               },
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Paid Event",
                   Description = "Description 2",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Paid,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 100 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, TicketPricingType.Paid, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().TicketPricingType.Should().Be(TicketPricingType.Paid);
       }

       [Fact]
       public async Task UTCID10_GetEventAsync_WithDistrictFilterCaseInsensitive_ShouldReturnFilteredEvents()
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   District = "Ho Chi Minh",
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                    District = "Quận 1",
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   EndTime = DateTime.Now.AddHours(3),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
           var now = DateTime.Now;
           var today = now.Date;
           var diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
           var startOfWeek = today.AddDays(-diff);
           var endOfWeek = startOfWeek.AddDays(7).AddTicks(-1);
           // Event in the future within this week
           var eventInWeek = now.AddSeconds(1);
           var eventOutsideWeek = endOfWeek.AddDays(2);
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
           var thisMonth = today.AddHours(10);
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   Status = EventStatus.Approved,
                   DeletedAt = DateTime.Now.AddDays(-1), // Deleted
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   Status = EventStatus.PendingApproval, // Not approved
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 75,
                   SoldQuantity = 0,
                   LocationName = "Location 3",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = categoryId,
                   EventCategory = eventCategory,
                   District = "Ho Chi Minh",
                   TicketPricingType = TicketPricingType.Paid,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
                   District = "Quận 1",
                   TicketPricingType = TicketPricingType.Paid,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag> { new EventTag { TagId = tagId, Tag = tag } },
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 50 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           var tagRequest = new List<EventTagRequest> { new EventTagRequest { TagId = tagId } };

           // Act
           var result = await _eventService.GetEventAsync(null, "rock", categoryId.ToString(), tagRequest, TicketPricingType.Paid, "chi minh", null, 1, 5);

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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location 1",
                   Publish = true,
                   CreatedAt = DateTime.Now.AddMinutes(-2),
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
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 50,
                   SoldQuantity = 0,
                   LocationName = "Location 2",
                   Publish = true,
                   CreatedAt = DateTime.Now.AddMinutes(-1),
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard Ticket", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 1);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.TotalItems.Should().Be(2);
           result.Value.PageSize.Should().Be(1);
       }

       // UTCID20: GetEventAsync with userId = Guid.Empty - Should not show favorite
       [Fact]
       public async Task UTCID20_GetEventAsync_WithEmptyGuidUserId_ShouldNotShowFavorite()
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
                   Title = "Test Event",
                   Description = "Description",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(userId, null, null, null!, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().IsFavorite.Should().BeFalse();
       }

       // UTCID21: GetEventAsync with TicketTypes = null - Should return 0 for TicketPrice
       [Fact]
       public async Task UTCID21_GetEventAsync_WithNullTicketTypes_ShouldReturnZeroPrice()
       {
           // Arrange
           var futureDate = DateTime.Now.AddDays(10);
           var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Test Event",
                   Description = "Description",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = null! // Null TicketTypes
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().TicketPrice.Should().Be(0);
       }

       // UTCID22: GetEventAsync with empty ImgListEvent - Should return empty list
       [Fact]
       public async Task UTCID22_GetEventAsync_WithEmptyImgListEvent_ShouldReturnEmptyImageList()
       {
           // Arrange
           var futureDate = DateTime.Now.AddDays(10);
           var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };

           var events = new List<Event>
           {
               new Event
               {
                   Id = Guid.NewGuid(),
                   Title = "Test Event",
                   Description = "Description",
                   StartTime = futureDate,
                   EndTime = futureDate.AddHours(2),
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 0,
                   LocationName = "Location",
                   Publish = true,
                   CreatedAt = DateTime.Now,
                   ImgListEvent = "", // Empty ImgListEvent
                   EventTags = new List<EventTag>(),
                   FavoriteEvents = new List<FavoriteEvent>(),
                   TicketTypes = new List<TicketType> { new TicketType { TicketName = "Standard", TicketQuantity = 100, TicketPrice = 0 } }
               }
           }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetEventAsync(null, null, null, null!, null, null, null, 1, 5);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().ImgListEvent.Should().BeEmpty();
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
                   Status = EventStatus.Approved,
                   DeletedAt = null,
                   EventCategoryId = eventCategory.Id,
                   EventCategory = eventCategory,
                   OrganizerProfileId = Guid.NewGuid(),
                   TicketPricingType = TicketPricingType.Free,
                   TotalTickets = 100,
                   SoldQuantity = 20,
                   LocationName = "Test Location",
                    District = "Quận 7",
                   Publish = true,
                   CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           var organizerId = Guid.NewGuid();
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
           var organizerId = Guid.NewGuid();
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
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           var organizerId = Guid.NewGuid();
           var differentOrganizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = differentOrganizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           result.Error!.Message.Should().Contain("Title is required");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID08: Publish validation - EndTime before StartTime - Failure
       [Fact]
       public async Task UTCID08_UpdateEventAsync_WithPublishAndEndTimeBeforeStartTime_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var startTime = DateTime.Now.AddDays(5);
           var endTime = DateTime.Now.AddDays(3);

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
           result.Error!.Message.Should().Contain("EndTime must be after StartTime");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID09: Publish validation - SaleEndTime after event StartTime - Failure
       [Fact]
       public async Task UTCID09_UpdateEventAsync_WithPublishAndSaleEndTimeAfterStartTime_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var startTime = DateTime.Now.AddDays(5);
           var saleEndTime = DateTime.Now.AddDays(6);

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
               SaleStartTime = DateTime.Now.AddDays(1),
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
           result.Error!.Message.Should().Contain("SaleEndTime cannot be after event StartTime");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }


       // UTCID10: Publish validation - Missing evidence - Failure
       [Fact]
       public async Task UTCID10_UpdateEventAsync_WithPublishAndMissingEvidence_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "", // Missing evidence
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               EventCategoryId = Guid.NewGuid(),
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
           result.Error!.Message.Should().Contain("Evidence is required when publishing an event");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

        // UTCID11: Publish validation - Missing images - Failure
        [Fact]
       public async Task UTCID11_UpdateEventAsync_WithPublishAndNoImages_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "", // Missing images
               ImgListEvidences = "evidence1.jpg",
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               EventCategoryId = Guid.NewGuid(),
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
           result.Error!.Message.Should().Contain("At least one event image is required");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID12: Publish validation - No ticket details - Failure
       [Fact]
       public async Task UTCID12_UpdateEventAsync_WithPublishAndNoTicketTypes_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               EventCategoryId = Guid.NewGuid(),
               TicketTypes = new List<TicketType>(),
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
           result.Error!.Message.Should().Contain("At least one ticket type is required");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }


       // UTCID13: Publish validation - Valid data with Publish=true - Success
       [Fact]
       public async Task UTCID13_UpdateEventAsync_WithValidPublishData_ShouldSetPublishAndStatus()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               EventCategoryId = Guid.NewGuid(),
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
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns((UpdateEventRequest req, Event ev) => {
               ev.Publish = req.Publish ?? ev.Publish;
               return ev;
           });

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

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
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();

           var updateRequest = new UpdateEventRequest
           {
               TicketTypes = new List<TicketTypeRequest>
               {
                   new TicketTypeRequest
                   {
                       Id = null, // New ticket
                       TicketName = "New Ticket",
                       TicketPrice = 50,
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
           _mockMapper.Setup(x => x.Map<TicketType>(It.IsAny<TicketTypeRequest>())).Returns(newTicket);

           _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

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
           var organizerId = Guid.NewGuid();
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
                       TicketPrice = 75,
                       TicketQuantity = 150
                   }
               }
           };

           var existingTicket = new TicketType
           {
               Id = ticketId,
               TicketName = "Original Ticket",
               TicketPrice = 50,
               TicketQuantity = 100,
               SoldQuantity = 10
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
            var organizerId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var ticketToRemoveId = Guid.NewGuid();

            var updateRequest = new UpdateEventRequest
            {
                RemoveTicketTypeIds = new List<Guid> { ticketToRemoveId }
            };

            var ticketToRemove = new TicketType
            {
                Id = ticketToRemoveId,
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
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(2),
                Publish = false,
                IsDeleted = false,
                ImgListEvent = "image1.jpg",
                TicketTypes = new List<TicketType>
               {
                   ticketToRemove,
                   new TicketType { Id = Guid.NewGuid(), TicketName = "Keep Ticket", TicketQuantity = 100 }
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
            _mockMapper.Setup(x => x.Map(updateRequest, existingEvent)).Returns(existingEvent);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

            // Act
            var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
            existingEvent.TicketTypes.Should().HaveCount(1); // Should remove the ticket
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
        }

        // UTCID19: Add new tag - Success
        [Fact]
       public async Task UTCID19_UpdateEventAsync_WithAddNewTag_ShouldAddTag()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 0,
               EventCategoryId = Guid.NewGuid(),
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
           result.Error!.Message.Should().Contain("TotalTickets must be greater than 0");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID22: Publish validation - Missing EventCategoryId
       [Fact]
       public async Task UTCID22_UpdateEventAsync_WithPublishAndMissingEventCategoryId_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Test Location",
               District = "Test District",
               Address = "Test Address",
               ImgListEvent = "image1.jpg",
               ImgListEvidences = "evidence1.jpg",
               TicketPricingType = TicketPricingType.Free,
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
           result.Error!.Message.Should().Contain("EventCategoryId is required");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID23: Add evidence images - Success
       [Fact]
       public async Task UTCID23_UpdateEventAsync_WithAddEvidence_ShouldUploadAndAddEvidence()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var booking = new Booking
           {
               Id = Guid.NewGuid(),
               EventId = eventId,
               Status = BookingStatus.Pending
           };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               Publish = true,
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
           result.Error!.Message.Should().Be("Cannot update published event that has existing bookings");
           result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
       }

       // UTCID25: Published event without active bookings (Cancelled only) - Success
       [Fact]
       public async Task UTCID25_UpdateEventAsync_WithPublishedEventAndOnlyCancelledBookings_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };
           var booking = new Booking { Id = Guid.NewGuid(), EventId = eventId, Status = BookingStatus.Cancelled };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test",
               Description = "Test",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               Publish = true,
               IsDeleted = false,
               Bookings = new List<Booking> { booking },
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

       // UTCID26: Published event without any bookings - Success
       [Fact]
       public async Task UTCID26_UpdateEventAsync_WithPublishedEventAndNoBookings_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Title = "Updated Title" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test",
               Description = "Test",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               Publish = true,
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

       // UTCID27: Publish validation - Missing Description
       [Fact]
       public async Task UTCID27_UpdateEventAsync_WithPublishAndMissingDescription_ShouldReturnFailure()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Publish = true, Description = "" };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test",
               Description = "",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Location",
               District = "District",
               Address = "Address",
               ImgListEvent = "image.jpg",
               ImgListEvidences = "evidence.jpg",
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               EventCategoryId = Guid.NewGuid(),
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
           };

           var eventQueryable = new List<Event> { existingEvent }.AsQueryable().BuildMock();
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(false)).Returns(eventQueryable);

           // Act
           var result = await _eventService.UpdateEventAsync(organizerId, eventId, updateRequest);

           // Assert
           result.IsSuccess.Should().BeFalse();
           result.Error!.Message.Should().Contain("Description is required");
       }


       // UTCID28: Publish validation - TotalTickets boundary value = 1
       [Fact]
       public async Task UTCID28_UpdateEventAsync_WithPublishAndTotalTicketsEqualOne_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
           var eventId = Guid.NewGuid();
           var updateRequest = new UpdateEventRequest { Publish = true, TotalTickets = 1 };

           var existingEvent = new Event
           {
               Id = eventId,
               OrganizerProfileId = organizerId,
               Title = "Test",
               Description = "Test",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
               SaleStartTime = DateTime.Now.AddDays(1),
               SaleEndTime = DateTime.Now.AddDays(4),
               LocationName = "Location",
               District = "District",
               Address = "Address",
               ImgListEvent = "image.jpg",
               ImgListEvidences = "evidence.jpg",
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 1,
               EventCategoryId = Guid.NewGuid(),
               TicketTypes = new List<TicketType> { new TicketType { Id = Guid.NewGuid(), TicketName = "Standard", TicketQuantity = 100 } },
               EventTags = new List<EventTag> { new EventTag { EventId = eventId, TagId = Guid.NewGuid() } }
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
       }

       // UTCID29: Update with add and remove images simultaneously - Success
       [Fact]
       public async Task UTCID29_UpdateEventAsync_WithAddAndRemoveImagesSimultaneously_ShouldUpdateImages()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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

        // UTCID30: Update without Publish - Success
        [Fact]
       public async Task UTCID30_UpdateEventAsync_WithoutPublish_ShouldReturnSuccess()
       {
           // Arrange
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(2),
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

       #endregion

       #region DeleteEventAsync Tests

       [Fact]
       public async Task UTCID01_DeleteEventAsync_WithValidEventWithoutBookings_ShouldReturnSuccess()
       {
           // Arrange
           var eventId = Guid.NewGuid();
           var organizerId = Guid.NewGuid();
           var organizerUserId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               DeletedAt = null,
               IsDeleted = false,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();

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
           var organizerId = Guid.NewGuid();

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
           var organizerId = Guid.NewGuid();

           var deletedEvent = new Event
           {
               Id = eventId,
               Title = "Deleted Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               DeletedAt = DateTime.Now.AddDays(-1),
               IsDeleted = true,
               CreatedAt = DateTime.Now.AddDays(-10)
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
           var actualOrganizerId = Guid.NewGuid();
           var unauthorizedOrganizerId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = actualOrganizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               DeletedAt = null,
               IsDeleted = false,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Test Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
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
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var reasonCancel = "Test cancellation";

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Free Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var reasonCancel = "Test cancellation";

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Paid Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
           var organizerUserId = Guid.NewGuid();
           var userId = Guid.NewGuid();
           var reasonCancel = "Test cancellation";

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Paid Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
           var userId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Unpublished Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = false, // Unpublished event
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
           var userId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Event with Cancelled Bookings",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 100,
               SoldQuantity = 10,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();

           var existingEvent = new Event
           {
               Id = eventId,
               Title = "Published Event",
               Description = "Test Description",
               StartTime = DateTime.Now.AddDays(5),
               EndTime = DateTime.Now.AddDays(5).AddHours(3),
               OrganizerProfileId = organizerId,
               EventCategoryId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               DeletedAt = null,
               IsDeleted = false,
               Publish = true, // Published event
               CreatedAt = DateTime.Now,
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
                District = "Quận 1",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
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
               District = "Quận 7",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.Now,
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
               District = "Quận 1",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
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
                District = "Quận 7",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.Now,
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
               District = "Quận 1",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.Now,
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
               EventCategoryId = Guid.NewGuid(),
               District = "Quận 1", // Same District
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.Now,
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
                District = "Quận 1",
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               Publish = true,
               CreatedAt = DateTime.Now,
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
               EventCategoryId = Guid.NewGuid(), // Different category
                District = "Quận 7", // Different District
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var futureDate = DateTime.Now.AddDays(10);

           var event1 = new Event
           {
               Id = Guid.NewGuid(),
               Title = "Event 1",
               Description = "Description 1",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = Guid.NewGuid(),
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 1",
               Publish = true,
               CreatedAt = DateTime.Now,
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
               EventCategoryId = Guid.NewGuid(),
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.Now,
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
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var futureDate = DateTime.Now.AddDays(10);

           var targetEvent = new Event
           {
               Id = eventId,
               Title = "Target Event",
               Description = "Target Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = Guid.NewGuid(),
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               DeletedAt = DateTime.Now, // Deleted
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var futureDate = DateTime.Now.AddDays(10);

           var targetEvent = new Event
           {
               Id = eventId,
               Title = "Target Event",
               Description = "Target Description",
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = Guid.NewGuid(),
               Status = EventStatus.Approved,
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.PendingApproval, // Not approved
               DeletedAt = null,
               OrganizerProfileId = Guid.NewGuid(),
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 2",
               Publish = true,
               CreatedAt = DateTime.Now,
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
           var organizerId = Guid.NewGuid();
           var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
           var futureDate = DateTime.Now.AddDays(10);

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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location 1",
               CreatedAt = DateTime.Now.AddDays(-2),
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
               TicketPricingType = TicketPricingType.Paid,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1),
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
           var organizerId = Guid.NewGuid();
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
           var organizerId = Guid.NewGuid();
           var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
           var futureDate = DateTime.Now.AddDays(10);

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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.Now,
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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1),
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
           var organizerId = Guid.NewGuid();
           var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
           var futureDate = DateTime.Now.AddDays(10);

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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.Now,
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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1),
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
           var organizerId1 = Guid.NewGuid();
           var organizerId2 = Guid.NewGuid();
           var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
           var futureDate = DateTime.Now.AddDays(10);

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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.Now,
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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1),
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
           var eventCategory = new EventCategory { Id = Guid.NewGuid(), CategoryName = "Music" };
           var futureDate = DateTime.Now.AddDays(10);

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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.Now,
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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { PendingApprovalEvent, approvedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.PendingApproval, 1, 10);

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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.Now,
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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { approvedEvent, PendingApprovalEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Approved, 1, 10);

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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.Now,
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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { rejectedEvent, approvedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Rejected, 1, 10);

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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.Now,
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
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1),
               TicketTypes = null!
           };

           var events = new List<Event> { organizerEvent, otherEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(organizerId, null, EventStatus.Approved, 1, 10);

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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
           };

           var events = new List<Event> { event1, event2 }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Approved, 1, 10);

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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
           };

           var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "rock", EventStatus.Approved, 1, 10);

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
               Address = "Ho Chi Minh District", // Contains "minh"
               StartTime = futureDate,
               EndTime = futureDate.AddHours(2),
               EventCategoryId = eventCategory.Id,
               EventCategory = eventCategory,
               OrganizerProfileId = Guid.NewGuid(),
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
           };

           var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "minh", EventStatus.Approved, 1, 10);

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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
           };

           var events = new List<Event> { matchingEvent, nonMatchingEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "music", EventStatus.Approved, 1, 10);

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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
           };

           var events = new List<Event> { event1, event2 }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, "", EventStatus.Approved, 1, 10);

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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
           };

           var events = new List<Event> { publishedEvent, unpublishedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Approved, 1, 10);

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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
           };

           var events = new List<Event> { activeEvent, deletedEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(Guid.Empty, null, EventStatus.Approved, 1, 10);

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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved, // Same organizer but different title
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 75,
               SoldQuantity = 0,
               LocationName = "Location 3",
               CreatedAt = DateTime.Now.AddDays(-2)
           };

           var events = new List<Event> { matchingEvent, nonMatchingEvent1, nonMatchingEvent2 }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(organizerId, "rock", EventStatus.Approved, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(1);
           result.Value.Items.First().Title.Should().Be("Rock Concert");
       }

       [Fact]
       public async Task UTCID13_GetAllEventStatusAsync_WithNullStatus_ShouldReturnAllStatusEvents()
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 100,
               SoldQuantity = 0,
               LocationName = "Location",
               CreatedAt = DateTime.Now
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
               OrganizerProfileId = Guid.NewGuid(),
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.Rejected,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
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
               OrganizerProfileId = Guid.NewGuid(),
               Publish = true,
               IsDeleted = false,
               Status = EventStatus.PendingApproval,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 75,
               SoldQuantity = 0,
               LocationName = "Location 3",
               CreatedAt = DateTime.Now.AddDays(-2)
           };

           var events = new List<Event> { approvedEvent, rejectedEvent, PendingApprovalEvent }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(null, null, null, 1, 10);

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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
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
               Status = EventStatus.Approved,
               TicketPricingType = TicketPricingType.Free,
               TotalTickets = 50,
               SoldQuantity = 0,
               LocationName = "Location 2",
               CreatedAt = DateTime.Now.AddDays(-1)
           };

           var events = new List<Event> { event1, event2 }.AsQueryable().BuildMock();

           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events);

           // Act
           var result = await _eventService.GetAllEventStatusAsync(null, null, EventStatus.Approved, 1, 10);

           // Assert
           result.Should().NotBeNull();
           result.Value!.Items.Should().HaveCount(2);
       }


       #endregion

       #region ConfirmEventAsync
       private static Event CreateEventPendingApproval(Guid id)
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
               TicketPricingType = TicketPricingType.Free,
               Status = EventStatus.PendingApproval,
               IsDeleted = false
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
               .Returns(new List<Event>().AsQueryable().BuildMock());

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
               .Returns(new List<Event> { evt }.AsQueryable().BuildMock());

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
               .Returns(new List<Event> { evt }.AsQueryable().BuildMock());

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
           var evt = CreateEventPendingApproval(Guid.NewGuid());
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMock());
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
               .ReturnsAsync((Event e) => e);
           _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

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
       }

       [Fact]
       public async Task UTCID08_ConfirmEventAsync_Approve_ShouldUpdateAndReturnSuccess()
       {
           // Arrange
           var evt = CreateEventPendingApproval(Guid.NewGuid());
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMock());
           _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
               .ReturnsAsync((Event e) => e);
           _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

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
       }

       [Fact]
       public async Task UTCID09_ConfirmEventAsync_DeletedEvent_ShouldReturnNotFound()
       {
           // Arrange
           var evt = CreateEventPendingApproval(Guid.NewGuid());
           evt.IsDeleted = true;
           _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
               .Returns(new List<Event> { evt }.AsQueryable().BuildMock());

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
               .Returns(new List<Event> { evt }.AsQueryable().BuildMock());

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

   }
}
