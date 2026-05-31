import React, { useEffect, useState, useContext } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, TablePagination, IconButton, Dialog, DialogTitle, 
    DialogContent, DialogActions, Button, TextField, Snackbar, Alert, Switch, FormControlLabel 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
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
}

export default function UserManagement() {
    const { user } = useContext(AuthContext)!;
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
        setEditingUser(selectedUser);
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

        try {
            await api.put(`/api/users/${editingUser.username}`, editingUser);
            setSnackbar({ open: true, message: 'User updated successfully!', severity: 'success' });
            setIsModalOpen(false);
            fetchUsers(); // Refresh table
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to update user', severity: 'error' });
        }
    };

    // Security check: Only render if Admin
    if (!user?.roles?.includes('ROLE_ADMIN')) {
        return <Typography variant="h6" color="error" sx={{ p: 3 }}>Access Denied.</Typography>;
    }

    return (
        <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#2c3e50' }}>User Management</Typography>
            
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f6fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
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
                                    <Typography variant="body2" sx={{ color: u.active ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                                        {u.active ? 'ACTIVE' : 'INACTIVE'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={() => handleOpenEdit(u)}>
                                        <EditIcon />
                                    </IconButton>
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

            {/* Admin Edit Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Edit User: {editingUser?.username}</DialogTitle>
                <Box component="form" onSubmit={handleSave}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Username is read-only because it is the database identifier */}
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
                        
                        {/* 🚀 The Admin-Only Status Toggle */}
                        <FormControlLabel 
                            control={<Switch checked={editingUser?.active || false} onChange={handleFormChange} name="active" color="primary" />} 
                            label={editingUser?.active ? "Account is Active" : "Account is Disabled"} 
                            sx={{ mt: 1 }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setIsModalOpen(false)} color="inherit">Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">Save Changes</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}