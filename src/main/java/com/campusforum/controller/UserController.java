package com.campusforum.controller;

import com.campusforum.dto.ApiResponse;
import com.campusforum.dto.UserDTO;
import com.campusforum.entity.User;
import com.campusforum.service.UserService;
import com.campusforum.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final DtoMapper dtoMapper;

    @GetMapping("/{id}")
    public ApiResponse<?> getUser(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(value -> ApiResponse.success(dtoMapper.toUserDTO(value)))
                .orElseGet(ApiResponse::notFound);
    }

    @GetMapping("/profile/{username}")
    public ApiResponse<?> getUserByUsername(@PathVariable String username) {
        Optional<User> user = userService.getUserByUsername(username);
        return user.map(value -> ApiResponse.success(dtoMapper.toUserDTO(value)))
                .orElseGet(ApiResponse::notFound);
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateUser(
            @PathVariable Long id,
            @RequestParam(required = false) String realname,
            @RequestParam(required = false) String avatar,
            @RequestParam(required = false) String bio) {

        User user = new User();
        user.setRealname(realname);
        user.setAvatar(avatar);
        user.setBio(bio);

        User updated = userService.updateUser(id, user);
        if (updated != null) {
            return ApiResponse.success("更新成功", dtoMapper.toUserDTO(updated));
        }
        return ApiResponse.notFound();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.success("删除成功", null);
    }
}
