/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.hvh.dto.CustomerVerificationResponseDTO;
import com.hvh.dto.LoginRequestDTO;
import com.hvh.dto.LoginResponseDTO;
import com.hvh.dto.RegisterRequestDTO;
import com.hvh.dto.SellerVerificationResponseDTO;
import com.hvh.dto.UpdateProfileDTO;
import com.hvh.dto.UpdateVerificationProfileDTO;
import com.hvh.dto.UserProfileResponseDTO;
import com.hvh.dto.VerificationProfileResponseDTO;
import com.hvh.dto.VerificationQueueDTO;
import com.hvh.pojo.Company;
import com.hvh.pojo.CustomerProfile;
import com.hvh.pojo.SellerProfile;
import com.hvh.pojo.Users;
import com.hvh.repository.UserRepository;
import com.hvh.service.CustomerProfileService;
import com.hvh.service.SellerProfileService;
import com.hvh.service.CompanyService;
import com.hvh.service.UserService;
import com.hvh.utils.JwtUtils;
import java.io.IOException;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * @author acer
 */
@Service("userDetailsService")
public class UserServiceImpl implements UserService {

    private static final Set<String> ALLOWED_ROLES
            = Set.of("ROLE_ADMIN", "ROLE_CUSTOMER", "ROLE_SELLER");

    private static final Set<String> REGISTERABLE_ROLES = Set.of("ROLE_CUSTOMER", "ROLE_SELLER");

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private CustomerProfileService customerProfileService;

    @Autowired
    private SellerProfileService sellerProfileService;

    @Autowired
    private CompanyService companyService;

    @Autowired
    private Cloudinary cloudinary;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Users getUserByUsername(String username) {
        return this.userRepo.getUserByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public Users getUserById(int id) {
        Users user = this.userRepo.getUserById(id);

        if (user == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với id " + id);
        }

        return user;
    }

    @Override
    @Transactional
    public UserProfileResponseDTO register(RegisterRequestDTO request, MultipartFile avatar) {

        String username = request.getUsername().trim();

        Users existingUser = this.userRepo.getUserByUsername(username);

        if (existingUser != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại");
        }

        String role = normalizeRegisterRole(request.getRole());

        Users user = new Users();

        user.setFirstName(request.getFirstName().trim());

        user.setLastName(request.getLastName().trim());

        user.setPhone(request.getPhone().trim());

        user.setEmail(request.getEmail().trim());

        user.setUsername(username);

        user.setPassword(this.passwordEncoder.encode(request.getPassword()));

        user.setUserRole(role);
        user.setActive(true);

        if (avatar != null && !avatar.isEmpty()) {
            user.setAvatar(uploadAvatar(avatar));
        }

        Users savedUser = this.userRepo.addUser(user);

        if ("ROLE_SELLER".equals(role)) {
            this.sellerProfileService.createProfileForUser(savedUser);
        } else {
            this.customerProfileService.createProfileForUser(savedUser);
        }

        return toUserProfileDTO(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO request) {

        boolean authenticated
                = this.userRepo.authenticate(request.getUsername(), request.getPassword());

        if (!authenticated) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai thông tin đăng nhập");
        }

        try {
            String token = JwtUtils.generateToken(request.getUsername());

            return new LoginResponseDTO(token);

        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo JWT", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponseDTO getUserProfile(String username) {

        return toUserProfileDTO(requireUserForApi(username));
    }

    @Override
    @Transactional(readOnly = true)
    public VerificationProfileResponseDTO<?> getVerificationProfile(
            String username) {

        Users user = requireUserForApi(username);

        if ("ROLE_CUSTOMER".equals(user.getUserRole())) {

            CustomerProfile profile
                    = this.customerProfileService
                            .getByUserId(user.getId());

            if (profile == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tài khoản chưa có customer_profile"
                );
            }

            CustomerVerificationResponseDTO dto
                    = new CustomerVerificationResponseDTO(
                            profile.getId(),
                            profile.getAddress(),
                            profile.getIdentityNumber(),
                            profile.getIdentityVerified(),
                            profile.getCreatedAt(),
                            profile.getUpdatedAt()
                    );

            return new VerificationProfileResponseDTO<>(
                    "ROLE_CUSTOMER",
                    dto
            );
        }

        if ("ROLE_SELLER".equals(user.getUserRole())) {

            SellerProfile profile
                    = this.sellerProfileService
                            .getByUserId(user.getId());

            if (profile == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tài khoản chưa có seller_profile"
                );
            }

            Company company
                    = profile.getCompanyId();

            SellerVerificationResponseDTO dto
                    = new SellerVerificationResponseDTO(
                            profile.getId(),
                            profile.getBio(),
                            profile.getIsVerified(),
                            profile.getVerifiedAt(),
                            profile.getRatingAvg(),
                            profile.getTotalProperties(),
                            company == null
                                    ? null
                                    : company.getId(),
                            company == null
                                    ? null
                                    : company.getName(),
                            profile.getCreatedAt(),
                            profile.getUpdatedAt()
                    );

            return new VerificationProfileResponseDTO<>(
                    "ROLE_SELLER",
                    dto
            );
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Vai trò "
                + user.getUserRole()
                + " không hỗ trợ hồ sơ xác minh"
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Users user = requireUserForSecurity(username);

        Set<GrantedAuthority> authorities = new HashSet<>();

        authorities.add(new SimpleGrantedAuthority(user.getUserRole()));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Boolean.TRUE.equals(user.getActive()),
                true,
                true,
                true,
                authorities);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean authenticate(String username, String password) {

        return this.userRepo.authenticate(username, password);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Users> getUsers(Integer page) {
        return this.userRepo.getUsers(page);
    }

    @Override
    @Transactional
    public Users updateRole(int id, String role) {

        if (role == null || !ALLOWED_ROLES.contains(role)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Role không hợp lệ, chỉ chấp nhận: " + ALLOWED_ROLES);
        }

        return this.userRepo.updateRole(id, role);
    }

    private Users requireUserForApi(String username) {

        Users user = this.userRepo.getUserByUsername(username);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản");
        }

        return user;
    }

    private Users requireUserForSecurity(String username) {

        Users user = this.userRepo.getUserByUsername(username);

        if (user == null) {
            throw new UsernameNotFoundException("Không tìm thấy tài khoản");
        }

        return user;
    }

    private String normalizeRegisterRole(String requestedRole) {

        if (requestedRole == null || requestedRole.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Vai trò không được để trống");
        }

        String normalized = requestedRole.trim().toUpperCase(Locale.ROOT);

        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }

        if (!REGISTERABLE_ROLES.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ được đăng ký với vai trò " + "CUSTOMER hoặc SELLER");
        }

        return normalized;
    }

