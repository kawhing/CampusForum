package com.campusforum.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.core.userdetails.UserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return new UserDetailsServiceImpl();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ✅ 修复1: 保持 CSRF 禁用（因为有 REST API，开启会很复杂）
            // 后续如需开启，需要同时在所有 form 里加 th:action（Thymeleaf 会自动注入 token）
            .csrf().disable()

            .authorizeRequests()
                // 静态资源和公开页面
                .antMatchers("/", "/index").permitAll()
                .antMatchers("/register", "/login").permitAll()
                .antMatchers("/post-list", "/post/**", "/profile/**").permitAll()
                .antMatchers("/css/**", "/js/**", "/images/**", "/static/**").permitAll()

                // ✅ 修复2: 公开读取 API（GET），写入 API 需要登录
                // 注册接口公开
                .antMatchers("/api/auth/**").permitAll()
                // 帖子、评论、资源的读取接口公开
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/posts/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/comments/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/resources/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/users/**").permitAll()

                // ✅ 其他所有请求（POST/PUT/DELETE API）需要登录
                .anyRequest().authenticated()
                .and()

            // ✅ 修复3: 配置 Spring Security 标准表单登录
            .formLogin()
                .loginPage("/login")               // 自定义登录页
                .loginProcessingUrl("/login")      // POST 提交地址（Spring Security 自动处理）
                .defaultSuccessUrl("/", true)      // 登录成功后跳转首页
                .failureUrl("/login?error")        // 登录失败跳回登录页并带 error 参数
                .permitAll()
                .and()

            // ✅ 修复4: 配置退出登录
            .logout()
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout")  // 退出后跳转到登录页并带 logout 参数
                .invalidateHttpSession(true)        // 清除 Session
                .deleteCookies("JSESSIONID")        // 清除 Cookie
                .permitAll();

        return http.build();
    }
}
