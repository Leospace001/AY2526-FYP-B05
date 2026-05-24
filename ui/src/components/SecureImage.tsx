import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { CircularProgress, Box } from '@mui/material';

interface SecureImageProps {
    imagePath?: string;
    alt: string;
    height: string;
}

export default function SecureImage({ imagePath, alt, height }: SecureImageProps) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!imagePath) {
            setImageSrc('https://placehold.co/600x400?text=No+Image+Available');
            setLoading(false);
            return;
        }

        const fetchSecureImage = async () => {
            try {
                const fileName = imagePath.substring(imagePath.lastIndexOf('/') + 1);
                
                // Fetch the image file as a raw binary blob data stream with headers attached
                const response = await api.get(`/api/admin/image/${fileName}`, {
                    responseType: 'blob' 
                });

                // Convert the raw binary stream into a local temporal browser resource URL
                const blobUrl = URL.createObjectURL(response.data);
                setImageSrc(blobUrl);
            } catch (error) {
                console.error("Failed to fetch protected image asset:", error);
                setImageSrc('https://placehold.co/600x400?text=Error+Loading+Image');
            } finally {
                setLoading(false);
            }
        };

        fetchSecureImage();

        // Clean up the object URL out of memory when component unmounts
        return () => {
            if (imageSrc && !imageSrc.startsWith('http')) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [imagePath]);

    if (loading) {
        return (
            <Box sx={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center', bg: '#f4f6f8' }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <img 
            src={imageSrc} 
            alt={alt} 
            style={{ width: '100%', height: height, objectFit: 'cover' }} 
        />
    );
}