import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Alert, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, List, ListItem, ListItemButton, ListItemText, Paper,
    Snackbar, TextField, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import SendIcon from '@mui/icons-material/Send';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Client } from '@stomp/stompjs';
import api from '../api/axiosConfig';
import { createGroupChatClient, sendGroupMessage, subscribeToGroup } from '../api/groupChatSocket';
import { AuthContext } from '../context/AuthContext';

type GroupMemberRole = 'LEADER' | 'MEMBER';

interface ChatGroup {
    id: number;
    name: string;
    description?: string;
    createdByUsername: string;
    memberCount: number;
    myRole?: GroupMemberRole;
    member: boolean;
    createdAt?: string;
}

interface ChatGroupMember {
    userId: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    role: GroupMemberRole;
    joinedAt: string;
}

interface ChatMessage {
    id: number;
    groupId: number;
    senderId: number;
    senderUsername: string;
    senderName: string;
    content: string;
    sentAt: string;
}

interface InviteCandidate {
    userId: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
}

function formatInviteLabel(candidate: InviteCandidate): string {
    return `${candidate.firstname} ${candidate.lastname} (@${candidate.username})`;
}

export default function GroupChat() {
    const auth = useContext(AuthContext)!;
    const isSystemAdmin = auth.user?.roles?.includes('ROLE_ADMIN') ?? false;
    const currentUsername = auth.user?.sub ?? '';

    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [members, setMembers] = useState<ChatGroupMember[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [showAllGroups, setShowAllGroups] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [selectedInvite, setSelectedInvite] = useState<InviteCandidate | null>(null);
    const [inviteInput, setInviteInput] = useState('');
    const [inviteCandidates, setInviteCandidates] = useState<InviteCandidate[]>([]);
    const [inviteSearchLoading, setInviteSearchLoading] = useState(false);

    const inviteSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [loading, setLoading] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);

    const stompClientRef = useRef<Client | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const selectedGroup = groups.find(g => g.id === selectedGroupId) ?? null;
    const isLeader = selectedGroup?.myRole === 'LEADER';
    const canChat = selectedGroup?.member ?? false;

    const showError = (message: string) => setSnackbar({ open: true, message, severity: 'error' });
    const showSuccess = (message: string) => setSnackbar({ open: true, message, severity: 'success' });

    const loadGroups = useCallback(async () => {
        try {
            const url = isSystemAdmin && showAllGroups ? '/api/groups?all=true' : '/api/groups';
            const response = await api.get(url);
            setGroups(response.data);
        } catch (error) {
            console.error(error);
            showError('Failed to load groups');
        }
    }, [isSystemAdmin, showAllGroups]);

    const loadGroupDetails = useCallback(async (groupId: number) => {
        setLoading(true);
        try {
            const [detailRes, messagesRes] = await Promise.all([
                api.get(`/api/groups/${groupId}`),
                api.get(`/api/groups/${groupId}/messages?page=0&size=100`),
            ]);
            setMembers(detailRes.data.members ?? []);
            setMessages(messagesRes.data.content ?? []);
            setGroups(prev => prev.map(g => g.id === groupId ? detailRes.data.group : g));
        } catch (error) {
            console.error(error);
            showError('Failed to load group');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const client = createGroupChatClient(token, () => setWsConnected(true), showError);
        client.onDisconnect = () => setWsConnected(false);
        client.activate();
        stompClientRef.current = client;

        return () => {
            unsubscribeRef.current?.();
            setWsConnected(false);
            client.deactivate();
            stompClientRef.current = null;
        };
    }, []);

    useEffect(() => {
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;

        if (!selectedGroupId || !wsConnected || !stompClientRef.current) {
            return;
        }

        const client = stompClientRef.current;
        unsubscribeRef.current = subscribeToGroup(client, selectedGroupId, (body) => {
            try {
                const incoming: ChatMessage = JSON.parse(body);
                setMessages(prev => {
                    if (prev.some(m => m.id === incoming.id)) return prev;
                    return [...prev, incoming];
                });
            } catch (e) {
                console.error(e);
            }
        });
    }, [selectedGroupId, wsConnected]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectGroup = async (groupId: number) => {
        setSelectedGroupId(groupId);
        setSelectedInvite(null);
        setInviteInput('');
        setInviteCandidates([]);
        await loadGroupDetails(groupId);
    };

    const searchInviteCandidates = useCallback(async (query: string) => {
        if (!selectedGroupId || query.trim().length < 1) {
            setInviteCandidates([]);
            return;
        }
        setInviteSearchLoading(true);
        try {
            const response = await api.get(`/api/groups/${selectedGroupId}/invite-candidates`, {
                params: { q: query.trim() },
            });
            setInviteCandidates(response.data);
        } catch (error) {
            console.error(error);
            setInviteCandidates([]);
        } finally {
            setInviteSearchLoading(false);
        }
    }, [selectedGroupId]);

    useEffect(() => {
        if (!isLeader || !selectedGroupId) {
            return;
        }
        if (inviteSearchTimerRef.current) {
            clearTimeout(inviteSearchTimerRef.current);
        }
        if (inviteInput.trim().length < 1) {
            setInviteCandidates([]);
            return;
        }
        inviteSearchTimerRef.current = setTimeout(() => {
            searchInviteCandidates(inviteInput);
        }, 300);
        return () => {
            if (inviteSearchTimerRef.current) {
                clearTimeout(inviteSearchTimerRef.current);
            }
        };
    }, [inviteInput, isLeader, selectedGroupId, searchInviteCandidates]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            const response = await api.post('/api/groups', {
                name: newGroupName.trim(),
                description: newGroupDescription.trim() || null,
            });
            setCreateOpen(false);
            setNewGroupName('');
            setNewGroupDescription('');
            await loadGroups();
            await handleSelectGroup(response.data.id);
            showSuccess('Group created');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to create group');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroupId || !messageInput.trim() || !canChat) return;

        const content = messageInput.trim();
        setMessageInput('');

        try {
            if (stompClientRef.current?.connected) {
                sendGroupMessage(stompClientRef.current, selectedGroupId, content);
            } else {
                await api.post(`/api/groups/${selectedGroupId}/messages`, { content });
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to send message');
            setMessageInput(content);
        }
    };

    const handleInvite = async (candidate?: InviteCandidate | null) => {
        const target = candidate ?? selectedInvite;
        if (!selectedGroupId || !target) return;
        try {
            await api.post(`/api/groups/${selectedGroupId}/invite`, { username: target.username });
            setSelectedInvite(null);
            setInviteInput('');
            setInviteCandidates([]);
            await loadGroupDetails(selectedGroupId);
            await loadGroups();
            showSuccess('User invited');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to invite user');
        }
    };

    const handleKick = async (username: string) => {
        if (!selectedGroupId) return;
        try {
            await api.post(`/api/groups/${selectedGroupId}/kick`, { username });
            await loadGroupDetails(selectedGroupId);
            await loadGroups();
            showSuccess('Member removed');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to remove member');
        }
    };

    const handleToggleLeader = async (member: ChatGroupMember) => {
        if (!selectedGroupId) return;
        try {
            if (member.role === 'LEADER') {
                await api.delete(`/api/groups/${selectedGroupId}/leaders/${member.username}`);
            } else {
                await api.post(`/api/groups/${selectedGroupId}/leaders`, { username: member.username });
            }
            await loadGroupDetails(selectedGroupId);
            showSuccess('Leader role updated');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to update leader role');
        }
    };

    const handleLeaveGroup = async () => {
        if (!selectedGroupId) return;
        try {
            await api.post(`/api/groups/${selectedGroupId}/leave`);
            setSelectedGroupId(null);
            setMembers([]);
            setMessages([]);
            await loadGroups();
            showSuccess('You left the group');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to leave group');
        }
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Group Chat</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create WhatsApp-style groups with multiple leaders. Leaders can invite or remove members.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isSystemAdmin && (
                        <Button
                            variant={showAllGroups ? 'contained' : 'outlined'}
                            onClick={() => setShowAllGroups(v => !v)}
                        >
                            {showAllGroups ? 'All Groups' : 'My Groups'}
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                        New Group
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 180px)', minHeight: 500 }}>
                <Paper sx={{ width: 280, overflow: 'auto', borderRadius: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#f5f6fa' }}>
                        <Typography sx={{ fontWeight: 'bold' }}>Groups</Typography>
                    </Box>
                    <List dense>
                        {groups.map(group => (
                            <ListItem key={group.id} disablePadding>
                                <ListItemButton
                                    selected={group.id === selectedGroupId}
                                    onClick={() => handleSelectGroup(group.id)}
                                >
                                    <ListItemText
                                        primary={group.name}
                                        secondary={`${group.memberCount} members${group.myRole === 'LEADER' ? ' · Leader' : ''}`}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                        {groups.length === 0 && (
                            <ListItem>
                                <ListItemText secondary="No groups yet. Create one to get started." />
                            </ListItem>
                        )}
                    </List>
                </Paper>

                <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                    {selectedGroup ? (
                        <>
                            <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{selectedGroup.name}</Typography>
                                    {selectedGroup.description && (
                                        <Typography variant="body2" color="text.secondary">{selectedGroup.description}</Typography>
                                    )}
                                </Box>
                                {canChat && (
                                    <Button color="warning" size="small" onClick={handleLeaveGroup}>Leave Group</Button>
                                )}
                            </Box>

                            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
                                {loading && <Typography color="text.secondary">Loading...</Typography>}
                                {messages.map(msg => {
                                    const mine = msg.senderUsername === currentUsername;
                                    return (
                                        <Box
                                            key={msg.id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: mine ? 'flex-end' : 'flex-start',
                                                mb: 1.5,
                                            }}
                                        >
                                            <Paper
                                                sx={{
                                                    p: 1.5,
                                                    maxWidth: '70%',
                                                    bgcolor: mine ? '#dcf8c6' : 'white',
                                                    borderRadius: 2,
                                                }}
                                                elevation={1}
                                            >
                                                {!mine && (
                                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }} color="primary">
                                                        {msg.senderName || msg.senderUsername}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                                                    {new Date(msg.sentAt).toLocaleString()}
                                                </Typography>
                                            </Paper>
                                        </Box>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </Box>

                            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={canChat ? 'Type a message...' : 'Only group members can send messages'}
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    disabled={!canChat}
                                />
                                <IconButton type="submit" color="primary" disabled={!canChat || !messageInput.trim()}>
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ m: 'auto', textAlign: 'center', color: 'text.secondary' }}>
                            <GroupIcon sx={{ fontSize: 48, mb: 1 }} />
                            <Typography>Select a group or create a new one</Typography>
                        </Box>
                    )}
                </Paper>

                <Paper sx={{ width: 300, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#f5f6fa' }}>
                        <Typography sx={{ fontWeight: 'bold' }}>Members</Typography>
                        {isSystemAdmin && selectedGroup && !selectedGroup.member && (
                            <Typography variant="caption" color="text.secondary">Admin view (read-only)</Typography>
                        )}
                    </Box>

                    {isLeader && selectedGroup && (
                        <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <Autocomplete
                                size="small"
                                sx={{ flex: 1 }}
                                options={inviteCandidates}
                                value={selectedInvite}
                                inputValue={inviteInput}
                                loading={inviteSearchLoading}
                                filterOptions={(options) => options}
                                getOptionLabel={(option) => formatInviteLabel(option)}
                                isOptionEqualToValue={(option, value) => option.userId === value.userId}
                                noOptionsText={inviteInput.trim() ? 'No users found' : 'Type to search users'}
                                onInputChange={(_, value) => {
                                    setInviteInput(value);
                                    if (!value) {
                                        setSelectedInvite(null);
                                    }
                                }}
                                onChange={(_, value) => {
                                    setSelectedInvite(value);
                                    if (value) {
                                        handleInvite(value);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search by name, username, or email"
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.userId}>
                                        <Box>
                                            <Typography variant="body2">{option.firstname} {option.lastname}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                @{option.username} · {option.email}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                            <IconButton color="primary" onClick={() => handleInvite()} disabled={!selectedInvite}>
                                <PersonAddIcon />
                            </IconButton>
                        </Box>
                    )}

                    <List dense sx={{ overflow: 'auto', flex: 1 }}>
                        {members.map(member => (
                            <ListItem
                                key={member.userId}
                                secondaryAction={
                                    isLeader && member.username !== currentUsername ? (
                                        <Box>
                                            <IconButton
                                                size="small"
                                                title={member.role === 'LEADER' ? 'Demote to member' : 'Promote to leader'}
                                                onClick={() => handleToggleLeader(member)}
                                            >
                                                {member.role === 'LEADER' ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                                            </IconButton>
                                            {member.role === 'MEMBER' && (
                                                <IconButton size="small" color="error" onClick={() => handleKick(member.username)}>
                                                    <PersonRemoveIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    ) : null
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <span>{member.firstname} {member.lastname}</span>
                                            {member.role === 'LEADER' && <Chip label="Leader" size="small" color="warning" />}
                                        </Box>
                                    }
                                    secondary={`@${member.username}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Group</DialogTitle>
                <Box component="form" onSubmit={handleCreateGroup}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Group name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Description (optional)"
                            value={newGroupDescription}
                            onChange={(e) => setNewGroupDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Create</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
