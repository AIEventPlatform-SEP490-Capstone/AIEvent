using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Role;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class RoleService : IRoleService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public RoleService(
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<Result<List<RoleResponse>>> GetAllRolesAsync()
        {
            var roles = await _unitOfWork.RoleRepository.GetAllAsync();
            var roleResponses = _mapper.Map<List<RoleResponse>>(roles);
            return Result<List<RoleResponse>>.Success(roleResponses);
        }

        public async Task<Result> CreateRoleAsync(CreateRoleRequest request)
        {
            var existingRole = await _unitOfWork.RoleRepository
                                                .Query()
                                                .FirstOrDefaultAsync(r => r.Name == request.Name);
            if (existingRole != null)
            {
                return ErrorResponse.FailureResult("Role with this name already exists", ErrorCodes.InvalidInput);
            }

            var role = _mapper.Map<Role>(request);

            await _unitOfWork.RoleRepository.AddAsync(role);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> UpdateRoleAsync(string roleId, UpdateRoleRequest request)
        {
            var role = await _unitOfWork.RoleRepository.GetByIdAsync(Guid.Parse(roleId), true);
            if (role == null || role.DeletedAt.HasValue)
            {
                return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
            }
            _mapper.Map(request, role);

            await _unitOfWork.RoleRepository.UpdateAsync(role);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> DeleteRoleAsync(string roleId)
        {
            var role = await _unitOfWork.RoleRepository.GetByIdAsync(Guid.Parse(roleId), true);
            if (role == null)
            {
                return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
            }

            var usersInRole = await _unitOfWork.UserRepository.Query().FirstOrDefaultAsync(u => u.RoleId == Guid.Parse(roleId));
            if (usersInRole != null)
            {
                return ErrorResponse.FailureResult("Failed to delete role. Role may be in use or system protected", ErrorCodes.InvalidInput);
            }

            await _unitOfWork.RoleRepository.DeleteAsync(role);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
    }
}
