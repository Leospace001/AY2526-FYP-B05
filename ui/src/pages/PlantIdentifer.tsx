import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Button, CircularProgress, 
    Snackbar, Alert, Card, CardMedia, Grid 
} from '@mui/material'; // 🚀 修正 1：移除了未使用的 Divider
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'; 
import CompassCalibrationIcon from '@mui/icons-material/CompassCalibration'; 
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'; 

// 參考 OllamaChat.tsx 匯入 Axios 設定
import api from '../api/axiosConfig';
import {
    getPlantIdentifierCache,
    updatePlantIdentifierCache,
    type PlantDetails,
} from './plantIdentifierCache';
import ProductCatalogGrid from '../components/ProductCatalogGrid';

export default function PlantIdentifier() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        () => getPlantIdentifierCache().previewDataUrl
    );

    const [loading, setLoading] = useState(false);
    const [geminiLoading, setGeminiLoading] = useState(false); 
    const [plantName, setPlantName] = useState<string | null>(
        () => getPlantIdentifierCache().plantName
    );
    const [plantDetails, setPlantDetails] = useState<PlantDetails | null>(
        () => getPlantIdentifierCache().plantDetails
    ); 
    const [error, setError] = useState('');

    useEffect(() => {
        updatePlantIdentifierCache({
            previewDataUrl: previewUrl,
            plantName,
            plantDetails,
        });
    }, [previewUrl, plantName, plantDetails]);

    const handleFetchFengShuiDetails = async () => {
        if (!plantName || plantName === 'Unknown Plant') return;
        setPlantDetails(null);
        setError('');
        await fetchGeminiDetails(plantName);
    };

    // --- 1. HANDLE FILE SELECTION & RESTRICTION ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                setError('Invalid file type. Please upload a JPG or PNG image.');
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setPreviewUrl(reader.result as string);
                setPlantName(null);
                setPlantDetails(null);
                setError('');
            };
            reader.onerror = () => {
                setError('Failed to read the image. Please try again.');
            };
        }
    };

    // --- 向 Backend Proxy 索取 Gemini 詳細分析 ---
    const fetchGeminiDetails = async (name: string) => {
        setGeminiLoading(true);
        try {
            const prompt = `你是一位精通植物學、傳統中醫藥理以及風水玄學的專家。請針對植物「${name}」提供詳細分析。
必須嚴格按照以下 JSON 格式回傳，不要包含任何 Markdown 標記（絕對不要用 \`\`\`json 包裹）或任何前後解釋文字：
{
  "medicine_properties": "中醫藥性詳細內容（包含藥用部位、性味、功效、民間應用及安全毒性提示）",
  "feng_shui_layout": "風水佈局詳細內容（包含招財/擋煞功能、建議擺放方位如財位/浴室、居家磁場影響）",
  "festive_meaning": "節慶寓意詳細內容（包含節日送禮含意、象徵觀念及美好祝願）"
}`;

            const response = await api.post<{ text: string }>('/api/chat/gemini', { message: prompt });
            
            let rawJson = response.data.text.trim();
            if (rawJson.startsWith('```')) {
                rawJson = rawJson.replace(/^```json\s*|```$/g, '').trim();
            }

            const parsedDetails: PlantDetails = JSON.parse(rawJson);
            setPlantDetails(parsedDetails);

        } catch (err: any) {
            console.error('Gemini Fetch Error:', err);
            setError('植物識別成功，但無法獲取 Gemini 詳細分析。');
        } finally {
            setGeminiLoading(false);
        }
    };

    // --- 3. SUBMIT TO ENDPOINT ---
    const handleIdentifyPlant = async () => {
        if (!previewUrl) return;

        setLoading(true);
        setError('');
        setPlantName(null);
        setPlantDetails(null);

        try {
            const response = await fetch('https://api.plant.id/v3/identification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': "VXFfrdvC1z9Tn46bzbg2pTxgyeQSvMWHGMsaq4xIJ6dSjmSd3Q" 
                },
                body: JSON.stringify({
                    images: [previewUrl], 
                    latitude: 49.207,
                    longitude: 16.608,
                    similar_images: true
                })
            });

            const data = await response.json();
            const detectedName = data.result?.classification?.suggestions?.[0]?.name;

            if (detectedName) {
                setPlantName(detectedName);
            } else {
                setPlantName("Unknown Plant");
            }

        } catch (err: any) {
            console.error(err);
            setError('Failed to analyze the image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: '#f9f9f9' }}>
            <Paper sx={{ p: 4, maxWidth: plantDetails ? '1000px' : '500px', width: '100%', borderRadius: 3, boxShadow: 4, transition: 'max-width 0.4s ease' }}>
                
                <Grid container spacing={4}>
                    {/* 左邊：上傳與圖片預覽區 */}
                    {/* 🚀 修正 2：拿走 item，改用 size={{ xs: 12, md: ... }} 語法 */}
                    <Grid size={{ xs: 12, md: plantDetails ? 5 : 12 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ bgcolor: '#e8f5e9', p: 2, borderRadius: '50%', mb: 2 }}>
                                <LocalFloristIcon sx={{ fontSize: 40, color: '#2ecc71' }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                AI Plant Identifier
                            </Typography>
                        </Box>

                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            sx={{ borderStyle: 'dashed', borderWidth: 2, py: 1.5, mb: 3, width: '100%' }}
                        >
                            {previewUrl ? "Choose a Different Image" : "Select Plant Image"}
                            <input type="file" hidden accept=".jpg, .jpeg, .png, image/jpeg, image/png" onChange={handleFileChange} />
                        </Button>

                        {previewUrl && (
                            <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                                <CardMedia component="img" height="250" image={previewUrl} alt="Plant to identify" sx={{ objectFit: 'cover' }} />
                            </Card>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            disabled={!previewUrl || loading}
                            onClick={handleIdentifyPlant}
                            endIcon={!loading &&  <SearchIcon />}
                            sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.05rem', mb: 2 }}
                        >
                            {loading ? <CircularProgress size={26} color="inherit" /> : 'Identify Plant'}
                        </Button>

                        {plantName && (
                            <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, p: 2, textAlign: 'center', mb:2 }}>
                                <Typography variant="overline" sx={{ color: '#16a34a', fontWeight: 'bold' }}>Match Found</Typography>
                                <Typography variant="h5" sx={{ color: '#15803d', fontWeight: 'bold' }}>{plantName}</Typography>
                            </Box>
                        )}

                        {plantName && plantName !== 'Unknown Plant' && (
                            <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                size="large"
                                disabled={geminiLoading}
                                onClick={handleFetchFengShuiDetails}
                                startIcon={!geminiLoading && <CompassCalibrationIcon />}
                                sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.05rem', mb: 2 }}
                            >
                                {geminiLoading ? <CircularProgress size={26} color="inherit" /> : 'Feng Shui Details'}
                            </Button>
                        )}


                    </Grid>

                    {/* 右邊：Gemini 三大板塊資訊 */}
                    {/* 🚀 修正 3：拿走 item，改用 size={{ xs: 12, md: 7 }} 語法 */}
                    {plantDetails && (
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left' }}>
                                
                                {/* 1. 中醫藥性 */}
                                <Box sx={{ pl: 2, borderLeft: '4px solid #2ecc71' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <HealthAndSafetyIcon sx={{ color: '#2ecc71' }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>中醫藥性</Typography>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6, textAlign: 'justify' }}>
                                        {plantDetails.medicine_properties}
                                    </Typography>
                                </Box>

                                {/* 2. 風水佈局 */}
                                <Box sx={{ pl: 2, borderLeft: '4px solid #f1c40f' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CompassCalibrationIcon sx={{ color: '#f1c40f' }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>風水佈局</Typography>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6, textAlign: 'justify' }}>
                                        {plantDetails.feng_shui_layout}
                                    </Typography>
                                </Box>

                                {/* 3. 節慶寓意 */}
                                <Box sx={{ pl: 2, borderLeft: '4px solid #e74c3c' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CardGiftcardIcon sx={{ color: '#e74c3c' }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>節慶寓意</Typography>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6, textAlign: 'justify' }}>
                                        {plantDetails.festive_meaning}
                                    </Typography>
                                </Box>

                            </Box>
                        </Grid>
                    )}
                </Grid>

                <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert>
                </Snackbar>
            </Paper>

            {plantName && (
                <Paper sx={{ p: 4, mt: 3, maxWidth: '1200px', width: '100%', borderRadius: 3, boxShadow: 4 }}>
                    <ProductCatalogGrid
                        searchQuery={plantName}
                        title={`Related Products for ${plantName}`}
                        randomProductCount={5}
                    />
                </Paper>
            )}
        </Box>
    );
}