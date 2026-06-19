import React, { useState, useRef, useEffect } from 'react';
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
const GEMINI_MODEL = 'gemini-2.0-flash';

type SnackbarSeverity = 'error' | 'warning' | 'info';

function resolveChatError(error: unknown): { message: string; severity: SnackbarSeverity } {
    const err = error as { message?: string };
    const rawMessage = err.message ?? 'Failed to connect to chat service.';

    if (rawMessage.toLowerCase().includes('api key')) {
        return {
            message: 'Gemini is not configured on the server. Contact the administrator.',
            severity: 'error',
        };
    }

    return { message: rawMessage, severity: 'error' };
}

async function streamGeminiViaBackend(
    message: string,
    onChunk: (chunk: string) => void,
    signal: AbortSignal
): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
        signal,
    });

    if (!response.ok) {
        let errorMessage = `Chat service error (${response.status}).`;
        try {
            const body = await response.json();
            errorMessage = body.message ?? errorMessage;
        } catch {
            const text = await response.text();
            if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Streaming is not supported by this browser.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = 'message';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (currentEvent === 'error') {
                    throw new Error(data || 'Gemini request failed.');
                }
                if (currentEvent === 'done' || data === '[DONE]') {
                    return;
                }
                if (data) {
                    onChunk(data);
                }
            }
        }
    }
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
            let accumulatedBotResponse = '';

            await streamGeminiViaBackend(
                userPrompt,
                (chunk) => {
                    accumulatedBotResponse += chunk;
                    setMessages(prev => prev.map(msg =>
                        msg.id === botMsgId
                            ? { ...msg, content: accumulatedBotResponse, isError: false }
                            : msg
                    ));
                },
                abortControllerRef.current.signal
            );

            if (!accumulatedBotResponse.trim()) {
                setMessages(prev => prev.filter(msg => msg.id !== botMsgId));
            }
        } catch (error: unknown) {
            const err = error as { name?: string };
            if (err.name === 'AbortError') {
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
                Requests go through your Spring Boot server — users do not need a VPN or a Gemini API key in the browser.
            </Alert>

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
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};
