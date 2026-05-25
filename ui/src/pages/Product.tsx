import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import api from '../api/axiosConfig'; 
import { AuthContext } from '../context/AuthContext'; 
import {
    Grid, Card, CardContent, CardActions, Typography,
    Button, CircularProgress, Box, Snackbar, Alert, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider, CardMedia
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import EditIcon from '@mui/icons-material/Edit'; // 🚀 Added Edit icon
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // 🚀 Added Upload icon

interface Stock {
    id: number;
    sellingPrice: number;
    quantity: number;
    minimumLevel: number;
    imagePath?: string;
    name?: string;
    description?: string; // 🚀 Added for edit modal completeness
    cost?: number;        // 🚀 Added for edit modal completeness
}

// --- SECURE IMAGE LOADER COMPONENT ---
function SecureProductImage({ imagePath, alt }: { imagePath?: string; alt: string }) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!imagePath) {
            setImageSrc('https://placehold.co/600x400?text=No+Image');
            setLoading(false);
            return;
        }
        let blobUrl = '';
        const fetchImageBlob = async () => {
            try {
                const fileName = imagePath.substring(imagePath.lastIndexOf('/') + 1);
                const response = await api.get(`/api/admin/image/${fileName}`, { responseType: 'blob' });
                blobUrl = URL.createObjectURL(response.data);
                setImageSrc(blobUrl);
            } catch (error) {
                console.error("Failed to load secure product photo stream:", error);
                setImageSrc('https://placehold.co/600x400?text=Error+Loading+Image');
            } finally {
                setLoading(false);
            }
        };
        fetchImageBlob();
        return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [imagePath]);

    if (loading) {
        return (
            <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5' }}>
                <CircularProgress size={24} />
            </Box>
        );
    }
    return <img src={imageSrc} alt={alt} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />;
}

