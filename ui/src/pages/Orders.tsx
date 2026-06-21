import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import SecureImage from '../components/SecureImage';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Snackbar, Alert, Tabs, Tab, Chip, IconButton, Collapse, MenuItem, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface OrderItemResponse {
    id: number;
    stockId: number;
    stockName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    imagePath?: string;
    remarks?: string;
}

interface OrderResponse {
    id: number;
    name?: string;
    description?: string;
    remarks?: string;
    createdAt?: string;
    customerUsername?: string;
    orderTotal?: number;
    items?: OrderItemResponse[];
    deliveryLabel?: string;
    deliveryRecipientName?: string;
    deliveryPhone?: string;
    deliveryAddressLine1?: string;
    deliveryAddressLine2?: string;
    deliveryCity?: string;
    deliveryState?: string;
    deliveryPostalCode?: string;
    deliveryCountry?: string;
    paymentLabel?: string;
    paymentCardholderName?: string;
    paymentCardBrand?: string;
    paymentCardLastFour?: string;
    paymentExpiryMonth?: number;
    paymentExpiryYear?: number;
}

interface DeliveryAddress {
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

interface PaymentMethod {
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

interface PageData {
    content: OrderResponse[];
    totalElements: number;
}

const emptyAddress = {
    label: '', recipientName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: '', isDefault: false,
};

type AddressFormData = typeof emptyAddress;

function addressToForm(addr: DeliveryAddress): AddressFormData {
    return {
        label: addr.label,
        recipientName: addr.recipientName,
        phone: addr.phone ?? '',
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 ?? '',
        city: addr.city,
        state: addr.state ?? '',
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: isDefaultFlag(addr),
    };
}

const emptyPayment = {
    label: '', cardholderName: '', cardBrand: 'Visa', cardNumber: '',
    expiryMonth: 1, expiryYear: new Date().getFullYear(), isDefault: false,
};

function isDefaultFlag(item: { isDefault?: boolean; default?: boolean }) {
    return item.isDefault ?? item.default ?? false;
}

function formatAddress(order: OrderResponse): string {
    const parts = [
        order.deliveryRecipientName,
        order.deliveryAddressLine1,
        order.deliveryAddressLine2,
        [order.deliveryCity, order.deliveryState, order.deliveryPostalCode].filter(Boolean).join(', '),
        order.deliveryCountry,
    ].filter(Boolean);
    return parts.join(' · ') || 'No delivery address recorded';
}

export default function Orders() {
    const auth = useContext(AuthContext);
    const isAdmin = auth?.user?.roles?.includes('ROLE_ADMIN');

    const [tab, setTab] = useState(0);
    const [data, setData] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [detailOrder, setDetailOrder] = useState<OrderResponse | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
    const [payments, setPayments] = useState<PaymentMethod[]>([]);
    const [addressForm, setAddressForm] = useState<AddressFormData>(emptyAddress);
    const [paymentForm, setPaymentForm] = useState(emptyPayment);
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [addressDialogOpen, setAddressDialogOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    const [editOrder, setEditOrder] = useState<OrderResponse | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', remarks: '' });
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const showMsg = (message: string, severity: 'success' | 'error' = 'success') =>
        setSnackbar({ open: true, message, severity });

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/order/page?page=${page}&size=${rowsPerPage}&sortBy=createdAt&sortDir=desc`);
            setData(res.data);
        } catch {
            showMsg('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAddresses = async () => {
        try {
            const res = await api.get('/api/addresses');
            setAddresses(res.data);
        } catch {
            showMsg('Failed to load addresses', 'error');
        }
    };

    const fetchPayments = async () => {
        try {
            const res = await api.get('/api/payment-methods');
            setPayments(res.data);
        } catch {
            showMsg('Failed to load payment methods', 'error');
        }
    };

    useEffect(() => { fetchOrders(); }, [page, rowsPerPage]);
    useEffect(() => { fetchAddresses(); fetchPayments(); }, []);

    const openOrderDetail = async (orderId: number) => {
        try {
            const res = await api.get(`/api/order/${orderId}`);
            setDetailOrder(res.data);
            setDetailOpen(true);
        } catch {
            showMsg('Failed to load order details', 'error');
        }
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingAddressId) {
                await api.put(`/api/addresses/${editingAddressId}`, addressForm);
            } else {
                await api.post('/api/addresses', addressForm);
            }
            setAddressDialogOpen(false);
            setEditingAddressId(null);
            setAddressForm(emptyAddress);
            fetchAddresses();
            showMsg('Address saved');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showMsg(err.response?.data?.message || 'Failed to save address', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingPaymentId) {
                await api.put(`/api/payment-methods/${editingPaymentId}`, paymentForm);
            } else {
                await api.post('/api/payment-methods', paymentForm);
            }
            setPaymentDialogOpen(false);
            setEditingPaymentId(null);
            setPaymentForm(emptyPayment);
            fetchPayments();
            showMsg('Payment method saved');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showMsg(err.response?.data?.message || 'Failed to save payment method', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefaultAddress = async (id: number) => {
        try {
            await api.patch(`/api/addresses/${id}/default`);
            fetchAddresses();
            showMsg('Default address updated');
        } catch {
            showMsg('Failed to set default address', 'error');
        }
    };

    const handleSetDefaultPayment = async (id: number) => {
        try {
            await api.patch(`/api/payment-methods/${id}/default`);
            fetchPayments();
            showMsg('Default payment method updated');
        } catch {
            showMsg('Failed to set default payment', 'error');
        }
    };

    const handleDeleteAddress = async (id: number) => {
        try {
            await api.delete(`/api/addresses/${id}`);
            fetchAddresses();
            showMsg('Address removed');
        } catch {
            showMsg('Failed to delete address', 'error');
        }
    };

    const handleDeletePayment = async (id: number) => {
        try {
            await api.delete(`/api/payment-methods/${id}`);
            fetchPayments();
            showMsg('Payment method removed');
        } catch {
            showMsg('Failed to delete payment method', 'error');
        }
    };

    const handleSaveOrderEdit = async () => {
        if (!editOrder) return;
        setSaving(true);
        try {
            await api.put(`/api/order/${editOrder.id}`, editForm);
            setEditOpen(false);
            fetchOrders();
            showMsg('Order updated');
        } catch {
            showMsg('Failed to update order', 'error');
        } finally {
            setSaving(false);
        }
    };

    const renderOrderItems = (items: OrderItemResponse[] = []) => (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Unit price</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {items.length === 0 ? (
                    <TableRow><TableCell colSpan={4}>No line items</TableCell></TableRow>
                ) : items.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {item.imagePath && (
                                    <Box sx={{ width: 40, height: 40, borderRadius: 1, overflow: 'hidden' }}>
                                        <SecureImage imagePath={item.imagePath} alt={item.stockName} height="40px" />
                                    </Box>
                                )}
                                {item.stockName}
                            </Box>
                        </TableCell>
                        <TableCell align="right">${item.unitPrice?.toFixed(2)}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">${item.lineTotal?.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#2c3e50' }}>Orders & Checkout</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View order line items, manage saved delivery addresses and payment methods, and set defaults for checkout.
            </Typography>

            <Paper sx={{ mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="My Orders" />
                    <Tab label="Delivery Addresses" />
                    <Tab label="Payment Methods" />
                </Tabs>
            </Paper>

            {tab === 0 && (
                <Paper sx={{ boxShadow: 3 }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f4f6f8' }}>
                                <TableRow>
                                    <TableCell />
                                    <TableCell sx={{ fontWeight: 'bold' }}>Order</TableCell>
                                    {isAdmin && <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>}
                                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Items</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={isAdmin ? 7 : 6} align="center"><CircularProgress /></TableCell></TableRow>
                                ) : data?.content.length === 0 ? (
                                    <TableRow><TableCell colSpan={isAdmin ? 7 : 6} align="center">No orders found.</TableCell></TableRow>
                                ) : data?.content.map(order => (
                                    <React.Fragment key={order.id}>
                                        <TableRow hover>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                                                    {expandedOrderId === order.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 'bold' }}>#{order.id}</Typography>
                                                <Typography variant="caption" color="text.secondary">{order.name || 'Order'}</Typography>
                                            </TableCell>
                                            {isAdmin && <TableCell>{order.customerUsername || '—'}</TableCell>}
                                            <TableCell sx={{ fontWeight: 'bold' }}>${(order.orderTotal ?? 0).toFixed(2)}</TableCell>
                                            <TableCell>{order.items?.length ?? 0}</TableCell>
                                            <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</TableCell>
                                            <TableCell align="center">
                                                <IconButton color="primary" onClick={() => openOrderDetail(order.id)}><VisibilityIcon /></IconButton>
                                                {isAdmin && (
                                                    <IconButton color="primary" onClick={() => {
                                                        setEditOrder(order);
                                                        setEditForm({ name: order.name || '', description: order.description || '', remarks: order.remarks || '' });
                                                        setEditOpen(true);
                                                    }}><EditIcon /></IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={isAdmin ? 7 : 6} sx={{ py: 0, borderBottom: expandedOrderId === order.id ? undefined : 0 }}>
                                                <Collapse in={expandedOrderId === order.id}>
                                                    <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
                                                        {renderOrderItems(order.items)}
                                                        <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                                            <Box>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Delivery</Typography>
                                                                <Typography variant="body2">{formatAddress(order)}</Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Payment</Typography>
                                                                <Typography variant="body2">
                                                                    {order.paymentLabel || '—'}
                                                                    {order.paymentCardBrand && ` · ${order.paymentCardBrand} •••• ${order.paymentCardLastFour}`}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={data?.totalElements || 0}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                </Paper>
            )}

            {tab === 1 && (
                <Paper sx={{ p: 2, boxShadow: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Saved delivery addresses</Typography>
                        <Button variant="contained" onClick={() => { setEditingAddressId(null); setAddressForm(emptyAddress); setAddressDialogOpen(true); }}>
                            Add address
                        </Button>
                    </Box>
                    {addresses.length === 0 ? (
                        <Typography color="text.secondary">No saved addresses yet. Add one to use at checkout.</Typography>
                    ) : addresses.map(addr => (
                        <Paper key={addr.id} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                        <Typography sx={{ fontWeight: 'bold' }}>{addr.label}</Typography>
                                        {isDefaultFlag(addr) && <Chip icon={<StarIcon />} label="Default" size="small" color="warning" />}
                                    </Box>
                                    <Typography variant="body2">{addr.recipientName}{addr.phone ? ` · ${addr.phone}` : ''}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}, {addr.country}
                                    </Typography>
                                </Box>
                                <Box>
                                    {!isDefaultFlag(addr) && (
                                        <Button size="small" onClick={() => handleSetDefaultAddress(addr.id)}>Set default</Button>
                                    )}
                                    <IconButton onClick={() => {
                                        setEditingAddressId(addr.id);
                                        setAddressForm(addressToForm(addr));
                                        setAddressDialogOpen(true);
                                    }}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => handleDeleteAddress(addr.id)}><DeleteIcon /></IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Paper>
            )}

            {tab === 2 && (
                <Paper sx={{ p: 2, boxShadow: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Saved payment methods</Typography>
                        <Button variant="contained" onClick={() => { setEditingPaymentId(null); setPaymentForm(emptyPayment); setPaymentDialogOpen(true); }}>
                            Add payment method
                        </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Only the last 4 digits of your card are stored. Full card numbers are never saved.
                    </Typography>
                    {payments.length === 0 ? (
                        <Typography color="text.secondary">No saved payment methods yet.</Typography>
                    ) : payments.map(pm => (
                        <Paper key={pm.id} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                        <Typography sx={{ fontWeight: 'bold' }}>{pm.label}</Typography>
                                        {isDefaultFlag(pm) && <Chip icon={<StarIcon />} label="Default" size="small" color="warning" />}
                                    </Box>
                                    <Typography variant="body2">{pm.cardholderName}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {pm.cardBrand} •••• {pm.cardLastFour} · Exp {pm.expiryMonth}/{pm.expiryYear}
                                    </Typography>
                                </Box>
                                <Box>
                                    {!isDefaultFlag(pm) && (
                                        <Button size="small" onClick={() => handleSetDefaultPayment(pm.id)}>Set default</Button>
                                    )}
                                    <IconButton onClick={() => {
                                        setEditingPaymentId(pm.id);
                                        setPaymentForm({
                                            label: pm.label, cardholderName: pm.cardholderName, cardBrand: pm.cardBrand,
                                            cardNumber: `************${pm.cardLastFour}`, expiryMonth: pm.expiryMonth,
                                            expiryYear: pm.expiryYear, isDefault: isDefaultFlag(pm),
                                        });
                                        setPaymentDialogOpen(true);
                                    }}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => handleDeletePayment(pm.id)}><DeleteIcon /></IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Paper>
            )}

            {/* Order detail dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Order #{detailOrder?.id}</DialogTitle>
                <DialogContent dividers>
                    {detailOrder && (
                        <>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Placed {detailOrder.createdAt ? new Date(detailOrder.createdAt).toLocaleString() : '—'}
                                {isAdmin && detailOrder.customerUsername ? ` · Customer: ${detailOrder.customerUsername}` : ''}
                            </Typography>
                            {renderOrderItems(detailOrder.items)}
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Delivery address</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>{formatAddress(detailOrder)}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Payment</Typography>
                            <Typography variant="body2">
                                {detailOrder.paymentCardholderName} · {detailOrder.paymentCardBrand} •••• {detailOrder.paymentCardLastFour}
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>Total: ${(detailOrder.orderTotal ?? 0).toFixed(2)}</Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
            </Dialog>

            {/* Address dialog */}
            <Dialog open={addressDialogOpen} onClose={() => !saving && setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingAddressId ? 'Edit address' : 'Add delivery address'}</DialogTitle>
                <Box component="form" onSubmit={handleSaveAddress}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Label (e.g. Home)" required value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} />
                        <TextField label="Recipient name" required value={addressForm.recipientName} onChange={e => setAddressForm({ ...addressForm, recipientName: e.target.value })} />
                        <TextField label="Phone" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} />
                        <TextField label="Address line 1" required value={addressForm.addressLine1} onChange={e => setAddressForm({ ...addressForm, addressLine1: e.target.value })} />
                        <TextField label="Address line 2" value={addressForm.addressLine2} onChange={e => setAddressForm({ ...addressForm, addressLine2: e.target.value })} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="City" required fullWidth value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                            <TextField label="State" fullWidth value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Postal code" required fullWidth value={addressForm.postalCode} onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })} />
                            <TextField label="Country" required fullWidth value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAddressDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Payment dialog */}
            <Dialog open={paymentDialogOpen} onClose={() => !saving && setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingPaymentId ? 'Edit payment method' : 'Add payment method'}</DialogTitle>
                <Box component="form" onSubmit={handleSavePayment}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Label (e.g. Personal Visa)" required value={paymentForm.label} onChange={e => setPaymentForm({ ...paymentForm, label: e.target.value })} />
                        <TextField label="Cardholder name" required value={paymentForm.cardholderName} onChange={e => setPaymentForm({ ...paymentForm, cardholderName: e.target.value })} />
                        <TextField select label="Card brand" required value={paymentForm.cardBrand} onChange={e => setPaymentForm({ ...paymentForm, cardBrand: e.target.value })}>
                            {['Visa', 'Mastercard', 'Amex', 'Other'].map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                        </TextField>
                        <TextField label="Card number" required value={paymentForm.cardNumber} onChange={e => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })} helperText="Only last 4 digits are stored" />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Expiry month" type="number" required fullWidth value={paymentForm.expiryMonth} onChange={e => setPaymentForm({ ...paymentForm, expiryMonth: parseInt(e.target.value, 10) || 1 })} />
                            <TextField label="Expiry year" type="number" required fullWidth value={paymentForm.expiryYear} onChange={e => setPaymentForm({ ...paymentForm, expiryYear: parseInt(e.target.value, 10) || 2026 })} />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPaymentDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Admin edit order */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Order #{editOrder?.id}</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField label="Order name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    <TextField label="Description" multiline rows={2} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                    <TextField label="Remarks" multiline rows={2} value={editForm.remarks} onChange={e => setEditForm({ ...editForm, remarks: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveOrderEdit} disabled={saving}>Save</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
