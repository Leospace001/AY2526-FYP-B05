import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, TablePagination, Typography, CircularProgress, Box, TableSortLabel,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

interface OrderResponse {
    id: number;
    name?: string;
    description?: string;
    remarks?: string;
    createdAt?: string;
}

interface PageData {
    content: OrderResponse[];
    totalPages: number;
    totalElements: number;
    number: number;
}

type SortableColumns = 'id' | 'name' | 'remarks' | 'createdAt';
type Order = 'asc' | 'desc';

export default function Orders() {
    const auth = useContext(AuthContext);
    const isAdmin = auth?.user?.roles?.includes('ROLE_ADMIN');

    // Table State
    const [data, setData] = useState<PageData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [order, setOrder] = useState<Order>('desc');
    const [orderBy, setOrderBy] = useState<SortableColumns>('createdAt');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<OrderResponse | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        remarks: ''
    });

    // Snackbar State
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    // Fetch Orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get(
                `/api/order/page?page=${page}&size=${rowsPerPage}&sortBy=${orderBy}&sortDir=${order}`
            );
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            showSnackbar("Failed to load orders.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, orderBy, order]);

    // Table Handlers
    const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleRequestSort = (property: SortableColumns) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
        setPage(0);
    };

    // Edit Form Handlers
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenEdit = (orderData: OrderResponse) => {
        setEditingOrder(orderData);
        setEditFormData({
            name: orderData.name || '',
            description: orderData.description || '',
            remarks: orderData.remarks || ''
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setEditingOrder(null);
    };

    // Snackbar Handlers
    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    const handleSaveEdit = async () => {
        if (!editingOrder) return;
        setIsUpdating(true);
        try {
            await api.put(`/api/order/${editingOrder.id}`, editFormData);
            handleCloseEdit();
            fetchOrders(); 
            showSnackbar(`Order #${editingOrder.id} successfully updated!`, "success");
        } catch (error) {
            console.error("Failed to update order", error);
            showSnackbar("Failed to update the order. Please try again.", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#2c3e50' }}>
                Order Management
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#7f8c8d' }}>
                View and manage all customer orders here.
            </Typography>

            <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden', boxShadow: 3 }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader aria-label="orders table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f4f6f8' }}>
                                    <TableSortLabel
                                        active={orderBy === 'id'}
                                        direction={orderBy === 'id' ? order : 'asc'}
                                        onClick={() => handleRequestSort('id')}
                                    >
                                        Order ID
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f4f6f8' }}>
                                    <TableSortLabel
                                        active={orderBy === 'name'}
                                        direction={orderBy === 'name' ? order : 'asc'}
                                        onClick={() => handleRequestSort('name')}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f4f6f8' }}>
                                    <TableSortLabel
                                        active={orderBy === 'remarks'}
                                        direction={orderBy === 'remarks' ? order : 'asc'}
                                        onClick={() => handleRequestSort('remarks')}
                                    >
                                        Remarks
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f4f6f8' }}>
                                    <TableSortLabel
                                        active={orderBy === 'createdAt'}
                                        direction={orderBy === 'createdAt' ? order : 'asc'}
                                        onClick={() => handleRequestSort('createdAt')}
                                    >
                                        Created At
                                    </TableSortLabel>
                                </TableCell>
                                
                                {isAdmin && (
                                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f4f6f8' }}>
                                        Actions
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 5 : 4} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : data?.content.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 5 : 4} align="center" sx={{ py: 5, color: '#95a5a6' }}>
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.content.map((orderRow) => (
                                    <TableRow hover key={orderRow.id}>
                                        <TableCell>{orderRow.id}</TableCell>
                                        <TableCell>{orderRow.name || 'N/A'}</TableCell>
                                        <TableCell>{orderRow.remarks || 'N/A'}</TableCell>
                                        <TableCell>
                                            {orderRow.createdAt ? new Date(orderRow.createdAt).toLocaleString() : 'N/A'}
                                        </TableCell>
                                        
                                        {isAdmin && (
                                            <TableCell align="center">
                                                <IconButton color="primary" onClick={() => handleOpenEdit(orderRow)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={data?.totalElements || 0}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* EDIT MODAL */}
            <Dialog open={isEditModalOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
                <DialogTitle>Edit Order #{editingOrder?.id}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="Order Name" name="name" value={editFormData.name} onChange={handleFormChange} fullWidth variant="outlined" />
                        <TextField label="Description" name="description" value={editFormData.description} onChange={handleFormChange} fullWidth multiline rows={2} variant="outlined" />
                        <TextField label="Remarks" name="remarks" value={editFormData.remarks} onChange={handleFormChange} fullWidth multiline rows={2} variant="outlined" />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseEdit} color="inherit" disabled={isUpdating}>Cancel</Button>
                    <Button onClick={handleSaveEdit} color="primary" variant="contained" disabled={isUpdating}>
                        {isUpdating ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SUCCESS / ERROR SNACKBAR */}
            <Snackbar 
                open={snackbarOpen} 
                autoHideDuration={4000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </Box>
    );
}