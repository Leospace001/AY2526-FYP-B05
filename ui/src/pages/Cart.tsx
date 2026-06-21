import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import SecureImage from '../components/SecureImage';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button, 
    CircularProgress, Divider, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Link
} from '@mui/material';
// 🟢 Explicitly import Grid2 (or standard Grid depending on MUI subversion configuration)
import Grid from '@mui/material/Grid'; 
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

interface CartItem {
    id: number;
    stockId: number;
    productName?: string;
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
    const { refreshCartCount } = useContext(AuthContext)!;
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // 🚀 Modal control state and dynamic form bindings
    const [openCheckoutModal, setOpenCheckoutModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(1);
    const [updating, setUpdating] = useState<boolean>(false);
    const [checkoutForm, setCheckoutForm] = useState({
        name: '',
        description: '',
        remarks: '',
        deliveryAddressId: '' as number | '',
        paymentMethodId: '' as number | '',
    });
    const [addresses, setAddresses] = useState<Array<{ id: number; label: string; recipientName: string; isDefault?: boolean; default?: boolean }>>([]);
    const [paymentMethods, setPaymentMethods] = useState<Array<{ id: number; label: string; cardBrand: string; cardLastFour: string; isDefault?: boolean; default?: boolean }>>([]);

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

    const handleRemoveItem = async (cartItemId: number) => {
        try {
            const response = await api.delete<CartResponse>(`/api/cart/items/${cartItemId}`);
            setCart(response.data);
            refreshCartCount();
            window.dispatchEvent(new Event('cart-updated'));
            setSnackbar({ open: true, message: 'Item removed from cart.', severity: 'success' });
        } catch (error) {
            console.error('Failed to remove cart item:', error);
            setSnackbar({ open: true, message: 'Failed to drop item from cart.', severity: 'error' });
        }
    };

    const handleEditOpen = (item: CartItem) => {
        setEditingItem(item);
        setEditQuantity(item.quantity);
        setOpenEditModal(true);
    };

    const handleEditClose = () => {
        if (!updating) {
            setOpenEditModal(false);
            setEditingItem(null);
        }
    };

    const handleConfirmEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editQuantity < 1) {
            setSnackbar({ open: true, message: 'Quantity must be at least 1.', severity: 'error' });
            return;
        }

