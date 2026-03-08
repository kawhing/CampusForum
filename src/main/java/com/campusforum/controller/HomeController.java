package com.campusforum.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/post-list")
    public String postList() {
        return "post-list";
    }

    @GetMapping("/post/{id}")
    public String postDetail() {
        return "post-detail";
    }

    @GetMapping("/post/edit/{id}")
    public String editPost() {
        return "post-edit";
    }

    @GetMapping("/profile/{username}")
    public String userProfile() {
        return "user-profile";
    }
}
