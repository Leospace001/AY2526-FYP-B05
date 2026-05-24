import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axiosConfig'; // Your custom axios instance with JWT interceptors
import { AuthContext } from '../context/AuthContext'; // 🟢 Added for navigation badge synchronization
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

                // Generate a safe local memory stream URL out of the raw byte content
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

        // Garbage collection memory management safety cleanup
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [imagePath]);

    if (loading) {
        return (
            <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5' }}>
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

// --- MAIN PRODUCTS CATALOG CATALOG TERMINAL ---
export default function Products() {
    const auth = useContext(AuthContext); // 🟢 Consume Auth Context values
    const [products, setProducts] = useState<Stock[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch active warehouse inventory records on mount
    useEffect(() => {
        const fetchProductCatalog = async () => {
            try {
                const response = await api.get<Stock[]>('/api/stock/');
                setProducts(response.data);
            } catch (error) {
                console.error("Failed to recover stock profiles:", error);
                setSnackbar({ open: true, message: 'Server connection timeout. Product sync failure.', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchProductCatalog();
    }, []);

    // Local numeric tracking wrapper management
    const handleQuantityChange = (stockId: number, value: number) => {
        // Lower limit floor boundary check to prevent negative inputs
        const safeValue = value < 1 ? 1 : value;
        setQuantities(prev => ({ ...prev, [stockId]: safeValue }));
    };

    // Commit selection addition payload parameters to cart API node
    const handleAddToCart = async (stockId: number) => {
        const qty = quantities[stockId] || 1;
        try {
            await api.post('/api/cart/items', { stockId, quantity: qty });
            
            setSnackbar({ open: true, message: 'Item successfully appended to your cart!', severity: 'success' });
            
            window.dispatchEvent(new Event('cart-updated'));
            // 🟢 CRITICAL SYNC: Tell the global context provider to update the sidebar badge right away!
            if (auth && auth.refreshCartCount) {
                auth.refreshCartCount();
            }
        } catch (error) {
            console.error("Could not register item choice selection inside database layers:", error);
            setSnackbar({ open: true, message: 'Could not append selection item. Try again.', severity: 'error' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress size={50} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2c3e50' }}>
                Available Material Stock Inventory
            </Typography>

            {products.length === 0 ? (
                <Typography variant="body1" color="textSecondary">
                    No registered item entries currently populated inside the central warehouse nodes.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {products.map((item) => (
                        <Grid item key={item.id} xs={12} sm={6} md={4} lg={3}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 2 }}>
                                
                                {/* Secure Header Image Container Box */}
                                <SecureProductImage imagePath={item.imagePath} alt={item.name || 'Product Stock Item'} />
                                
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', minHeight: '64px', overflow: 'hidden' }}>
                                        {item.name || `Stock Item Record #${item.id}`}
                                    </Typography>
                                    
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
                                    {/* Item Quantity Input Selection Field */}
                                    <TextField
                                        type="number"
                                        size="small"
                                        label="Quantity"
                                        inputProps={{ min: 1 }}
                                        value={quantities[item.id] || 1}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                        sx={{ width: '100%' }}
                                        disabled={item.quantity <= 0}
                                    />
                                    {/* Action Submission Dispatcher Trigger Button */}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        startIcon={<AddShoppingCartIcon />}
                                        onClick={() => handleAddToCart(item.id)}
                                        disabled={item.quantity <= 0}
                                        sx={{ fontWeight: 'bold', py: 1 }}
                                    >
                                        {item.quantity <= 0 ? 'Empty' : 'Add To Cart'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Notification Feedback Status Banner */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
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