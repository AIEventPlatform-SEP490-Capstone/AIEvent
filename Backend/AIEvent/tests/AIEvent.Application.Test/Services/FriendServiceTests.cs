using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Friend;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class FriendServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ICacheService> _mockCacheService;
        private readonly IFriendService _friendService;

        public FriendServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            _mockCacheService = new Mock<ICacheService>();
            _friendService = new FriendService(_mockUnitOfWork.Object, _mockMapper.Object, _mockCacheService.Object);
        }

        #region AddFriendRequestAsync Tests
        [Fact]
        public async Task UTCID01_AddFriendRequest_InvalidGuid_ShouldReturnInvalidGuidFormat()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            string invalidUserId = "abc"; 

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(new List<Friendship>()
                .AsQueryable()
                .BuildMock());

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, invalidUserId);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Invalid Guid format.", result.Error.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID02_AddFriendRequest_SelfRequest_ShouldReturnCannotSendToYourself()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            string userIdSameAsSender = senderId.ToString();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(new List<Friendship>()
                .AsQueryable()
                .BuildMock());

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, userIdSameAsSender);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("You cannot send a friend request to yourself.", result.Error.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID03_AddFriendRequest_ExistingPending_ShouldReturnAlreadySent()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            var receiverId = Guid.NewGuid();
            string receiverIdString = receiverId.ToString();

            var existingFriendship = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    Status = FriendshipStatus.Pending,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(existingFriendship);

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, receiverIdString);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Friend request already sent.", result.Error.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID04_AddFriendRequest_ExistingAccepted_ShouldReturnAlreadyFriends()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            var receiverId = Guid.NewGuid();
            string receiverIdString = receiverId.ToString();

            var existingFriendship = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    Status = FriendshipStatus.Accepted,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(existingFriendship);

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, receiverIdString);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("You are already friends.", result.Error.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID05_AddFriendRequest_ExistingBlocked_ShouldReturnCannotSend()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            var receiverId = Guid.NewGuid();
            string receiverIdString = receiverId.ToString();

            var existingFriendship = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    Status = FriendshipStatus.Blocked,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(existingFriendship);

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, receiverIdString);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("You cannot send a friend request to this user.", result.Error.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID06_AddFriendRequest_ExistingUnknownStatus_ShouldReturnFriendshipAlreadyExists()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            var receiverId = Guid.NewGuid();
            string receiverIdString = receiverId.ToString();

            var unknownStatus = (FriendshipStatus)999;

            var existingFriendship = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    Status = unknownStatus,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(existingFriendship);

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, receiverIdString);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Friendship already exists.", result.Error.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID07_AddFriendRequest_ReceiverNotFound_ShouldReturnReceiverNotFound()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            var receiverId = Guid.NewGuid();
            string receiverIdString = receiverId.ToString();

            var emptyFriendshipList = new List<Friendship>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(emptyFriendshipList);

            var emptyUserList = new List<User>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository
                .Query(false))
                .Returns(emptyUserList);

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, receiverIdString);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Receiver not found.", result.Error.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID08_AddFriendRequest_Success_ShouldCreateFriendRequest()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            var receiverId = Guid.NewGuid();
            string receiverIdString = receiverId.ToString();

            var emptyFriendshipList = new List<Friendship>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(emptyFriendshipList);

            var userList = new List<User>
            {
                new User
                {
                    Id = receiverId,
                    IsActive = true,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository
                .Query(false))
                .Returns(userList);

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, receiverIdString);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Null(result.Error);  

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(It.Is<Friendship>(f =>
                f.SenderId == senderId &&
                f.ReceiverId == receiverId &&
                f.Status == FriendshipStatus.Pending
            )), Times.Once);

            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }


        [Fact]
        public async Task UTCID09_ExistingFriendshipRejected_ShouldContinueAndCreateFriendRequest()
        {
            // Arrange
            var senderId = Guid.NewGuid();
            var receiverId = Guid.NewGuid();
            string receiverIdString = receiverId.ToString();

            var existingFriendship = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    Status = FriendshipStatus.Rejected,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u =>
                u.FriendshipRepository.Query(false))
                .Returns(existingFriendship);

            var userList = new List<User>
            {
                new User
                {
                    Id = receiverId,
                    IsActive = true,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u =>
                u.UserRepository.Query(false))
                .Returns(userList);

            // Act
            var result = await _friendService.AddFriendRequestAsync(senderId, receiverIdString);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Null(result.Error);

            // Verify 
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.AddAsync(
                It.Is<Friendship>(f =>
                    f.SenderId == senderId &&
                    f.ReceiverId == receiverId &&
                    f.Status == FriendshipStatus.Pending
                )
            ), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        #endregion

        #region RespondFriendRequestAsync Tests
        [Fact]
        public async Task UTCID01_InvalidGuid_ShouldReturnInvalidInput()
        {
            // Arrange
            string invalidId = "abc";
            var userId = Guid.NewGuid();

            // Act
            var result = await _friendService.RespondFriendRequestAsync(invalidId, userId, true);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Invalid Guid format.", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify 
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(It.IsAny<bool>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.UpdateAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID02_FriendshipNotFound_ShouldReturnNotFound()
        {
            // Arrange
            string validId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var emptyList = new List<Friendship>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(emptyList);

            // Act
            var result = await _friendService.RespondFriendRequestAsync(validId, userId, true);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Friend request not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.UpdateAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID03_ReceiverNotMatch_ShouldReturnPermissionDenied()
        {
            // Arrange
            string validId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();                 
            var receiverId = Guid.NewGuid();             

            var friendship = new Friendship
            {
                Id = Guid.Parse(validId),
                ReceiverId = receiverId,                 
                IsDeleted = false,
                Status = FriendshipStatus.Pending
            };

            var friendshipList = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(friendshipList);

            // Act
            var result = await _friendService.RespondFriendRequestAsync(validId, userId, true);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("You are not authorized to respond to this request", result.Error!.Message);
            Assert.Equal(ErrorCodes.PermissionDenied, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.UpdateAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID04_StatusAccepted_ShouldReturnAlreadyProcessed()
        {
            // Arrange
            string validId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var friendship = new Friendship
            {
                Id = Guid.Parse(validId),
                ReceiverId = userId,                     
                IsDeleted = false,
                Status = FriendshipStatus.Accepted       
            };

            var list = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(list);

            // Act
            var result = await _friendService.RespondFriendRequestAsync(validId, userId, true);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("This friend request has already been processed", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.UpdateAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID05_StatusRejected_ShouldReturnAlreadyProcessed()
        {
            // Arrange
            string validId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var friendship = new Friendship
            {
                Id = Guid.Parse(validId),
                ReceiverId = userId,                     
                IsDeleted = false,
                Status = FriendshipStatus.Rejected       
            };

            var mockedList = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(mockedList);

            // Act
            var result = await _friendService.RespondFriendRequestAsync(validId, userId, true);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("This friend request has already been processed", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify 
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.UpdateAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID06_PendingAndAccept_ShouldReturnSuccess()
        {
            // Arrange
            string validId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var friendship = new Friendship
            {
                Id = Guid.Parse(validId),
                ReceiverId = userId,
                IsDeleted = false,
                Status = FriendshipStatus.Pending
            };

            var friendshipList = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(friendshipList);

            // Act
            var result = await _friendService.RespondFriendRequestAsync(validId, userId, isAccepted: true);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Null(result.Error);
            Assert.Equal(FriendshipStatus.Accepted, friendship.Status); 

            // Verify 
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.UpdateAsync(
                It.Is<Friendship>(f =>
                    f.Id == friendship.Id &&
                    f.Status == FriendshipStatus.Accepted
                )), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }


        [Fact]
        public async Task UTCID07_PendingAndReject_ShouldReturnSuccess()
        {
            // Arrange
            string validId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var friendship = new Friendship
            {
                Id = Guid.Parse(validId),
                ReceiverId = userId,
                IsDeleted = false,
                Status = FriendshipStatus.Pending
            };

            var friendshipList = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository
                .Query(false))
                .Returns(friendshipList);

            // Act
            var result = await _friendService.RespondFriendRequestAsync(validId, userId, isAccepted: false);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Null(result.Error);
            Assert.Equal(FriendshipStatus.Rejected, friendship.Status);

            // Verify 
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.UpdateAsync(
                It.Is<Friendship>(f =>
                    f.Id == friendship.Id &&
                    f.Status == FriendshipStatus.Rejected
                )), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
        #endregion

        #region DeleteFriendAsync Tests
        [Fact]
        public async Task UTCID01_InvalidGuid_ShouldReturnInvalidGuidFormat()
        {
            // Arrange
            string invalidId = "abc";
            var userId = Guid.NewGuid();

            // Act
            var result = await _friendService.DeleteFriendAsync(userId, invalidId);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Invalid Guid format.", result.Error.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(It.IsAny<bool>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.DeleteAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID02_FriendNotFound_IsDeleted_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string id = friendId.ToString();

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                SenderId = userId,
                ReceiverId = friendId,
                Status = FriendshipStatus.Accepted, 
                IsDeleted = true                    
            };

            var friendshipList = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(friendshipList);

            // Act
            var result = await _friendService.DeleteFriendAsync(userId, id);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Friend not found", result.Error.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            // Verify 
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.DeleteAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID03_FriendNotFound_StatusPending_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string id = friendId.ToString();

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                SenderId = userId,
                ReceiverId = friendId,
                Status = FriendshipStatus.Pending,
                IsDeleted = false
            };

            var friendshipList = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(friendshipList);

            // Act
            var result = await _friendService.DeleteFriendAsync(userId, id);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Friend not found", result.Error.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.DeleteAsync(It.IsAny<Friendship>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID04_SuccessDelete_StatusAccepted_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string id = friendId.ToString();

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                SenderId = userId,
                ReceiverId = friendId,
                Status = FriendshipStatus.Accepted, 
                IsDeleted = false
            };

            var friendshipList = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(friendshipList);

            // Act
            var result = await _friendService.DeleteFriendAsync(userId, id);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Null(result.Error);

            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.DeleteAsync(
                It.Is<Friendship>(f =>
                    f.Id == friendship.Id &&
                    f.SenderId == friendship.SenderId &&
                    f.ReceiverId == friendship.ReceiverId
                )), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }


        [Fact]
        public async Task UTCID05_SuccessDelete_StatusBlocked_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string id = friendId.ToString();

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                SenderId = userId,
                ReceiverId = friendId,
                Status = FriendshipStatus.Blocked, 
                IsDeleted = false
            };

            var friendshipList = new List<Friendship> { friendship }
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(friendshipList);

            // Act
            var result = await _friendService.DeleteFriendAsync(userId, id);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Null(result.Error);

            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.DeleteAsync(
                It.Is<Friendship>(f =>
                    f.Id == friendship.Id &&
                    f.Status == FriendshipStatus.Blocked
                )), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
        #endregion

        #region GetFriendProfileAsync Tests
        [Fact]
        public async Task UTCID01_GetFriendProfileAsync_InvalidGuid_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            string invalidId = "abc";

            // Act
            var result = await _friendService.GetFriendProfileAsync(userId, invalidId);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Invalid Guid format.", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(It.IsAny<bool>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(It.IsAny<bool>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.EventRepository.Query(It.IsAny<bool>()), Times.Never);
        }


        [Fact]
        public async Task UTCID02_ValidGuid_FriendNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string friendIdString = friendId.ToString();

            var emptyUserList = new List<User>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository
                .Query(false))
                .Returns(emptyUserList);

            // Act
            var result = await _friendService.GetFriendProfileAsync(userId, friendIdString);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Friend not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(It.IsAny<bool>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.EventRepository.Query(It.IsAny<bool>()), Times.Never);
        }


        [Fact]
        public async Task UTCID03_ValidGuid_FriendIsDeleted_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string friendIdString = friendId.ToString();

            var deletedUserList = new List<User>
            {
                new User
                {
                    Id = friendId,
                    IsActive = false,
                    IsDeleted = true
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository
                .Query(false))
                .Returns(deletedUserList);

            // Act
            var result = await _friendService.GetFriendProfileAsync(userId, friendIdString);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Friend not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(It.IsAny<bool>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.EventRepository.Query(It.IsAny<bool>()), Times.Never);
        }


        [Fact]
        public async Task UTCID04_FriendExists_NoFriendship_NoCommonEvent_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string friendIdString = friendId.ToString();

            var userList = new List<User>
            {
                new User
                {
                    Id = friendId,
                    IsActive = true,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            var emptyFriendshipList = new List<Friendship>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(emptyFriendshipList);

            _mockMapper.Setup(m => m.Map<FriendProfileResponse>(It.IsAny<User>()))
                .Returns(new FriendProfileResponse
                {
                    FullName = "Test User",
                    AvatarImgUrl  = null,
                    FriendshipStatus = null,
                    ListCommonEvent = new List<CommonEvent>()
                });

            var emptyEventList = new List<Event>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false))
                .Returns(emptyEventList);

            // Act
            var result = await _friendService.GetFriendProfileAsync(userId, friendIdString);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Null(result.Value!.FriendshipStatus);

            // Verify
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID05_FriendExists_HasFriendship_Pending_ShouldReturnPendingStatus()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string friendIdString = friendId.ToString();

            var userList = new List<User>
            {
                new User
                {
                    Id = friendId,
                    IsActive = true,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            var friendshipList = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = friendId,
                    ReceiverId = userId,
                    Status = FriendshipStatus.Pending,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(friendshipList);

            var emptyEventList = new List<Event>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false))
                .Returns(emptyEventList);

            _mockMapper.Setup(m => m.Map<FriendProfileResponse>(It.IsAny<User>()))
                .Returns(new FriendProfileResponse
                {
                    FullName = "Test Friend",
                    AvatarImgUrl = null,
                    FriendshipStatus = null,
                    ListCommonEvent = new List<CommonEvent>()
                });

            // Act
            var result = await _friendService.GetFriendProfileAsync(userId, friendIdString);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal(FriendshipStatus.Pending, result.Value!.FriendshipStatus);

            // Verify
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID06_FriendExists_HasFriendship_Accepted_ShouldReturnAcceptedStatus()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string friendIdString = friendId.ToString();

            var userList = new List<User>
            {
                new User
                {
                    Id = friendId,
                    IsActive = true,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            var friendshipList = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = friendId,
                    ReceiverId = userId,
                    Status = FriendshipStatus.Accepted,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(friendshipList);

            var emptyEventList = new List<Event>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false))
                .Returns(emptyEventList);

            _mockMapper.Setup(m => m.Map<FriendProfileResponse>(It.IsAny<User>()))
                .Returns(new FriendProfileResponse
                {
                    FullName = "Test Friend",
                    AvatarImgUrl = null,
                    FriendshipStatus = null,
                    ListCommonEvent = new List<CommonEvent>()
                });

            // Act
            var result = await _friendService.GetFriendProfileAsync(userId, friendIdString);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal(FriendshipStatus.Accepted, result.Value!.FriendshipStatus);

            // Verify
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID07_FriendExists_HasFriendship_Blocked_ShouldReturnBlockedStatus()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string friendIdString = friendId.ToString();

            var userList = new List<User>
            {
                new User
                {
                    Id = friendId,
                    IsActive = true,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            var friendshipList = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = friendId,
                    ReceiverId = userId,
                    Status = FriendshipStatus.Blocked,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(friendshipList);

            var emptyEventList = new List<Event>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false))
                .Returns(emptyEventList);

            _mockMapper.Setup(m => m.Map<FriendProfileResponse>(It.IsAny<User>()))
                .Returns(new FriendProfileResponse
                {
                    FullName = "Test Friend",
                    AvatarImgUrl = null,
                    FriendshipStatus = null,
                    ListCommonEvent = new List<CommonEvent>()
                });

            // Act
            var result = await _friendService.GetFriendProfileAsync(userId, friendIdString);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal(FriendshipStatus.Blocked, result.Value!.FriendshipStatus);

            // Verify Queries
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID07_FriendExists_HasFriendshipButDeleted_ShouldTreatAsNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            string friendIdString = friendId.ToString();

            var userList = new List<User>
            {
                new User
                {
                    Id = friendId,
                    IsActive = true,
                    IsDeleted = false
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            var friendshipList = new List<Friendship>
            {
                new Friendship
                {
                    SenderId = friendId,
                    ReceiverId = userId,
                    Status = FriendshipStatus.Accepted,
                    IsDeleted = true   
                }
            }
            .AsQueryable()
            .BuildMock();

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(friendshipList);

            var emptyEventList = new List<Event>()
                .AsQueryable()
                .BuildMock();

            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false))
                .Returns(emptyEventList);

            _mockMapper.Setup(m => m.Map<FriendProfileResponse>(It.IsAny<User>()))
                .Returns(new FriendProfileResponse
                {
                    FullName = "Test Friend",
                    AvatarImgUrl = null,
                    FriendshipStatus = null,
                    ListCommonEvent = new List<CommonEvent>()
                });

            // Act
            var result = await _friendService.GetFriendProfileAsync(userId, friendIdString);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Null(result.Value!.FriendshipStatus);

            // Verify 
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.EventRepository.Query(false), Times.Once);
        }
        #endregion

        #region GetFriendLocationAsync Tests
        [Fact]
        public async Task UTCID01_GetFriendLocation_NoFriendsFound_ShouldReturnEmptyList()
        {
            // Arrange
            var userId = Guid.NewGuid();
            int radius = 1000;
            double latitude = 10.0;
            double longitude = 20.0;

            var mockFriendshipQueryable = new List<Friendship>().AsQueryable().BuildMock();
            _mockUnitOfWork
                .Setup(u => u.FriendshipRepository.Query(false))
                .Returns(mockFriendshipQueryable);

            // Act
            var result = await _friendService.GetFriendLocationAsync(userId, radius, latitude, longitude);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Empty(result.Value);

            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID02_GetFriendLocation_FriendCacheNull_ShouldReturnEmptyList()
        {
            // Arrange
            var userId = Guid.NewGuid();
            int radius = 1000;
            double latitude = 10.0;
            double longitude = 20.0;

            var friendUser = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Friend One",
                Email = "friend@example.com",
                AvatarImgUrl = "avatar.png",
                IsTurnOnLocation = true
            };

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                Status = FriendshipStatus.Accepted,
                IsDeleted = false,
                SenderId = userId,
                Receiver = friendUser
            };

            var mockFriendshipQueryable = new List<Friendship> { friendship }.AsQueryable().BuildMock();
            _mockUnitOfWork
                .Setup(u => u.FriendshipRepository.Query(false))
                .Returns(mockFriendshipQueryable);

            _mockCacheService
                .Setup(c => c.GetAsync<UserLocationCache?>($"user-location:{friendUser.Id}"))
                .ReturnsAsync((UserLocationCache?)null);


            // Act
            var result = await _friendService.GetFriendLocationAsync(userId, radius, latitude, longitude);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Empty(result.Value);

            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockCacheService.Verify(c => c.GetAsync<UserLocationCache>($"user-location:{friendUser.Id}"), Times.Once);
        }


        [Fact]
        public async Task UTCID03_GetFriendLocation_FriendCacheHit_ShouldReturnFriendLocation()
        {
            // Arrange
            var userId = Guid.NewGuid();
            int radius = 1000; // 1 km
            double latitude = 10.0;
            double longitude = 20.0;

            var friendUser = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Friend One",
                Email = "friend@example.com",
                AvatarImgUrl = "avatar.png",
                IsTurnOnLocation = true
            };

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                Status = FriendshipStatus.Accepted,
                IsDeleted = false,
                SenderId = userId,
                Receiver = friendUser
            };

            var mockFriendshipQueryable = new List<Friendship> { friendship }.AsQueryable().BuildMock();
            _mockUnitOfWork
                .Setup(u => u.FriendshipRepository.Query(false))
                .Returns(mockFriendshipQueryable);

            var friendLocation = new UserLocationCache
            {
                Latitude = 10.001,   
                Longitude = 20.001
            };

            _mockCacheService
                .Setup(c => c.GetAsync<UserLocationCache>($"user-location:{friendUser.Id}"))
                .ReturnsAsync(friendLocation);

            // Act
            var result = await _friendService.GetFriendLocationAsync(userId, radius, latitude, longitude);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Single(result.Value);

            var friendResp = result.Value.First();
            Assert.Equal(friendUser.Id, friendResp.FriendId);
            Assert.Equal(friendUser.FullName, friendResp.FriendName);
            Assert.Equal(friendUser.Email, friendResp.Email);
            Assert.Equal(friendUser.AvatarImgUrl, friendResp.ImageUrl);
            Assert.Equal(friendLocation.Latitude, friendResp.Latitude);
            Assert.Equal(friendLocation.Longitude, friendResp.Longitude);

            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockCacheService.Verify(c => c.GetAsync<UserLocationCache>($"user-location:{friendUser.Id}"), Times.Once);
        }


        [Fact]
        public async Task UTCID04_GetFriendLocation_FriendOutsideRadius_ShouldReturnEmptyList()
        {
            // Arrange
            var userId = Guid.NewGuid();
            int radius = 1; // 1 km radius
            double latitude = 10.0;
            double longitude = 20.0;

            var friendUser = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Friend One",
                Email = "friend@example.com",
                AvatarImgUrl = "avatar.png",
                IsTurnOnLocation = true
            };

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                Status = FriendshipStatus.Accepted,
                IsDeleted = false,
                SenderId = userId,
                Receiver = friendUser
            };

            var mockFriendshipQueryable = new List<Friendship> { friendship }.AsQueryable().BuildMock();
            _mockUnitOfWork
                .Setup(u => u.FriendshipRepository.Query(false))
                .Returns(mockFriendshipQueryable);

            // Location nằm ngoài radius > 1 km
            var friendLocation = new UserLocationCache
            {
                Latitude = 11.0,   // ~111 km cách 10.0 latitude
                Longitude = 20.0
            };

            _mockCacheService
                .Setup(c => c.GetAsync<UserLocationCache>($"user-location:{friendUser.Id}"))
                .ReturnsAsync(friendLocation);

            // Act
            var result = await _friendService.GetFriendLocationAsync(userId, radius, latitude, longitude);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Empty(result.Value); // friend ngoài radius -> list rỗng

            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockCacheService.Verify(c => c.GetAsync<UserLocationCache>($"user-location:{friendUser.Id}"), Times.Once);
        }


        [Fact]
        public async Task UTCID05_GetFriendLocation_MixNullAndValidLocations_ShouldIncludeOnlyValidFriend()
        {
            // Arrange
            var userId = Guid.NewGuid();
            int radius = 200; // 200 km
            double latitude = 10.0;
            double longitude = 20.0;

            // Friend hợp lệ trong radius
            var validFriend = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Valid Friend",
                Email = "valid@example.com",
                AvatarImgUrl = "valid.png",
                IsTurnOnLocation = true
            };

            // Friend hợp lệ nhưng location null
            var nullLocationFriend = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Null Location Friend",
                Email = "null@example.com",
                AvatarImgUrl = "null.png",
                IsTurnOnLocation = true
            };

            // Friend hợp lệ nhưng ngoài radius
            var farFriend = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Far Friend",
                Email = "far@example.com",
                AvatarImgUrl = "far.png",
                IsTurnOnLocation = true
            };

            var friendships = new List<Friendship>
            {
                new Friendship
                {
                    Id = Guid.NewGuid(),
                    Status = FriendshipStatus.Accepted,
                    IsDeleted = false,
                    SenderId = userId,
                    Receiver = validFriend
                },
                new Friendship
                {
                    Id = Guid.NewGuid(),
                    Status = FriendshipStatus.Accepted,
                    IsDeleted = false,
                    SenderId = userId,
                    Receiver = nullLocationFriend
                },
                new Friendship
                {
                    Id = Guid.NewGuid(),
                    Status = FriendshipStatus.Accepted,
                    IsDeleted = false,
                    SenderId = userId,
                    Receiver = farFriend
                }
            };

            var mockFriendshipQueryable = friendships.AsQueryable().BuildMock();
            _mockUnitOfWork
                .Setup(u => u.FriendshipRepository.Query(false))
                .Returns(mockFriendshipQueryable);

            // Setup cache
            _mockCacheService
                .Setup(c => c.GetAsync<UserLocationCache>($"user-location:{validFriend.Id}"))
                .ReturnsAsync(new UserLocationCache { Latitude = 10.5, Longitude = 20.5 }); // trong radius

            _mockCacheService
                .Setup(c => c.GetAsync<UserLocationCache?>($"user-location:{nullLocationFriend.Id}"))
                .ReturnsAsync((UserLocationCache?)null); 

            _mockCacheService
                .Setup(c => c.GetAsync<UserLocationCache>($"user-location:{farFriend.Id}"))
                .ReturnsAsync(new UserLocationCache { Latitude = 50.0, Longitude = 50.0 }); // ngoài radius

            // Act
            var result = await _friendService.GetFriendLocationAsync(userId, radius, latitude, longitude);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Single(result.Value); 

            var friendResp = result.Value.First();
            Assert.Equal(validFriend.Id, friendResp.FriendId);
            Assert.Equal(validFriend.FullName, friendResp.FriendName);
            Assert.Equal(validFriend.Email, friendResp.Email);
            Assert.Equal(validFriend.AvatarImgUrl, friendResp.ImageUrl);
            Assert.Equal(10.5, friendResp.Latitude);
            Assert.Equal(20.5, friendResp.Longitude);

            // Verify calls
            _mockUnitOfWork.Verify(u => u.FriendshipRepository.Query(false), Times.Once);
            _mockCacheService.Verify(c => c.GetAsync<UserLocationCache>($"user-location:{validFriend.Id}"), Times.Once);
            _mockCacheService.Verify(c => c.GetAsync<UserLocationCache>($"user-location:{nullLocationFriend.Id}"), Times.Once);
            _mockCacheService.Verify(c => c.GetAsync<UserLocationCache>($"user-location:{farFriend.Id}"), Times.Once);
        }
        #endregion
    }
}
