package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.ChatGroupDetailDto;
import com.example.demo.dto.ChatGroupDto;
import com.example.demo.dto.ChatGroupMemberDto;
import com.example.demo.dto.ChatMessageDto;
import com.example.demo.dto.CreateChatGroupRequest;
import com.example.demo.dto.InviteCandidateDto;
import com.example.demo.dto.SendChatMessageRequest;
import com.example.demo.dto.UsernameActionRequest;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.ChatGroupService;
import com.example.demo.service.ChatMessageService;
import com.example.demo.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/groups")
public class ChatGroupController {

    @Autowired
    private ChatGroupService chatGroupService;

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private UserService userService;

    @PostMapping
    @Operation(summary = "Create a new chat group", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ChatGroupDto> createGroup(
            @RequestBody CreateChatGroupRequest request,
            Authentication authentication) {
        User creator = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.createGroup(request, creator));
    }

    @GetMapping
    @Operation(summary = "List chat groups for current user (admins may request all groups)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<ChatGroupDto>> listGroups(
            @RequestParam(defaultValue = "false") boolean all,
            Authentication authentication) {
        User requester = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.listGroups(requester, all));
    }

    @GetMapping("/{groupId}")
    @Operation(summary = "Get group details and members", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ChatGroupDetailDto> getGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        User requester = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.getGroupDetail(groupId, requester));
    }

    @GetMapping("/{groupId}/members")
    @Operation(summary = "List active group members", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<ChatGroupMemberDto>> listMembers(
            @PathVariable Long groupId,
            Authentication authentication) {
        User requester = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.listMembers(groupId, requester));
    }

    @GetMapping("/{groupId}/invite-candidates")
    @Operation(summary = "Search users to invite (leaders only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<InviteCandidateDto>> searchInviteCandidates(
            @PathVariable Long groupId,
            @RequestParam("q") String query,
            Authentication authentication) {
        User actingUser = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.searchInviteCandidates(groupId, actingUser, query));
    }

    @PostMapping("/{groupId}/invite")
    @Operation(summary = "Invite a user to the group (leaders only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ChatGroupMemberDto> inviteUser(
            @PathVariable Long groupId,
            @RequestBody UsernameActionRequest request,
            Authentication authentication) {
        User actingUser = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.inviteUser(groupId, actingUser, request.getUsername()));
    }

    @PostMapping("/{groupId}/kick")
    @Operation(summary = "Remove a member from the group (leaders only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> kickUser(
            @PathVariable Long groupId,
            @RequestBody UsernameActionRequest request,
            Authentication authentication) {
        User actingUser = getUser(authentication);
        chatGroupService.kickUser(groupId, actingUser, request.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/leaders")
    @Operation(summary = "Promote a member to group leader", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ChatGroupMemberDto> promoteLeader(
            @PathVariable Long groupId,
            @RequestBody UsernameActionRequest request,
            Authentication authentication) {
        User actingUser = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.promoteToLeader(groupId, actingUser, request.getUsername()));
    }

    @DeleteMapping("/{groupId}/leaders/{username}")
    @Operation(summary = "Demote a group leader to member", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ChatGroupMemberDto> demoteLeader(
            @PathVariable Long groupId,
            @PathVariable String username,
            Authentication authentication) {
        User actingUser = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.demoteLeader(groupId, actingUser, username));
    }

    @PostMapping("/{groupId}/leave")
    @Operation(summary = "Leave a chat group", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = getUser(authentication);
        chatGroupService.leaveGroup(groupId, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{groupId}/messages")
    @Operation(summary = "Get paginated group chat history", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<ChatMessageDto>> getMessages(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {
        User requester = getUser(authentication);
        return ResponseEntity.ok(chatMessageService.getMessages(groupId, requester, page, size));
    }

    @PostMapping("/{groupId}/messages")
    @Operation(summary = "Send a group chat message", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ChatMessageDto> sendMessage(
            @PathVariable Long groupId,
            @RequestBody SendChatMessageRequest request,
            Authentication authentication) {
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(chatMessageService.sendMessage(groupId, principal.getUsername(), request.getContent()));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: list all groups", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<ChatGroupDto>> listAllGroupsForAdmin(Authentication authentication) {
        User requester = getUser(authentication);
        return ResponseEntity.ok(chatGroupService.listGroups(requester, true));
    }

    private User getUser(Authentication authentication) {
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        return userService.getUserByUsername(principal.getUsername());
    }
}
