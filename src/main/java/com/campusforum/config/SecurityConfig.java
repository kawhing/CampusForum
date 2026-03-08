package com.campusforum.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .authorizeRequests()
                    // 允许公开访问的页面和资源
                    .antMatchers("/").permitAll()
                    .antMatchers("/index").permitAll()
                    .antMatchers("/register").permitAll()
                    .antMatchers("/login").permitAll()
                    .antMatchers("/post-list").permitAll()
                    .antMatchers("/post/**").permitAll()
                    .antMatchers("/profile/**").permitAll()
                    .antMatchers("/static/**").permitAll()
                    .antMatchers("/css/**").permitAll()
                    .antMatchers("/js/**").permitAll()
                    .antMatchers("/db/**").permitAll()
                    // 允许所有API端点（认证由前端令牌处理）
                    .antMatchers("/api/auth/**").permitAll()
                    .antMatchers("/api/posts/**").permitAll()
                    .antMatchers("/api/comments/**").permitAll()
                    .antMatchers("/api/resources/**").permitAll()
                    .antMatchers("/api/users/**").permitAll()
                    // 其他请求需要认证
                    .anyRequest().authenticated()
                    .and()
                .formLogin()
                    .loginPage("/login")
                    .permitAll()
                    .and()
                .logout()
                    .permitAll();
        return http.build();
    }
}
