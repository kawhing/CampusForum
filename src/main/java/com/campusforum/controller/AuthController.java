package com.campusforum.controller;

import com.campusforum.dto.ApiResponse;
import com.campusforum.dto.UserDTO;
import com.campusforum.entity.User;
import com.campusforum.service.UserService;
import com.campusforum.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final DtoMapper dtoMapper;

    @PostMapping("/register")
    public ApiResponse<?> register(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam(required = false) String realname) {

        // 验证用户名和邮箱是否已存在
        if (userService.existsUsername(username)) {
            return ApiResponse.error("用户名已存在");
        }
        if (userService.existsEmail(email)) {
            return ApiResponse.error("邮箱已存在");
        }

        try {
            User user = userService.register(username, email, password, realname);
            UserDTO userDTO = dtoMapper.toUserDTO(user);
            return ApiResponse.success("注册成功", userDTO);
        } catch (Exception e) {
            return ApiResponse.error("注册失败：" + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ApiResponse<?> login(
            @RequestParam String username,
            @RequestParam String password) {

        Optional<User> user = userService.login(username, password);
        if (user.isPresent()) {
            Map<String, Object> data = new HashMap<>();
            data.put("user", dtoMapper.toUserDTO(user.get()));
            data.put("token", "Bearer_" + user.get().getId() + "_" + System.currentTimeMillis());
            return ApiResponse.success("登录成功", data);
        } else {
            return ApiResponse.error("用户名或密码错误");
        }
    }

    @PostMapping("/logout")
    public ApiResponse<?> logout() {
        return ApiResponse.success("退出成功", null);
    }

    @GetMapping("/check-username/{username}")
    public ApiResponse<?> checkUsername(@PathVariable String username) {
        boolean exists = userService.existsUsername(username);
        return ApiResponse.success(new HashMap<String, Object>() {{
            put("exists", exists);
        }});
    }

    @GetMapping("/check-email/{email}")
    public ApiResponse<?> checkEmail(@PathVariable String email) {
        boolean exists = userService.existsEmail(email);
        return ApiResponse.success(new HashMap<String, Object>() {{
            put("exists", exists);
        }});
    }
}
