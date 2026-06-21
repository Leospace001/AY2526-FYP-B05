package com.example.demo.service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.demo.dto.ChatGroupDetailDto;
import com.example.demo.dto.ChatGroupDto;
import com.example.demo.dto.ChatGroupMemberDto;
import com.example.demo.dto.CreateChatGroupRequest;
import com.example.demo.dto.InviteCandidateDto;
import com.example.demo.model.ChatGroup;
import com.example.demo.model.ChatGroupMember;
import com.example.demo.model.GroupMemberRole;
import com.example.demo.model.User;
import com.example.demo.repository.ChatGroupMemberRepository;
import com.example.demo.repository.ChatGroupRepository;
import com.example.demo.repository.UserRepository;

@Service
public class ChatGroupService {

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private ChatGroupMemberRepository chatGroupMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ChatGroupDto createGroup(CreateChatGroupRequest request, User creator) {
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("Group name is required.");
        }

        ChatGroup group = new ChatGroup();
        group.setName(request.getName().trim());
        group.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null);
        group.setCreatedBy(creator);
        group.setActive(true);

        ChatGroupMember leader = new ChatGroupMember(group, creator, GroupMemberRole.LEADER);
        group.getMembers().add(leader);

        ChatGroup saved = chatGroupRepository.save(group);
        return toGroupDto(saved, creator);
    }

    @Transactional(readOnly = true)
    public List<ChatGroupDto> listGroups(User requester, boolean includeAllForAdmin) {
        boolean isAdmin = isSystemAdmin(requester);
        List<ChatGroup> groups;
        if (includeAllForAdmin && isAdmin) {
            groups = chatGroupRepository.findAllWithCreator();
        } else {
            groups = chatGroupRepository.findActiveGroupsForUser(requester.getId());
        }
        return groups.stream()
                .map(group -> toGroupDto(group, requester))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChatGroupDetailDto getGroupDetail(Long groupId, User requester) {
        ChatGroup group = chatGroupRepository.findByIdWithCreator(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found."));
        if (!canViewGroup(groupId, requester)) {
            throw new IllegalArgumentException("You do not have access to this group.");
        }

        ChatGroupDetailDto detail = new ChatGroupDetailDto();
        detail.setGroup(toGroupDto(group, requester));
        detail.setMembers(loadMemberDtos(groupId));
        return detail;
    }

    @Transactional(readOnly = true)
    public List<ChatGroupMemberDto> listMembers(Long groupId, User requester) {
        if (!canViewGroup(groupId, requester)) {
            throw new IllegalArgumentException("You do not have access to view members of this group.");
        }
        return loadMemberDtos(groupId);
    }

    @Transactional(readOnly = true)
    public List<InviteCandidateDto> searchInviteCandidates(Long groupId, User actingUser, String query) {
        requireLeader(groupId, actingUser);
        if (!StringUtils.hasText(query) || query.trim().length() < 1) {
            return List.of();
        }

        chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found."));

        return userRepository.searchInviteCandidates(groupId, query.trim(), PageRequest.of(0, 10))
                .stream()
                .map(user -> new InviteCandidateDto(
                        user.getId(),
                        user.getUsername(),
                        user.getFirstname(),
                        user.getLastname(),
                        user.getEmail()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatGroupMemberDto inviteUser(Long groupId, User actingUser, String targetUsername) {
        requireLeader(groupId, actingUser);
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUsername));
        if (!target.isActive()) {
            throw new IllegalArgumentException("Cannot invite a blocked user.");
        }

        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found."));

        ChatGroupMember existing = chatGroupMemberRepository.findByGroup_IdAndUser_Id(groupId, target.getId())
                .orElse(null);
        if (existing != null && existing.isActive()) {
            throw new IllegalArgumentException("User is already in this group.");
        }

        ChatGroupMember member = existing != null ? existing : new ChatGroupMember(group, target, GroupMemberRole.MEMBER);
        member.setRole(GroupMemberRole.MEMBER);
        member.setActive(true);
        chatGroupMemberRepository.save(member);

        return toMemberDto(member);
    }

    @Transactional
    public void kickUser(Long groupId, User actingUser, String targetUsername) {
        requireLeader(groupId, actingUser);
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUsername));
        if (target.getId().equals(actingUser.getId())) {
            throw new IllegalArgumentException("Leaders cannot kick themselves. Use leave group instead.");
        }

        ChatGroupMember membership = chatGroupMemberRepository.findByGroup_IdAndUser_Id(groupId, target.getId())
                .orElseThrow(() -> new IllegalArgumentException("User is not in this group."));
        if (!membership.isActive()) {
            throw new IllegalArgumentException("User is not an active member of this group.");
        }
        if (membership.getRole() == GroupMemberRole.LEADER) {
            throw new IllegalArgumentException("Group leaders cannot kick other leaders.");
        }

        membership.setActive(false);
        chatGroupMemberRepository.save(membership);
    }

    @Transactional
    public ChatGroupMemberDto promoteToLeader(Long groupId, User actingUser, String targetUsername) {
        requireLeader(groupId, actingUser);
        ChatGroupMember membership = getActiveMembership(groupId, targetUsername);
        membership.setRole(GroupMemberRole.LEADER);
        chatGroupMemberRepository.save(membership);
        return toMemberDto(membership);
    }

    @Transactional
    public ChatGroupMemberDto demoteLeader(Long groupId, User actingUser, String targetUsername) {
        requireLeader(groupId, actingUser);
        ChatGroupMember membership = getActiveMembership(groupId, targetUsername);
        if (membership.getRole() != GroupMemberRole.LEADER) {
            throw new IllegalArgumentException("User is not a group leader.");
        }
        long leaderCount = chatGroupMemberRepository.countActiveByGroupIdAndRole(groupId, GroupMemberRole.LEADER);
        if (leaderCount <= 1) {
            throw new IllegalArgumentException("Each group must keep at least one leader.");
        }

        membership.setRole(GroupMemberRole.MEMBER);
        chatGroupMemberRepository.save(membership);
        return toMemberDto(membership);
    }

    @Transactional
    public void leaveGroup(Long groupId, User user) {
        ChatGroupMember membership = chatGroupMemberRepository.findByGroup_IdAndUser_Id(groupId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("You are not in this group."));
        if (!membership.isActive()) {
            throw new IllegalArgumentException("You are not an active member of this group.");
        }

        if (membership.getRole() == GroupMemberRole.LEADER) {
            long leaderCount = chatGroupMemberRepository.countActiveByGroupIdAndRole(groupId, GroupMemberRole.LEADER);
            long memberCount = chatGroupMemberRepository.findActiveMembersByGroupId(groupId).size();
            if (memberCount > 1 && leaderCount <= 1) {
                throw new IllegalArgumentException("Assign another leader before leaving this group.");
            }
        }

        membership.setActive(false);
        chatGroupMemberRepository.save(membership);
    }

    @Transactional(readOnly = true)
    public void requireActiveMember(Long groupId, User user) {
        if (!chatGroupMemberRepository.isActiveMember(groupId, user.getId())) {
            throw new IllegalArgumentException("You must be a group member to perform this action.");
        }
    }

    @Transactional(readOnly = true)
    public boolean canViewGroup(Long groupId, User user) {
        return isSystemAdmin(user) || chatGroupMemberRepository.isActiveMember(groupId, user.getId());
    }

    private void requireLeader(Long groupId, User user) {
        if (!chatGroupMemberRepository.isActiveLeader(groupId, user.getId())) {
            throw new IllegalArgumentException("Only group leaders can perform this action.");
        }
    }

    private ChatGroupMember getActiveMembership(Long groupId, String targetUsername) {
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUsername));
        ChatGroupMember membership = chatGroupMemberRepository.findByGroup_IdAndUser_Id(groupId, target.getId())
                .orElseThrow(() -> new IllegalArgumentException("User is not in this group."));
        if (!membership.isActive()) {
            throw new IllegalArgumentException("User is not an active member of this group.");
        }
        return membership;
    }

    private List<ChatGroupMemberDto> loadMemberDtos(Long groupId) {
        return chatGroupMemberRepository.findActiveMembersByGroupId(groupId).stream()
                .sorted(Comparator.comparing(ChatGroupMember::getRole).thenComparing(ChatGroupMember::getJoinedAt))
                .map(this::toMemberDto)
                .collect(Collectors.toList());
    }

    private ChatGroupDto toGroupDto(ChatGroup group, User requester) {
        ChatGroupDto dto = new ChatGroupDto();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setCreatedByUsername(group.getCreatedBy() != null ? group.getCreatedBy().getUsername() : null);
        dto.setCreatedAt(group.getCreatedAt());
        dto.setUpdatedAt(group.getUpdatedAt());

        List<ChatGroupMember> activeMembers = chatGroupMemberRepository.findActiveMembersByGroupId(group.getId());
        dto.setMemberCount(activeMembers.size());

        ChatGroupMember myMembership = activeMembers.stream()
                .filter(member -> member.getUser().getId().equals(requester.getId()))
                .findFirst()
                .orElse(null);
        dto.setMember(myMembership != null);
        dto.setMyRole(myMembership != null ? myMembership.getRole() : null);
        return dto;
    }

    private ChatGroupMemberDto toMemberDto(ChatGroupMember member) {
        User user = member.getUser();
        return new ChatGroupMemberDto(
                user.getId(),
                user.getUsername(),
                user.getFirstname(),
                user.getLastname(),
                user.getEmail(),
                member.getRole(),
                member.getJoinedAt());
    }

    private boolean isSystemAdmin(User user) {
        return user.getRoleAssignments().stream()
                .collect(Collectors.groupingBy(
                        assignment -> assignment.getRole(),
                        Collectors.collectingAndThen(
                                Collectors.maxBy(Comparator.comparing(
                                        assignment -> assignment.getAssignedDate())),
                                optional -> optional.filter(assignment -> assignment.isActive()))))
                .values().stream()
                .flatMap(java.util.Optional::stream)
                .anyMatch(assignment -> assignment.getRole().getName().name().equals("ROLE_ADMIN"));
    }
}
