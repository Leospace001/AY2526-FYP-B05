import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import SecureImage from './SecureImage';
import {
    Grid, Card, CardContent, CardActions, Typography,
    Button, CircularProgress, Box, Snackbar, Alert, TextField, Chip,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

interface Stock {
    id: number;
    sellingPrice: number;
    quantity: number;
    minimumLevel: number;
    imagePath?: string;
    name?: string;
    description?: string;
    active?: boolean;
    isActive?: boolean;
}

function isProductActive(item: Stock): boolean {
    const flag = item.active ?? item.isActive;
    return flag !== false;
}

function shuffleProducts<T>(items: T[]): T[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

interface ProductCatalogGridProps {
    searchQuery: string;
    title?: string;
    /** When true, show random catalog products if the search returns no matches. */
    fallbackToRandom?: boolean;
    randomProductCount?: number;
}

export default function ProductCatalogGrid({
    searchQuery,
    title,
    fallbackToRandom = true,
    randomProductCount = 5,
}: ProductCatalogGridProps) {
    const [products, setProducts] = useState<Stock[]>([]);
    const [usingRandomFallback, setUsingRandomFallback] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        const trimmed = searchQuery.trim();

        const fetchProducts = async () => {
            setLoading(true);
            setUsingRandomFallback(false);
            try {
                if (trimmed) {
                    const response = await api.get(
                        `/api/stock/?search=${encodeURIComponent(trimmed)}&page=0&size=12&sortBy=createdAt&sortDir=desc`,
                    );
                    const matchedProducts: Stock[] = response.data.content ?? [];
                    if (matchedProducts.length > 0 || !fallbackToRandom) {
                        setProducts(matchedProducts);
                        return;
                    }
                }

                if (!fallbackToRandom) {
                    setProducts([]);
                    return;
                }

                const fallbackResponse = await api.get(
                    `/api/stock/?page=0&size=24&sortBy=createdAt&sortDir=desc`,
                );
                const randomProducts = shuffleProducts<Stock>(fallbackResponse.data.content ?? [])
                    .slice(0, randomProductCount);
                setProducts(randomProducts);
                setUsingRandomFallback(true);
            } catch (error) {
                console.error('Failed to load related products:', error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchQuery, fallbackToRandom, randomProductCount]);

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
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Could not append selection item. Try again.', severity: 'error' });
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            {title && (
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: usingRandomFallback ? 1 : 3 }}>
                    {title}
                </Typography>
            )}
            {usingRandomFallback && (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    No exact matches found — here are some products you might like.
                </Typography>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : products.length === 0 ? (
                <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 2 }}>
                    No matching products found in the catalog.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {products.map((item) => {
                        const productActive = isProductActive(item);
                        const canPurchase = productActive && (item.quantity ?? 0) > 0;

                        return (
                            <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    borderRadius: 2,
                                    boxShadow: 2,
                                    opacity: productActive ? 1 : 0.72,
                                    border: productActive ? undefined : '1px dashed #e74c3c',
                                }}>
                                    <Box sx={{ position: 'relative' }}>
                                        <SecureImage
                                            imagePath={item.imagePath}
                                            alt={item.name || 'Product Stock Item'}
                                            height="200px"
                                        />
                                        {!productActive && (
                                            <Chip
                                                label="Unavailable"
                                                color="error"
                                                size="small"
                                                sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 'bold' }}
                                            />
                                        )}
                                    </Box>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', minHeight: '64px', overflow: 'hidden' }}>
                                            {item.name || `Stock Item Record #${item.id}`}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                                ${item.sellingPrice.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" color={(item.quantity ?? 0) <= (item.minimumLevel ?? 0) ? 'error' : 'textSecondary'} sx={{ fontWeight: 'medium' }}>
                                                {!productActive
                                                    ? 'Not listed'
                                                    : (item.quantity ?? 0) <= 0
                                                        ? 'Out of Stock'
                                                        : `Available Qty: ${item.quantity}`}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                    <CardActions sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Quantity"
                                            slotProps={{ htmlInput: { min: 1 } }}
                                            value={quantities[item.id] || 1}
                                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                            sx={{ width: '100%' }}
                                            disabled={!canPurchase}
                                        />
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            startIcon={<AddShoppingCartIcon />}
                                            onClick={() => handleAddToCart(item.id)}
                                            disabled={!canPurchase}
                                            sx={{ fontWeight: 'bold', py: 1 }}
                                        >
                                            {!productActive ? 'Unavailable' : (item.quantity ?? 0) <= 0 ? 'Empty' : 'Add To Cart'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
