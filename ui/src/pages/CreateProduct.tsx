import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { 
    Box, Typography, Paper, TextField, Button, Grid, 
    CircularProgress, Snackbar, Alert, Card, CardMedia, Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function CreateProduct() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    // Security Guard: Check for admin role assignment
    const isAdmin = auth?.user?.roles?.includes('ROLE_ADMIN');

    // Form Field State - Perfectly mapped to StockRequestDto fields
    const [formData, setFormData] = useState({
        name: '',
        description: '', 
        sellingPrice: '',
        cost: '',
        quantity: '',
        minimumLevel: ''
    });
    
    // File upload binary & local stream preview tracking
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    
    // UI Engine State
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file)); 
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Pack text field primitives and binary structures into a clean Multipart payload
        const multipartPayload = new FormData();
        multipartPayload.append('name', formData.name);
        multipartPayload.append('description', formData.description); 
        multipartPayload.append('sellingPrice', formData.sellingPrice);
        multipartPayload.append('cost', formData.cost);
        multipartPayload.append('quantity', formData.quantity);
        multipartPayload.append('minimumLevel', formData.minimumLevel);
        
        if (imageFile) {
            // Must match private MultipartFile imageFile exactly
            multipartPayload.append('imageFile', imageFile); 
        }

        try {
            await api.post('/api/stock/', multipartPayload, {
                headers: {
                    'Content-Type': 'multipart/form-data' 
                }
            });

            setSnackbar({ open: true, message: 'Product successfully added to inventory warehouse!', severity: 'success' });
            
            setTimeout(() => {
                navigate('/products');
            }, 1500);

        } catch (error) {
            console.error("Failed to generate stock record:", error);
            setSnackbar({ open: true, message: 'Server rejected insertion payload. Please check input values.', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    // Protection Access Block
    if (!isAdmin) {
        return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <Typography variant="h4" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Access Denied
                </Typography>
                <Typography color="textSecondary" align="center">
                    You do not possess the required administrator clearance configuration keys to access this terminal console.
                </Typography>
                <Button startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mt: 3 }} onClick={() => navigate('/products')}>
                    Return to Catalog
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: '900px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')} color="inherit">
                    Back
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Register New Warehouse Stock
                </Typography>
            </Box>

            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    
                    {/* Name Property Input */}
                    <Grid size={{ xs: 12 }}>
                        <TextField required label="Product Name / Code" name="name" fullWidth value={formData.name} onChange={handleInputChange} variant="outlined" />
                    </Grid>

                    {/* Description Property Input (Multi-line) */}
                    <Grid size={{ xs: 12 }}>
                        <TextField 
                            required 
                            label="Product Description" 
                            name="description" 
                            fullWidth 
                            multiline
                            rows={3}
                            value={formData.description} 
                            onChange={handleInputChange} 
                            variant="outlined" 
                        />
                    </Grid>

                    {/* Cost Price Input */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField 
                            required 
                            type="number"
                            label="Cost Price ($)" 
                            name="cost" 
                            fullWidth 
                            value={formData.cost} 
                            onChange={handleInputChange} 
                            variant="outlined" 
                            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                        />
                    </Grid>

                    {/* Selling Price Input */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField 
                            required 
                            type="number"
                            label="Selling Price ($)" 
                            name="sellingPrice" 
                            fullWidth 
                            value={formData.sellingPrice} 
                            onChange={handleInputChange} 
                            variant="outlined" 
                            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                        />
                    </Grid>

                    {/* Quantity Input */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField 
                            required 
                            type="number"
                            label="Initial Stock Quantity" 
                            name="quantity" 
                            fullWidth 
                            value={formData.quantity} 
                            onChange={handleInputChange} 
                            variant="outlined" 
                            slotProps={{ htmlInput: { min: 0 } }}
                        />
                    </Grid>

                    {/* Minimum Critical Level Threshold Input */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField 
                            required 
                            type="number"
                            label="Minimum Alert Level" 
                            name="minimumLevel" 
                            fullWidth 
                            value={formData.minimumLevel} 
                            onChange={handleInputChange} 
                            variant="outlined" 
                            slotProps={{ htmlInput: { min: 0 } }}
                        />
                    </Grid>

                    {/* Binary Image Upload Section */}
                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#34495e' }}>
                            Product Reference Showcase Image
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<CloudUploadIcon />}
                                sx={{ py: 1.5 }}
                            >
                                Select Image File
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </Button>
                            {imageFile && (
                                <Typography variant="body2" color="textSecondary">
                                    Selected File: <strong>{imageFile.name}</strong>
                                </Typography>
                            )}
                        </Box>
                    </Grid>

                    {/* Image Preview Dynamic Card rendering view */}
                    {imagePreview && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Card sx={{ maxWidth: '100%', borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 1 }}>
                                <CardMedia
                                    component="img"
                                    height="180"
                                    image={imagePreview}
                                    alt="Uploaded profile file preview stream"
                                    sx={{ objectFit: 'contain', bgcolor: '#fdfdfd', p: 1 }}
                                />
                            </Card>
                        </Grid>
                    )}

                    {/* Action Form Footer Submit Buttons */}
                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                        <Button 
                            variant="outlined" 
                            color="inherit" 
                            onClick={() => navigate('/products')}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{ minWidth: '140px', fontWeight: 'bold' }}
                        >
                            {submitting ? 'Processing...' : 'Register Stock'}
                        </Button>
                    </Grid>

                </Grid>
            </Paper>

            {/* Asynchronous Operation SnackBar Toast Overlay */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={5000} 
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
                    severity={snackbar.severity} 
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}