// --- MAIN PRODUCTS CATALOG WITH INFINITE SCROLL ---
export default function Products() {
    const auth = useContext(AuthContext); 
    const observerRef = useRef<IntersectionObserver | null>(null);

    // 🚀 Detect Administrator Permissions
    const isAdmin = auth?.user?.roles?.includes('ROLE_ADMIN');

    // Operational Core Pipeline State Management
    const [products, setProducts] = useState<Stock[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true); 
    
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // 🚀 Edit Modal Operational States
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<Stock | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        sellingPrice: '',
        cost: '',
        quantity: '',
        minimumLevel: ''
    });
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string>('');

    // Core Fetch Function: Appends records instead of overwriting them
    const fetchProductCatalog = async (currentPage: number) => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await api.get(`/api/stock/?page=${currentPage}&size=12&sortBy=id&sortDir=asc`);
            const { content, last } = response.data;

            setProducts(prev => {
                const existingIds = new Set(prev.map(item => item.id));
                const filteredNewContent = content.filter((item: Stock) => !existingIds.has(item.id));
                return [...prev, ...filteredNewContent];
            });
            
            setHasMore(!last);
        } catch (error) {
            console.error("Failed to recover stock profiles:", error);
            setSnackbar({ open: true, message: 'Connection error. Product sync failure.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Trigger load requests when page variable state updates
    useEffect(() => {
        fetchProductCatalog(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // Intersection Observer Callback: Observes the bottom sentinel node element
    const bottomSentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });

        if (node) observerRef.current.observe(node);
    }, [loading, hasMore]);

    const handleQuantityChange = (stockId: number, value: number) => {
        const safeValue = value < 1 ? 1 : value;
        setQuantities(prev => ({ ...prev, [stockId]: safeValue }));
    };

    const handleAddToCart = async (stockId: number) => {
        const qty = quantities[stockId] || 1;
        try {
            await api.post('/api/cart/items', { stockId, quantity: qty });
            setSnackbar({ open: true, message: 'Item successfully appended to your cart!', severity: 'success' });
            window.dispatchEvent(new Event('cart-updated'));
            if (auth && auth.refreshCartCount) auth.refreshCartCount();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Could not append selection item. Try again.', severity: 'error' });
        }
    };

    // 🚀 Open Dialog and pre-populate inputs with existing item data
    const handleOpenEdit = (product: Stock) => {
        setEditingProduct(product);
        setEditFormData({
            name: product.name || '',
            description: product.description || '',
            sellingPrice: product.sellingPrice?.toString() || '0',
            cost: product.cost?.toString() || '0',
            quantity: product.quantity?.toString() || '0',
            minimumLevel: product.minimumLevel?.toString() || '0'
        });
        setEditImageFile(null);
        setEditImagePreview('');
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setEditImageFile(file);
            setEditImagePreview(URL.createObjectURL(file));
        }
    };

    // 🚀 Submit multi-part data modifications to the PUT endpoint
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setIsUpdating(true);

        const multipartPayload = new FormData();
        multipartPayload.append('name', editFormData.name);
        multipartPayload.append('description', editFormData.description);
        multipartPayload.append('sellingPrice', editFormData.sellingPrice);
        multipartPayload.append('cost', editFormData.cost);
        multipartPayload.append('quantity', editFormData.quantity);
        multipartPayload.append('minimumLevel', editFormData.minimumLevel);

        if (editImageFile) {
            multipartPayload.append('imageFile', editImageFile);
        }

        try {
            // Fires PUT request directly to your /api/stock/{id} endpoint
            const response = await api.put(`/api/stock/${editingProduct.id}`, multipartPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 🚀 Inline state replacement: updates item data without breaking infinite scroll position
            setProducts(prev => prev.map(item => item.id === editingProduct.id ? { ...item, ...response.data } : item));
            
            setSnackbar({ open: true, message: 'Product profile updated successfully!', severity: 'success' });
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Failed to modify product record:", error);
            setSnackbar({ open: true, message: 'Failed to update product. Verify unique naming constraints.', severity: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };

    // Memory Cleanup for file preview bindings
    useEffect(() => {
        return () => { if (editImagePreview) URL.revokeObjectURL(editImagePreview); };
    }, [editImagePreview]);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2c3e50' }}>
                Available Material Stock Inventory
            </Typography>

            {products.length === 0 && !loading ? (
                <Typography variant="body1" color="textSecondary">
                    No registered item entries currently populated inside the central warehouse nodes.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {products.map((item) => (
                        <Grid item key={item.id} xs={12} sm={6} md={4} lg={3}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 2 }}>
                                <SecureProductImage imagePath={item.imagePath} alt={item.name || 'Product Stock Item'} />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    
                                    {/* 🚀 Header wrapper supporting the inline admin Edit option */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', minHeight: '64px', overflow: 'hidden', flexGrow: 1, pr: 1 }}>
                                            {item.name || `Stock Item Record #${item.id}`}
                                        </Typography>
                                        {isAdmin && (
                                            <IconButton color="primary" size="small" onClick={() => handleOpenEdit(item)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                            ${item.sellingPrice.toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2" color={item.quantity <= item.minimumLevel ? "error" : "textSecondary"} sx={{ fontWeight: 'medium' }}>
                                            {item.quantity <= 0 ? 'Out of Stock' : `Available Qty: ${item.quantity}`}
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <TextField
                                        type="number" size="small" label="Quantity" inputProps={{ min: 1 }}
                                        value={quantities[item.id] || 1}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                        sx={{ width: '100%' }} disabled={item.quantity <= 0}
                                    />
                                    <Button
                                        variant="contained" color="primary" fullWidth startIcon={<AddShoppingCartIcon />}
                                        onClick={() => handleAddToCart(item.id)} disabled={item.quantity <= 0} sx={{ fontWeight: 'bold', py: 1 }}
                                    >
                                        {item.quantity <= 0 ? 'Empty' : 'Add To Cart'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* THE INFINITE SCROLL SENTINEL TRACKING TARGET */}
            <div ref={bottomSentinelRef} style={{ height: '40px', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {loading && <CircularProgress size={32} />}
                {!hasMore && products.length > 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', my: 2 }}>
                        You have viewed all warehouse inventory profiles.
                    </Typography>
                )}
            </div>

            {/* 🚀 ADMIN PRODUCT EDIT DIALOG MODAL BOX */}
            <Dialog open={isEditModalOpen} onClose={() => !isUpdating && setIsEditModalOpen(false)} maxWidth="sm" fullWidth slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.3)' } } }}>
                <DialogTitle sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Modify Product Profile #{editingProduct?.id}</DialogTitle>
                <Box component="form" onSubmit={handleSaveEdit}>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField required fullWidth label="Product Designation Name" name="name" value={editFormData.name} onChange={handleEditFormChange} disabled={isUpdating} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField required fullWidth multiline rows={2} label="Product Description" name="description" value={editFormData.description} onChange={handleEditFormChange} disabled={isUpdating} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField required fullWidth type="number" label="Selling Price ($)" name="sellingPrice" slotProps={{ htmlInput: { step: '0.01', min: '0' } }} value={editFormData.sellingPrice} onChange={handleEditFormChange} disabled={isUpdating} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField required fullWidth type="number" label="Cost Margin ($)" name="cost" slotProps={{ htmlInput: { step: '0.01', min: '0' } }} value={editFormData.cost} onChange={handleEditFormChange} disabled={isUpdating} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField required fullWidth type="number" label="Quantity in Stock" name="quantity" slotProps={{ htmlInput: { min: '0' } }} value={editFormData.quantity} onChange={handleEditFormChange} disabled={isUpdating} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField required fullWidth type="number" label="Minimum Level Alert" name="minimumLevel" slotProps={{ htmlInput: { min: '0' } }} value={editFormData.minimumLevel} onChange={handleEditFormChange} disabled={isUpdating} />
                            </Grid>
                            
                            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                            
                            {/* File Upload Selector & Preview Rows */}
                            <Grid item xs={12} sm={5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={isUpdating} sx={{ borderStyle: 'dashed', py: 1.5 }}>
                                    Replace Image
                                    <input type="file" hidden accept="image/*" onChange={handleEditFileChange} />
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={7}>
                                <Card variant="outlined" sx={{ bgcolor: '#fafafa', borderRadius: 1 }}>
                                    <CardMedia 
                                        component="img" 
                                        height="100" 
                                        image={editImagePreview || (editingProduct?.imagePath ? `http://localhost:8080/api/admin/image/${editingProduct.imagePath.substring(editingProduct.imagePath.lastIndexOf('/') + 1)}` : 'https://placehold.co/600x400?text=No+New+Image')} 
                                        alt="Thumbnail asset preview" 
                                        sx={{ objectFit: 'contain' }} 
                                    />
                                </Card>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, gap: 1 }}>
                        <Button color="inherit" disabled={isUpdating} onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={isUpdating} sx={{ px: 3, fontWeight: 'bold' }}>
                            {isUpdating ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Snackbar
                open={snackbar.open} autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}