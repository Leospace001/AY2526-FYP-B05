import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import EmailHtmlEditor from '../components/EmailHtmlEditor';
import { htmlContainsBrokenEmbeddedImages } from '../utils/emailImageEmbed';
import {
    Box, Typography, Paper, TextField, Button, Grid,
    CircularProgress, Snackbar, Alert, Divider, IconButton, List, ListItem, ListItemText,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const EMPTY_BODY = '<p></p>';

export default function SendEmail() {
    const navigate = useNavigate();

    const [recipientString, setRecipientString] = useState('');
    const [subject, setSubject] = useState('');
    const [sendTime, setSendTime] = useState('');
    const [htmlBody, setHtmlBody] = useState(EMPTY_BODY);
    const [isCodeView, setIsCodeView] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const recipientsArray = recipientString.split(',').map((em) => em.trim()).filter(Boolean);
        if (recipientsArray.length === 0) {
            setSnackbar({ open: true, message: 'Please specify at least one recipient.', severity: 'error' });
            setSubmitting(false);
            return;
        }

        const trimmedBody = htmlBody.trim();
        if (!trimmedBody || trimmedBody === EMPTY_BODY || trimmedBody === '<p></p>') {
            setSnackbar({ open: true, message: 'Please compose an email body.', severity: 'error' });
            setSubmitting(false);
            return;
        }

        if (htmlContainsBrokenEmbeddedImages(htmlBody)) {
            setSnackbar({
                open: true,
                message: 'An embedded image is not ready. Re-insert the image using the toolbar before sending.',
                severity: 'error',
            });
            setSubmitting(false);
            return;
        }

        const multipartPayload = new FormData();
        recipientsArray.forEach((rec) => multipartPayload.append('recipients', rec));
        multipartPayload.append('subject', subject);
        multipartPayload.append('body', htmlBody);

        if (sendTime) {
            // datetime-local value — keep as local time; do not convert to UTC ISO
            multipartPayload.append('sendTime', sendTime.length === 16 ? `${sendTime}:00` : sendTime);
        }
        attachments.forEach((file) => multipartPayload.append('attachments', file));

        try {
            // Do NOT set Content-Type manually — axios must add the multipart boundary
            await api.post('/api/emails/send', multipartPayload);
            setSnackbar({ open: true, message: 'HTML email sent successfully!', severity: 'success' });
            setRecipientString('');
            setSubject('');
            setSendTime('');
            setAttachments([]);
            setHtmlBody(EMPTY_BODY);
            setIsCodeView(false);
        } catch (error: unknown) {
            console.error(error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const message = err.response?.data?.message ?? err.message ?? 'Failed to send email.';
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: '1100px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/email')} color="inherit">
                    Inbox
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Compose Email
                </Typography>
            </Box>

            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="Recipients (comma-separated)"
                            placeholder="team@example.com"
                            value={recipientString}
                            onChange={(e) => setRecipientString(e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="Subject"
                            placeholder="Enter subject line"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#57606f' }}>
                            Message (formatted text → HTML)
                        </Typography>
                        <EmailHtmlEditor
                            html={htmlBody}
                            onChange={setHtmlBody}
                            isCodeView={isCodeView}
                            onToggleCodeView={() => setIsCodeView((prev) => !prev)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            label="Schedule send (optional)"
                            value={sendTime}
                            onChange={(e) => setSendTime(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            helperText="Leave empty to send immediately"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ py: 1.5, borderStyle: 'dashed' }}>
                            Attach files
                            <input type="file" hidden multiple onChange={handleFileChange} />
                        </Button>
                    </Grid>

                    {attachments.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Attachments ({attachments.length})
                            </Typography>
                            <Paper variant="outlined" sx={{ bgcolor: '#fafafa', borderRadius: 2, maxHeight: 150, overflowY: 'auto' }}>
                                <List dense>
                                    {attachments.map((file, idx) => (
                                        <ListItem
                                            key={`${file.name}-${idx}`}
                                            secondaryAction={
                                                <IconButton edge="end" color="error" onClick={() => removeAttachment(idx)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="text" color="inherit" disabled={submitting} onClick={() => navigate('/email')}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            endIcon={!submitting && <SendIcon />}
                            disabled={submitting}
                            sx={{ px: 4, fontWeight: 'bold' }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send Email'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
