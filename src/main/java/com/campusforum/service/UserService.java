package com.campusforum.service;

import com.campusforum.entity.User;
import java.util.Optional;

public interface UserService {
    User register(String username, String email, String password, String realname);
    Optional<User> login(String username, String password);
    Optional<User> getUserById(Long id);
    Optional<User> getUserByUsername(String username);
    Optional<User> getUserByEmail(String email);
    User updateUser(Long id, User user);
    void deleteUser(Long id);
    boolean existsUsername(String username);
    boolean existsEmail(String email);
}
