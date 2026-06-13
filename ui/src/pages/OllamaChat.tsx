import React, { useState, useRef, useEffect } from 'react';
import { 
    Box, Typography, Paper, TextField, IconButton, 
    Avatar, Divider, Alert, Snackbar, Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Better icon for Gemini!
import PersonIcon from '@mui/icons-material/Person';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    content: string;
}

const LOCAL_STORAGE_KEY = 'gemini_chat_history';

export default function GeminiChat() {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedHistory) {
            try {
                return JSON.parse(savedHistory);
            } catch (e) {
                console.error("Failed to parse chat history");
                return [];
            }
        }
        return [];
    });

    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'warning' | 'info' });
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleClearChat = () => {
        setMessages([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setSnackbar({ open: true, message: 'Chat history wiped clean.', severity: 'info' });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isGenerating) return;

        const userPrompt = input.trim();
        setInput(''); 
        
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userPrompt };
        setMessages(prev => [...prev, userMsg]);

        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: 'bot', content: '' }]);

        setIsGenerating(true);
        abortControllerRef.current = new AbortController();

        try {
            // 🚀 2. Use Vite's environment variable syntax!
            const apiKey = 'AIzaSyA5kRNjgmzptmuvZAmK8Zm0gKZ3k8odc8E'; 
            if (!apiKey) {
                throw new Error("Gemini API Key is missing from .env file.");
            }

            // 🚀 3. Initialize the SDK
            const ai = new GoogleGenAI({ apiKey: apiKey });

            // 🚀 4. Call the official generateContentStream method
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-3.5-flash',
                contents: userPrompt,
            });

            let accumulatedBotResponse = '';

            // 🚀 5. Loop through the clean text chunks as the SDK processes them!
            for await (const chunk of responseStream) {
                
                // If the user clicked the "Stop" button, break out of the stream
                if (abortControllerRef.current?.signal.aborted) {
                    console.log("Stream manually stopped.");
                    break; 
                }

                accumulatedBotResponse += chunk.text;

                setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId 
                        ? { ...msg, content: accumulatedBotResponse } 
                        : msg
                ));
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Stream manually aborted by user.");
            } else {
                console.error("Chat generation failed:", error);
                setSnackbar({ open: true, message: error.message || 'Failed to connect to Gemini.', severity: 'error' });
            }
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsGenerating(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: '900px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {/* Updated Icon for Gemini */}
                <AutoAwesomeIcon sx={{ fontSize: 32, color: '#8e44ad', mr: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Gemini AI Chat
                </Typography>
                <Typography variant="caption" sx={{ ml: 2, bgcolor: '#f3e5f5', color: '#8e44ad', px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 'bold' }}>
                    gemini-1.5-flash
                </Typography>
                
                <Box sx={{ flexGrow: 1 }} />
                
                {messages.length > 0 && (
                    <Tooltip title="Clear Chat History">
                        <IconButton onClick={handleClearChat} color="error" disabled={isGenerating}>
                            <DeleteSweepIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <Paper sx={{ flexGrow: 1, mb: 3, p: 3, overflowY: 'auto', borderRadius: 3, boxShadow: 3, bgcolor: '#fdfdfd', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.length === 0 ? (
                    <Box sx={{ m: 'auto', textAlign: 'center', color: '#bdc3c7' }}>
                        <AutoAwesomeIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6">Gemini Engine Ready</Typography>
                        <Typography variant="body2">Type a prompt below to start streaming.</Typography>
                    </Box>
                ) : (
                    messages.map((msg) => (
                        <Box key={msg.id} sx={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar sx={{ bgcolor: msg.role === 'user' ? '#3498db' : '#8e44ad', width: 36, height: 36 }}>
                                {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <AutoAwesomeIcon fontSize="small" />}
                            </Avatar>
                            <Paper sx={{ p: 2, maxWidth: '75%', borderRadius: 3, bgcolor: msg.role === 'user' ? '#e3f2fd' : '#ffffff', color: '#2c3e50', boxShadow: 1, border: msg.role === 'bot' ? '1px solid #eee' : 'none' }}>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                    {msg.content}
                                </Typography>
                            </Paper>
                        </Box>
                    ))
                )}
                <div ref={messagesEndRef} />
            </Paper>

            <Paper component="form" onSubmit={handleSendMessage} sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: 3, border: '1px solid #dcdde1' }}>
                <TextField
                    fullWidth
                    placeholder="Ask Gemini something..."
                    variant="standard"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isGenerating}
                    sx={{ ml: 2, flex: 1 }}
                    slotProps={{ input: { disableUnderline: true } }}
                />
                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                
                {isGenerating ? (
                    <IconButton color="error" sx={{ p: '10px' }} onClick={handleStopGeneration}>
                        <StopCircleIcon />
                    </IconButton>
                ) : (
                    <IconButton color="primary" sx={{ p: '10px' }} type="submit" disabled={!input.trim()}>
                        <SendIcon />
                    </IconButton>
                )}
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}