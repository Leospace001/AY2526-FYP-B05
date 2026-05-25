import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import SecureImage from '../components/SecureImage';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button, 
    CircularProgress, Divider, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField // 🚀 Added Dialog imports
} from '@mui/material';
// 🟢 Explicitly import Grid2 (or standard Grid depending on MUI subversion configuration)
import Grid from '@mui/material/Grid'; 
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

interface CartItem {
    id: number;
    stockId: number;
    sellingPrice: number;
    imagePath: string;
    quantity: number;
}

interface CartResponse {
    id: number;
    userId: number;
    items: CartItem[];
}

export default function Cart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // 🚀 Modal control state and dynamic form bindings
    const [openCheckoutModal, setOpenCheckoutModal] = useState<boolean>(false);
    const [checkoutForm, setCheckoutForm] = useState({
        name: '',
        description: '',
        remarks: ''
    });

    const fetchCartData = async () => {
        try {
            const response = await api.get<CartResponse>('/api/cart');
            setCart(response.data);
        } catch (error) {
            console.error("Failed to load shopping cart contents:", error);
            setSnackbar({ open: true, message: 'Could not recover your active cart session.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCartData();
    }, []);

    const handleRemoveItem = async (itemId: number) => {
        try {
            await api.delete(`/api/cart/items/${itemId}`);
            setSnackbar({ open: true, message: 'Item removed from cart.', severity: 'success' });
            fetchCartData();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to drop item from cart.', severity: 'error' });
        }
    };

    // Opens the details entry popup
    const handleCheckoutOpen = () => {
        setOpenCheckoutModal(true);
    };

    // Tracks inline input updates on the modal fields
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCheckoutForm(prev => ({ ...prev, [name]: value }));
    };

    // 🚀 Executes the final authorized payload transaction to the Spring Boot backend
    const handleConfirmCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Updated destination target path mapping route to match /api/order/checkout exactly
            await api.post('/api/order/checkout', checkoutForm);
            
            setSnackbar({ open: true, message: 'Order submitted successfully!', severity: 'success' });
            setOpenCheckoutModal(false);
            
            setTimeout(() => navigate('/orders'), 1500);
        } catch (error) {
            console.error("Checkout transaction failed:", error);
            setSnackbar({ open: true, message: 'Checkout transaction failed.', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const calculateTotal = () => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const items = cart?.items || [];

    return (
        <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')} color="inherit">
                    Continue Shopping
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Your Shopping Cart
                </Typography>
            </Box>

            {items.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, boxShadow: 1 }}>
                    <ShoppingBagIcon sx={{ fontSize: 60, color: '#b2bec3', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Your basket is currently empty
                    </Typography>
                    <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/products')}>
                        Browse Catalog
                    </Button>
                </Paper>
            ) : (
                // 🟢 Updated wrapper context tags to match Grid2 signature parameters
                <Grid container spacing={4}>
                    {/* Items List Table Column */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, overflow: 'hidden' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ width: 60, height: 60, borderRadius: 1, overflow: 'hidden', border: '1px solid #eee', flexShrink: 0 }}>
                                                    <SecureImage imagePath={item.imagePath} alt="Product image thumbnail" height="60px" />
                                                </Box>
                                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                    Stock Item #{item.stockId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">${item.sellingPrice.toFixed(2)}</TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="right">${(item.sellingPrice * item.quantity).toFixed(2)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton color="error" onClick={() => handleRemoveItem(item.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    {/* Transaction Order Summary Checklist Column */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, bgcolor: '#fdfdfd' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                Order Summary
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography color="textSecondary">Estimated Total:</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                    ${calculateTotal().toFixed(2)}
                                </Typography>
                            </Box>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                fullWidth 
                                size="large"
                                disabled={submitting}
                                onClick={handleCheckoutOpen} // 🚀 Triggers the modal popup dialog layout
                                sx={{ fontWeight: 'bold', py: 1.5, borderRadius: 2 }}
                            >
                                Proceed to Checkout
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* 🚀 CHECKOUT MULTIPART POPUP DIALOG FORM */}
            <Dialog 
                open={openCheckoutModal} 
                onClose={() => !submitting && setOpenCheckoutModal(false)}
                maxWidth="sm"
                fullWidth
                sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', color: '#2c3e50', pt: 3 }}>
                    Fulfillment Delivery Details
                </DialogTitle>
                
                <Box component="form" onSubmit={handleConfirmCheckout}>
                    <DialogContent dividers sx={{ py: 2 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            Please furnish administrative identifying metrics to attach metadata tracking references to this batch purchase execution.
                        </Typography>
                        
                        <TextField
                            required
                            fullWidth
                            margin="normal"
                            label="Order Designation Name"
                            name="name"
                            variant="outlined"
                            placeholder="e.g. Fuji Apple Batch Order"
                            value={checkoutForm.name}
                            onChange={handleFormChange}
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Order Description"
                            name="description"
                            variant="outlined"
                            multiline
                            rows={2}
                            placeholder="Provide summary structural tracking briefs..."
                            value={checkoutForm.description}
                            onChange={handleFormChange}
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Special Remarks / Notes"
                            name="remarks"
                            variant="outlined"
                            multiline
                            rows={2}
                            placeholder="e.g. Request immediate ASAP warehouse logistics processing"
                            value={checkoutForm.remarks}
                            onChange={handleFormChange}
                            disabled={submitting}
                        />
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
                        <Button 
                            color="inherit" 
                            disabled={submitting} 
                            onClick={() => setOpenCheckoutModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary"
                            disabled={submitting}
                            sx={{ fontWeight: 'bold', px: 3 }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Checkout'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}