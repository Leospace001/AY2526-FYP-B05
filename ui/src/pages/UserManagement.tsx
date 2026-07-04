import { useEffect, useState, useContext, type ChangeEvent, type FormEvent } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, TableSortLabel, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, TextField, Snackbar, Alert,
    Switch, FormControlLabel, Chip, Tooltip, CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { formatHongKongDateTime } from '../utils/hongKongTime';

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
    createdAt?: string | null;
    updatedAt?: string | null;
}

type SortField = 'username' | 'firstname' | 'email' | 'createdAt' | 'updatedAt' | 'active';
type SortDirection = 'asc' | 'desc';

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
    const [sortField, setSortField] = useState<SortField>('username');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const isSelf = editingUser?.username === user?.sub;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(
                `/api/users?page=${page}&size=${rowsPerPage}&sortBy=${sortField}&sortDir=${sortDirection}`,
            );
            setUsers(response.data.content);
            setTotalElements(response.data.totalElements);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to load user list', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection(field === 'createdAt' || field === 'updatedAt' ? 'desc' : 'asc');
        }
        setPage(0);
    };

    const handleOpenEdit = (selectedUser: UserInfo) => {
        setEditingUser({ ...selectedUser });
        setIsAdmin(selectedUser.roles?.includes('ROLE_ADMIN') ?? false);
        setIsModalOpen(true);
    };

    const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!editingUser) return;
        const { name, value, type, checked } = e.target;
        setEditingUser({
            ...editingUser,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSave = async (e: FormEvent) => {
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
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f6fa' }}>
                        <TableRow>
                            <TableCell sortDirection={sortField === 'username' ? sortDirection : false}>
                                <TableSortLabel
                                    active={sortField === 'username'}
                                    direction={sortField === 'username' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('username')}
                                >
                                    Username
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={sortField === 'firstname' ? sortDirection : false}>
                                <TableSortLabel
                                    active={sortField === 'firstname'}
                                    direction={sortField === 'firstname' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('firstname')}
                                >
                                    Full Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={sortField === 'email' ? sortDirection : false}>
                                <TableSortLabel
                                    active={sortField === 'email'}
                                    direction={sortField === 'email' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('email')}
                                >
                                    Email
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Login Methods</TableCell>
                            <TableCell>Roles</TableCell>
                            <TableCell sortDirection={sortField === 'createdAt' ? sortDirection : false}>
                                <TableSortLabel
                                    active={sortField === 'createdAt'}
                                    direction={sortField === 'createdAt' ? sortDirection : 'desc'}
                                    onClick={() => handleSort('createdAt')}
                                >
                                    Created (HKT)
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={sortField === 'updatedAt' ? sortDirection : false}>
                                <TableSortLabel
                                    active={sortField === 'updatedAt'}
                                    direction={sortField === 'updatedAt' ? sortDirection : 'desc'}
                                    onClick={() => handleSort('updatedAt')}
                                >
                                    Updated (HKT)
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={sortField === 'active' ? sortDirection : false}>
                                <TableSortLabel
                                    active={sortField === 'active'}
                                    direction={sortField === 'active' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('active')}
                                >
                                    Status
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                    <CircularProgress size={32} />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 5, color: '#7f8c8d' }}>
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((u) => (
                                <TableRow key={u.username} hover>
                                    <TableCell>{u.username}</TableCell>
                                    <TableCell>{u.firstname} {u.lastname}</TableCell>
                                    <TableCell sx={{ wordBreak: 'break-word' }}>{u.email}</TableCell>
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
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {formatHongKongDateTime(u.createdAt ?? null)}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {formatHongKongDateTime(u.updatedAt ?? null)}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: u.active ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                                            {u.active ? 'ACTIVE' : 'BLOCKED'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
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
                            ))
                        )}
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
                    rowsPerPageOptions={[5, 10, 25, 50]}
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
