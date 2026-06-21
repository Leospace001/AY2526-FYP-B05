import React, { useEffect, useState, useContext } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, TextField, Snackbar, Alert,
    Switch, FormControlLabel, Chip, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';

interface UserInfo {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    age: number;
    phone: number;
    active: boolean;
    roles: string[];
    authMethods: string[];
}

const AUTH_METHOD_LABELS: Record<string, string> = {
    password: 'Password',
    google: 'Google',
    github: 'GitHub',
};

function formatAuthMethod(method: string): string {
    return AUTH_METHOD_LABELS[method] ?? method.charAt(0).toUpperCase() + method.slice(1);
}

function authMethodColor(method: string): 'default' | 'primary' | 'secondary' | 'success' {
    if (method === 'password') return 'default';
    if (method === 'google') return 'primary';
    if (method === 'github') return 'secondary';
    return 'success';
}

export default function UserManagement() {
    const { user } = useContext(AuthContext)!;
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const isSelf = editingUser?.username === user?.sub;

    const fetchUsers = async () => {
        try {
            const response = await api.get(`/api/users?page=${page}&size=${rowsPerPage}`);
            setUsers(response.data.content);
            setTotalElements(response.data.totalElements);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to load user list', severity: 'error' });
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage]);

    const handleOpenEdit = (selectedUser: UserInfo) => {
        setEditingUser({ ...selectedUser });
        setIsAdmin(selectedUser.roles?.includes('ROLE_ADMIN') ?? false);
        setIsModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingUser) return;
        const { name, value, type, checked } = e.target;
        setEditingUser({
            ...editingUser,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setSaving(true);
        try {
            await api.put(`/api/users/${editingUser.username}`, editingUser);

            const wasAdmin = users.find(u => u.username === editingUser.username)?.roles?.includes('ROLE_ADMIN') ?? false;
            if (!isSelf && isAdmin !== wasAdmin) {
                if (isAdmin) {
                    await api.post(`/api/users/${editingUser.username}/roles/admin`);
                } else {
                    await api.delete(`/api/users/${editingUser.username}/roles/admin`);
                }
            }

            setSnackbar({ open: true, message: 'User updated successfully!', severity: 'success' });
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to update user', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleBlock = async (targetUser: UserInfo) => {
        if (targetUser.username === user?.sub) {
            setSnackbar({ open: true, message: 'You cannot block your own account.', severity: 'error' });
            return;
        }
        const nextActive = !targetUser.active;
        try {
            await api.patch(`/api/users/${targetUser.username}/active`, { active: nextActive });
            setSnackbar({
                open: true,
                message: nextActive ? 'User unblocked.' : 'User blocked from logging in.',
                severity: 'success'
            });
            fetchUsers();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to update account status', severity: 'error' });
        }
    };

    if (!user?.roles?.includes('ROLE_ADMIN')) {
        return <Typography variant="h6" color="error" sx={{ p: 3 }}>Access Denied.</Typography>;
    }

    return (
        <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#2c3e50' }}>User Management</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                One email can be linked to multiple sign-in methods. When a user signs in with Google or GitHub
                using the same email as an existing account, those providers are added to the same user record.
            </Typography>

            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f6fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Login Methods</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Roles</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.username} hover>
                                <TableCell>{u.username}</TableCell>
                                <TableCell>{u.firstname} {u.lastname}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(u.authMethods ?? []).length > 0 ? (
                                            u.authMethods.map((method) => (
                                                <Chip
                                                    key={method}
                                                    label={formatAuthMethod(method)}
                                                    size="small"
                                                    color={authMethodColor(method)}
                                                    variant="outlined"
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">None</Typography>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(u.roles ?? []).map((role) => (
                                            <Chip
                                                key={role}
                                                icon={role === 'ROLE_ADMIN' ? <AdminPanelSettingsIcon /> : undefined}
                                                label={role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                                                size="small"
                                                color={role === 'ROLE_ADMIN' ? 'warning' : 'default'}
                                            />
                                        ))}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ color: u.active ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                                        {u.active ? 'ACTIVE' : 'BLOCKED'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="Edit profile, roles, and status">
                                        <IconButton color="primary" onClick={() => handleOpenEdit(u)}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    {u.username !== user?.sub && (
                                        <Tooltip title={u.active ? 'Block login' : 'Unblock login'}>
                                            <Button
                                                size="small"
                                                color={u.active ? 'error' : 'success'}
                                                variant="outlined"
                                                onClick={() => handleToggleBlock(u)}
                                                sx={{ ml: 1 }}
                                            >
                                                {u.active ? 'Block' : 'Unblock'}
                                            </Button>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Edit User: {editingUser?.username}</DialogTitle>
                <Box component="form" onSubmit={handleSave}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Username" value={editingUser?.username || ''} disabled fullWidth />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="First Name" name="firstname" value={editingUser?.firstname || ''} onChange={handleFormChange} fullWidth required />
                            <TextField label="Last Name" name="lastname" value={editingUser?.lastname || ''} onChange={handleFormChange} fullWidth required />
                        </Box>
                        <TextField label="Email" name="email" type="email" value={editingUser?.email || ''} onChange={handleFormChange} fullWidth required />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Age" name="age" type="number" value={editingUser?.age || ''} onChange={handleFormChange} fullWidth />
                            <TextField label="Phone" name="phone" type="number" value={editingUser?.phone || ''} onChange={handleFormChange} fullWidth />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Linked login methods</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(editingUser?.authMethods ?? []).map((method) => (
                                    <Chip
                                        key={method}
                                        label={formatAuthMethod(method)}
                                        size="small"
                                        color={authMethodColor(method)}
                                    />
                                ))}
                            </Box>
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isAdmin}
                                    onChange={(e) => setIsAdmin(e.target.checked)}
                                    disabled={isSelf}
                                    color="warning"
                                />
                            }
                            label={isAdmin ? 'Administrator access' : 'Standard user access'}
                        />
                        {isSelf && (
                            <Typography variant="caption" color="text.secondary">
                                You cannot change your own admin role.
                            </Typography>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editingUser?.active || false}
                                    onChange={handleFormChange}
                                    name="active"
                                    color="primary"
                                    disabled={isSelf}
                                />
                            }
                            label={editingUser?.active ? 'Account can log in' : 'Account is blocked'}
                        />
                        {isSelf && (
                            <Typography variant="caption" color="text.secondary">
                                You cannot block your own account.
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setIsModalOpen(false)} color="inherit" disabled={saving}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
