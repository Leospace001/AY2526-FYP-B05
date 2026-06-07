import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Snackbar, Alert, Card, CardMedia, Divider } from '@mui/material';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';

export default function PlantIdentifier() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [plantName, setPlantName] = useState<string | null>(null);
    const [error, setError] = useState('');

    // --- 1. HANDLE FILE SELECTION & RESTRICTION ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Double-check the file type on the client side just to be safe
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                setError('Invalid file type. Please upload a JPG or PNG image.');
                return;
            }

            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setPlantName(null); // Reset previous results
            setError('');
        }
    };

    // --- 2. BASE64 CONVERSION HELPER ---
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    // --- 3. SUBMIT TO ENDPOINT ---
    const handleIdentifyPlant = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError('');
        setPlantName(null);

        try {
            // Convert the image to a Base64 string
            const fullBase64String = await convertFileToBase64(selectedImage);

            // Note: readAsDataURL includes a prefix like "data:image/jpeg;base64,"
            // Some backends want this prefix, some want strictly the raw string. 
            // If your backend crashes, uncomment the line below to strip the prefix:
            // const rawBase64 = fullBase64String.split(',')[1];

            // Send the payload to your specific AI/identification endpoint
            const response = await fetch('https://api.plant.id/v3/identification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': "GiCgOhgptbTTwql1LwNIPdSqieD8KSGQMXwbo6G81d7BQBcEyv" // Note: Plant.id usually uses a dash (Api-Key) rather than an underscore!
                },
                body: JSON.stringify({
                    images: [fullBase64String], // 🚀 Note: Plant.id v3 expects "images" (plural)
                    latitude: 49.207,
                    longitude: 16.608,
                    similar_images: true
                })
            });

            // 🚀 FIXED: You must explicitly parse the native fetch response into JSON!
            const data = await response.json();

            // Now you can drill down into the parsed 'data' object instead of 'response.data'
            const plantName = data.result?.classification?.suggestions?.[0]?.name;

            // Safely set the state
            setPlantName(plantName || "Unknown Plant");

        } catch (err: any) {
            console.error(err);
            setError('Failed to analyze the image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Cleanup memory when the component unmounts or image changes
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Paper sx={{ p: 4, maxWidth: '500px', width: '100%', borderRadius: 3, boxShadow: 4, textAlign: 'center' }}>

                {/* Header */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ bgcolor: '#e8f5e9', p: 2, borderRadius: '50%', mb: 2 }}>
                        <LocalFloristIcon sx={{ fontSize: 40, color: '#2ecc71' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        AI Plant Identifier
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Upload a photo of a leaf or flower (JPG/PNG only) to instantly identify the plant species.
                    </Typography>
                </Box>

                {/* File Upload Button */}
                <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ borderStyle: 'dashed', borderWidth: 2, py: 1.5, mb: 3, width: '100%' }}
                >
                    {selectedImage ? "Choose a Different Image" : "Select Plant Image"}
                    <input
                        type="file"
                        hidden
                        accept=".jpg, .jpeg, .png, image/jpeg, image/png"
                        onChange={handleFileChange}
                    />
                </Button>

                {/* Image Preview */}
                {previewUrl && (
                    <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                        <CardMedia
                            component="img"
                            height="250"
                            image={previewUrl}
                            alt="Plant to identify"
                            sx={{ objectFit: 'cover' }}
                        />
                    </Card>
                )}

                {/* Action Button */}
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={!selectedImage || loading}
                    onClick={handleIdentifyPlant}
                    endIcon={!loading && <SearchIcon />}
                    sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.05rem', mb: 3 }}
                >
                    {loading ? <CircularProgress size={26} color="inherit" /> : 'Identify Plant'}
                </Button>

                <Divider sx={{ mb: 3 }} />

                {/* Success Result Area */}
                {plantName && (
                    <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, p: 3 }}>
                        <Typography variant="overline" sx={{ color: '#16a34a', fontWeight: 'bold', letterSpacing: 1 }}>
                            Match Found
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#15803d', fontWeight: 'bold', mt: 0.5 }}>
                            {plantName}
                        </Typography>
                    </Box>
                )}

                {/* Error Notifications */}
                <Snackbar
                    open={Boolean(error)}
                    autoHideDuration={5000}
                    onClose={() => setError('')}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity="error" variant="filled" onClose={() => setError('')}>
                        {error}
                    </Alert>
                </Snackbar>
            </Paper>
        </Box>
    );
}