import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import SecureImage from '../components/SecureImage';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    CircularProgress, Divider, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    ToggleButton, ToggleButtonGroup, FormControlLabel, Checkbox
} from '@mui/material';
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

interface SavedAddress {
    id: number;
    label: string;
    recipientName: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
    default?: boolean;
}

interface SavedPayment {
    id: number;
    label: string;
    cardholderName: string;
    cardBrand: string;
    cardLastFour: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault?: boolean;
    default?: boolean;
}

type FulfillmentMode = 'saved' | 'new';

const emptyAddress = {
    label: '', recipientName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: '',
};

const emptyPayment = {
    label: '', cardholderName: '', cardBrand: 'Visa', cardNumber: '',
    expiryMonth: 1, expiryYear: new Date().getFullYear(),
};

function isDefaultFlag(item: { isDefault?: boolean; default?: boolean }) {
    return item.isDefault ?? item.default ?? false;
}

export default function Cart() {
    const navigate = useNavigate();
    const { refreshCartCount } = useContext(AuthContext)!;
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const [openCheckoutModal, setOpenCheckoutModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(1);
    const [updating, setUpdating] = useState<boolean>(false);

    const [checkoutForm, setCheckoutForm] = useState({ name: '', description: '', remarks: '' });
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<SavedPayment[]>([]);
    const [addressMode, setAddressMode] = useState<FulfillmentMode>('new');
    const [paymentMode, setPaymentMode] = useState<FulfillmentMode>('new');
    const [selectedAddressId, setSelectedAddressId] = useState<number | ''>('');
    const [selectedPaymentId, setSelectedPaymentId] = useState<number | ''>('');
    const [newAddress, setNewAddress] = useState(emptyAddress);
    const [newPayment, setNewPayment] = useState(emptyPayment);
    const [saveNewAddress, setSaveNewAddress] = useState(false);
    const [saveNewPayment, setSaveNewPayment] = useState(false);

    const fetchCartData = async () => {
        try {
            const response = await api.get<CartResponse>('/api/cart');
            setCart(response.data);
        } catch (error) {
            console.error('Failed to load shopping cart contents:', error);
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

    const handleCheckoutOpen = async () => {
        try {
            const [addrRes, payRes] = await Promise.all([
                api.get('/api/addresses'),
                api.get('/api/payment-methods'),
            ]);
            const addrList = addrRes.data as SavedAddress[];
            const payList = payRes.data as SavedPayment[];
            setAddresses(addrList);
            setPaymentMethods(payList);

            const defaultAddr = addrList.find(a => isDefaultFlag(a));
            const defaultPay = payList.find(p => isDefaultFlag(p));

            setAddressMode(addrList.length > 0 ? 'saved' : 'new');
            setPaymentMode(payList.length > 0 ? 'saved' : 'new');
            setSelectedAddressId(defaultAddr?.id ?? '');
            setSelectedPaymentId(defaultPay?.id ?? '');
            setNewAddress(emptyAddress);
            setNewPayment(emptyPayment);
            setSaveNewAddress(false);
            setSaveNewPayment(false);
            setCheckoutForm({ name: '', description: '', remarks: '' });
            setOpenCheckoutModal(true);
        } catch {
            setAddresses([]);
            setPaymentMethods([]);
            setAddressMode('new');
            setPaymentMode('new');
            setNewAddress(emptyAddress);
            setNewPayment(emptyPayment);
            setOpenCheckoutModal(true);
        }
    };

    const handleCheckoutFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCheckoutForm(prev => ({ ...prev, [name]: value }));
    };

    const validateCheckout = (): string | null => {
        if (!checkoutForm.name.trim()) {
            return 'Order name is required.';
        }
        if (addressMode === 'saved') {
            if (!selectedAddressId) {
                return 'Please select a delivery address or enter a new one.';
            }
        } else {
            if (!newAddress.recipientName.trim() || !newAddress.addressLine1.trim()
                || !newAddress.city.trim() || !newAddress.postalCode.trim() || !newAddress.country.trim()) {
                return 'Please complete the required delivery address fields.';
            }
            if (saveNewAddress && !newAddress.label.trim()) {
                return 'Please add a label if you want to save this address.';
            }
        }
        if (paymentMode === 'saved') {
            if (!selectedPaymentId) {
                return 'Please select a payment method or enter a new one.';
            }
        } else {
            const digits = newPayment.cardNumber.replace(/\D/g, '');
            if (!newPayment.cardholderName.trim() || digits.length < 4) {
                return 'Please enter cardholder name and a valid card number.';
            }
            if (saveNewPayment && !newPayment.label.trim()) {
                return 'Please add a label if you want to save this payment method.';
            }
        }
        return null;
    };

    const handleConfirmCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateCheckout();
        if (validationError) {
            setSnackbar({ open: true, message: validationError, severity: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                name: checkoutForm.name,
                description: checkoutForm.description,
                remarks: checkoutForm.remarks,
            };

            if (addressMode === 'saved') {
                payload.deliveryAddressId = selectedAddressId;
            } else {
                payload.deliveryAddress = { ...newAddress };
                payload.saveDeliveryAddress = saveNewAddress;
            }

            if (paymentMode === 'saved') {
                payload.paymentMethodId = selectedPaymentId;
            } else {
                payload.paymentMethod = { ...newPayment };
                payload.savePaymentMethod = saveNewPayment;
            }

            await api.post('/api/order/checkout', payload);

            setSnackbar({ open: true, message: 'Order submitted successfully!', severity: 'success' });
            setOpenCheckoutModal(false);
            refreshCartCount();
            setTimeout(() => navigate('/orders'), 1500);
        } catch (error: unknown) {
            console.error('Checkout transaction failed:', error);
            const err = error as { response?: { data?: { message?: string } } };
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Checkout transaction failed.',
                severity: 'error',
            });
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
                <Grid container spacing={4}>
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
                                onClick={handleCheckoutOpen}
                                sx={{ fontWeight: 'bold', py: 1.5, borderRadius: 2 }}
                            >
                                Proceed to Checkout
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            )}

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
                        <Button type="submit" variant="contained" color="primary" disabled={updating} sx={{ fontWeight: 'bold', px: 3 }}>
                            {updating ? <CircularProgress size={24} color="inherit" /> : 'Save'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog
                open={openCheckoutModal}
                onClose={() => !submitting && setOpenCheckoutModal(false)}
                maxWidth="md"
                fullWidth
                sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', color: '#2c3e50', pt: 3 }}>
                    Checkout
                </DialogTitle>

                <Box component="form" onSubmit={handleConfirmCheckout}>
                    <DialogContent dividers sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Enter delivery and payment details below. You can use saved options or fill in one-off details for this order only.
                        </Typography>

                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Order details</Typography>
                        <TextField
                            required
                            fullWidth
                            margin="dense"
                            label="Order name"
                            name="name"
                            placeholder="e.g. Weekly grocery order"
                            value={checkoutForm.name}
                            onChange={handleCheckoutFormChange}
                            disabled={submitting}
                        />
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Order description"
                            name="description"
                            multiline
                            rows={2}
                            value={checkoutForm.description}
                            onChange={handleCheckoutFormChange}
                            disabled={submitting}
                        />
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Special remarks"
                            name="remarks"
                            multiline
                            rows={2}
                            value={checkoutForm.remarks}
                            onChange={handleCheckoutFormChange}
                            disabled={submitting}
                        />

                        <Divider sx={{ my: 2.5 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Delivery address</Typography>
                            <ToggleButtonGroup
                                size="small"
                                exclusive
                                value={addressMode}
                                onChange={(_, value: FulfillmentMode | null) => value && setAddressMode(value)}
                                disabled={submitting}
                            >
                                <ToggleButton value="saved" disabled={addresses.length === 0}>Saved</ToggleButton>
                                <ToggleButton value="new">New</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {addressMode === 'saved' ? (
                            addresses.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 1 }}>No saved addresses yet. Switch to New to enter one for this order.</Alert>
                            ) : (
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    margin="dense"
                                    label="Choose saved address"
                                    value={selectedAddressId}
                                    onChange={(e) => setSelectedAddressId(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={submitting}
                                >
                                    {addresses.map(addr => (
                                        <MenuItem key={addr.id} value={addr.id}>
                                            {addr.label} — {addr.recipientName}{isDefaultFlag(addr) ? ' (Default)' : ''}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                                {saveNewAddress && (
                                    <TextField
                                        label="Label (e.g. Home)"
                                        required
                                        value={newAddress.label}
                                        onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                        disabled={submitting}
                                    />
                                )}
                                <TextField
                                    label="Recipient name"
                                    required
                                    value={newAddress.recipientName}
                                    onChange={e => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                                    disabled={submitting}
                                />
                                <TextField
                                    label="Phone"
                                    value={newAddress.phone}
                                    onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                    disabled={submitting}
                                />
                                <TextField
                                    label="Address line 1"
                                    required
                                    value={newAddress.addressLine1}
                                    onChange={e => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                    disabled={submitting}
                                />
                                <TextField
                                    label="Address line 2"
                                    value={newAddress.addressLine2}
                                    onChange={e => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                                    disabled={submitting}
                                />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField label="City" required fullWidth value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} disabled={submitting} />
                                    <TextField label="State" fullWidth value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} disabled={submitting} />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField label="Postal code" required fullWidth value={newAddress.postalCode} onChange={e => setNewAddress({ ...newAddress, postalCode: e.target.value })} disabled={submitting} />
                                    <TextField label="Country" required fullWidth value={newAddress.country} onChange={e => setNewAddress({ ...newAddress, country: e.target.value })} disabled={submitting} />
                                </Box>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={saveNewAddress}
                                            onChange={e => setSaveNewAddress(e.target.checked)}
                                            disabled={submitting}
                                        />
                                    }
                                    label="Save this address for future orders"
                                />
                            </Box>
                        )}

                        <Divider sx={{ my: 2.5 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Payment method</Typography>
                            <ToggleButtonGroup
                                size="small"
                                exclusive
                                value={paymentMode}
                                onChange={(_, value: FulfillmentMode | null) => value && setPaymentMode(value)}
                                disabled={submitting}
                            >
                                <ToggleButton value="saved" disabled={paymentMethods.length === 0}>Saved</ToggleButton>
                                <ToggleButton value="new">New</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {paymentMode === 'saved' ? (
                            paymentMethods.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 1 }}>No saved payment methods yet. Switch to New to pay for this order.</Alert>
                            ) : (
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    margin="dense"
                                    label="Choose saved payment method"
                                    value={selectedPaymentId}
                                    onChange={(e) => setSelectedPaymentId(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={submitting}
                                >
                                    {paymentMethods.map(pm => (
                                        <MenuItem key={pm.id} value={pm.id}>
                                            {pm.label} — {pm.cardBrand} •••• {pm.cardLastFour}{isDefaultFlag(pm) ? ' (Default)' : ''}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                                {saveNewPayment && (
                                    <TextField
                                        label="Label (e.g. Personal Visa)"
                                        required
                                        value={newPayment.label}
                                        onChange={e => setNewPayment({ ...newPayment, label: e.target.value })}
                                        disabled={submitting}
                                    />
                                )}
                                <TextField
                                    label="Cardholder name"
                                    required
                                    value={newPayment.cardholderName}
                                    onChange={e => setNewPayment({ ...newPayment, cardholderName: e.target.value })}
                                    disabled={submitting}
                                />
                                <TextField
                                    select
                                    label="Card brand"
                                    required
                                    value={newPayment.cardBrand}
                                    onChange={e => setNewPayment({ ...newPayment, cardBrand: e.target.value })}
                                    disabled={submitting}
                                >
                                    {['Visa', 'Mastercard', 'Amex', 'Other'].map(b => (
                                        <MenuItem key={b} value={b}>{b}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="Card number"
                                    required
                                    value={newPayment.cardNumber}
                                    onChange={e => setNewPayment({ ...newPayment, cardNumber: e.target.value })}
                                    helperText="Only the last 4 digits are stored on the order"
                                    disabled={submitting}
                                />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField label="Expiry month" type="number" required fullWidth value={newPayment.expiryMonth} onChange={e => setNewPayment({ ...newPayment, expiryMonth: parseInt(e.target.value, 10) || 1 })} disabled={submitting} />
                                    <TextField label="Expiry year" type="number" required fullWidth value={newPayment.expiryYear} onChange={e => setNewPayment({ ...newPayment, expiryYear: parseInt(e.target.value, 10) || new Date().getFullYear() })} disabled={submitting} />
                                </Box>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={saveNewPayment}
                                            onChange={e => setSaveNewPayment(e.target.checked)}
                                            disabled={submitting}
                                        />
                                    }
                                    label="Save this payment method for future orders"
                                />
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
                        <Button color="inherit" disabled={submitting} onClick={() => setOpenCheckoutModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={submitting} sx={{ fontWeight: 'bold', px: 3 }}>
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