    private String uploadAvatar(MultipartFile avatar) {

        try {
            Map<?, ?> result
                    = this.cloudinary
                            .uploader()
                            .upload(
                                    avatar.getBytes(),
                                    ObjectUtils.asMap(
                                            "resource_type",
                                            "image",
                                            "folder",
                                            "estatemind/avatars"));

            Object secureUrl = result.get("secure_url");

            if (secureUrl == null) {
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "Cloudinary không trả về URL ảnh");
            }

            return secureUrl.toString();

        } catch (IOException ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tải ảnh đại diện", ex);
        }
    }

    private UserProfileResponseDTO toUserProfileDTO(Users user) {

        return new UserProfileResponseDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getUsername(),
                user.getActive(),
                user.getUserRole(),
                user.getAvatar());
    }

    @Override
    @Transactional
    public VerificationProfileResponseDTO<?> updateVerificationProfile(
            String username, UpdateVerificationProfileDTO request) {

        Users user = requireUserForApi(username);

        if ("ROLE_CUSTOMER".equals(user.getUserRole())) {

            CustomerProfile profile = this.customerProfileService.getByUserId(user.getId());

            if (profile == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tài khoản chưa có customer_profile");
            }

            if (request.getAddress() != null) {
                profile.setAddress(
                        request.getAddress().isBlank() ? null : request.getAddress().trim());
            }

            if (request.getIdentityNumber() != null) {
                String newIdentity
                        = request.getIdentityNumber().isBlank()
                        ? null
                        : request.getIdentityNumber().trim();

                boolean changed
                        = newIdentity == null
                                ? profile.getIdentityNumber() != null
                                : !newIdentity.equals(profile.getIdentityNumber());

                if (changed) {
                    profile.setIdentityNumber(newIdentity);
                    profile.setIdentityVerified(false);
                }
            }

            profile.setUpdatedAt(new Date());

            this.customerProfileService.updateProfile(profile);

            return this.getVerificationProfile(username);
        }

        if ("ROLE_SELLER".equals(user.getUserRole())) {

            SellerProfile profile = this.sellerProfileService.getByUserId(user.getId());

            if (profile == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tài khoản chưa có seller_profile");
            }

            if (request.getBio() != null) {
                profile.setBio(request.getBio().isBlank() ? null : request.getBio().trim());
            }

            if (request.getCompanyId() != null) {
                Company company = new Company();
                company.setId(request.getCompanyId());
                profile.setCompanyId(company);
            }

            profile.setUpdatedAt(new Date());

            this.sellerProfileService.updateProfile(profile);

            return this.getVerificationProfile(username);
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Vai trò " + user.getUserRole() + " không hỗ trợ hồ sơ xác minh");
    }

    @Override
    @Transactional
    public void approveVerification(int userId) {

        Users user = this.getUserById(userId);

        if ("ROLE_CUSTOMER".equals(user.getUserRole())) {

            CustomerProfile profile = this.customerProfileService.getByUserId(user.getId());

            if (profile == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tài khoản chưa có customer_profile");
            }

            if (profile.getAddress() == null
                    || profile.getAddress().isBlank()
                    || profile.getIdentityNumber() == null
                    || profile.getIdentityNumber().isBlank()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Hồ sơ chưa đủ địa chỉ và số giấy tờ định danh");
            }

            profile.setIdentityVerified(true);
            profile.setUpdatedAt(new Date());

            this.customerProfileService.updateProfile(profile);
            return;
        }

        if ("ROLE_SELLER".equals(user.getUserRole())) {

            SellerProfile profile = this.sellerProfileService.getByUserId(user.getId());

            if (profile == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tài khoản chưa có seller_profile");
            }

            profile.setIsVerified(true);
            profile.setVerifiedAt(new Date());
            profile.setUpdatedAt(new Date());

            this.sellerProfileService.updateProfile(profile);
            return;
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Vai trò " + user.getUserRole() + " không hỗ trợ xác minh");
    }

    @Override
    @Transactional
    public UserProfileResponseDTO updateProfile(
            String username, UpdateProfileDTO request, MultipartFile avatar) {

        Users user = requireUserForApi(username);

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            user.setFirstName(request.getFirstName().trim());
        }

        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            user.setLastName(request.getLastName().trim());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail().trim());
        }

        if (avatar != null && !avatar.isEmpty()) {
            user.setAvatar(uploadAvatar(avatar));
        }

        this.userRepo.updateUser(user);

        return toUserProfileDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VerificationQueueDTO> getVerificationQueue(String role) {

        List<VerificationQueueDTO> result = new java.util.ArrayList<>();

        if (role == null || "ROLE_CUSTOMER".equals(role)) {
            for (CustomerProfile profile : this.customerProfileService.getPendingVerification()) {
                result.add(VerificationQueueDTO.fromCustomer(profile));
            }
        }

        if (role == null || "ROLE_SELLER".equals(role)) {
            for (SellerProfile profile : this.sellerProfileService.getPendingVerification()) {
                result.add(VerificationQueueDTO.fromSeller(profile));
            }
        }

        return result;
    }

    @Override
    @Transactional
    public void rejectVerification(int userId) {

        Users user = this.getUserById(userId);

        if ("ROLE_CUSTOMER".equals(user.getUserRole())) {

            CustomerProfile profile = this.customerProfileService.getByUserId(user.getId());

            if (profile == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tài khoản chưa có customer_profile");
            }

            profile.setIdentityVerified(false);
            profile.setUpdatedAt(new Date());

            this.customerProfileService.updateProfile(profile);
            return;
        }

        if ("ROLE_SELLER".equals(user.getUserRole())) {

            SellerProfile profile = this.sellerProfileService.getByUserId(user.getId());

            if (profile == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tài khoản chưa có seller_profile");
            }

            profile.setIsVerified(false);
            profile.setVerifiedAt(null);
            profile.setUpdatedAt(new Date());

            this.sellerProfileService.updateProfile(profile);
            return;
        }
    }
}