        setUpdating(true);
        try {
            const response = await api.put<CartResponse>(
                `/api/cart/items/${editingItem.id}`,
                { quantity: editQuantity }
            );
            setCart(response.data);
            refreshCartCount();
            window.dispatchEvent(new Event('cart-updated'));
            setOpenEditModal(false);
            setEditingItem(null);
            setSnackbar({ open: true, message: 'Cart item quantity updated.', severity: 'success' });
        } catch (error: unknown) {
            console.error('Failed to update cart item:', error);
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? 'Failed to update item quantity.';
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    // Opens the details entry popup
    const handleCheckoutOpen = async () => {
        try {
            const [addrRes, payRes] = await Promise.all([
                api.get('/api/addresses'),
                api.get('/api/payment-methods'),
            ]);
            const addrList = addrRes.data as Array<{ id: number; label: string; recipientName: string; isDefault?: boolean; default?: boolean }>;
            const payList = payRes.data as Array<{ id: number; label: string; cardBrand: string; cardLastFour: string; isDefault?: boolean; default?: boolean }>;
            setAddresses(addrList);
            setPaymentMethods(payList);

            const defaultAddr = addrList.find(a => a.isDefault || a.default);
            const defaultPay = payList.find(p => p.isDefault || p.default);

            setCheckoutForm(prev => ({
                ...prev,
                deliveryAddressId: defaultAddr?.id ?? '',
                paymentMethodId: defaultPay?.id ?? '',
            }));
            setOpenCheckoutModal(true);
        } catch {
            setSnackbar({ open: true, message: 'Could not load checkout options. Add an address and payment method under Orders.', severity: 'error' });
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCheckoutForm(prev => ({
            ...prev,
            [name]: name === 'deliveryAddressId' || name === 'paymentMethodId'
                ? (value === '' ? '' : Number(value))
                : value,
        }));
    };

    // 🚀 Executes the final authorized payload transaction to the Spring Boot backend
    const handleConfirmCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (!checkoutForm.deliveryAddressId || !checkoutForm.paymentMethodId) {
                setSnackbar({ open: true, message: 'Please select a delivery address and payment method.', severity: 'error' });
                setSubmitting(false);
                return;
            }
            await api.post('/api/order/checkout', {
                name: checkoutForm.name,
                description: checkoutForm.description,
                remarks: checkoutForm.remarks,
                deliveryAddressId: checkoutForm.deliveryAddressId,
                paymentMethodId: checkoutForm.paymentMethodId,
            });
            
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
                                                    {item.productName || `Stock Item #${item.stockId}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">${item.sellingPrice.toFixed(2)}</TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="right">${(item.sellingPrice * item.quantity).toFixed(2)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton color="primary" onClick={() => handleEditOpen(item)} aria-label="Edit quantity">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton color="error" onClick={() => handleRemoveItem(item.id)} aria-label="Remove item">
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

            {/* Edit quantity dialog */}
            <Dialog
                open={openEditModal}
                onClose={handleEditClose}
                maxWidth="xs"
                fullWidth
                sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', color: '#2c3e50', pt: 3 }}>
                    Edit Quantity
                </DialogTitle>
                <Box component="form" onSubmit={handleConfirmEdit}>
                    <DialogContent dividers sx={{ py: 2 }}>
                        {editingItem && (
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                {editingItem.productName || `Stock Item #${editingItem.stockId}`} — ${editingItem.sellingPrice.toFixed(2)} each
                            </Typography>
                        )}
                        <TextField
                            required
                            fullWidth
                            type="number"
                            label="Quantity"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            disabled={updating}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
                        <Button color="inherit" disabled={updating} onClick={handleEditClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={updating}
                            sx={{ fontWeight: 'bold', px: 3 }}
                        >
                            {updating ? <CircularProgress size={24} color="inherit" /> : 'Save'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* 🚀 CHECKOUT MULTIPART POPUP DIALOG FORM */}
            <Dialog 
                open={openCheckoutModal} 
                onClose={() => !submitting && setOpenCheckoutModal(false)}
                maxWidth="sm"
                fullWidth
                sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', color: '#2c3e50', pt: 3 }}>
                    Checkout
                </DialogTitle>
                
                <Box component="form" onSubmit={handleConfirmCheckout}>
                    <DialogContent dividers sx={{ py: 2 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Choose your delivery address and payment method. Manage saved options on the{' '}
                            <Link component={RouterLink} to="/orders" underline="hover">Orders page</Link>.
                        </Typography>

                        {addresses.length === 0 || paymentMethods.length === 0 ? (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                {addresses.length === 0 && paymentMethods.length === 0
                                    ? 'Add a delivery address and payment method on the Orders page before checkout.'
                                    : addresses.length === 0
                                        ? 'Add a delivery address on the Orders page before checkout.'
                                        : 'Add a payment method on the Orders page before checkout.'}
                            </Alert>
                        ) : null}

                        <TextField
                            select
                            required
                            fullWidth
                            margin="normal"
                            label="Delivery address"
                            name="deliveryAddressId"
                            value={checkoutForm.deliveryAddressId}
                            onChange={handleFormChange}
                            disabled={submitting}
                        >
                            {addresses.map(addr => (
                                <MenuItem key={addr.id} value={addr.id}>
                                    {addr.label} — {addr.recipientName}{(addr.isDefault || addr.default) ? ' (Default)' : ''}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            required
                            fullWidth
                            margin="normal"
                            label="Payment method"
                            name="paymentMethodId"
                            value={checkoutForm.paymentMethodId}
                            onChange={handleFormChange}
                            disabled={submitting}
                        >
                            {paymentMethods.map(pm => (
                                <MenuItem key={pm.id} value={pm.id}>
                                    {pm.label} — {pm.cardBrand} •••• {pm.cardLastFour}{(pm.isDefault || pm.default) ? ' (Default)' : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                        
                        <TextField
                            required
                            fullWidth
                            margin="normal"
                            label="Order name"
                            name="name"
                            variant="outlined"
                            placeholder="e.g. Weekly grocery order"
                            value={checkoutForm.name}
                            onChange={handleFormChange}
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Order description"
                            name="description"
                            variant="outlined"
                            multiline
                            rows={2}
                            value={checkoutForm.description}
                            onChange={handleFormChange}
                            disabled={submitting}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Special remarks"
                            name="remarks"
                            variant="outlined"
                            multiline
                            rows={2}
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