import React, { useState, useRef, useEffect } from 'react';
import { 
    Box, Typography, Paper, TextField, IconButton, 
    CircularProgress, Avatar, Divider, Alert, Snackbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import StopCircleIcon from '@mui/icons-material/StopCircle';

interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    content: string;
}

export default function OllamaChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'warning' });
    
    // Auto-scroll anchor
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // AbortController to allow users to stop the stream mid-generation
    const abortControllerRef = useRef<AbortController | null>(null);

    // Auto-scroll to the bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isGenerating) return;

        const userPrompt = input.trim();
        setInput(''); // Clear input box immediately for better UX
        
        // Append the user's message to the chat
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userPrompt };
        setMessages(prev => [...prev, userMsg]);

        // Create a placeholder for the bot's incoming streaming response
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: 'bot', content: '' }]);

        setIsGenerating(true);
        abortControllerRef.current = new AbortController();

        try {
            // 🚀 Using native fetch instead of Axios to access the raw ReadableStream
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    model: 'smollm2', // Ensure you have pulled this model in your Docker container
                    prompt: userPrompt,
                    stream: true // 🚀 Must be true to receive chunks over time
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama Server Error: ${response.statusText}`);
            }

            if (!response.body) throw new Error("ReadableStream not supported in this browser.");

            // 🚀 Attach a reader to the incoming data stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let accumulatedBotResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode the raw binary chunk into text
                const chunk = decoder.decode(value, { stream: true });
                
                // Ollama streams data as Newline Delimited JSON (NDJSON). 
                // We split by newline and parse each JSON object individually.
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    const parsedData = JSON.parse(line);
                    accumulatedBotResponse += parsedData.response;

                    // Update the specific bot message in the UI progressively
                    setMessages(prev => prev.map(msg => 
                        msg.id === botMsgId 
                            ? { ...msg, content: accumulatedBotResponse } 
                            : msg
                    ));
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Stream manually aborted by user.");
            } else {
                console.error("Chat generation failed:", error);
                setSnackbar({ open: true, message: 'Failed to connect to Ollama. Is the Docker container running and CORS configured?', severity: 'error' });
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
                <SmartToyIcon sx={{ fontSize: 32, color: '#3498db', mr: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Ollama Local AI
                </Typography>
                <Typography variant="caption" sx={{ ml: 2, bgcolor: '#e3f2fd', color: '#1976d2', px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 'bold' }}>
                    smollm2
                </Typography>
            </Box>

            {/* --- CHAT HISTORY WINDOW --- */}
            <Paper sx={{ flexGrow: 1, mb: 3, p: 3, overflowY: 'auto', borderRadius: 3, boxShadow: 3, bgcolor: '#fdfdfd', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.length === 0 ? (
                    <Box sx={{ m: 'auto', textAlign: 'center', color: '#bdc3c7' }}>
                        <SmartToyIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6">Local LLM Interface Ready</Typography>
                        <Typography variant="body2">Type a prompt below to start streaming.</Typography>
                    </Box>
                ) : (
                    messages.map((msg) => (
                        <Box key={msg.id} sx={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar sx={{ bgcolor: msg.role === 'user' ? '#3498db' : '#2ecc71', width: 36, height: 36 }}>
                                {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                            </Avatar>
                            <Paper sx={{ p: 2, maxWidth: '75%', borderRadius: 3, bgcolor: msg.role === 'user' ? '#e3f2fd' : '#ffffff', color: '#2c3e50', boxShadow: 1, border: msg.role === 'bot' ? '1px solid #eee' : 'none' }}>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                    {msg.content}
                                </Typography>
                            </Paper>
                        </Box>
                    ))
                )}
                {/* Invisible element to anchor the auto-scroll */}
                <div ref={messagesEndRef} />
            </Paper>

            {/* --- INPUT BAR --- */}
            <Paper component="form" onSubmit={handleSendMessage} sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: 3, border: '1px solid #dcdde1' }}>
                <TextField
                    fullWidth
                    placeholder="Ask local AI something..."
                    variant="standard"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isGenerating}
                    sx={{ ml: 2, flex: 1 }}
                    InputProps={{ disableUnderline: true }}
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

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}