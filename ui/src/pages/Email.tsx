import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, CircularProgress, Alert,
    List, ListItem, ListItemText, ListItemButton,
    Divider, IconButton, Avatar, Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axiosConfig'; // Adjust this import path if needed!

// 1. Define the TypeScript interface matching your Spring Boot MailBoxDto
interface MailBoxDto {
    subject: string;
    sender: string;
    to: string[];
    cc: string[];
    bcc: string[];
    body: string;
    // attachments: any[]; // You can add attachments later!
}

export default function EmailInbox() {
    const [emails, setEmails] = useState<MailBoxDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    
    // State to track which email the user is currently reading
    const [selectedEmail, setSelectedEmail] = useState<MailBoxDto | null>(null);

    // 2. Fetch the emails from Spring Boot when the page loads
    useEffect(() => {
        const fetchEmails = async () => {
            try {
                setLoading(true);
                // Update this URL to match your exact Spring Boot endpoint!
                const response = await api.get('/api/emails/inbox');
                setEmails(response.data);
            } catch (err: any) {
                console.error("Failed to fetch emails:", err);
                setError('Could not connect to the mail server. Check your backend logs.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, []);

    // 3. Render Loading or Error States
    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
                <CircularProgress size={50} sx={{ mb: 2 }} />
                <Typography color="text.secondary">Connecting to IMAP server...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, maxWidth: '800px', margin: '0 auto' }}>
                <Alert severity="error" variant="filled">{error}</Alert>
            </Box>
        );
    }

    // 4. Render the specific Email Detail View (if an email is selected)
    if (selectedEmail) {
        return (
            <Box sx={{ p: 4, backgroundColor: '#f4f6f8', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ maxWidth: '900px', width: '100%' }}>
                    
                    {/* Back Button & Header */}
                    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <IconButton onClick={() => setSelectedEmail(null)} sx={{ mr: 2, bgcolor: '#f0f0f0' }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {selectedEmail.subject || "(No Subject)"}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1"><strong>From:</strong> {selectedEmail.sender}</Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            <strong>To:</strong> {selectedEmail.to?.join(', ')}
                        </Typography>
                    </Paper>

                    {/* The Magic HTML Rendering Container */}
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            bgcolor: '#ffffff', 
                            borderRadius: 2,
                            minHeight: '400px',
                            overflowX: 'auto', // Prevents huge tables from breaking your UI
                            '& img': { maxWidth: '100%', height: 'auto' } // Scales images down
                        }}
                    >
                        {selectedEmail.body ? (
                            <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                        ) : (
                            <Typography sx={{ color: 'gray', fontStyle: 'italic' }}>This email has no body content.</Typography>
                        )}
                    </Paper>

                </Box>
            </Box>
        );
    }

    // 5. Render the Main Inbox List (if no email is selected)
    return (
        <Box sx={{ p: 4, maxWidth: '900px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                    <EmailIcon />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', flexGrow: 1 }}>
                    System Inbox
                    {emails.length > 0 && (
                        <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}>
                            ({emails.length} {emails.length === 1 ? 'message' : 'messages'})
                        </Typography>
                    )}
                </Typography>
                <Button
                    component={RouterLink}
                    to="/emails/send"
                    variant="contained"
                    startIcon={<EditIcon />}
                >
                    Compose
                </Button>
            </Box>

            <Paper sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
                {emails.length === 0 ? (
                    <Typography sx={{ p: 4, textAlign: 'center', color: '#7f8c8d' }}>
                        Your inbox is currently empty.
                    </Typography>
                ) : (
                    <List disablePadding>
                        {emails.map((email, index) => (
                            <React.Fragment key={index}>
                                <ListItem disablePadding>
                                    <ListItemButton 
                                        onClick={() => setSelectedEmail(email)}
                                        sx={{ p: 2, '&:hover': { bgcolor: '#f8f9fa' } }}
                                    >
                                        <ListItemText 
                                            primary={
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                                    {email.subject || '(No Subject)'}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" sx={{ color: '#34495e', mt: 0.5 }}>
                                                    {email.sender}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {index < emails.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
}