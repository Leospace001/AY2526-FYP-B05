import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
    Box, Typography, Paper, TextField, IconButton,
    Avatar, Divider, Alert, Snackbar, Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    content: string;
    isError?: boolean;
}

const LOCAL_STORAGE_KEY = 'gemini_chat_history';
const GEMINI_MODEL = 'gemini-2.5-flash';

type SnackbarSeverity = 'error' | 'warning' | 'info';

function resolveChatError(error: unknown): { message: string; severity: SnackbarSeverity } {
    const err = error as {
        message?: string;
        response?: { status?: number; data?: { message?: string; upstreamStatus?: number } };
    };

    const apiMessage = err.response?.data?.message;
    const upstreamStatus = err.response?.data?.upstreamStatus;
    const rawMessage = apiMessage ?? err.message ?? 'Failed to connect to chat service.';

    if (upstreamStatus === 403 || rawMessage.includes('403')) {
        return {
            message: 'Gemini blocked the server (403). Your EC2 region may not be supported — use us-east-1 or configure GEMINI_PROXY_HOST on the server.',
            severity: 'warning',
        };
    }

    if (upstreamStatus === 429 || rawMessage.includes('429') || rawMessage.toLowerCase().includes('quota')) {
        return {
            message: 'Gemini quota or rate limit hit (429). If the model is gemini-2.0-flash, switch to gemini-2.5-flash — 2.0 was shut down in June 2026.',
            severity: 'warning',
        };
    }

    if (rawMessage.toLowerCase().includes('api key')) {
        return {
            message: 'Gemini is not configured on the server. Set GEMINI_API_KEY in the server environment.',
            severity: 'error',
        };
    }

    return { message: rawMessage, severity: 'error' };
}

export default function GeminiChat() {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedHistory) {
            try {
                return JSON.parse(savedHistory);
            } catch {
                console.error('Failed to parse chat history');
                return [];
            }
        }
        return [];
    });

    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'error' as SnackbarSeverity,
    });

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

        const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userPrompt };
        setMessages(prev => [...prev, userMsg]);

        const botMsgId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: botMsgId, role: 'bot', content: '' }]);

        setIsGenerating(true);
        abortControllerRef.current = new AbortController();

        try {
            const response = await api.post<{ text: string }>(
                '/api/chat/gemini',
                { message: userPrompt },
                { signal: abortControllerRef.current.signal }
            );

            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, content: response.data.text, isError: false }
                    : msg
            ));
        } catch (error: unknown) {
            const err = error as { name?: string; code?: string };
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                setMessages(prev => prev.filter(msg => !(msg.id === botMsgId && !msg.content.trim())));
                return;
            }

            console.error('Chat generation failed:', error);
            const { message, severity } = resolveChatError(error);

            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, content: message, isError: true }
                    : msg
            ));
            setSnackbar({ open: true, message, severity });
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const handleStopGeneration = () => {
        abortControllerRef.current?.abort();
        setIsGenerating(false);
    };

    return (
        <Box sx={{ p: 3, maxWidth: '900px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AutoAwesomeIcon sx={{ fontSize: 32, color: '#8e44ad', mr: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Gemini AI Chat
                </Typography>
                <Typography variant="caption" sx={{ ml: 2, bgcolor: '#f3e5f5', color: '#8e44ad', px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 'bold' }}>
                    {GEMINI_MODEL}
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

            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Requests go to <strong>/api/chat/gemini</strong> on your server — not Google from the browser.
                If chat fails with 403, Gemini is blocking your <strong>server&apos;s region</strong> (common on HK/Asia EC2).
                Your laptop VPN does not fix that for other users. Move EC2 to <strong>us-east-1</strong> or set{' '}
                <strong>GEMINI_PROXY_HOST</strong> on the server, then run <strong>GET /api/chat/gemini/status</strong> to verify.
            </Alert>

            <Paper sx={{ flexGrow: 1, mb: 3, p: 3, overflowY: 'auto', borderRadius: 3, boxShadow: 3, bgcolor: '#fdfdfd', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.length === 0 ? (
                    <Box sx={{ m: 'auto', textAlign: 'center', color: '#bdc3c7' }}>
                        <AutoAwesomeIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6">Gemini Engine Ready</Typography>
                        <Typography variant="body2">Type a prompt below to send via the backend proxy.</Typography>
                    </Box>
                ) : (
                    messages.map((msg) => (
                        <Box key={msg.id} sx={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar sx={{ bgcolor: msg.role === 'user' ? '#3498db' : msg.isError ? '#e67e22' : '#8e44ad', width: 36, height: 36 }}>
                                {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <AutoAwesomeIcon fontSize="small" />}
                            </Avatar>
                            <Paper sx={{
                                p: 2,
                                maxWidth: '75%',
                                borderRadius: 3,
                                bgcolor: msg.isError ? '#fff8e1' : msg.role === 'user' ? '#e3f2fd' : '#ffffff',
                                color: msg.isError ? '#e65100' : '#2c3e50',
                                boxShadow: 1,
                                border: msg.isError ? '1px solid #ffe082' : msg.role === 'bot' ? '1px solid #eee' : 'none',
                            }}>
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={8000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};
