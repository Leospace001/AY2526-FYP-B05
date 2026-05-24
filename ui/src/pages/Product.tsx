import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig'; // Your custom axios instance with JWT interceptors
import {
    Grid, Card, CardContent, CardActions, Typography,
    Button, CircularProgress, Box, Snackbar, Alert, TextField
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

// --- TS INTERFACE FOR STOCK ---
interface Stock {
    id: number;
    sellingPrice: number;
    quantity: number;
    minimumLevel: number;
    imagePath?: string;
    name?: string;
}

// --- SECURE IMAGE LOADER COMPONENT ---
// This component automatically handles downloading the protected file using authorization headers
function SecureProductImage({ imagePath, alt }: { imagePath?: string; alt: string }) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Fallback placeholder if no image exists in the database record
        if (!imagePath) {
            setImageSrc('https://placehold.co/600x400?text=No+Image');
            setLoading(false);
            return;
        }

        let blobUrl = '';

        const fetchImageBlob = async () => {
            try {
                // Extract just the file name out of the absolute storage path
                const fileName = imagePath.substring(imagePath.lastIndexOf('/') + 1);

                // Fetch the file as a raw blob while Axios passes the active token
                const response = await api.get(`/api/admin/image/${fileName}`, {
                    responseType: 'blob'
                });

                // Convert raw binary data into a temporal UI-renderable object URL
                blobUrl = URL.createObjectURL(response.data);
                setImageSrc(blobUrl);
            } catch (error) {
                console.error("Error downloading authorized asset:", error);
                setImageSrc('https://placehold.co/600x400?text=Image+Error+(403)');
            } finally {
                setLoading(false);
            }
        };

        fetchImageBlob();

        // Memory cleanup: Revoke object URL when component unmounts to prevent memory leaks
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [imagePath]);

    if (loading) {
        return (
            <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
        />
    );
}

// --- MAIN PRODUCTS PAGE COMPONENT ---
export default function Products() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch store inventory lists on mount
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await api.get('/api/stock/');
                setStocks(response.data);

                // Default purchase amount set to 1 per card selector
                const initialQty: { [key: number]: number } = {};
                response.data.forEach((item: Stock) => { initialQty[item.id] = 1; });
                setQuantities(initialQty);
            } catch (error) {
                console.error("Failed to load products list:", error);
                setSnackbar({ open: true, message: 'Failed to load stock data.', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, []);

    const handleQuantityChange = (stockId: number, val: number) => {
        if (val < 1) return;
        setQuantities(prev => ({ ...prev, [stockId]: val }));
    };

    const handleAddToCart = async (stockId: number) => {
        const qty = quantities[stockId] || 1;
        try {
            await api.post('/api/cart/items', { stockId, quantity: qty });
            setSnackbar({ open: true, message: `Added ${qty} item(s) to your shopping cart!`, severity: 'success' });
        } catch (error) {
            console.error("Cart post error:", error);
            setSnackbar({ open: true, message: 'Could not append item to cart.', severity: 'error' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={45} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#2c3e50' }}>
                Store Products
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: '#7f8c8d' }}>
                Select items and fill your active cart session securely.
            </Typography>

            {stocks.length === 0 ? (
                <Typography color="textSecondary" align="center">No products are currently tracked.</Typography>
            ) : (
                <Grid container spacing={3}>
                    {stocks.map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3, borderRadius: 2 }}>

                                {/* 🖼️ SECURE IMAGE CALL */}
                                <SecureProductImage imagePath={item.imagePath} alt={item.name || 'Product'} />

                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {item.name || `Product Inventory #${item.id}`}
                                    </Typography>
                                    <Typography variant="h5" color="primary" sx={{ my: 1, fontWeight: 'bold' }}>
                                        ${item.sellingPrice.toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" color={item.quantity > item.minimumLevel ? "textSecondary" : "error"}>
                                        In Stock: <strong>{item.quantity} items</strong>
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                                    <TextField
                                        type="number"
                                        label="Qty"
                                        size="small"
                                        // 🚀 THE ULTIMATE MODERN FIX FOR MUI v6:
                                        slotProps={{
                                            htmlInput: { min: 1, max: item.quantity }
                                        }}
                                        value={quantities[item.id] || 1}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                        sx={{ width: '75px' }}
                                        disabled={item.quantity <= 0}
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        startIcon={<AddShoppingCartIcon />}
                                        onClick={() => handleAddToCart(item.id)}
                                        disabled={item.quantity <= 0}
                                    >
                                        {item.quantity <= 0 ? 'Empty' : 'Add'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}