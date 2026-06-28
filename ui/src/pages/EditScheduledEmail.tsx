import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import EmailHtmlEditor from '../components/EmailHtmlEditor';
import { htmlContainsBrokenEmbeddedImages } from '../utils/emailImageEmbed';
import type { EmailRecordSummary } from './EmailOutbox';
import {
    Alert, Box, Button, CircularProgress, Divider, Grid,
    Paper, Snackbar, TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

const EMPTY_BODY = '<p></p>';

function toDatetimeLocalValue(value: string | null): string {
    if (!value) return '';
    return value.slice(0, 16);
}

function toApiSendTime(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
}

export default function EditScheduledEmail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [recipientString, setRecipientString] = useState('');
    const [subject, setSubject] = useState('');
    const [sendTime, setSendTime] = useState('');
    const [htmlBody, setHtmlBody] = useState(EMPTY_BODY);
    const [isCodeView, setIsCodeView] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    useEffect(() => {
        const fetchEmail = async () => {
            if (!id) return;
            setLoading(true);
            setLoadError('');
            try {
                const response = await api.get<EmailRecordSummary>(`/api/emails/outbox/${id}`);
                const email = response.data;
                if (!email.editable) {
                    setLoadError('This email can no longer be edited because it has already been sent or queued.');
                    return;
                }
                setRecipientString(email.recipients?.join(', ') ?? '');
                setSubject(email.subject ?? '');
                setSendTime(toDatetimeLocalValue(email.scheduledSendTime));
                setHtmlBody(email.body?.trim() || EMPTY_BODY);
            } catch (err: unknown) {
                console.error(err);
                const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
                setLoadError(apiErr.response?.data?.message ?? apiErr.message ?? 'Could not load scheduled email.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmail();
    }, [id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSubmitting(true);

        const recipientsArray = recipientString.split(',').map((em) => em.trim()).filter(Boolean);
        if (recipientsArray.length === 0) {
            setSnackbar({ open: true, message: 'Please specify at least one recipient.', severity: 'error' });
            setSubmitting(false);
            return;
        }

        const trimmedBody = htmlBody.trim();
        if (!trimmedBody || trimmedBody === EMPTY_BODY) {
            setSnackbar({ open: true, message: 'Please compose an email body.', severity: 'error' });
            setSubmitting(false);
            return;
        }

        if (!sendTime) {
            setSnackbar({ open: true, message: 'Scheduled send time is required.', severity: 'error' });
            setSubmitting(false);
            return;
        }

        if (htmlContainsBrokenEmbeddedImages(htmlBody)) {
            setSnackbar({
                open: true,
                message: 'An embedded image is not ready. Re-insert the image using the toolbar before saving.',
                severity: 'error',
            });
            setSubmitting(false);
            return;
        }

        try {
            await api.put(`/api/emails/outbox/${id}`, {
                recipients: recipientsArray,
                subject,
                body: htmlBody,
                sendTime: toApiSendTime(sendTime),
            });
            setSnackbar({ open: true, message: 'Scheduled email updated.', severity: 'success' });
            setTimeout(() => navigate('/emails/outbox?tab=scheduled'), 800);
        } catch (err: unknown) {
            console.error(err);
            const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
            setSnackbar({
                open: true,
                message: apiErr.response?.data?.message ?? apiErr.message ?? 'Failed to update email.',
                severity: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelScheduled = async () => {
        if (!id) return;
        if (!window.confirm('Cancel this scheduled email? This cannot be undone.')) return;
        setSubmitting(true);
        try {
            await api.delete(`/api/emails/outbox/${id}`);
            navigate('/emails/outbox?tab=scheduled');
        } catch (err: unknown) {
            console.error(err);
            const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
            setSnackbar({
                open: true,
                message: apiErr.response?.data?.message ?? apiErr.message ?? 'Failed to cancel email.',
                severity: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (loadError) {
        return (
            <Box sx={{ p: 4, maxWidth: '800px', margin: '0 auto' }}>
                <Alert severity="error" variant="filled" sx={{ mb: 2 }}>{loadError}</Alert>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/emails/outbox?tab=scheduled')}>
                    Back to scheduled emails
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: '1100px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/emails/outbox?tab=scheduled')} color="inherit">
                    Scheduled
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', flexGrow: 1 }}>
                    Edit Scheduled Email
                </Typography>
                <Button
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    disabled={submitting}
                    onClick={handleCancelScheduled}
                >
                    Cancel send
                </Button>
            </Box>

            <Paper component="form" onSubmit={handleSave} sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="Recipients (comma-separated)"
                            value={recipientString}
                            onChange={(e) => setRecipientString(e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#57606f' }}>
                            Message
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
                            required
                            fullWidth
                            type="datetime-local"
                            label="Scheduled send time"
                            value={sendTime}
                            onChange={(e) => setSendTime(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="text" color="inherit" disabled={submitting} onClick={() => navigate('/emails/outbox?tab=scheduled')}>
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            endIcon={!submitting && <SaveIcon />}
                            disabled={submitting}
                            sx={{ px: 4, fontWeight: 'bold' }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save changes'}
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
